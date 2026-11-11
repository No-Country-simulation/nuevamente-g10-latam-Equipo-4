import {test} from 'node:test';
import assert from 'node:assert/strict';
import {credentialEncryption} from '../src/encryption.mjs';
import {allowedPage,requireSender} from '../src/access.mjs';
import {LocalSession} from '../src/lifecycle.mjs';
import {localPorts} from '../src/ports.mjs';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:net';

test('OS encryption refuses basic_text, unavailable or not-ready storage without plaintext fallback',()=>{
  let called=0;
  const storage={isEncryptionAvailable:()=>true,getSelectedStorageBackend:()=> 'basic_text',encryptString:()=>{called++;},decryptString:()=>{called++;}};
  const provider=credentialEncryption(storage,()=>true,'linux');
  assert.equal(provider.isAvailable(),false);assert.throws(()=>provider.encrypt('synthetic'));assert.throws(()=>provider.decrypt(Buffer.from('synthetic')));assert.equal(called,0);
  storage.getSelectedStorageBackend=()=> 'gnome_libsecret';
  assert.equal(provider.isAvailable(),true);
  assert.equal(credentialEncryption(storage,()=>false,'linux').isAvailable(),false);
  storage.isEncryptionAvailable=()=>false;assert.equal(provider.isAvailable(),false);
});

test('IPC accepts only own top frame at the built account file or exact local origin',()=>{
  const entry='/tmp/atlas/index.html';
  const frame={url:'file:///tmp/atlas/index.html'};const contents={mainFrame:frame};const window={webContents:contents};
  assert.doesNotThrow(()=>requireSender({sender:contents,senderFrame:frame},window,entry));
  assert.throws(()=>requireSender({sender:contents,senderFrame:{...frame}},window,entry));
  assert.throws(()=>requireSender({sender:{},senderFrame:frame},window,entry));
  for(const url of ['file:///tmp/evil.html','https://evil.example','http://127.0.0.1:9999','http://x@127.0.0.1:3000'])assert.equal(allowedPage(url,entry,'http://127.0.0.1:3000'),false);
  assert.equal(allowedPage('http://127.0.0.1:3000/workspace',entry,'http://127.0.0.1:3000'),true);
});

test('quit during startup aborts, awaits cleanup and never publishes an orphan resource',async()=>{
  const runtime=new LocalSession();let aborted=false,cleaned=0;
  const starting=runtime.start(async signal=>{await new Promise(resolve=>signal.addEventListener('abort',()=>{aborted=true;resolve();},{once:true}));return {stop:async()=>{cleaned++;}};});
  await Promise.resolve();
  await assert.rejects(runtime.start(async()=>({stop:async()=>{}})));
  const stop=runtime.stop();await assert.rejects(starting);await stop;
  assert.equal(aborted,true);assert.equal(cleaned,1);assert.equal(runtime.current,undefined);
  await runtime.stop();assert.equal(cleaned,1);
});

test('account replacement waits for previous shutdown, including a concurrent stop',async()=>{
  const runtime=new LocalSession();let release,started=false,cleaned=0;
  await runtime.start(async()=>({stop:()=>new Promise(resolve=>{release=()=>{cleaned++;resolve();};})}));
  const stopping=runtime.stop();await Promise.resolve();await Promise.resolve();
  const next=runtime.start(async()=>{started=true;return {stop:async()=>{}};});
  await Promise.resolve();assert.equal(started,false);release();await stopping;await next;
  assert.equal(cleaned,1);assert.equal(started,true);await runtime.stop();
});

test('profile ports are unique and web origin is stable; occupied saved port fails closed',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'atlas-ports-'));const server=createServer();
  try{
    const first=await localPorts(directory),second=await localPorts(directory);
    assert.equal(new Set(first).size,3);assert.equal(first[0],second[0]);
    await new Promise(resolve=>server.listen(first[0],'127.0.0.1',resolve));
    await assert.rejects(localPorts(directory));
  }finally{if(server.listening)await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});}
});
