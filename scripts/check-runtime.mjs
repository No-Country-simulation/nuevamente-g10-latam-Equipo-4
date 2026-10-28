import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtempSync,mkdirSync,cpSync,readFileSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

const repository=process.cwd(),root=mkdtempSync(join(tmpdir(),'atlas-runtime-'));
const children=[];let logs='';
function start(command,args,cwd,env){
  const child=spawn(command,args,{cwd,env,stdio:['ignore','pipe','pipe']});children.push(child);
  for(const stream of [child.stdout,child.stderr])stream.on('data',chunk=>{logs=(logs+chunk.toString()).slice(-16000);});
  return child;
}
try{
  for(const name of ['package.json','package-lock.json','apps/api/package.json','apps/web/package.json','packages/contracts/package.json']){
    mkdirSync(join(root,name,'..'),{recursive:true});cpSync(name,join(root,name));
  }
  execFileSync('npm',['ci','--prefix',root,'--omit=dev','--workspace=@atlas/api','--workspace=@atlas/contracts','--include-workspace-root=false','--ignore-scripts','--no-audit','--no-fund'],{stdio:'pipe'});
  cpSync('apps/api/dist',join(root,'apps/api/dist'),{recursive:true});
  cpSync('packages/contracts',join(root,'packages/contracts'),{recursive:true});
  const secret=randomUUID()+randomUUID();
  const env={...process.env,NODE_ENV:'production',ATLAS_ENV_FILE:'/dev/null',ATLAS_APP_MODE:'local',ATLAS_TENANT_ID:'runtime-check',ATLAS_INTERNAL_TOKEN:secret,ATLAS_DATA_DIR:join(root,'data'),ATLAS_AGENT_CATALOG:join(root,'packages/contracts/agents.json'),API_PORT:'4101',ATLAS_BIND_ADDRESS:'127.0.0.1',COGNITION_URL:'http://127.0.0.1:8101',ATLAS_API_URL:'http://127.0.0.1:4101',ATLAS_AGENT_RUNTIME:'extractive',ATLAS_SEED_DEMO:'1',STORAGE_PROVIDER:'local',VECTOR_BACKEND:'sqlite',ATLAS_JOB_RUNNER:'local',EVE_URL:'',MEMORY_SERVICE_URL:'',MONGODB_URI:'',ATLAS_CREDENTIALS_FILE:'',ATLAS_ALLOW_LOCAL_CHATGPT:'0'};
  for(const key of ['TYPESAFE_API_KEY','FIRECRAWL_API_KEY','EMBEDDING_API_KEY','EMBEDDING_BASE_URL','EMBEDDING_MODEL','LLM_API_KEY','LLM_BASE_URL','LLM_MODEL','OPENROUTER_API_KEY','ATLAS_OPENAI_API_KEY','ANTHROPIC_API_KEY','AI_GATEWAY_API_KEY']){env[key]='';env[`${key}_FILE`]='';}
  const python=start(resolve('.venv/bin/uvicorn'),['atlas.main:app','--host','127.0.0.1','--port','8101'],resolve('services/cognition'),env);
  const api=start(process.execPath,['apps/api/dist/main.js'],root,env);
  const base='http://127.0.0.1:4101/v1/';
  async function call(path,body,key=randomUUID()){
    const response=await fetch(base+path,{method:body?'POST':'GET',headers:{Authorization:`Bearer ${secret}`,'content-type':'application/json','Idempotency-Key':key},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(10000)});
    const result=await response.json();assert.ok(response.ok,`${path}: ${response.status} ${JSON.stringify(result)}`);return result;
  }
  let ready=false;
  for(let attempt=0;attempt<80;attempt++){
    if(api.exitCode!==null||python.exitCode!==null)throw new Error('A production runtime process exited before readiness.');
    try{const boot=await call('bootstrap');assert.equal(boot.agents.length,5);ready=true;break;}catch{await delay(250);}
  }
  assert.ok(ready,'Production dependencies must boot the actual API and cognition.');
  const bootstrap=await call('bootstrap');const document=bootstrap.documents[0];
  const key=randomUUID();const groupInput={name:'Runtime check',topic:'Conferir replay sem ferramentas de desenvolvimento'};
  const group=await call('groups',groupInput,key);assert.deepEqual(await call('groups',groupInput,key),group);
  const material=await call('generations',{document_ids:[document.id],goal:'Entender os principais conceitos do documento',profile:'beginner',format:'quiz',sector:'general',agent_id:'nilo',method:'auto',rag_mode:'auto'});
  assert.equal(material.mode,'extractive_demo');assert.equal(material.status,'ready');
  const item=material.conteudo_adaptado.itens[0];
  const option=item.options.find(option=>option.text===item.citations[0].excerpt.slice(0,300));assert.ok(option);
  const answer={item_id:item.id,option_id:option.id,event_id:randomUUID()};const attemptKey=randomUUID();
  const first=await call(`quiz/${material.id}/attempt`,answer,attemptKey);assert.equal(first.xp_awarded,15);
  assert.deepEqual(await call(`quiz/${material.id}/attempt`,answer,attemptKey),first);
  assert.equal((await call('progress')).xp,15);
  const rss=pid=>Number(/VmRSS:\s+(\d+)/.exec(readFileSync(`/proc/${pid}/status`,'utf8'))?.[1]||0);
  const bytes=Number(execFileSync('du',['-sb',join(root,'node_modules')],{encoding:'utf8'}).split('\t')[0]);
  const report={scope:'production dependency tree + Node/Python processes, no containers/Eve inference or 4GiB load proof',apiRSSKiB:rss(api.pid),cognitionRSSKiB:rss(python.pid),nodeModulesBytes:bytes,mode:material.mode,checks:['bootstrap','group replay','grounded quiz','attempt replay','XP once'],status:'PASS'};
  mkdirSync('artifacts/quality',{recursive:true});writeFileSync('artifacts/quality/runtime.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}catch(error){console.error(logs);throw error;}
finally{
  for(const child of children)child.kill('SIGTERM');
  await Promise.all(children.map(child=>child.exitCode!==null?undefined:new Promise(resolve=>child.once('exit',resolve))));
  rmSync(root,{recursive:true,force:true});
}
