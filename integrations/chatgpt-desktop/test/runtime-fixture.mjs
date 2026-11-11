// Synthetic provider only. Exercises the production launcher/BFF; never authorizes OAuth.
import {app,utilityProcess} from 'electron';
import {randomBytes} from 'node:crypto';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createGateway} from '../src/gateway.mjs';
import {launchStack} from '../src/stack.mjs';
import {createWindow} from '../src/windows.mjs';
app.setName('Atlas synthetic runtime test');
const children=[];
const controller=new AbortController();
const cancel=process.argv.includes('--cancel-startup');
const utilities={fork(...args){const child=utilityProcess.fork(...args);children.push(child);if(cancel&&children.length===2)queueMicrotask(()=>controller.abort());return child;}};
async function run(){
const client={getSession:async()=>({status:'connected',sharing:true,profileId:'synthetic-profile'}),streamResponse:async options=>{
  const prompt=JSON.parse(options.input[1].content);
  if(globalThis.atlasTest.quota)throw Object.assign(new Error('synthetic-only-private-detail'),{status:429});
  return {text:JSON.stringify({title:'Estudo de redes',introduction:'Uma rede conecta recursos.',items:[{title:'VCN',body:'Uma VCN permite organizar sub-redes.',evidence_ids:[prompt.authorized_evidence_ids[0]]}]})};
}};
const directory=await mkdtemp(join(tmpdir(),'atlas-desktop-runtime-'));
const gateway=await createGateway(client,'synthetic-model','synthetic-profile');
let resource;
try{resource=await launchStack(utilities,gateway,'synthetic-model',directory,randomBytes(32).toString('base64'),'synthetic-profile',controller.signal);
}catch(error){
  if(!cancel||error!==controller.signal.reason)throw error;
  const processes=execFileSync('ps',['-o','pid=,args=','--ppid',String(process.pid)],{encoding:'utf8'}).trim().split('\n');
  const leftovers=processes.filter(command=>command.includes('node.mojom.NodeService')||command.includes('.venv/bin/python')).map(command=>command.trim().split(/\s+/)[0]);
  globalThis.atlasCancellation={directory,leftovers};
  const window=createWindow(new Set());globalThis.atlasTestWindow=window;await window.loadURL('about:blank');return;
}
const window=createWindow(new Set(),resource.url,resource.capability,'atlas-synthetic-'+randomBytes(8).toString('hex'));
globalThis.atlasTestWindow=window;
globalThis.atlasTest={url:resource.url,directory,quota:false,children:()=>resource.pids,stop:()=>resource.stop()};
await window.loadURL(resource.url+'/workspace');
let quitting=false,drained=false;
app.on('before-quit',event=>{if(drained)return;event.preventDefault();if(quitting)return;quitting=true;void resource.stop().then(()=>{drained=true;app.quit();});});

}
app.whenReady().then(run).catch(error=>{console.error("Synthetic desktop runtime startup failed:",error.name,error.code,error.message);app.quit();});
