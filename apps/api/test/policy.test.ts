import {test} from 'node:test';
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
  const anterior=process.env.TYPESAFE_API_KEY;
  if(chave===undefined)delete process.env.TYPESAFE_API_KEY;else process.env.TYPESAFE_API_KEY=chave;
  try{return await fn();}
  finally{if(anterior===undefined)delete process.env.TYPESAFE_API_KEY;else process.env.TYPESAFE_API_KEY=anterior;}
}

test('sem chave do TypeSafe: judge, selectTeam e evaluateEvidence não avaliam',async()=>{
  await comChave(undefined,async()=>{
    assert.deepEqual(await judge('p','e','r'),{verdict:'not_evaluated',score:null});
    assert.deepEqual(await selectTeam('p','e',{},{}),{winner:'abstain',source:'policy'});
    assert.deepEqual(await evaluateEvidence('p',[{id:'1',text:'texto'}]),{source:'not_evaluated',scores:[]});
  });
});

test('TypeSafe fora do ar (chave inválida): as funções não derrubam o fluxo',{timeout:60000},async()=>{
  await comChave('chave-falsa-123456',async()=>{
    assert.deepEqual(await judge('p','e','r'),{verdict:'not_evaluated',score:null});
    assert.deepEqual(await selectTeam('p','e',{},{}),{winner:'abstain',source:'policy'});
    assert.deepEqual(await evaluateEvidence('p',[{id:'1',text:'texto'}]),{source:'not_evaluated',scores:[]});
  });
});