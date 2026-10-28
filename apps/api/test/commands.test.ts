import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {CommandReceipts} from '../src/commands/receipts.js';
import {boundedInteger} from '../src/configuration.js';
import {DatabaseSync} from 'node:sqlite';
import {commandPath} from '../src/commands/http.js';

const key='test-command-key-0001';
function fixture(run:(path:string)=>void){
  const folder=mkdtempSync(join(tmpdir(),'atlas-receipts-'));
  try{run(join(folder,'commands.sqlite3'));}finally{rmSync(folder,{recursive:true,force:true});}
}
test('durable replay keeps the exact response after reopening and accepts canonical JSON',()=>fixture(path=>{
  let receipts=new CommandReceipts(path);
  assert.deepEqual(receipts.reserve('a','generate',key,{b:2,a:1}),{kind:'new'});
  receipts.complete('a','generate',key,201,{id:'only-package',xp:15});receipts.close();
  receipts=new CommandReceipts(path);
  assert.deepEqual(receipts.reserve('a','generate',key,{a:1,b:2}),{kind:'replay',status:201,body:{id:'only-package',xp:15}});
  assert.throws(()=>receipts.reserve('a','generate',key,{a:9}),{status:409});
  receipts.close();
}));
test('competing processes/connections cannot reserve an in-flight key twice',()=>fixture(path=>{
  const first=new CommandReceipts(path),second=new CommandReceipts(path);
  first.reserve('a','generate',key,{});
  assert.throws(()=>second.reserve('a','generate',key,{}),{status:409});
  first.close();second.close();
  const afterCrash=new CommandReceipts(path);
  assert.throws(()=>afterCrash.reserve('a','generate',key,{}),{status:409});afterCrash.close();
}));
test('scope is tenant and operation, never a global untrusted key',()=>fixture(path=>{
  const receipts=new CommandReceipts(path);
  receipts.reserve('a','generate',key,{});
  assert.equal(receipts.reserve('b','generate',key,{}).kind,'new');
  assert.equal(receipts.reserve('a','groups',key,{}).kind,'new');receipts.close();
}));
test('forget invalidates done and in-flight content without making keys reusable',()=>fixture(path=>{
  const receipts=new CommandReceipts(path);
  receipts.reserve('a','chat',key,{});receipts.complete('a','chat',key,200,{text:'private'});
  receipts.reserve('a','generate',key,{});receipts.forget('a');
  receipts.complete('a','generate',key,200,{text:'late private'});
  assert.throws(()=>receipts.reserve('a','chat',key,{}),{status:409});
  assert.throws(()=>receipts.reserve('a','generate',key,{}),{status:409});receipts.close();
}));
test('failed, oversized and expired responses never reexecute; quota fails closed',()=>fixture(path=>{
  const receipts=new CommandReceipts(path,3,-1);
  receipts.reserve('a','failure',key,{});receipts.complete('a','failure',key,503,{error:'provider'});
  assert.throws(()=>receipts.reserve('a','failure',key,{}),{status:409});
  receipts.reserve('a','large',key,{});receipts.complete('a','large',key,200,{text:'x'.repeat(524288)});
  assert.throws(()=>receipts.reserve('a','large',key,{}),{status:409});
  receipts.reserve('a','expires',key,{});receipts.complete('a','expires',key,200,{});
  assert.throws(()=>receipts.reserve('a','expires',key,{}),{status:409});
  assert.throws(()=>receipts.reserve('a','another',key,{}),{status:503});receipts.close();
}));
test('invalid operation keys and invalid numeric settings are rejected',()=>fixture(path=>{
  const receipts=new CommandReceipts(path);
  for(const invalid of ['short','invalid key that contains spaces','x'.repeat(101)])assert.throws(()=>receipts.reserve('a','command',invalid,{}),{status:400});
  const before=process.env.ATLAS_TEST_NUMBER;
  try{process.env.ATLAS_TEST_NUMBER='NaN';assert.throws(()=>boundedInteger('ATLAS_TEST_NUMBER',1,1,4));process.env.ATLAS_TEST_NUMBER='3';assert.equal(boundedInteger('ATLAS_TEST_NUMBER',1,1,4),3);}
  finally{if(before===undefined)delete process.env.ATLAS_TEST_NUMBER;else process.env.ATLAS_TEST_NUMBER=before;receipts.close();}
}));
test('expiry is persisted even when replay or quota returns an error',()=>fixture(path=>{
  const receipts=new CommandReceipts(path,1,-1);
  receipts.reserve('a','chat',key,{});receipts.complete('a','chat',key,200,{text:'must expire'});
  assert.throws(()=>receipts.reserve('a','chat',key,{}),{status:409});
  assert.throws(()=>receipts.reserve('a','other',key,{}),{status:503});
  const db=new DatabaseSync(path,{readOnly:true});
  assert.deepEqual({...db.prepare('SELECT state,body FROM receipts').get()},{state:'expired',body:null});
  db.close();receipts.close();
}));
test('static routing aliases normalize while resource ID case stays significant',()=>{
  assert.equal(commandPath('/V1/Groups/'),'/v1/groups');
  assert.equal(commandPath('/v1/groups/Group_A/MESSAGES/'),'/v1/groups/Group_A/messages');
  assert.equal(commandPath('/V1/TRAILS/Trail_A/STEPS/Step_B/GENERATE/'),'/v1/trails/Trail_A/steps/Step_B/generate');
  assert.equal(commandPath('/v1/groups/Group%5FA/messages'),'/v1/groups/Group_A/messages');
  for(const path of ['/v1/groups/x%2Fy/messages','/v1/groups/x%5Cy/messages','/v1/groups/x%ZZ/messages'])assert.throws(()=>commandPath(path),{status:400});
});
test('erasure receipt can replay but previous memory receipts cannot',()=>fixture(path=>{
  const receipts=new CommandReceipts(path);
  receipts.reserve('a','chat',key,{});receipts.complete('a','chat',key,200,{text:'private'});
  const operation='DELETE:/v1/dreamer/memory';
  receipts.reserve('a',operation,key,null);
  receipts.forget('a',{operation,key});receipts.complete('a',operation,key,200,{consent:false,events:0});
  assert.equal(receipts.reserve('a',operation,key,null).kind,'replay');
  assert.throws(()=>receipts.reserve('a','chat',key,{}),{status:409});receipts.close();
}));
test('aggregate byte quota counts UTF-8 and erasure releases cached content safely',()=>fixture(path=>{
  const receipts=new CommandReceipts(path,10,604800,5);
  receipts.reserve('a','first',key,{});receipts.complete('a','first',key,200,'á');
  assert.equal(receipts.reserve('a','first',key,{}).kind,'replay');
  receipts.reserve('a','second',key,{});receipts.complete('a','second',key,200,{});
  assert.throws(()=>receipts.reserve('a','second',key,{}),{status:409});
  receipts.forget('a');
  receipts.reserve('a','third',key,{});receipts.complete('a','third',key,200,{});
  assert.equal(receipts.reserve('a','third',key,{}).kind,'replay');
  assert.throws(()=>receipts.reserve('a','first',key,{}),{status:409});receipts.close();
}));
