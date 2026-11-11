import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,openAsBlob,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const base=(process.env.ATLAS_WEB_URL || 'http://127.0.0.1:3000')+'/api/atlas/';
const unique=Date.now();
async function request(path,body,cookie){return fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json','Idempotency-Key':crypto.randomUUID()}:{}),...(cookie?{cookie}:{})},body:body&&JSON.stringify(body)});}
async function register(email){const r=await request('auth/register',{name:'Teste',email,password:'password-1234'});assert.equal(r.status,201);const body=await r.json();assert.ok(body.user.id);assert.equal(body.session_token,undefined);const cookie=r.headers.get('set-cookie');assert.match(cookie,/HttpOnly/i);return {id:body.user.id,cookie:cookie.split(';')[0]};}
const one=await register(`one-${unique}@example.test`);
const privateText=`# Documento privado\n\nConteúdo reservado da conta A, identificador ${unique}.`;
const form=new FormData();form.append('file',new Blob([privateText],{type:'text/markdown'}),'privado.md');
let r=await fetch(base+'documents',{method:'POST',headers:{cookie:one.cookie},body:form});
assert.equal(r.status,201,'A faz upload');
const document=await r.json();assert.match(document.id,/^doc_[a-f0-9]{20}$/);
const two=await register(`two-${unique}@example.test`);
assert.notEqual(one.id,two.id);
for(const user of [one,two]){r=await request('auth/me',null,user.cookie);assert.equal((await r.json()).user.id,user.id);}
r=await request('documents',null,two.cookie);assert.equal(r.status,200);
assert.equal((await r.json()).some(item=>item.id===document.id),false,'B não vê a fonte na lista');
r=await request(`documents/${document.id}/source`,null,two.cookie);assert.equal(r.status,404,'B não lê a fonte de A');
r=await request(`documents/${document.id}/source`,null,one.cookie);assert.equal(r.status,200);
assert.match(JSON.stringify(await r.json()),new RegExp(`identificador ${unique}`),'A lê sua fonte');
// Exercise authentication and the streamed 80 MiB boundary together, across all three services.
const directory=mkdtempSync(join(tmpdir(),'atlas-auth-upload-'));
try {
  const path=join(directory,'large.pdf');
  execFileSync(resolve('.venv/bin/python'),['scripts/fixtures/large-pdf.py',path]);
  const large=new FormData();large.append('file',await openAsBlob(path,{type:'application/pdf'}),'large.pdf');
  const uploaded=await fetch(base+'documents',{method:'POST',headers:{cookie:two.cookie},body:large});
  assert.equal(uploaded.status,201,'B uploads a complete 80 MiB PDF with its session');
  const big=await uploaded.json();
  assert.equal((await request(`documents/${big.id}/source`,null,one.cookie)).status,404,'A cannot read B large source');
  const foreignDelete=await fetch(base+`documents/${big.id}`,{method:'DELETE',headers:{cookie:one.cookie,'Idempotency-Key':crypto.randomUUID()}});
  assert.equal(foreignDelete.status,404,'A cannot delete B large source');
  const generated=await request('generations',{document_ids:[big.id],goal:'Explicar redes privadas na nuvem',agent_id:'clara',method:'feynman'},two.cookie);
  assert.equal(generated.status,201,'B generates using its source and a new persona');
  const material=await generated.json();
  assert.equal((await request(`packages/${material.id}`,null,one.cookie)).status,404,'A cannot read B derived material');
  const erased=await fetch(base+`documents/${big.id}`,{method:'DELETE',headers:{cookie:two.cookie,'Idempotency-Key':crypto.randomUUID()}});
  assert.equal(erased.status,200,'B removes its own source');
  assert.equal((await request(`packages/${material.id}`,null,two.cookie)).status,404,'removal invalidates the derived material');
  console.log('HTTP authenticated 80 MiB upload, persona, source/package isolation and deletion passed');
} finally {
  rmSync(directory,{recursive:true,force:true});
}
r=await request('auth/logout',{},one.cookie);assert.equal(r.status,201);assert.match(r.headers.get('set-cookie'),/Max-Age=0/i);
assert.equal((await request('auth/me',null,one.cookie)).status,401);
assert.equal((await request(`documents/${document.id}/source`,null,one.cookie)).status,401,'sessão encerrada não acessa a fonte');
assert.equal((await request(`documents/${document.id}/source`)).status,401,'sem cookie não acessa a fonte');
assert.equal((await request('auth/me',null,two.cookie)).status,200);
r=await request('auth/login',{email:`one-${unique}@example.test`,password:'password-1234'});assert.equal(r.status,201);assert.match(r.headers.get('set-cookie'),/HttpOnly/i);assert.equal((await r.json()).session_token,undefined);
console.log('HTTP register/login two users, isolation and logout passed');
if(process.env.ATLAS_API_URL&&process.env.ATLAS_INTERNAL_TOKEN){
  const session=two.cookie.slice('atlas_session='.length);
  const headers={Authorization:`Bearer ${process.env.ATLAS_INTERNAL_TOKEN}`,'x-atlas-session':session};
  for(const path of ['/v1/connections','/V1/Connections']){
    const response=await fetch(process.env.ATLAS_API_URL+path,{headers});
    assert.equal(response.status,403,`administrative protection for ${path}`);
  }
  console.log('HTTP connection aliases require an administrator');
}
