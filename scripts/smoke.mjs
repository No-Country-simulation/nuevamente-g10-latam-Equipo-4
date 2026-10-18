import assert from 'node:assert/strict';
const base = process.env.ATLAS_SMOKE_URL || 'http://127.0.0.1:3000/api/atlas';
async function call(path,body,method=body?'POST':'GET') {
  const response=await fetch(`${base}/${path}`,{method,headers:body instanceof FormData?{}:body?{'Content-Type':'application/json'}:undefined,body:body instanceof FormData?body:body?JSON.stringify(body):undefined});
  const data=await response.json();assert.ok(response.ok,`${path}: ${response.status} ${JSON.stringify(data)}`);return data;
}
const bootstrap=await call('bootstrap');assert.equal(bootstrap.agents.length,5);
const form=new FormData();form.set('file',new Blob(['# Smoke — redes\n\nUma VCN conecta sub-redes privadas. NAT Gateway permite conexões de saída.'],{type:'text/markdown'}),'Smoke redes.md');
const doc=await call('documents',form);assert.equal(doc.status,'ready');
const request={document_ids:[doc.id],goal:'Entender os principais conceitos deste documento',profile:'beginner',format:'quiz',sector:'general',agent_id:'nilo',method:'auto',rag_mode:'auto'};
const pkg=await call('generations',request);assert.equal(pkg.status,'ready');assert.ok(pkg.conteudo_adaptado.itens.length);
const item=pkg.conteudo_adaptado.itens[0];assert.ok(item.citations[0].excerpt);assert.equal(item.correct_index,undefined);
const page=await call(`documents/${doc.id}/source`);assert.ok(page.pages.some(p=>p.text.includes(item.citations[0].excerpt)));
let success;
for(const option of item.options){const result=await call(`quiz/${pkg.id}/attempt`,{item_id:item.id,option_id:option.id,event_id:crypto.randomUUID()});if(result.correct){success={option,result};break;}}
assert.ok(success);assert.equal(success.result.xp_awarded,15);
const repeat=await call(`quiz/${pkg.id}/attempt`,{item_id:item.id,option_id:success.option.id,event_id:crypto.randomUUID()});assert.equal(repeat.xp_awarded,0);
const memory=await call('dreamer/status');assert.equal(typeof memory.consent,'boolean');
const cycle=await call('dreamer/cycles',{});assert.ok(cycle.status);
const group=await call('groups',{name:'Grupo smoke',topic:'Revisar uma fonte juntos'});const msg=await call(`groups/${group.id}/messages`,{text:'Vamos revisar as fontes antes da resposta.'});assert.equal(msg.author,'Você');
assert.ok((await call(`groups/${group.id}/messages`)).some(m=>m.id===msg.id));
console.log('Smoke HTTP passou: upload, geração, citação, quiz/XP idempotente, Dreamer, grupo e chat. Modo:',pkg.mode);
