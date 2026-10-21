import {config} from 'dotenv';
import {spawn} from 'node:child_process';
// Keep securely injected cloud variables; .env supplies only missing values.
config({path:'.env',quiet:true,override:false});
const [command,...args]=process.argv.slice(2);
if(!command)throw new Error('Informe o comando a executar.');
const child=spawn(command,args,{stdio:'inherit',env:{...process.env,ATLAS_ENV_READY:'1'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('error',()=>{console.error('Não foi possível iniciar o comando do Atlas.');process.exit(1);});
child.on('exit',(code,signal)=>process.exit(signal==='SIGINT'?130:signal?143:code??1));
