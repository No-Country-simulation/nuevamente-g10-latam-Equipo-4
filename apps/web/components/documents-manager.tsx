'use client';
import {useState} from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {Search,Trash2,X} from 'lucide-react';
import type {Document,RemovalStatus} from '@atlas/contracts';
import {api} from '@/lib/api';

type Result={id:string;name:string;status:'deleted'|'cleanup_pending'|'unconfirmed';message?:string};
type Props={documents:Document[];onClose:()=>void;onBusy:(busy:boolean)=>void;onChanged:()=>Promise<void>};
export default function DocumentsManager({documents,onClose,onBusy,onChanged}:Props){
  const [query,setQuery]=useState('');
  const [selected,setSelected]=useState<string[]>([]);
  const [confirming,setConfirming]=useState(false);
  const [working,setWorking]=useState(false);
  const [results,setResults]=useState<Result[]>([]);
  const [error,setError]=useState('');
  const filtered=documents.filter(doc=>doc.title.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  const chosen=documents.filter(doc=>selected.includes(doc.id));
  function toggle(id:string){setSelected(previous=>previous.includes(id)?previous.filter(value=>value!==id):[...previous,id].slice(0,20));}
  async function remove(){
    setWorking(true);onBusy(true);setResults([]);setError('');
    const statuses:Result[]=[];
    try{
      for(const doc of chosen){
        const result=await removeOne(doc);statuses.push(result);setResults([...statuses]);
      }
      await onChanged();setSelected([]);setConfirming(false);
    }catch(e){setError('Confira o estado da biblioteca: '+(e as Error).message);}
    finally{setWorking(false);onBusy(false);}
  }
  return <Dialog.Root open onOpenChange={open=>{if(!open&&!working)onClose();}}><Dialog.Portal><Dialog.Overlay className="dialog-overlay"/><Dialog.Content className="dialog-content documents-manager">
    <div className="row between"><Dialog.Title>Gerenciar fontes</Dialog.Title><button className="icon-button" onClick={onClose} disabled={working} aria-label="Fechar gerenciador"><X size={18}/></button></div>
    <Dialog.Description>Encontre documentos e remova os que não devem mais fazer parte da base de conhecimento.</Dialog.Description>
    {confirming?<div className="manager-confirm"><h3>Remover {chosen.length} fontes?</h3><ul>{chosen.map(doc=><li key={doc.id}>{doc.title}</li>)}</ul><p>Os materiais, exercícios, trilhas e XP vinculados serão removidos. Todo o histórico de conversas com os tutores e a memória pedagógica deste workspace serão limpos. A preferência de consentimento e as outras fontes permanecem.</p><p>As fontes serão processadas uma por vez. Falhas não desfazem remoções já concluídas. Limpezas externas pendentes continuam sendo acompanhadas pelo sistema. Nenhum material será refeito automaticamente.</p></div>:<>
      <label className="manager-search"><Search size={16}/><span className="sr-only">Buscar fontes</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder="Buscar pelo nome da fonte"/></label>
      <div className="row between"><span>{selected.length} selecionadas · até 20 por vez</span><button className="text-button" disabled={working} onClick={()=>setSelected(filtered.slice(0,20).map(doc=>doc.id))}>Selecionar resultados</button></div>
      <ul className="manager-list">{filtered.map(doc=><li key={doc.id}><label><input type="checkbox" checked={selected.includes(doc.id)} disabled={working} onChange={()=>toggle(doc.id)}/><span>{doc.title}<small>{doc.pages} {doc.pages===1?'página':'páginas'}</small></span></label></li>)}</ul>
      {!filtered.length&&<p>Nenhuma fonte encontrada.</p>}
    </>}
    {!!results.length&&<ul className="manager-results" aria-live="polite">{results.map(result=><li key={result.id}><strong>{result.name}</strong><span>{resultLabel(result)}</span></li>)}</ul>}
    {error&&<p role="alert" className="error-text">{error}</p>}
    <div className="row end">{confirming&&<button className="button" disabled={working} onClick={()=>setConfirming(false)}>Voltar</button>}<button className="button" disabled={working} onClick={onClose}>Fechar</button><button className="button danger" disabled={!chosen.length||working} onClick={()=>{if(confirming)void remove();else setConfirming(true);}}><Trash2 size={14}/>{working?'Removendo fontes…':'Remover selecionadas'}</button></div>
  </Dialog.Content></Dialog.Portal></Dialog.Root>;
}
async function removeOne(doc:Document):Promise<Result>{
  try{
    const status=await api<RemovalStatus>(`documents/${doc.id}`,{method:'DELETE'});
    return {id:doc.id,name:doc.title,status:status.status};
  }catch(error){
    try{const status=await api<RemovalStatus>(`documents/${doc.id}/removal`);return {id:doc.id,name:doc.title,status:status.status};}catch{}
    return {id:doc.id,name:doc.title,status:'unconfirmed',message:(error as Error).message};
  }
}
function resultLabel(result:Result){
  if(result.status==='deleted')return 'Removida';
  if(result.status==='cleanup_pending')return 'Retirada do acervo; limpeza ainda em andamento';
  return 'Remoção não confirmada. '+result.message;
}
