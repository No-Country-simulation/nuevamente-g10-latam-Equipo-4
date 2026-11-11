import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createActionEngines,brainPrincipal} from '../src/orchestration/actions.js';
import {CognitionError,unwrapCognitionError,publicErrorCode,replayErrorHeader} from '../src/http-errors.js';
import type {Response} from 'express';
test('trusted upstream errors survive real Invokta wrapping without accepting forged cause objects',async()=>{
  const original=new CognitionError('safe message',429,'chatgpt_limit');
  const actions=createActionEngines(()=>'test',{cognition:async()=>{throw original;},search:async()=>({}),judge:async()=>({})});
  await assert.rejects(actions.invoke('atlas.sources',{},brainPrincipal('test','nilo')),error=>{
    assert.equal(unwrapCognitionError(error),original);assert.equal(publicErrorCode(error),'chatgpt_limit');return true;
  });
  const untrusted={cause:{status:429,publicCode:'chatgpt_limit'}};
  assert.equal(unwrapCognitionError(untrusted),untrusted);assert.equal(publicErrorCode(untrusted),undefined);
  assert.equal(publicErrorCode(new CognitionError('safe',503,'private-diagnostic')),undefined);
});
test('replayed error restores only an allowlisted public header',()=>{
  const headers=new Map();const response={setHeader:(key:string,value:string)=>{headers.set(key,value);}} as unknown as Response;
  replayErrorHeader(response,{code:'private-diagnostic'});assert.equal(headers.size,0);
  replayErrorHeader(response,{code:'chatgpt_limit'});assert.equal(headers.get('X-Atlas-Error-Code'),'chatgpt_limit');
});
