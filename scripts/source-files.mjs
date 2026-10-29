import {readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';

export function sourceFiles(path){
  if(statSync(path).isFile())return /\.(ts|tsx|py|mjs|sh)$/.test(path)?[path]:[];
  return readdirSync(path,{withFileTypes:true}).flatMap(entry=>{
    if(entry.isSymbolicLink()||entry.name.startsWith('.')||['node_modules','__pycache__','dist'].includes(entry.name))return [];
    return sourceFiles(join(path,entry.name));
  });
}
