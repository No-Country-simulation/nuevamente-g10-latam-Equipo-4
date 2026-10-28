import {config} from 'dotenv';
import {spawn} from 'node:child_process';
import {resolve} from 'node:path';
// Keep securely injected cloud variables; .env supplies only missing values.
const selected=process.env.ATLAS_ENV_FILE;
const envFile=resolve(selected||'.env');
const result=config({path:envFile,quiet:true,override:false});
if(selected&&result.error){console.error('Arquivo ATLAS_ENV_FILE indisponível.');process.exit(1);}
const [command,...args]=process.argv.slice(2);
if(!command)throw new Error('Informe o comando a executar.');
const child=spawn(command,args,{stdio:'inherit',env:{...process.env,ATLAS_ENV_READY:'1',ATLAS_ENV_FILE:envFile}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',()=>{console.error('Não foi possível iniciar o comando do Atlas.');process.exit(1);});
child.on('exit',(code,signal)=>process.exit(signal==='SIGINT'?130:signal?143:code??1));
