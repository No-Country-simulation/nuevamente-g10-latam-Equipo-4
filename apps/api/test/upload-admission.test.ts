import {test} from 'node:test';
import assert from 'node:assert/strict';
import {UploadAdmission} from '../src/upload-admission.js';
test('client disconnect during processing cannot admit another upload until backend cleanup',()=>{
  const admission=new UploadAdmission(),first=admission.reserve();first.start();first.close();
  assert.throws(()=>admission.reserve(),(error:any)=>error.status===429);
  first.finish();const next=admission.reserve();
  first.finish();assert.throws(()=>admission.reserve());next.close();assert.doesNotThrow(()=>admission.reserve());
});
test('abandoned multipart request releases admission and cannot start late',()=>{
  const admission=new UploadAdmission(),first=admission.reserve();first.close();
  const second=admission.reserve();assert.throws(()=>first.start());first.finish();assert.throws(()=>admission.reserve());second.finish();
});
