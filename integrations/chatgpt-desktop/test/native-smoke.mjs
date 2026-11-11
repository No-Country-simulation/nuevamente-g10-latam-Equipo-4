import {_electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const executablePath=join(root,'integrations/chatgpt-desktop/node_modules/electron/dist/electron');
const configuration=await mkdtemp(join(tmpdir(),'atlas-native-config-'));
let desktop,dataDir;
try{
  desktop=await _electron.launch({executablePath,args:[join(import.meta.dirname,'runtime-fixture.mjs')],env:{...process.env,XDG_CONFIG_HOME:configuration},timeout:90000});
  const page=await desktop.firstWindow();await expect(page.getByRole('button',{name:'Adicionar fonte',exact:true})).toBeVisible();
  const info=await desktop.evaluate(()=>({url:globalThis.atlasTest.url,directory:globalThis.atlasTest.directory,children:globalThis.atlasTest.children()}));dataDir=info.directory;
  assert.equal(info.children.length,3);
  assert.equal((await fetch(info.url+'/api/atlas/bootstrap')).status,401);
  assert.equal((await fetch(info.url+'/api/atlas/generations',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,401);
  const result=await page.evaluate(async()=>{
    const form=new FormData();form.append('file',new Blob(['# Redes\n\nUma VCN permite organizar sub-redes e regras de acesso.'],{type:'text/markdown'}),'redes.md');
    const uploaded=await fetch('/api/atlas/documents',{method:'POST',body:form});const source=await uploaded.json();
    const generated=await fetch('/api/atlas/generations',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({document_ids:[source.id],goal:'Explicar VCN e sub-redes',agent_id:'clara'})});
    return {uploadStatus:uploaded.status,generationStatus:generated.status,material:await generated.json(),sourceId:source.id};
  });
  assert.equal(result.uploadStatus,201);assert.equal(result.generationStatus,201);assert.equal(result.material.mode,'remote');assert.equal(result.material.conteudo_adaptado.itens[0].citations[0].document_id,result.sourceId);
  await desktop.evaluate(()=>{globalThis.atlasTest.quota=true;});
  const limited=await page.evaluate(async id=>{
    const options={method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify({document_ids:[id],goal:'Revisar as sub-redes'})};
    const r=await fetch('/api/atlas/generations',options);const replay=await fetch('/api/atlas/generations',options);
    return {status:r.status,body:await r.text(),replayStatus:replay.status,replayBody:await replay.text()};
  },result.sourceId);
  assert.equal(limited.status,429);assert.match(limited.body,/ChatGPT/);assert.match(limited.body,/não houve troca/);assert.doesNotMatch(limited.body,/private-detail/);
  assert.equal(limited.replayStatus,429);assert.equal(limited.replayBody,limited.body);
  await desktop.evaluate(async()=>{await globalThis.atlasTest.stop();await globalThis.atlasTest.stop();});
  for(const pid of info.children)assert.throws(()=>process.kill(pid,0));
  await assert.rejects(fetch(info.url+'/api/atlas/bootstrap'));
  console.log('Native runtime: capability enforced, real Next/Nest/Python generation with synthetic model, quota notice, children reaped. No OAuth or plan use tested.');
}finally{if(desktop)await desktop.close();if(dataDir)await rm(dataDir,{recursive:true,force:true});await rm(configuration,{recursive:true,force:true});}
