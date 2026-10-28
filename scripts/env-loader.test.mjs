import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {spawnSync} from 'node:child_process';

const loader=resolve('scripts/with-env.mjs');
function fixture(run){
  const folder=mkdtempSync(join(tmpdir(),'atlas-env-test-'));
  try{run(folder);}finally{rmSync(folder,{recursive:true,force:true});}
}
function execute(folder,selection,expected){
  const env={...process.env,ATLAS_TEST_INJECTED:'injected'};
  delete env.ATLAS_ENV_FILE;delete env.ATLAS_TEST_SELECTOR;
  if(selection)env.ATLAS_ENV_FILE=selection;
  const code=`const assert=require('node:assert/strict'); assert.equal(process.env.ATLAS_TEST_SELECTOR,${JSON.stringify(expected)}); assert.equal(process.env.ATLAS_TEST_INJECTED,'injected'); assert.equal(process.env.ATLAS_ENV_READY,'1'); assert.equal(process.env.ATLAS_ENV_FILE,${JSON.stringify(resolve(folder,selection||'.env'))}); console.log('loader-ok');`;
  return spawnSync(process.execPath,[loader,process.execPath,'-e',code],{cwd:folder,env,encoding:'utf8'});
}
test('default environment file fills missing values without replacing injected ones',()=>fixture(folder=>{
  writeFileSync(join(folder,'.env'),'ATLAS_TEST_SELECTOR=default\nATLAS_TEST_INJECTED=file\n');
  const result=execute(folder,null,'default');assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'loader-ok');
}));
test('custom relative and absolute paths reach every child with one canonical selection',()=>fixture(folder=>{
  writeFileSync(join(folder,'.env'),'ATLAS_TEST_SELECTOR=wrong-file\n');
  writeFileSync(join(folder,'custom.env'),'ATLAS_TEST_SELECTOR=custom\nATLAS_TEST_INJECTED=file\n');
  for(const selection of ['custom.env',join(folder,'custom.env')]){
    const result=execute(folder,selection,'custom');assert.equal(result.status,0,result.stderr);assert.equal(result.stdout.trim(),'loader-ok');
  }
}));
test('an explicitly missing environment file cannot fall back or execute the child',()=>fixture(folder=>{
  writeFileSync(join(folder,'.env'),'ATLAS_TEST_SELECTOR=must-not-load\n');
  const result=execute(folder,'absent.env','must-not-load');assert.equal(result.status,1);assert.equal(result.stdout,'');assert.match(result.stderr,/ATLAS_ENV_FILE indisponível/);
}));
