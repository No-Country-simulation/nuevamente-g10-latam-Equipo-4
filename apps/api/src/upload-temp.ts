import {mkdtempSync,lstatSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const prefix='atlas-private-uploads-';
function privateDirectory(path:string){
  const stat=lstatSync(path);
  return stat.isDirectory()&&stat.uid===(process.getuid?.()??stat.uid)&&(stat.mode&0o777)===0o700;
}
function owner(path:string):number|null{
  const marker=join(path,'.atlas-owner.json'),stat=lstatSync(marker);
  if(!stat.isFile()||stat.size>512||stat.uid!==(process.getuid?.()??stat.uid))return null;
  const data=JSON.parse(readFileSync(marker,'utf8'));
  return data.application==='atlas-private-upload-v1'&&Number.isSafeInteger(data.pid)&&data.pid>0?data.pid:null;
}
function gone(pid:number){
  try{process.kill(pid,0);return false;}catch(error){return (error as NodeJS.ErrnoException).code==='ESRCH';}
}
export function scrubUploadDirectories(parent=tmpdir()){
  for(const entry of readdirSync(parent,{withFileTypes:true})){
    if(!entry.isDirectory()||!entry.name.startsWith(prefix))continue;
    const path=join(parent,entry.name);
    try{const pid=owner(path);if(privateDirectory(path)&&pid&&gone(pid))rmSync(path,{recursive:true,force:true});}catch{}
  }
}
export function createUploadDirectory(parent=tmpdir()){
  scrubUploadDirectories(parent);
  const directory=mkdtempSync(join(parent,prefix));
  writeFileSync(join(directory,'.atlas-owner.json'),JSON.stringify({application:'atlas-private-upload-v1',pid:process.pid}),{mode:0o600,flag:'wx'});
  return directory;
}
export function installUploadCleanup(directory:string){
  const cleanup=()=>rmSync(directory,{recursive:true,force:true});
  process.once('exit',cleanup);
  for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>{cleanup();process.exit(0);});
}
