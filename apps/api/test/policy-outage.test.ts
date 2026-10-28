import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {TypeSafeClient} from '@typesafe-ai/sdk';
import {judge,selectTeam,evaluateEvidence} from '../src/policy.js';

test('Taylam integration: a failed decision provider never invents judgment, winner or relevance',async()=>{
  const before={...process.env};
  const dir=mkdtempSync(join(tmpdir(),'atlas-policy-outage-'));
  process.env.ATLAS_CREDENTIALS_FILE=join(dir,'absent.enc');
  process.env.TYPESAFE_API_KEY='test-only-not-a-provider-secret';
  delete process.env.TYPESAFE_API_KEY_FILE;
  const failure=mock.method(TypeSafeClient.prototype,'systemOne',async()=>{throw new Error('simulated provider outage');});
  try {
    assert.deepEqual(await judge('question','evidence','answer'),{verdict:'not_evaluated',score:null});
    assert.deepEqual(await selectTeam('question','evidence',{},{}),{winner:'abstain',source:'policy'});
    assert.deepEqual(await evaluateEvidence('question',[{id:'p1',text:'evidence'}]),{source:'not_evaluated',scores:[]});
    assert.equal(failure.mock.callCount(),3);
  } finally {
    failure.mock.restore();
    for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];
    Object.assign(process.env,before);rmSync(dir,{recursive:true,force:true});
  }
});

import {uploadFilename} from '../src/uploads.js';

test('Taylam upload correction preserves Unicode and decodes latin1 multipart mojibake',()=>{
  for(const name of ['你好.md','☀.md','atenção.md','plain.md'])assert.equal(uploadFilename(name),name);
  assert.equal(uploadFilename(Buffer.from('atenção.md','utf8').toString('latin1')),'atenção.md');
});
