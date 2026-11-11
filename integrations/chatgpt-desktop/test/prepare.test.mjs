import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtemp,cp,rm,appendFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
test('a clean upstream checkout applies the exact patch idempotently and rejects extra auth changes',async()=>{
  const root=await mkdtemp(join(tmpdir(),'atlas-clean-sdk-'));
  const sdk=resolve(import.meta.dirname,'../devkit');
  try{
    execFileSync('git',['clone','--shared','--no-hardlinks',sdk,join(root,'devkit')],{stdio:'pipe'});
    await cp(resolve(import.meta.dirname,'../scripts'),join(root,'scripts'),{recursive:true});
    await cp(resolve(import.meta.dirname,'../patches'),join(root,'patches'),{recursive:true});
    const prepare=()=>execFileSync(process.execPath,[join(root,'scripts/prepare-devkit.mjs')],{stdio:'pipe'});
    prepare();prepare();
    await appendFile(join(root,'devkit/packages/local/src/oauth.ts'),'\n// Unreviewed modification for negative test only.\n');
    assert.throws(prepare);
  }finally{await rm(root,{recursive:true,force:true});}
});
