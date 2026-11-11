import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once,EventEmitter} from 'node:events';
import {terminate,shutdown,trackChild} from '../src/processes.mjs';
test('shutdown waits for an owned child and escalates if SIGTERM is ignored',async()=>{
  const child=spawn(process.execPath,['-e',"process.on('SIGTERM',()=>{});console.log('ready');setInterval(()=>{},1000)"],{stdio:['ignore','pipe','ignore']});
  const owned=trackChild(child);const force=owned.force;let forced=0;owned.force=()=>{forced++;force();};
  await once(child.stdout,'data');
  try{
    await terminate(owned);
    assert.equal(forced,1);assert.throws(()=>process.kill(child.pid,0));
  }finally{child.kill('SIGKILL');}
});
test('a failed child cleanup cannot prevent other children or gateway from closing',async()=>{
  let closed=0,other=0;
  await assert.rejects(shutdown([{isExited(){throw new Error('synthetic failure');}},{isExited:()=>{other++;return true;}}],{close:async()=>{closed++;}}));
  assert.equal(closed,1);assert.equal(other,1);
});

test('an already exited Electron utility is recognized without signaling a mutable PID',async()=>{
  const child=new EventEmitter();child.pid=12345;let kills=0;child.kill=()=>{kills++;};
  const owned=trackChild(child,'utility');child.pid=undefined;child.emit('exit',1);
  await terminate(owned);await terminate(owned);assert.equal(kills,0);
});
test('a Node child already exited by signal is not waited on or killed again',async()=>{
  const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});
  const owned=trackChild(child);await once(child,'spawn');child.kill('SIGTERM');await once(child,'exit');
  assert.notEqual(child.signalCode,null);assert.equal(child.exitCode,null);
  await terminate(owned);await terminate(trackChild(child));
});
