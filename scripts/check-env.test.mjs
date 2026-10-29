import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,copyFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

function fixture(check){
  const root=mkdtempSync(join(tmpdir(),'atlas-env-contract-'));
  for(const path of ['apps/api/src/nested','apps/api/agent','apps/web/lib','apps/web/app','services/cognition/atlas','integrations/trigger/tasks','scripts'])mkdirSync(join(root,path),{recursive:true});
  copyFileSync('.env.example',join(root,'.env.example'));
  writeFileSync(join(root,'integrations/trigger/trigger.config.ts'),'export {};');
  // A private runtime file is irrelevant to the static example contract.
  writeFileSync(join(root,'.env'),'DO_NOT_READ=this-is-private-fixture');
  try{check(root);}finally{rmSync(root,{recursive:true,force:true});}
}
const checker=resolve('scripts/check-env.mjs');
function run(root){return spawnSync(process.execPath,[checker],{cwd:root,env:{...process.env,PATH:join(root,'no-tools')},encoding:'utf8'});}

test('environment contract works with Node alone and preserves nested source coverage',()=>fixture(root=>{
  writeFileSync(join(root,'apps/api/src/nested/config.ts'),'export const token=process.env.ATLAS_INTERNAL_TOKEN;');
  const result=run(root);assert.equal(result.status,0,result.stderr);
  assert.match(result.stdout,/Environment contract: 10 references/);
  assert.ok(!result.stdout.includes('this-is-private-fixture'));
}));

test('missing variables in nested modules and direct config files still fail the gate without rg',()=>fixture(root=>{
  const nested='ATLAS_'+'UNDECLARED_NESTED';
  const config='ATLAS_'+'UNDECLARED_CONFIG';
  writeFileSync(join(root,'apps/api/src/nested/config.ts'),'export const value=process.env.'+nested+';');
  writeFileSync(join(root,'integrations/trigger/trigger.config.ts'),'export const value=process.env.'+config+';');
  const result=run(root);assert.equal(result.status,1);
  assert.ok(result.stderr.includes(nested));assert.ok(result.stderr.includes(config));
  assert.ok(!result.stderr.includes('this-is-private-fixture'));
}));
