import { config } from 'dotenv';
import { isIP } from 'node:net';
import { judge, selectTeam, evaluateEvidence } from './policy.js';
import {createActionEngines, controlPrincipal} from './orchestration/actions.js';
import {createBrains} from './orchestration/brains.js';
import {createAgentFactory,eveRuntime} from './orchestration/factory.js';
import {connection} from './connections/vault.js';

const selectedEnv=process.env.ATLAS_ENV_FILE;
const configuredEnv=config({path:selectedEnv||'../../.env',quiet:true});
if(selectedEnv&&configuredEnv.error)throw new Error('Arquivo ATLAS_ENV_FILE indisponível.');
export const token = process.env.ATLAS_INTERNAL_TOKEN;
if (!token || token.length < 24) throw new Error('Configure ATLAS_INTERNAL_TOKEN com pelo menos 24 caracteres.');
if ((process.env.ATLAS_APP_MODE || 'local') !== 'local') throw new Error('Autenticação pública pendente. Esta versão só permite workspace local.');
export const tenant = process.env.ATLAS_TENANT_ID || 'local-workspace';

export async function cognition(path:string, method='GET', body?:unknown, memory=false, signal?:AbortSignal) {
  const base = memory && process.env.MEMORY_SERVICE_URL ? process.env.MEMORY_SERVICE_URL : process.env.COGNITION_URL || 'http://127.0.0.1:8000';
  const secret = memory && process.env.MEMORY_SERVICE_URL ? process.env.MEMORY_SERVICE_TOKEN : token;
  if (memory && process.env.MEMORY_SERVICE_URL && !base.startsWith('https://')) throw new Error('Memória externa requer HTTPS e token próprio.');
  const headers:Record<string,string> = {Authorization:`Bearer ${secret}`,'x-atlas-tenant':tenant};
  if (body && !(body instanceof FormData)) headers['content-type']='application/json';
  const response = await fetch(`${base}/v1/${path}`, {method,headers,body:body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,signal:AbortSignal.any([AbortSignal.timeout(120000),...(signal?[signal]:[])]),redirect:'error'});
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error(typeof data.detail === 'string' ? data.detail : 'A operação não pôde ser concluída.'),{status:response.status});
  return data;
}

export const actions=createActionEngines(tenant,{cognition,judge,remoteMemory:!!process.env.MEMORY_SERVICE_URL,async search(query,signal){
    if (!connection('search').key) throw Object.assign(new Error('Configure FIRECRAWL_API_KEY no servidor para pesquisar na web.'),{status:503});
    const response = await fetch('https://api.firecrawl.dev/v2/search',{method:'POST',headers:{Authorization:`Bearer ${connection('search').key}`,'content-type':'application/json'},body:JSON.stringify({query:query,limit:3}),signal});
    if (!response.ok) throw Object.assign(new Error('Busca web indisponível. Nenhuma chave foi enviada ao navegador.'),{status:503});
    const data = await response.json();
    const results = Array.isArray(data.data) ? data.data : data.data?.web || [];
    const filtered=results.filter((r:{url?:string})=>{try{const url=new URL(r.url||'');return url.protocol==='https:' && !isIP(url.hostname) && url.hostname.includes('.') && !url.hostname.endsWith('.local') && !url.hostname.endsWith('.internal');}catch{return false;}}).slice(0,3).map((item:{url:string;title?:string;description?:string})=>({url:item.url,title:(item.title||'').slice(0,300),description:(item.description||'').slice(0,2000)}));
    const evaluation=await evaluateEvidence(query,filtered.map((item:{title?:string;description?:string},index:number)=>({id:String(index),text:((item.title||'')+' '+(item.description||'')).slice(0,2000)})));
    return {results:filtered.filter((_item:unknown,index:number)=>evaluation.source!=='typesafe'||evaluation.scores.some(score=>score.id===String(index)&&score.score>0)),source:'firecrawl',retrieved_at:new Date().toISOString(),relevance:evaluation};
}});
export const brains=createBrains(tenant,actions);
export const control=controlPrincipal(tenant);
export const factory=createAgentFactory(tenant,process.env.EVE_SERVICE_TOKEN||token,actions,eveRuntime(process.env.EVE_URL||'http://127.0.0.1:2000'),{enabled:()=>process.env.ATLAS_TEAM_DEBATE!=='0'&&!!connection('decision').key,select:selectTeam});
