import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {mkdtempSync,existsSync,readdirSync,rmSync,statSync,symlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createUploadDirectory,scrubUploadDirectories} from '../src/upload-temp.js';
const moduleURL=new URL('../src/upload-temp.ts',import.meta.url).href;
async function interrupted(parent:string,signal:NodeJS.Signals){
  const code=`import {createUploadDirectory,installUploadCleanup} from ${JSON.stringify(moduleURL)};import {writeFileSync} from 'node:fs';import {join} from 'node:path';const directory=createUploadDirectory(process.argv[1]);installUploadCleanup(directory);writeFileSync(join(directory,'atlas-upload-synthetic'),Buffer.alloc(2*1024*1024));console.log(directory);setInterval(()=>{},1000);`;
  const child=spawn(process.execPath,['--import','tsx','--input-type=module','-e',code,parent],{stdio:['ignore','pipe','pipe']});
  const [data]=await once(child.stdout,'data');const directory=data.toString().trim();
  const exited=once(child,'exit');child.kill(signal);await exited;return directory;
}
test('SIGTERM clears an interrupted private upload; restart scrubs only dead owned workspaces',async()=>{
  const parent=mkdtempSync(join(tmpdir(),'atlas-temp-test-'));
  try{
    const graceful=await interrupted(parent,'SIGTERM');assert.equal(existsSync(graceful),false);
    const abandoned=await interrupted(parent,'SIGKILL');assert.equal(existsSync(join(abandoned,'atlas-upload-synthetic')),true);
    const active=createUploadDirectory(parent);assert.equal(existsSync(abandoned),false);assert.equal(statSync(active).mode&0o777,0o700);
    const foreign=join(parent,'atlas-private-uploads-foreign');symlinkSync(active,foreign);
    writeFileSync(join(active,'atlas-upload-active'),'synthetic');scrubUploadDirectories(parent);
    assert.equal(existsSync(join(active,'atlas-upload-active')),true);assert.ok(readdirSync(parent).includes('atlas-private-uploads-foreign'));
  }finally{rmSync(parent,{recursive:true,force:true});}
});
