import {createEngine, defineCapability} from '@invokta/core';
import type {Principal, ExecutionContext, Engine} from '@invokta/core';
import {z} from 'zod';
import {generationSchema, decisionSchema} from '../policy.js';

export interface ActionPorts {
  remoteMemory?:boolean;
  cognition(path:string, method?:string, body?:unknown, memory?:boolean, signal?:AbortSignal):Promise<any>;
  search(query:string, signal:AbortSignal):Promise<any>;
  judge(question:string,evidence:string,answer:string):Promise<any>;
}
const empty=z.object({}).strict();
const material=z.object({id:z.string(),status:z.enum(['ready','abstained']),conteudo_adaptado:z.object({itens:z.array(z.object({}).passthrough())}).passthrough()}).passthrough();
const state=z.object({consent:z.boolean(),active_version:z.number().int().min(0),active_policy:z.object({}).passthrough().nullable()}).passthrough();
export const brainCapabilities=['atlas.sources','atlas.generate','atlas.chat','atlas.web-search','atlas.judge','atlas.memory.status'] as const;
const agents=new Set(['nilo','lumi','prisma','fio','soma']);

/** Principal is constructed by the server, never deserialized from a model/request. */
export function brainPrincipal(tenant:string,agent:string):Principal {
  if(!agents.has(agent))throw new Error('Brain desconhecido.');
  return {id:`atlas-brain:${agent}`,attributes:{tenant,role:'brain',agent}};
}
export function controlPrincipal(tenant:string):Principal {
  return {id:'atlas-workspace-control',attributes:{tenant,role:'workspace-control'}};
}
export function createActionEngines(tenant:string,ports:ActionPorts) {
  const access=({principal,capabilityId}:{principal:Principal|null;capabilityId:string})=>{
    if(principal?.attributes?.tenant!==tenant)return false;
    if(principal.attributes.role==='workspace-control')return principal.id==='atlas-workspace-control';
    const agent=principal.attributes.agent;
    return principal.attributes.role==='brain' && typeof agent==='string' && agents.has(agent) && principal.id===`atlas-brain:${agent}` && (brainCapabilities as readonly string[]).includes(capabilityId);
  };
  const policy={access,timeoutMs:120000};
  const input=z.object({...generationSchema.shape,decision:decisionSchema}).strict();
  const memoryAction=(path:string,method:string,body:unknown,context:ExecutionContext)=>ports.cognition(path,method,body,true,context.signal);
  const learning=createEngine({name:'atlas-learning',version:'0.2.0',capabilities:{
    'atlas.sources':defineCapability({...policy,description:'Lista fontes autorizadas do workspace.',input:empty,output:z.object({documents:z.array(z.object({id:z.string(),characters:z.number().nonnegative()}).passthrough())}),annotations:{readOnly:true},async run({context}){return {documents:await ports.cognition('documents','GET',undefined,false,context.signal)};}}),
    'atlas.generate':defineCapability({...policy,description:'Entrega material pedagógico citável com decisão validada.',input,output:material,async run({input,context}){return ports.cognition('generations','POST',input,false,context.signal);}}),
    'atlas.chat':defineCapability({...policy,description:'Responde com a persona e memória consentida no serviço de aprendizagem.',input,output:material,async run({input,context}){return ports.cognition('chat','POST',input,false,context.signal);}}),
    'atlas.judge':defineCapability({...policy,description:'Avalia suporte e utilidade sem publicar veredito fictício.',input:z.object({question:z.string().max(2000),evidence:z.string().max(28000),answer:z.string().max(18000)}).strict(),output:z.object({verdict:z.enum(['supported','contradicted','insufficient_evidence','not_evaluated']),score:z.number().min(0).max(1).nullable()}).passthrough(),async run({input}){return ports.judge(input.question,input.evidence,input.answer);}})
  }});
  const research=createEngine({name:'atlas-research',version:'0.2.0',capabilities:{
    'atlas.web-search':defineCapability({...policy,timeoutMs:30000,description:'Pesquisa Firecrawl hospedada com orçamento e URLs filtradas.',input:z.object({query:z.string().trim().min(3).max(300)}).strict(),output:z.object({results:z.array(z.object({url:z.string().url()}).passthrough()).max(3),source:z.literal('firecrawl'),retrieved_at:z.string()}),annotations:{readOnly:true,openWorld:true},async run({input,context}){return ports.search(input.query,context.signal);}})
  }});
  const memory=createEngine({name:'atlas-memory',version:'0.2.0',capabilities:{
    'atlas.memory.status':defineCapability({...policy,description:'Lê consentimento e somente a política Dreamer autorizada.',input:empty,output:state,annotations:{readOnly:true},async run({context}){return memoryAction('dreamer/status','GET',undefined,context);}}),
    'atlas.memory.consent':defineCapability({...policy,description:'Registra consentimento explícito do usuário; brains não podem concedê-lo.',input:z.object({enabled:z.boolean()}).strict(),output:state,async run({input,context}){return memoryAction('dreamer/consent','POST',input,context);}}),
    'atlas.memory.cycle':defineCapability({...policy,description:'Agenda replay Dreamer sujeito ao consentimento e gates persistidos.',input:empty,output:z.object({status:z.string()}).passthrough(),async run({context}){return memoryAction('dreamer/cycles','POST',{},context);}}),
    'atlas.memory.rollback':defineCapability({...policy,description:'Restaura uma versão aprovada e invalida ciclos pendentes.',input:z.object({version:z.number().int().min(0)}).strict(),output:state,async run({input,context}){return memoryAction('dreamer/rollback','POST',input,context);}}),
    'atlas.memory.forget':defineCapability({...policy,description:'Apaga memórias e invalida escritores locais/remotos pendentes.',input:empty,output:state,annotations:{destructive:true},async run({context}){
      if(!ports.remoteMemory)return ports.cognition('dreamer/memory','DELETE',undefined,false,context.signal);
      try{return await memoryAction('dreamer/memory','DELETE',undefined,context);}
      finally{await ports.cognition('dreamer/memory','DELETE',undefined,false);}
    }})
  }});
  const engines=[learning,research,memory];
  const catalog=()=>engines.map(engine=>({name:engine.name,version:engine.version,capabilities:engine.list()}));
  async function invoke(id:string,input:unknown,principal:Principal,signal?:AbortSignal):Promise<any> {
    const engine=engines.find(engine=>engine.list().some(capability=>capability.id===id));
    if(!engine)throw Object.assign(new Error('Capacidade desconhecida.'),{status:404});
    // All inputs/outputs and access are checked by Invokta, including internal callers.
    return (engine as Engine).invoke(id,input,{principal,source:'direct',signal});
  }
  return {learning,research,memory,catalog,invoke};
}
export type ActionEngines=ReturnType<typeof createActionEngines>;
