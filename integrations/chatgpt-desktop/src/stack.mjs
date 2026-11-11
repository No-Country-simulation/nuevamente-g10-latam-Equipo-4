import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {existsSync,cpSync} from 'node:fs';
import {join} from 'node:path';
import {localPorts} from './ports.mjs';
import {shutdown,trackChild} from './processes.mjs';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
const repository=fileURLToPath(new URL('../../../',import.meta.url));
function environment(){
  const result={};
  for(const name of ['PATH','HOME','LANG','TMPDIR','TEMP','SYSTEMROOT','HTTP_PROXY','HTTPS_PROXY','http_proxy','https_proxy','SSL_CERT_FILE','NODE_EXTRA_CA_CERTS'])if(process.env[name])result[name]=process.env[name];
  result.NO_PROXY='127.0.0.1,localhost';return result;
}
function utility(utilityProcess,module,env,port){
  const child=utilityProcess.fork(fileURLToPath(new URL('./child.mjs',import.meta.url)),[],{cwd:repository,env:environment(),stdio:'pipe',serviceName:'Atlas local'});
  const owned=trackChild(child,'utility');
  const ready=new Promise((resolve,reject)=>{
    child.once('exit',()=>reject(new Error('Um serviço local encerrou antes de ficar pronto.')));
    child.on('message',message=>{if(message.ready)resolve();if(message.failed)reject(new Error('Compile o Atlas antes de iniciar o aplicativo local.'));});
  });
  child.stdout?.resume();child.stderr?.resume();
  child.postMessage({module,env,port});return {...owned,ready};
}
function cognition(env,port){
  const code=`import sys,json,os,asyncio\nos.environ.update(json.loads(sys.stdin.readline()))\nimport uvicorn\nasync def main():\n server=uvicorn.Server(uvicorn.Config('atlas.main:app',host='127.0.0.1',port=${port},log_level='error'))\n task=asyncio.create_task(server.serve())\n while not server.started:\n  if task.done(): await task; raise RuntimeError('startup failed')\n  await asyncio.sleep(.05)\n print('ATLAS_READY',flush=True)\n await task\nasyncio.run(main())`;
  const child=spawn(join(repository,'.venv/bin/python'),['-u','-c',code],{cwd:join(repository,'services/cognition'),env:environment(),stdio:['pipe','pipe','pipe']});
  const owned=trackChild(child);
  const ready=new Promise((resolve,reject)=>{let output='';child.once('error',()=>reject(new Error('Prepare o Python local com scripts/setup.sh.')));child.once('exit',()=>reject(new Error('O serviço de documentos não iniciou.')));child.stdout.on('data',data=>{output=(output+data).slice(-200);if(output.includes('ATLAS_READY\n'))resolve();});});
  child.stderr.resume();child.stdin.on('error',()=>undefined);
  child.stdin.end(JSON.stringify(env)+'\n');return {...owned,ready};
}
export async function launchStack(utilityProcess,gateway,model,dataDir,masterKey,tenant,signal){
  if(process.platform==='win32')throw new Error('O backend atual requer Linux/WSL ou macOS com ambiente POSIX.');
  for(const path of ['apps/api/dist/main.js','apps/web/.next/standalone/apps/web/server.js','.venv/bin/python'])if(!existsSync(join(repository,path)))throw new Error('Execute a preparação e npm run build no repositório Atlas.');
  const standalone=join(repository,'apps/web/.next/standalone/apps/web');
  cpSync(join(repository,'apps/web/public'),join(standalone,'public'),{recursive:true});
  cpSync(join(repository,'apps/web/.next/static'),join(standalone,'.next/static'),{recursive:true});
  const [webPort,apiPort,pythonPort]=await localPorts(dataDir);
  const token=randomBytes(32).toString('base64url');
  const capability=randomBytes(32).toString('base64url');
  const env={...environment(),NODE_ENV:'production',ATLAS_ENV_FILE:'/dev/null',ATLAS_APP_MODE:'local',ATLAS_BIND_ADDRESS:'127.0.0.1',ATLAS_DATA_DIR:dataDir,ATLAS_TENANT_ID:tenant,ATLAS_INTERNAL_TOKEN:token,ATLAS_CREDENTIAL_MASTER_KEY:masterKey,ATLAS_CREDENTIAL_MASTER_KEY_FILE:'',ATLAS_AGENT_CATALOG:join(repository,'packages/contracts/agents.json'),ATLAS_AGENT_RUNTIME:'direct',ATLAS_LOCAL_CHATGPT_PLAN:'1',ATLAS_SEED_DEMO:'0',STORAGE_PROVIDER:'local',VECTOR_BACKEND:'sqlite',ATLAS_JOB_RUNNER:'local',ATLAS_ALLOW_LOCAL_CHATGPT:'0',API_PORT:String(apiPort),COGNITION_URL:`http://127.0.0.1:${pythonPort}`,ATLAS_API_URL:`http://127.0.0.1:${apiPort}`,LLM_BASE_URL:gateway.baseURL,LLM_API_KEY:gateway.key,LLM_MODEL:model,HOSTNAME:'127.0.0.1',PORT:String(webPort)};
  const apps=[];
  signal.throwIfAborted();
  let stopping=false,stopPromise;
  function stop(){stopping=true;return stopPromise??=shutdown(apps,gateway);}
  try{
    apps.push(cognition(env,pythonPort));
    apps.push(utility(utilityProcess,join(repository,'apps/api/dist/main.js'),env,apiPort));
    const webEnv={...environment(),NODE_ENV:'production',ATLAS_ENV_FILE:'/dev/null',ATLAS_INTERNAL_TOKEN:token,ATLAS_API_URL:env.ATLAS_API_URL,ATLAS_LOCAL_CHATGPT_PLAN:'1',ATLAS_DESKTOP_CAPABILITY:capability,HOSTNAME:'127.0.0.1',PORT:String(webPort)};
    apps.push(utility(utilityProcess,join(repository,'apps/web/.next/standalone/apps/web/server.js'),webEnv,webPort));
    await Promise.race([aborted(signal),startupExit(apps),Promise.all(apps.map(app=>app.ready)),delay(60000,undefined,{ref:false}).then(()=>{throw new Error('O Atlas local não ficou pronto a tempo.');})]);
    requireRunning(apps);}
  catch(error){await stop();throw error;}
  return {url:`http://127.0.0.1:${webPort}`,capability,stop,pids:apps.map(item=>item.child.pid),onExit(listener){if(apps.some(item=>item.isExited()))queueMicrotask(listener);for(const item of apps)item.child.once('exit',()=>{if(!stopping)listener();});}};
}

function aborted(signal){
  return new Promise((_,reject)=>{if(signal.aborted)reject(signal.reason);else signal.addEventListener('abort',()=>reject(signal.reason),{once:true});});
}

function startupExit(apps){
  return Promise.race(apps.map(item=>item.closed)).then(()=>{throw new Error('Um serviço encerrou durante a inicialização. Nenhum workspace foi publicado.');});
}
function requireRunning(apps){
  if(apps.some(item=>item.isExited()))throw new Error('Um serviço local encerrou antes de abrir o workspace.');
}
