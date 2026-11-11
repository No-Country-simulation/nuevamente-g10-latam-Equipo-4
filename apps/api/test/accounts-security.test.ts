import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Accounts} from '../src/auth/users.js';

test('admin privilege is granted only to an existing user by trusted code',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'atlas-accounts-'));const accounts=new Accounts(join(dir,'users.db'));
  const original=process.env.ATLAS_ADMIN_EMAILS;process.env.ATLAS_ADMIN_EMAILS='admin@example.test';
  try {
    const {user}=await accounts.register('admin@example.test','Admin','password-1234');
    assert.equal(accounts.isAdmin(user.id),false);
    accounts.grantAdmin(user.id);
    assert.equal(accounts.isAdmin(user.id),true);
    assert.throws(()=>accounts.grantAdmin('usr_missing'));
  } finally {if(original===undefined)delete process.env.ATLAS_ADMIN_EMAILS;else process.env.ATLAS_ADMIN_EMAILS=original;accounts.close();rmSync(dir,{recursive:true,force:true});}
});

test('concurrent failed attempts reserve slots persistently',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'atlas-accounts-'));const path=join(dir,'users.db');const a=new Accounts(path);const b=new Accounts(path);
  try {
    await a.register('user@example.test','User','password-1234');
    const attempts=await Promise.allSettled(Array.from({length:6},(_,i)=>(i%2?a:b).login('user@example.test','incorrect')));
    const statuses=attempts.map(x=>x.status==='rejected'?x.reason.status:200).sort();
    assert.deepEqual(statuses,[401,401,401,401,401,429]);
    await assert.rejects(b.login('user@example.test','password-1234'),{status:429});
  } finally {a.close();b.close();rmSync(dir,{recursive:true,force:true});}
});
