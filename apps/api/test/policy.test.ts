import {test} from 'node:test';
import {TypeSafeClient} from '@typesafe-ai/sdk';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import assert from 'node:assert/strict';
import {fallbackDecision,generationSchema,decide,judge,selectTeam,evaluateEvidence} from '../src/policy.js';

test('automatic choices preserve user overrides and keep large sources out of LM context',()=>{
  const request=generationSchema.parse({document_ids:['doc_'+'a'.repeat(20)],goal:'Explicar o material'});
  assert.equal(fallbackDecision(request,30000).rag_mode,'hybrid');
  assert.equal(fallbackDecision(request,1000).method,'feynman');
  assert.equal(fallbackDecision({...request,method:'warburg',rag_mode:'vector'},1000).method,'warburg');
  assert.equal(fallbackDecision({...request,method:'warburg',rag_mode:'vector'},1000).rag_mode,'vector');
});

test('client cannot inject tenant, decision or credential fields into generation',()=>{
  assert.equal(generationSchema.safeParse({document_ids:['doc_'+'a'.repeat(20)],goal:'Explicar',tenant:'other'}).success,false);
});

test('approved Dreamer preference influences auto mode without overriding the user',async()=>{
  const previous=process.env.TYPESAFE_API_KEY;delete process.env.TYPESAFE_API_KEY;
  try {
    const request=generationSchema.parse({document_ids:['doc_'+'a'.repeat(20)],goal:'Explicar o material'});
    assert.equal((await decide(request,1000,{preferred_method:'socratic'})).method,'socratic');
    assert.equal((await decide({...request,method:'warburg'},1000,{preferred_method:'socratic'})).method,'warburg');
  } finally {if(previous!==undefined)process.env.TYPESAFE_API_KEY=previous;}
});

async function comChave<T>(chave:string|undefined,fn:()=>Promise<T>){
  const anterior={...process.env};
  const dir=mkdtempSync(join(tmpdir(),'atlas-taylam-policy-'));
  process.env.ATLAS_CREDENTIALS_FILE=join(dir,'absent.enc');
  delete process.env.TYPESAFE_API_KEY_FILE;
  if(chave===undefined)delete process.env.TYPESAFE_API_KEY;else process.env.TYPESAFE_API_KEY=chave;
  try{return await fn();}
  finally{
    for(const key of Object.keys(process.env))if(!(key in anterior))delete process.env[key];
    Object.assign(process.env,anterior);rmSync(dir,{recursive:true,force:true});
  }
}

test('sem chave do TypeSafe: judge, selectTeam e evaluateEvidence não avaliam',async t=>{
  const sdk=t.mock.method(TypeSafeClient.prototype,'systemOne',async()=>{throw new Error('No SDK call expected');});
  await comChave(undefined,async()=>{
    assert.deepEqual(await judge('p','e','r'),{verdict:'not_evaluated',score:null});
    assert.deepEqual(await selectTeam('p','e',{},{}),{winner:'abstain',source:'policy'});
    assert.deepEqual(await evaluateEvidence('p',[{id:'1',text:'texto'}]),{source:'not_evaluated',scores:[]});
  });
  assert.equal(sdk.mock.callCount(),0);
});

test('TypeSafe fora do ar: falha do SDK não derruba o fluxo',async t=>{
  const sdk=t.mock.method(TypeSafeClient.prototype,'systemOne',async()=>{throw new Error('Simulated provider outage');});
  await comChave('chave-falsa-123456',async()=>{
    assert.deepEqual(await judge('p','e','r'),{verdict:'not_evaluated',score:null});
    assert.deepEqual(await selectTeam('p','e',{},{}),{winner:'abstain',source:'policy'});
    assert.deepEqual(await evaluateEvidence('p',[{id:'1',text:'texto'}]),{source:'not_evaluated',scores:[]});
  });
  assert.equal(sdk.mock.callCount(),3);
});
