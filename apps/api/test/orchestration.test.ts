import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createActionEngines,brainPrincipal,controlPrincipal,type ActionPorts} from '../src/orchestration/actions.js';
import {createBrains} from '../src/orchestration/brains.js';
import {generationSchema,fallbackDecision} from '../src/policy.js';
const id='doc_'+'a'.repeat(20);
const state={consent:true,active_version:2,active_policy:{preferred_method:'socratic'}};
const material={id:'pkg_test',status:'ready',conteudo_adaptado:{itens:[]}};
function fixture(override:Partial<ActionPorts>={}) {
  const calls:{path:string;body:unknown;memory:boolean|undefined}[]=[];
  const ports:ActionPorts={async cognition(path,method,body,memory){calls.push({path,body,memory});return path==='documents'?[{id,characters:1234}]:path==='dreamer/status'?state:material;},async search(){return {results:[],source:'firecrawl',retrieved_at:new Date().toISOString()};},async judge(){return {verdict:'not_evaluated',score:null};},...override};
  return {actions:createActionEngines('alice',ports),calls};
}

test('Action Engines expose versioned domain capabilities and schemas',()=>{
  const {actions}=fixture();assert.deepEqual(actions.catalog().map(e=>e.name),['atlas-learning','atlas-research','atlas-memory']);
  assert.equal(actions.learning.describe('atlas.generate').inputSchema.type,'object');
  assert.equal(actions.memory.describe('atlas.memory.forget').annotations?.destructive,true);
});

test('Invokta denies cross-workspace calls and brains cannot grant consent or erase memory',async()=>{
  const {actions,calls}=fixture();
  await assert.rejects(actions.invoke('atlas.sources',{},brainPrincipal('bob','nilo')),error=>(error as any).code==='FORBIDDEN');
  for(const capability of ['atlas.memory.consent','atlas.memory.rollback','atlas.memory.forget','atlas.memory.cycle']) {
    const input=capability.endsWith('consent')?{enabled:true}:capability.endsWith('rollback')?{version:0}:{};
    await assert.rejects(actions.invoke(capability,input,brainPrincipal('alice','nilo')),error=>(error as any).code==='FORBIDDEN');
  }
  assert.equal(calls.length,0);
});

test('Invokta rejects injected fields and invalid provider outputs before returning them',async()=>{
  const {actions,calls}=fixture({async search(){return {results:[{url:'not-a-url'}],source:'firecrawl',retrieved_at:'now'};}});
  await assert.rejects(actions.invoke('atlas.web-search',{query:'redes OCI',tenant:'bob'},controlPrincipal('alice')),error=>(error as any).code==='INPUT_INVALID');
  await assert.rejects(actions.invoke('atlas.web-search',{query:'redes OCI'},controlPrincipal('alice')),error=>(error as any).code==='OUTPUT_INVALID');
  assert.equal(calls.length,0);
});

test('all five brains use authorized source sizes and Dreamer policy for chat and generation',async()=>{
  const {actions,calls}=fixture();let decisions=0;
  const brains=createBrains('alice',actions,async(input,characters,memory)=>{decisions++;assert.equal(characters,1234);assert.deepEqual(memory,state.active_policy);return fallbackDecision(input,characters);});
  for(const brain of brains.catalog())for(const kind of ['chat','generate'] as const){
    const input=generationSchema.parse({document_ids:[id],goal:'Explicar este material',agent_id:brain.id,method:'warburg'});
    assert.equal((await brains.respond(kind,input)).id,'pkg_test');
    const sent=calls.at(-1)!.body as any;assert.equal(sent.agent_id,brain.id);assert.equal(sent.decision.method,'warburg');
  }
  assert.equal(decisions,10);
});

test('brains reject unauthorized documents before reading memory or executing a model',async()=>{
  const {actions,calls}=fixture();const brains=createBrains('alice',actions,async()=>{throw new Error('must not run');});
  await assert.rejects(brains.respond('generate',generationSchema.parse({document_ids:['doc_'+'b'.repeat(20)],goal:'Explicar'})));
  assert.deepEqual(calls.map(call=>call.path),['documents']);
});

test('a revoked consent prevents the brain from forwarding a stale policy',async()=>{
  const {actions}=fixture({async cognition(path){return path==='documents'?[{id,characters:100}]:path==='dreamer/status'?{...state,consent:false}:material;}});
  const brains=createBrains('alice',actions,async(input,characters,memory)=>{assert.equal(memory,null);return fallbackDecision(input,characters);});
  await brains.respond('chat',generationSchema.parse({document_ids:[id],goal:'Explicar'}));
});

test('external memory failure still clears local history through the memory engine',async()=>{
  const cleared:boolean[]=[];const {actions}=fixture({remoteMemory:true,async cognition(path,method,body,memory){cleared.push(!!memory);if(memory)throw new Error('external unavailable');return {...state,consent:false};}});
  await assert.rejects(actions.invoke('atlas.memory.forget',{},controlPrincipal('alice')));
  assert.deepEqual(cleared,[true,false]);
});

test('action cancellation reaches provider port',async()=>{
  const abort=new AbortController();let started!:()=>void;const ready=new Promise<void>(resolve=>started=resolve);
  const {actions}=fixture({async search(query,signal){started();await new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));return {};}});
  const result=actions.invoke('atlas.web-search',{query:'redes OCI'},brainPrincipal('alice','lumi'),abort.signal);
  await ready;abort.abort();await assert.rejects(result);
});
