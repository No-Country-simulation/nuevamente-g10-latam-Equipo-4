import {test} from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {launchStack} from '../src/stack.mjs';
class Utility extends EventEmitter {
  constructor(index,fail){super();this.index=index;this.fail=fail;this.timers=[];}
  postMessage(){
    this.timers.push(setTimeout(()=>this.emit('message',{ready:true}),this.index===0?20:800));
    if(this.fail&&this.index===0)this.timers.push(setTimeout(()=>this.kill(),60));
  }
  kill(){if(this.exited)return;this.exited=true;for(const timer of this.timers)clearTimeout(timer);this.emit('exit',1);}
}
function fixture(fail){
  const children=[];let closes=0;
  return {children,gateway:{baseURL:'http://127.0.0.1:32111/v1',key:'synthetic-broker',close:async()=>{closes++;}},closes:()=>closes,
    utilities:{fork(){const child=new Utility(children.length,fail);children.push(child);return child;}}};
}
test('ready then exit while other services start rejects startup and cleans every owned service',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'atlas-dead-ready-')),f=fixture(true);
  try{
    await assert.rejects(launchStack(f.utilities,f.gateway,'synthetic-model',directory,'synthetic-master','test',new AbortController().signal));
    assert.equal(f.children.length,2);assert.ok(f.children.every(child=>child.exited));assert.equal(f.closes(),1);
  }finally{await rm(directory,{recursive:true,force:true});}
});
test('a service exit before onExit subscription is replayed instead of silently lost',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'atlas-exit-replay-')),f=fixture(false);let stack;
  try{
    stack=await launchStack(f.utilities,f.gateway,'synthetic-model',directory,'synthetic-master','test',new AbortController().signal);
    f.children[0].kill();let observed=0;stack.onExit(()=>{observed++;});
    await Promise.resolve();assert.equal(observed,1);
    await stack.stop();assert.equal(f.closes(),1);
  }finally{if(stack)await stack.stop();await rm(directory,{recursive:true,force:true});}
});
