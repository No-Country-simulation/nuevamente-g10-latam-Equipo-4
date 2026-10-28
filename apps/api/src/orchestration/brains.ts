import {personas,catalogVersion} from './catalog.js';
import type {Generation} from '../policy.js';
import {decide,generationSchema} from '../policy.js';
import {brainCapabilities,brainPrincipal,type ActionEngines} from './actions.js';

export const brains=Object.freeze(personas.map(brain=>Object.freeze({...brain,version:catalogVersion,capabilities:brainCapabilities})));

/** Atlas brain = domain decision loop; Eve remains the LLM/handoff runtime. */
export function createBrains(tenant:string,actions:ActionEngines,decision:typeof decide=decide) {
  async function respond(kind:'generate'|'chat',input:Generation,signal?:AbortSignal) {
    input=generationSchema.parse(input);
    const principal=brainPrincipal(tenant,input.agent_id);
    const {documents}=await actions.invoke('atlas.sources',{},principal,signal);
    const selected=documents.filter((doc:{id:string})=>input.document_ids.includes(doc.id));
    if(selected.length!==new Set(input.document_ids).size)throw Object.assign(new Error('Uma fonte selecionada não pertence a este workspace.'),{status:404});
    const state=await actions.invoke('atlas.memory.status',{},principal,signal);
    const memory=state.consent?state.active_policy:null;
    const choice=await decision(input,selected.reduce((n:number,doc:{characters:number})=>n+doc.characters,0),memory);
    return actions.invoke(kind==='chat'?'atlas.chat':'atlas.generate',{...input,decision:choice},principal,signal);
  }
  return {catalog:()=>brains,respond};
}
