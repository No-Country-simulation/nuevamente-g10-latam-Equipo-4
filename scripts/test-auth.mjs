import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

const token='e2e-only-internal-token-with-32-characters';
const env={...process.env,ATLAS_REQUIRE_LOGIN:'1'};
const server=spawn(process.execPath,['scripts/e2e-server.mjs'],{env,stdio:'inherit',detached:true});
let exited=false;
server.on('exit',()=>{exited=true;});
try {
  let ready=false;
  for(let attempt=0;attempt<120&&!exited;attempt++){
    try {
      const response=await fetch('http://127.0.0.1:3000/api/atlas/health');
      if(response.ok){ready=true;break;}
    } catch {}
    await delay(500);
  }
  if(!ready)throw new Error('Os serviços isolados não ficaram prontos.');
  for(const suite of ['auth.integration.mjs','auth.browser.mjs']){
    const test=spawn(process.execPath,[`apps/web/test/${suite}`],{
      env:{...env,ATLAS_WEB_URL:'http://127.0.0.1:3000',ATLAS_API_URL:'http://127.0.0.1:4000',ATLAS_INTERNAL_TOKEN:token},stdio:'inherit'
    });
    const code=await new Promise((resolve,reject)=>{test.on('error',reject);test.on('exit',resolve);});
    if(code!==0)throw new Error(`Teste de autenticação ${suite} falhou: ${code}`);
  }
} finally {
  try {process.kill(-server.pid,'SIGTERM');} catch {}
}
