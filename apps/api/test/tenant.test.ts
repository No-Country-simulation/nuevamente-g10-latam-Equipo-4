import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';
import {tenantStore,tenantFormat,currentTenant} from '../src/auth/tenant.js';

const A='usr_'+'a'.repeat(20);
const B='usr_'+'b'.repeat(20);

test('fora de uma requisição, usa o espaço padrão',()=>{
  assert.equal(currentTenant(),process.env.ATLAS_TENANT_ID||'local-workspace');
});

test('dentro de uma requisição, devolve o espaço do usuário logado',()=>{
  tenantStore.run(A,()=>assert.equal(currentTenant(),A));
});

test('duas requisições ao mesmo tempo nunca misturam os espaços',async()=>{
  const seen:Record<string,string[]>={a:[],b:[]};
  await Promise.all([
    tenantStore.run(A,async()=>{
      seen.a!.push(currentTenant());
      await sleep(20);
      seen.a!.push(currentTenant());
    }),
    tenantStore.run(B,async()=>{
      await sleep(5);
      seen.b!.push(currentTenant());
      await sleep(30);
      seen.b!.push(currentTenant());
    }),
  ]);
  assert.deepEqual(seen.a,[A,A]);
  assert.deepEqual(seen.b,[B,B]);
});

test('formato de espaço aceita só usuário válido ou o workspace local',()=>{
  assert.ok(tenantFormat.test(A));
  assert.ok(tenantFormat.test('local-workspace'));
});

test('formato de espaço recusa nomes estranhos (não viram pasta nem chave)',()=>{
  for(const bad of ['../usr_'+'a'.repeat(20),'usr_'+'a'.repeat(19),'usr_'+'A'.repeat(20),'usr_'+'a'.repeat(21),'usr_'+'a'.repeat(20)+'\n','a/b','','outro-workspace']){
    assert.equal(tenantFormat.test(bad),false,`deveria recusar: ${JSON.stringify(bad)}`);
  }
});