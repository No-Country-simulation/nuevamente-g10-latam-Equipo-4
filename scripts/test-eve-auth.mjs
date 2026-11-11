import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {createServer} from 'node:net';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {Client} from 'eve/client';
import {issueTicket} from '../apps/api/dist/orchestration/tickets.js';

const dir=await mkdtemp(join(tmpdir(),'atlas-eve-auth-'));
const listener=createServer();
await new Promise((ok,fail)=>listener.once('error',fail).listen(0,'127.0.0.1',ok));
const port=listener.address().port;
await new Promise((ok,fail)=>listener.close(error=>error?fail(error):ok()));
const host=`http://127.0.0.1:${port}`;
const secret='eve-auth-smoke-secret-0123456789';
const server=spawn(process.execPath,[resolve('apps/api/.output/server/index.mjs')],{
  cwd:dir,
  env:{HOST:'127.0.0.1',PORT:String(port),EVE_SERVICE_TOKEN:secret,ATLAS_INTERNAL_TOKEN:'different-internal-token-0123456789'},
  stdio:['ignore','pipe','pipe'],
});
let output='';
for(const stream of [server.stdout,server.stderr])stream.on('data',chunk=>{output=(output+chunk).slice(-12000);});
try {
  const health=new Client({host,redirect:'error'});
  let ready=false;
  for(let attempt=0;attempt<100;attempt++){
    if(server.exitCode!==null||server.signalCode!==null)throw new Error(`Eve exited before readiness (${server.exitCode??server.signalCode}): ${output}`);
    try{await health.health({signal:AbortSignal.timeout(500)});ready=true;break;}catch{await delay(200);}
  }
  assert.ok(ready,`Eve did not become ready: ${output}`);
  const {ticket}=issueTicket({tenant:'eve-auth-smoke',agent:'lumi',purpose:'learning',capabilities:[]},secret);
  const client=bearer=>new Client({host,auth:{bearer},redirect:'error'});
  for(const invalid of ['invalid-probe',`${ticket.slice(0,-1)}${ticket.endsWith('A')?'B':'A'}`]){
    await assert.rejects(client(invalid).sessions.create({signal:AbortSignal.timeout(8000)}),error=>{
      assert.ok([401,403].includes(error.status),`expected authentication rejection, got ${error}`);
      return true;
    });
  }
  const {session}=await client(ticket).sessions.create({signal:AbortSignal.timeout(8000)});
  assert.ok(session.state.sessionId,'valid signed ticket must create an Eve session');
  await session.reset({reason:'Compiled Eve authentication smoke; no model turn'});
  console.log('Compiled Eve: valid ticket creates a session; invalid and altered tickets rejected.');
} finally {
  if(server.exitCode===null&&server.signalCode===null){
    server.kill('SIGTERM');
    await Promise.race([new Promise(ok=>server.once('exit',ok)),delay(5000)]);
    if(server.exitCode===null&&server.signalCode===null){server.kill('SIGKILL');await new Promise(ok=>server.once('exit',ok));}
  }
  await rm(dir,{recursive:true,force:true});
}
