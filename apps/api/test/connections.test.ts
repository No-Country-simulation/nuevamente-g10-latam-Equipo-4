import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {saveConnection,removeConnection,publicConnections,connection,readVault,secret} from '../src/connections/vault.js';
import {probeConnection} from '../src/connections/probe.js';

test('provider vault: encrypted roundtrip, cross-runtime read, isolation, probes and deletion',async t=>{
 const dir=mkdtempSync(join(tmpdir(),'atlas-vault-'));
 const before={...process.env};
 process.env.ATLAS_CREDENTIAL_MASTER_KEY=randomBytes(32).toString('base64');
 process.env.ATLAS_CREDENTIALS_FILE=join(dir,'providers.enc');process.env.ATLAS_TENANT_ID='vault-test';
 delete process.env.ATLAS_CREDENTIAL_MASTER_KEY_FILE;
 try{
  await t.test('never persists or returns plaintext; Python decrypts the same envelope',()=>{
   const status=saveConnection('generation',{mode:'manual',provider:'openrouter',model:'example/model',key:'test-only-private-api-key'});
   assert.equal(connection('generation').key,'test-only-private-api-key');
   assert.ok(!readFileSync(process.env.ATLAS_CREDENTIALS_FILE!,'utf8').includes('test-only-private-api-key'));
   assert.ok(!JSON.stringify(status).includes('test-only-private-api-key'));
   const python=resolve('../../.venv/bin/python');
   const result=spawnSync(python,['-c','from atlas.credentials import connection; assert connection("generation")["key"] == "test-only-private-api-key"; print("cross-runtime-ok")'],{env:{...process.env,PYTHONPATH:resolve('../../services/cognition')}});
   assert.equal(result.status,0,result.stderr.toString());assert.equal(result.stdout.toString().trim(),'cross-runtime-ok');
  });
  await t.test('tenant change and ciphertext tampering fail closed',()=>{
   const good=readFileSync(process.env.ATLAS_CREDENTIALS_FILE!);
   process.env.ATLAS_TENANT_ID='other-workspace';assert.throws(()=>readVault());process.env.ATLAS_TENANT_ID='vault-test';
   const envelope=JSON.parse(good.toString());envelope.data=Buffer.from('corrupt').toString('base64');writeFileSync(process.env.ATLAS_CREDENTIALS_FILE!,JSON.stringify(envelope));assert.throws(()=>readVault());writeFileSync(process.env.ATLAS_CREDENTIALS_FILE!,good);
  });
  await t.test('missing master key never silently falls back to another provider',()=>{
   const key=process.env.ATLAS_CREDENTIAL_MASTER_KEY;delete process.env.ATLAS_CREDENTIAL_MASTER_KEY;assert.throws(()=>connection('generation'));process.env.ATLAS_CREDENTIAL_MASTER_KEY=key;
  });
  await t.test('rejects arbitrary endpoints, cross-purpose providers and unapproved ChatGPT login',()=>{
   assert.throws(()=>saveConnection('search',{mode:'manual',provider:'openrouter',key:'test-secret-key'}));
   assert.throws(()=>saveConnection('generation',{mode:'manual',provider:'openai',model:'x',key:'test-secret-key',base_url:'http://169.254.169.254'}));
   process.env.ATLAS_ALLOW_LOCAL_CHATGPT='0';assert.throws(()=>saveConnection('generation',{mode:'local_login',provider:'chatgpt_local',model:'x'}));
   process.env.ATLAS_ALLOW_LOCAL_CHATGPT='1';process.env.NODE_ENV='production';assert.throws(()=>saveConnection('generation',{mode:'local_login',provider:'chatgpt_local',model:'x'}));
  });
  await t.test('a catalog probe sends the secret only to its provider and never generates content',async()=>{
   let calls=0;
   const result=await probeConnection('generation',(async(url,init)=>{calls++;assert.equal(url,'https://openrouter.ai/api/v1/models');assert.equal(init?.redirect,'error');assert.equal((init?.headers as Record<string,string>).Authorization,'Bearer test-only-private-api-key');assert.equal(init?.body,undefined);return new Response(JSON.stringify({data:[{id:'example/model'}]}));}) as typeof fetch);
   assert.equal(calls,1);assert.equal(result.authenticated,true);assert.equal(result.inference,false);assert.equal('model_listed' in result&&result.model_listed,true);
  });
  await t.test('mounted secret file has explicit priority and missing files fail closed',()=>{
   const file=join(dir,'secret');writeFileSync(file,'file-secret');process.env.TYPESAFE_API_KEY='env-secret';process.env.TYPESAFE_API_KEY_FILE=file;assert.equal(secret('TYPESAFE_API_KEY'),'file-secret');process.env.TYPESAFE_API_KEY_FILE=join(dir,'absent');assert.throws(()=>secret('TYPESAFE_API_KEY'));delete process.env.TYPESAFE_API_KEY_FILE;
  });
  await t.test('deleting a manual key restores server configuration without returning it',()=>{
   process.env.ATLAS_AGENT_RUNTIME='direct';process.env.LLM_API_KEY='server-fallback-secret';process.env.LLM_MODEL='server-model';
   const state=removeConnection('generation');assert.equal(connection('generation').key,'server-fallback-secret');assert.ok(!JSON.stringify(state).includes('server-fallback-secret'));assert.equal(publicConnections().connections.find(p=>p.slot==='generation')?.source,'env');
   process.env.ATLAS_AGENT_RUNTIME='eve';process.env.EVE_MODEL_PROVIDER='openai';process.env.EVE_MODEL='app-model';process.env.OPENAI_API_KEY='reserved-tool-test-key';process.env.ATLAS_OPENAI_API_KEY='app-specific-test-key';assert.equal(connection('generation').key,'app-specific-test-key');delete process.env.ATLAS_OPENAI_API_KEY;assert.equal(connection('generation').key,'');
  });
 }finally{for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);rmSync(dir,{recursive:true,force:true});}
});
