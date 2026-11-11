import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,cpSync,mkdirSync,readFileSync,writeFileSync,rmSync,readdirSync,statSync,readlinkSync,openAsBlob} from 'node:fs';
import {once} from 'node:events';
import {join,resolve,basename} from 'node:path';
import {tmpdir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

// Isolated native processes and synthetic data only. This is not a cgroup/load proof.
const root=mkdtempSync(join(tmpdir(),'atlas-upload-runtime-'));
const repository=process.cwd(),children=[];
const maxRSSKiB={web:0,api:0,cognition:0,parser:0};
let logs='',timer;
function start(command,args,cwd,env){
  const child=spawn(command,args,{cwd,env,stdio:['ignore','pipe','pipe']});children.push(child);
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{logs=(logs+chunk).slice(-8000);});
  return child;
}
function ownsPort(pid,port){
  const wanted=port.toString(16).toUpperCase().padStart(4,'0');
  const sockets=new Set(readFileSync('/proc/net/tcp','utf8').trim().split('\n').slice(1).map(row=>row.trim().split(/\s+/)).filter(fields=>fields[1].endsWith(':'+wanted)&&fields[3]==='0A').map(fields=>'socket:['+fields[9]+']'));
  try{return readdirSync(`/proc/${pid}/fd`).some(fd=>{try{return sockets.has(readlinkSync(`/proc/${pid}/fd/${fd}`));}catch{return false;}});}catch{return false;}
}
async function stop(){
  clearInterval(timer);
  for(const child of children)child.kill('SIGTERM');
  await Promise.all(children.map(async child=>{
    if(child.exitCode!==null||child.signalCode!==null)return;
    await Promise.race([once(child,'exit'),delay(10000,undefined,{ref:false}).then(()=>child.kill('SIGKILL'))]);
  }));
  rmSync(root,{recursive:true,force:true});
}
try{
  const env={...process.env,NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=256',ATLAS_ENV_FILE:'/dev/null',ATLAS_ENV_READY:'1',ATLAS_APP_MODE:'local',ATLAS_BIND_ADDRESS:'127.0.0.1',ATLAS_TENANT_ID:'upload-runtime',ATLAS_INTERNAL_TOKEN:randomBytes(32).toString('hex'),ATLAS_DATA_DIR:join(root,'data'),TMPDIR:join(root,'uploads'),ATLAS_AGENT_CATALOG:resolve('packages/contracts/agents.json'),ATLAS_AGENT_RUNTIME:'extractive',ATLAS_SEED_DEMO:'0',STORAGE_PROVIDER:'local',VECTOR_BACKEND:'sqlite',ATLAS_JOB_RUNNER:'local',API_PORT:'4500',COGNITION_URL:'http://127.0.0.1:8500',ATLAS_API_URL:'http://127.0.0.1:4500',EVE_URL:'',MEMORY_SERVICE_URL:'',MONGODB_URI:'',ATLAS_ALLOW_LOCAL_CHATGPT:'0',ATLAS_CREDENTIALS_FILE:'',ATLAS_CREDENTIAL_MASTER_KEY:randomBytes(32).toString('base64'),ATLAS_CREDENTIAL_MASTER_KEY_FILE:''};
  for(const key of ['TYPESAFE_API_KEY','FIRECRAWL_API_KEY','EMBEDDING_API_KEY','EMBEDDING_BASE_URL','EMBEDDING_MODEL','LLM_API_KEY','LLM_BASE_URL','LLM_MODEL','OPENROUTER_API_KEY','ATLAS_OPENAI_API_KEY','ANTHROPIC_API_KEY','AI_GATEWAY_API_KEY']){env[key]='';env[`${key}_FILE`]='';}
  mkdirSync(env.TMPDIR,{recursive:true});
  const standalone=resolve('apps/web/.next/standalone/apps/web');
  cpSync('apps/web/public',join(standalone,'public'),{recursive:true});
  cpSync('apps/web/.next/static',join(standalone,'.next/static'),{recursive:true});
  const pdf=join(root,'80MiB.pdf');
  execFileSync(resolve('.venv/bin/python'),['scripts/fixtures/large-pdf.py',pdf],{stdio:'pipe'});
  const python=start(resolve('.venv/bin/uvicorn'),['atlas.main:app','--host','127.0.0.1','--port','8500'],resolve('services/cognition'),env);
  const api=start(process.execPath,['apps/api/dist/main.js'],repository,env);
  const web=start(process.execPath,[join(standalone,'server.js')],repository,{...env,HOSTNAME:'127.0.0.1',PORT:'3500'});
  const base='http://127.0.0.1:3500/api/atlas/';
  let ready=false;
  for(let attempt=0;attempt<120;attempt++){
    assert.ok(children.every(child=>child.exitCode===null),'A service exited before readiness; do not reuse an existing server.');
    try{
      if(!ownsPort(web.pid,3500)||!ownsPort(api.pid,4500)||!ownsPort(python.pid,8500)){await delay(500);continue;}
      const response=await fetch(base+'bootstrap');
      if(response.ok){const boot=await response.json();assert.equal(boot.capabilities.llm,'extractive_demo');assert.equal(boot.capabilities.storage,'local');ready=true;break;}
    }catch{}
    await delay(500);
  }
  assert.ok(ready,'Native upload services did not become ready.');
  const privateDirectory=readdirSync(env.TMPDIR).find(name=>name.startsWith('atlas-private-uploads-'));assert.ok(privateDirectory);
  assert.equal(statSync(join(env.TMPDIR,privateDirectory)).mode&0o777,0o700);
  function sample(){
    const rows=execFileSync('ps',['-eo','pid,ppid,rss'],{encoding:'utf8'}).trim().split('\n').slice(1);
    for(const row of rows){
      const [pid,parent,rss]=row.trim().split(/\s+/).map(Number);
      for(const [role,id] of [['web',web.pid],['api',api.pid],['cognition',python.pid]])if(pid===id)maxRSSKiB[role]=Math.max(maxRSSKiB[role],rss);
      if(parent===python.pid)maxRSSKiB.parser=Math.max(maxRSSKiB.parser,rss);
    }
  }
  timer=setInterval(sample,40);sample();
  const form=new FormData();form.append('file',await openAsBlob(pdf,{type:'application/pdf'}),'80MiB.pdf');
  const started=Date.now();const first=fetch(base+'documents',{method:'POST',body:form,signal:AbortSignal.timeout(120000)});
  await delay(50);
  const parallel=new FormData();parallel.append('file',new Blob(['# Teste\n\nUma fonte sintética.']),'parallel.md');
  const second=await fetch(base+'documents',{method:'POST',body:parallel});assert.equal(second.status,429);
  const response=await first;const document=await response.json();assert.equal(response.status,201,JSON.stringify(document));
  const source=await (await fetch(base+`documents/${document.id}/source`)).json();assert.match(source.pages[0].text,/Redes privadas/);
  const materialResponse=await fetch(base+'generations',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({document_ids:[document.id],goal:'Explicar os conceitos deste documento',agent_id:'agora',method:'feynman'})});
  assert.equal(materialResponse.status,201);const material=await materialResponse.json();assert.equal(material.status,'ready');assert.equal(material.mode,'extractive_demo');assert.equal(material.decision.method,'feynman');
  const tooBig=new FormData();tooBig.append('file',new Blob([await openAsBlob(pdf),new Uint8Array(1)]),'over.pdf');
  const oversized=await fetch(base+'documents',{method:'POST',body:tooBig,signal:AbortSignal.timeout(120000)});assert.equal(oversized.status,413);
  await delay(100);assert.deepEqual(readdirSync(env.TMPDIR,{recursive:true}).filter(name=>basename(name).startsWith('atlas-upload-')),[]);
  const erased=await fetch(base+`documents/${document.id}`,{method:'DELETE',headers:{'Idempotency-Key':crypto.randomUUID()}});assert.equal(erased.status,200);
  assert.equal((await fetch(base+`packages/${material.id}`)).status,404);
  sample();clearInterval(timer);
  assert.ok(maxRSSKiB.web<384*1024);assert.ok(maxRSSKiB.api<384*1024);assert.ok(maxRSSKiB.cognition<896*1024);
  const report={scope:'Actual native Next/Nest/Python; synthetic sparse PDF, extractive mode, sampled RSS; not container cgroup or full 4GiB load proof',fileBytes:80*1024**2,status:201,parallelStatus:429,oversizedStatus:413,deleted:200,tempFilesRemaining:0,tempDirectoryMode:'0700',elapsedMs:Date.now()-started,maxRSSKiB,statusGate:'PASS'};
  mkdirSync('artifacts/quality',{recursive:true});writeFileSync('artifacts/quality/upload-runtime.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){console.error(logs);throw error;}
finally{await stop();}
