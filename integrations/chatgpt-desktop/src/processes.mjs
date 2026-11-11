import {setTimeout as delay} from 'node:timers/promises';

// Register immediately after spawn/fork, before the first readiness await.
export function trackChild(child,kind='node'){
  let exited=child.exitCode!==undefined&&child.exitCode!==null||child.signalCode!=null;
  let pid=child.pid;
  const closed=new Promise(resolve=>{
    if(exited){resolve();return;}
    child.once('spawn',()=>{pid=child.pid;});
    child.once('exit',()=>{exited=true;resolve();});
    child.once('error',()=>{if(!child.pid){exited=true;resolve();}});
  });
  return {child,closed,isExited:()=>exited,
    graceful(){if(!exited)child.kill();},
    force(){
      if(exited||!pid||child.pid!==pid)return;
      if(kind==='node')child.kill('SIGKILL');else process.kill(pid,'SIGKILL');
    }};
}
export async function terminate(owned){
  if(owned.isExited())return;
  owned.graceful();
  await Promise.race([owned.closed,delay(3000,undefined,{ref:false})]);
  if(owned.isExited())return;
  owned.force();
  await Promise.race([owned.closed,delay(2000,undefined,{ref:false})]);
  if(!owned.isExited())throw new Error('Um serviço local não confirmou o encerramento. Não inicie outro perfil.');
}
export async function shutdown(apps,gateway){
  const results=await Promise.allSettled(apps.map(terminate));
  await gateway.close();
  const failed=results.find(result=>result.status==='rejected');
  if(failed)throw failed.reason;
}
