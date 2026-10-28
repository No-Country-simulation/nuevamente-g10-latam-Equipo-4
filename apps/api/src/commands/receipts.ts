import {createHash} from 'node:crypto';
import {mkdirSync, chmodSync} from 'node:fs';
import {dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';

type Receipt = {digest:string; state:string; body:string|null; status:number|null; epoch:number};
export type Reservation = {kind:'new'} | {kind:'replay'; status:number; body:unknown};
const conflict=(message:string)=>Object.assign(new Error(message),{status:409});

/** Deterministic fingerprints; never persist the request or provider credentials. */
export function canonical(value:unknown):string {
  if(Array.isArray(value))return `[${value.map(canonical).join(',')}]`;
  if(value!==null&&typeof value==='object'){
    const object=value as Record<string,unknown>;
    return `{${Object.keys(object).sort().map(key=>`${JSON.stringify(key)}:${canonical(object[key])}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

export class CommandReceipts {
  private readonly db:DatabaseSync;
  constructor(path:string,private readonly maxRows=20000,private readonly ttlSeconds=604800,private readonly maxBytes=67108864){
    mkdirSync(dirname(path),{recursive:true,mode:0o700});
    this.db=new DatabaseSync(path);
    chmodSync(path,0o600);
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=1500; PRAGMA secure_delete=ON;
      CREATE TABLE IF NOT EXISTS epochs(tenant TEXT PRIMARY KEY,epoch INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS receipts(tenant TEXT,operation TEXT,key TEXT,digest TEXT,state TEXT,body TEXT,status INTEGER,epoch INTEGER,created INTEGER,PRIMARY KEY(tenant,operation,key));
      CREATE INDEX IF NOT EXISTS receipts_expiry ON receipts(state,created);`);
  }
  private epoch(tenant:string):number {
    const row=this.db.prepare('SELECT epoch FROM epochs WHERE tenant=?').get(tenant) as {epoch:number}|undefined;
    return row?.epoch ?? 0;
  }
  private transaction<T>(run:()=>T):T {
    this.db.exec('BEGIN IMMEDIATE');
    try {const value=run();this.db.exec('COMMIT');return value;}
    catch(error){this.db.exec('ROLLBACK');throw error;}
  }
  reserve(tenant:string,operation:string,key:string,input:unknown):Reservation {
    if(!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw Object.assign(new Error('Idempotency-Key deve ter 16–100 caracteres alfanuméricos, _ ou -.'),{status:400});
    // Expiry must survive a later409/quota rollback in reservation.
    this.expire();
    const digest=createHash('sha256').update(canonical(input)).digest('hex');
    return this.transaction(()=>this.reserveLocked(tenant,operation,key,digest));
  }
  private reserveLocked(tenant:string,operation:string,key:string,digest:string):Reservation {
    const row=this.db.prepare('SELECT digest,state,body,status,epoch FROM receipts WHERE tenant=? AND operation=? AND key=?').get(tenant,operation,key) as Receipt|undefined;
    if(row)return this.replay(row,digest);
    const count=this.db.prepare('SELECT COUNT(*) AS total FROM receipts').get() as {total:number};
    if(count.total>=this.maxRows)throw Object.assign(new Error('Limite do registro de comandos atingido. Solicite manutenção ao operador.'),{status:503});
    this.db.prepare("INSERT INTO receipts VALUES(?,?,?,?,'pending',NULL,NULL,?,?)").run(tenant,operation,key,digest,this.epoch(tenant),Date.now());
    return {kind:'new'};
  }
  private replay(row:Receipt,digest:string):Reservation {
    if(row.digest!==digest)throw conflict('Esta chave já identifica outro conteúdo.');
    if(row.state!=='done'||row.body===null||row.status===null)throw conflict('Comando em andamento, expirado ou com resultado incerto. Confira o estado antes de uma nova operação.');
    return {kind:'replay',status:row.status,body:JSON.parse(row.body)};
  }
  complete(tenant:string,operation:string,key:string,status:number,body:unknown):void {
    const text=JSON.stringify(body);
    this.transaction(()=>this.completeLocked(tenant,operation,key,status,text));
  }
  private completeLocked(tenant:string,operation:string,key:string,status:number,text:string):void {
    const bytes=Buffer.byteLength(text);
    const used=this.db.prepare('SELECT COALESCE(SUM(length(CAST(body AS BLOB))),0) AS bytes FROM receipts').get() as {bytes:number};
    const safe=status<500&&bytes<=512*1024&&used.bytes+bytes<=this.maxBytes;
    this.db.prepare("UPDATE receipts SET state=CASE WHEN epoch<>? THEN 'forgotten' WHEN ? THEN 'done' ELSE 'uncertain' END,body=CASE WHEN epoch=? AND ? THEN ? ELSE NULL END,status=? WHERE tenant=? AND operation=? AND key=? AND state='pending'")
      .run(this.epoch(tenant),Number(safe),this.epoch(tenant),Number(safe),text,status,tenant,operation,key);
  }
  expire():void {
    this.db.prepare("UPDATE receipts SET state='expired',body=NULL WHERE state='done' AND created<?").run(Date.now()-this.ttlSeconds*1000);
  }
  forget(tenant:string,keep?:{operation:string;key:string}):void {
    this.transaction(()=>{
      this.db.prepare('INSERT INTO epochs VALUES(?,1) ON CONFLICT(tenant) DO UPDATE SET epoch=epoch+1').run(tenant);
      this.db.prepare("UPDATE receipts SET state='forgotten',body=NULL WHERE tenant=?").run(tenant);
      if(keep)this.db.prepare("UPDATE receipts SET state='pending',epoch=? WHERE tenant=? AND operation=? AND key=?").run(this.epoch(tenant),tenant,keep.operation,keep.key);
    });
  }
  close():void {this.db.close();}
}
