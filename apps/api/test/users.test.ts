import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {Accounts} from '../src/auth/users.js';

const PASSWORD='uma-senha-bem-longa-123';

/** Cada teste ganha um banco novo numa pasta temporária (some no final). */
function setup() {
  const dir=mkdtempSync(join(tmpdir(),'atlas-users-'));
  const path=join(dir,'users.sqlite3');
  const accounts=new Accounts(path);
  return {accounts,path,done(){accounts.close();rmSync(dir,{recursive:true,force:true});}};
}
const status=(code:number)=>(error:unknown)=>(error as {status?:number}).status===code;
/** Abre o banco "por fora" para conferir o que realmente foi salvo. */
function peek<T>(path:string,sql:string):T[] {
  const db=new DatabaseSync(path);
  try{return db.prepare(sql).all() as T[];}finally{db.close();}
}

test('cadastro cria a conta, normaliza o e-mail e já abre uma sessão',async()=>{
  const {accounts,done}=setup();
  try{
    const {user,session}=await accounts.register('  Ana@Email.com ','Ana',PASSWORD);
    assert.match(user.id,/^usr_[a-f0-9]{20}$/);
    assert.equal(user.email,'ana@email.com');
    assert.ok(session.token.length>20);
    assert.equal(accounts.validate(session.token)?.id,user.id);
  }finally{done();}
});

test('e-mail repetido é recusado, mesmo com maiúsculas diferentes',async()=>{
  const {accounts,done}=setup();
  try{
    await accounts.register('ana@email.com','Ana',PASSWORD);
    await assert.rejects(accounts.register('ANA@EMAIL.COM','Outra Ana',PASSWORD),status(409));
  }finally{done();}
});

test('a senha e o token de sessão nunca ficam guardados em texto puro',async()=>{
  const {accounts,path,done}=setup();
  try{
    const {session}=await accounts.register('ana@email.com','Ana',PASSWORD);
    const [user]=peek<{password_hash:string}>(path,'SELECT password_hash FROM users');
    assert.ok(user!.password_hash.startsWith('s1$'));
    assert.ok(!user!.password_hash.includes(PASSWORD));
    const [stored]=peek<{token_hash:string}>(path,'SELECT token_hash FROM sessions');
    assert.notEqual(stored!.token_hash,session.token);
  }finally{done();}
});

test('login funciona com a senha certa e falha com a errada',async()=>{
  const {accounts,done}=setup();
  try{
    const created=await accounts.register('ana@email.com','Ana',PASSWORD);
    const ok=await accounts.login(' ANA@email.com',PASSWORD);
    assert.equal(ok.user.id,created.user.id);
    await assert.rejects(accounts.login('ana@email.com','senha-errada-123'),status(401));
  }finally{done();}
});

test('"e-mail não existe" e "senha errada" dão exatamente a mesma resposta',async()=>{
  const {accounts,done}=setup();
  try{
    await accounts.register('ana@email.com','Ana',PASSWORD);
    const wrongPassword=await accounts.login('ana@email.com','senha-errada-123').catch(e=>e);
    const noUser=await accounts.login('ninguem@email.com',PASSWORD).catch(e=>e);
    assert.equal(wrongPassword.status,401);
    assert.equal(noUser.status,401);
    assert.equal(wrongPassword.message,noUser.message);
  }finally{done();}
});

test('depois de 5 erros seguidos a conta trava, até com a senha certa',async()=>{
  const {accounts,done}=setup();
  try{
    await accounts.register('ana@email.com','Ana',PASSWORD);
    await accounts.register('bia@email.com','Bia',PASSWORD);
    for(let i=0;i<5;i++)await assert.rejects(accounts.login('ana@email.com','errada-errada'),status(401));
    await assert.rejects(accounts.login('ana@email.com',PASSWORD),status(429));
    // O bloqueio é por e-mail: outra pessoa continua entrando normalmente.
    assert.equal((await accounts.login('bia@email.com',PASSWORD)).user.email,'bia@email.com');
  }finally{done();}
});

test('validate recusa token vazio, falso ou grande demais',async()=>{
  const {accounts,done}=setup();
  try{
    assert.equal(accounts.validate(undefined),null);
    assert.equal(accounts.validate(''),null);
    assert.equal(accounts.validate('token-que-nao-existe'),null);
    assert.equal(accounts.validate('x'.repeat(201)),null);
  }finally{done();}
});

test('logout invalida o token',async()=>{
  const {accounts,done}=setup();
  try{
    const {session}=await accounts.register('ana@email.com','Ana',PASSWORD);
    accounts.logout(session.token);
    assert.equal(accounts.validate(session.token),null);
  }finally{done();}
});

test('sessão vencida não vale e é apagada',async()=>{
  const {accounts,path,done}=setup();
  try{
    const {session}=await accounts.register('ana@email.com','Ana',PASSWORD);
    const db=new DatabaseSync(path);db.exec('UPDATE sessions SET expires=1');db.close();
    assert.equal(accounts.validate(session.token),null);
    assert.equal(peek(path,'SELECT 1 FROM sessions').length,0);
  }finally{done();}
});

test('cleanup remove só as sessões vencidas',async()=>{
  const {accounts,path,done}=setup();
  try{
    await accounts.register('ana@email.com','Ana',PASSWORD);
    const bia=await accounts.register('bia@email.com','Bia',PASSWORD);
    const db=new DatabaseSync(path);
    db.exec("UPDATE sessions SET expires=1 WHERE user_id=(SELECT id FROM users WHERE email='ana@email.com')");
    db.close();
    accounts.cleanup();
    assert.equal(peek(path,'SELECT 1 FROM sessions').length,1);
    assert.equal(accounts.validate(bia.session.token)?.email,'bia@email.com');
  }finally{done();}
});