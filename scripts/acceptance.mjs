import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
const base=process.env.ATLAS_SMOKE_URL||'http://127.0.0.1:3000/api/atlas';
async function call(path,body){const r=await fetch(base+'/'+path,{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(130000)});if(!r.ok)throw new Error('Aceite interrompido: '+path+' retornou '+r.status);return r.json();}
const bootstrap=await call('bootstrap');
assert.equal(bootstrap.capabilities.llm,'remote','O aceite exige geração real. A demo extrativa não encerra o MVP.');
assert.equal(bootstrap.capabilities.embeddings,'remote','O checklist do edital exige a prova de embeddings. O fluxo cotidiano pode continuar lexical.');
const document=bootstrap.documents.find(d=>d.id===process.env.ATLAS_ACCEPTANCE_DOCUMENT_ID)||(!process.env.ATLAS_ACCEPTANCE_DOCUMENT_ID?bootstrap.documents[0]:null);
assert.ok(document,'Adicione uma fonte e escolha ATLAS_ACCEPTANCE_DOCUMENT_ID.');
assert.equal(document.storage.provider,'oci','O original precisa estar no OCI Object Storage. Reenvie-o no workspace OCI, se necessário.');
assert.equal(document.storage.status,'verified');
const scenarios=[{profile:'beginner',format:'tutorial'},{profile:'developer',format:'flashcards'},{profile:'executive',format:'summary'}];
const receipts=[];
for(const scenario of scenarios){
 const result=await call('generations',{document_ids:[document.id],goal:'Compreender as ideias principais desta documentação e como aplicá-las',sector:'general',agent_id:'nilo',method:'auto',rag_mode:'vector',...scenario});
 assert.equal(result.quality.judge_verdict,'supported','O gate Jev deve sustentar cada cenário.');assert.equal(result.mode,'remote');assert.equal(result.status,'ready');assert.equal(result.storage.provider,'oci');assert.equal(result.storage.status,'verified');assert.ok(result.conteudo_adaptado.itens.length);assert.ok(result.metadados);
 assert.ok(result.conteudo_adaptado.itens.every(i=>i.citations.length&&i.citations.every(c=>c.document_id===document.id)));
 receipts.push({scenario,package_id:result.id,document_hash:document.hash,storage:result.storage,mode:result.mode,quality:result.quality,metadados:result.metadados});
}
await mkdir('data/reports',{recursive:true});await writeFile('data/reports/mvp-acceptance.json',JSON.stringify({created_at:new Date().toISOString(),document_id:document.id,document_hash:document.hash,scenarios:receipts},null,2));
console.log('Três cenários reais, mesmo documento, embeddings e recibos OCI verificados. Relatório em data/reports/mvp-acceptance.json. Revise qualidade e orçamento com a equipe.');
