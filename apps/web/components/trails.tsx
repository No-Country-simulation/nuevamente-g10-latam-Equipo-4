'use client';
import {useEffect,useState,type FormEvent,type ReactNode} from 'react';
import type {AgentId,Profile,Trail,EducationalPackage} from '@atlas/contracts';
import {api,post} from '@/lib/api';

type Props={documentIds:string[];profile:Profile;agentId:AgentId;renderMaterial:(value:EducationalPackage)=>ReactNode};

export default function Trails({documentIds,profile,agentId,renderMaterial}:Props){
  const [trails,setTrails]=useState<Trail[]>([]);
  const [goal,setGoal]=useState('');
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [material,setMaterial]=useState<EducationalPackage|null>(null);
  useEffect(()=>{
    let active=true;
    api<Trail[]>('trails').then(value=>{if(active)setTrails(value);})
      .catch(reason=>{if(active)setError(reason.message);}).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[]);
  async function run(command:()=>Promise<void>){
    setBusy(true);setError('');
    try {await command();}catch(reason){setError((reason as Error).message);}finally{setBusy(false);}
  }
  async function create(event:FormEvent){
    event.preventDefault();
    await run(async()=>{
      const trail=await post<Trail>('trails',{document_ids:documentIds,goal,profile,agent_id:agentId});
      setTrails(previous=>[trail,...previous]);setGoal('');
    });
  }
  function update(value:Trail){setTrails(previous=>previous.map(trail=>trail.id===value.id?value:trail));}
  async function prepare(trail:string,step:string){
    await run(async()=>{
      const result=await post<{trail:Trail;package:EducationalPackage}>(`trails/${trail}/steps/${step}/generate`,{});
      update(result.trail);setMaterial(result.package);
    });
  }
  async function complete(trail:string,step:string){
    await run(async()=>update(await post<Trail>(`trails/${trail}/steps/${step}/complete`,{})));
  }
  return <div className="trails-view">
    <form onSubmit={create} className="goal-composer"><label htmlFor="trail-goal">Qual é seu objetivo de estudo?</label>
      <input id="trail-goal" value={goal} onChange={event=>setGoal(event.target.value)} minLength={3} maxLength={2000} required placeholder="Ex.: compreender redes e praticar os conceitos"/>
      <p className="small muted">Usa as fontes, o perfil e o tutor selecionados no estúdio. O roteiro inicial segue quatro etapas; cada material usa suas fontes.</p>
      <button className="button primary" disabled={busy||!documentIds.length||loading}>Criar trilha</button>
    </form>
    {error&&<p role="alert" className="notice error">{error}</p>}
    {loading&&<p role="status">Carregando suas trilhas…</p>}
    {trails.map(trail=><section className="package" key={trail.id} aria-label={`Trilha ${trail.goal}`}>
      <div className="package-body"><h2>{trail.goal}</h2><p className="small muted">{trail.completed_steps} de {trail.steps.length} etapas · Roteiro local · Progresso salvo</p>
        {trail.steps.map((step,index)=><article className="learning-item" key={step.id}>
          <h3>{index+1}. {step.title}</h3><p>{step.status==='completed'?'Concluída':step.unlocked?'Pronta para estudar':'Conclua a etapa anterior'}</p>
          <div className="row wrap"><button className="button" disabled={busy||!step.unlocked} onClick={()=>void prepare(trail.id,step.id)} aria-label={`Preparar etapa ${index+1} de ${trail.goal}`}>{step.package_id?'Abrir material':'Preparar material'}</button>
          <button className="button" disabled={busy||!step.unlocked||!step.package_id||step.status==='completed'} onClick={()=>void complete(trail.id,step.id)} aria-label={`Concluir etapa ${index+1} de ${trail.goal}`}>Concluir etapa</button></div>
          {step.format==='quiz'?<p className="small muted">A conclusão exige acertos conferidos pelo servidor.</p>:<p className="small muted">Concluir registra sua confirmação de estudo.</p>}
        </article>)}
      </div>
    </section>)}
    {!loading&&!trails.length&&<p>Crie sua primeira trilha com uma fonte do estúdio.</p>}
    {material&&<div aria-label="Material da trilha">{renderMaterial(material)}</div>}
  </div>;
}
