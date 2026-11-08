import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setTimeout as sleep} from 'node:timers/promises';

// context.ts exige estas variáveis no momento em que é carregado.
process.env.ATLAS_INTERNAL_TOKEN='x'.repeat(32);
process.env.ATLAS_APP_MODE='local';
const {tenantStore}=await import('../src/auth/tenant.js');
const {cognition}=await import('../src/context.js');

const A='usr_'+'a'.repeat(20);
const B='usr_'+'b'.repeat(20);

test('cada usuário fala com o serviço Python usando o próprio espaço, mesmo em paralelo',async()=>{
  const calls:{url:string;tenant:string}[]=[];
  const original=globalThis.fetch;
  // Falso "Python": só anota quem chamou (header x-atlas-tenant) e responde vazio.
  globalThis.fetch=(async(url:unknown,init:{headers:Record<string,string>})=>{
    calls.push({url:String(url),tenant:init.headers['x-atlas-tenant']!});
    return new Response('{}',{status:200});
  }) as typeof fetch;
  try{
    await Promise.all([
      tenantStore.run(A,async()=>{await sleep(20);await cognition('documents/da-ana');}),
      tenantStore.run(B,async()=>{await cognition('documents/do-bruno');await sleep(5);await cognition('documents/do-bruno-2');}),
    ]);
  }finally{globalThis.fetch=original;}
  const tenantOf=(part:string)=>calls.find(call=>call.url.endsWith(part))?.tenant;
  assert.equal(tenantOf('documents/da-ana'),A);
  assert.equal(tenantOf('documents/do-bruno'),B);
  assert.equal(tenantOf('documents/do-bruno-2'),B);
});
