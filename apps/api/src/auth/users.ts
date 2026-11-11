import {createHash,randomBytes,scrypt,timingSafeEqual} from 'node:crypto';
import {chmodSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {promisify} from 'node:util';
import {DatabaseSync} from 'node:sqlite';

const scryptAsync=promisify(scrypt) as (password:string,salt:Buffer,keylen:number)=>Promise<Buffer>;
const fail=(status:number,message:string)=>Object.assign(new Error(message),{status});

export type PublicUser={id:string;email:string;name:string};
export type Session={token:string;expires_at:string};

const SESSION_DAYS=7;
const MAX_FAILS=5;            // tentativas erradas seguidas por e-mail
const LOCK_MS=15*60*1000;     // bloqueio de 15 minutos

/** Senha: scrypt (já vem no Node, sem biblioteca extra). Formato: s1$salt$hash */
async function hashPassword(password:string):Promise<string> {
  const salt=randomBytes(16);
  const hash=await scryptAsync(password,salt,32);
  return `s1$${salt.toString('base64')}$${hash.toString('base64')}`;
}
async function checkPassword(password:string,stored:string):Promise<boolean> {
  const [version,salt,hash]=stored.split('$');
  if(version!=='s1'||!salt||!hash)return false;
  const expected=Buffer.from(hash,'base64');
  const actual=await scryptAsync(password,Buffer.from(salt,'base64'),expected.length);
  return timingSafeEqual(actual,expected);
}
// Hash falso: faz o "e-mail não existe" demorar igual ao "senha errada".
const dummyHash=hashPassword('senha-falsa-para-igualar-o-tempo');

export class Accounts {
  private readonly db:DatabaseSync;
  constructor(path:string){
    mkdirSync(dirname(path),{recursive:true,mode:0o700});
    this.db=new DatabaseSync(path);
    chmodSync(path,0o600);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=1500; PRAGMA foreign_keys=ON;
      CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password_hash TEXT NOT NULL,created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,expires INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
      CREATE TABLE IF NOT EXISTS administrators(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE);
      CREATE TABLE IF NOT EXISTS login_attempts(email TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);`);
  }
  private openSession(userId:string):Session {
    const token=randomBytes(32).toString('base64url');
    const expires=Date.now()+SESSION_DAYS*86400000;
    // Só o hash do token fica no banco: se o arquivo vazar, os tokens não servem.
    this.db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(sha(token),userId,expires);
    return {token,expires_at:new Date(expires).toISOString()};
  }
  async register(email:string,name:string,password:string):Promise<{user:PublicUser;session:Session}> {
    const clean=email.trim().toLowerCase();
    const id='usr_'+randomBytes(10).toString('hex');
    const hash=await hashPassword(password);
    try{this.db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run(id,clean,name.trim(),hash,Date.now());}
    catch{throw fail(409,'Não foi possível criar a conta com estes dados.');}
    return {user:{id,email:clean,name:name.trim()},session:this.openSession(id)};
  }
  private reserveAttempt(clean:string):void {
    // Reserve an attempt before the asynchronous password check, across API processes.
    const now=Date.now();
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const lock=this.db.prepare('SELECT count,until FROM login_attempts WHERE email=?').get(clean) as {count:number;until:number}|undefined;
      if(lock&&lock.count>=MAX_FAILS&&lock.until>now)throw fail(429,'Muitas tentativas. Aguarde alguns minutos.');
      const count=lock&&lock.until>now?lock.count+1:1;
      this.db.prepare('INSERT INTO login_attempts VALUES(?,?,?) ON CONFLICT(email) DO UPDATE SET count=excluded.count,until=excluded.until').run(clean,count,now+LOCK_MS);
      this.db.exec('COMMIT');
    } catch(error) {this.db.exec('ROLLBACK');throw error;}
  }
  async login(email:string,password:string):Promise<{user:PublicUser;session:Session}> {
    const clean=email.trim().toLowerCase();
    this.reserveAttempt(clean);
    const row=this.db.prepare('SELECT id,email,name,password_hash FROM users WHERE email=?').get(clean) as {id:string;email:string;name:string;password_hash:string}|undefined;
    const ok=await checkPassword(password,row?.password_hash??await dummyHash);
    if(!row||!ok)throw fail(401,'E-mail ou senha incorretos.');
    this.db.prepare('DELETE FROM login_attempts WHERE email=?').run(clean);
    return {user:{id:row.id,email:row.email,name:row.name},session:this.openSession(row.id)};
  }
  isAdmin(userId:string):boolean {
    return !!this.db.prepare('SELECT 1 FROM administrators WHERE user_id=?').get(userId);
  }
  grantAdmin(userId:string):void {
    const result=this.db.prepare('INSERT OR IGNORE INTO administrators SELECT id FROM users WHERE id=?').run(userId);
    if(!result.changes&&!this.isAdmin(userId))throw new Error('Usuário não encontrado.');
  }
  /** Devolve o usuário dono do token, ou null se inválido/expirado. */
  validate(token:string|undefined):PublicUser|null {
    if(!token||token.length>200)return null;
    const row=this.db.prepare('SELECT u.id,u.email,u.name,s.expires FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?').get(sha(token)) as {id:string;email:string;name:string;expires:number}|undefined;
    if(!row)return null;
    if(row.expires<=Date.now()){this.logout(token);return null;}
    return {id:row.id,email:row.email,name:row.name};
  }
  logout(token:string|undefined):void {
    if(token)this.db.prepare('DELETE FROM sessions WHERE token_hash=?').run(sha(token));
  }
  /** Chamar de tempos em tempos (ex.: a cada minuto) para limpar o que expirou. */
  cleanup():void {
    this.db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    this.db.prepare('DELETE FROM login_attempts WHERE until<=?').run(Date.now());
  }
  close():void {this.db.close();}
}
function sha(value:string){return createHash('sha256').update(value).digest('hex');}