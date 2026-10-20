import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fallbackDecision,generationSchema,decide} from '../src/policy.js';

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
