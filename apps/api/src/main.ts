import 'reflect-metadata';
import { config } from 'dotenv';
import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { Controller, Get, Post, Delete, Req, Res, Param, Module, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { NestFactory } from '@nestjs/core';
import { Client } from 'eve/client';
import { z, ZodError } from 'zod';
import type { Request, Response } from 'express';
import { generationSchema, judge, selectTeam, evaluateEvidence } from './policy.js';
import {createActionEngines, controlPrincipal} from './orchestration/actions.js';
import {createBrains} from './orchestration/brains.js';
import {createAgentFactory,eveRuntime} from './orchestration/factory.js';
import {probeConnection} from './connections/probe.js';
import {connection,publicConnections,saveConnection,removeConnection,slots} from './connections/vault.js';

config({path:process.env.ATLAS_ENV_FILE || '../../.env',quiet:true});
const token = process.env.ATLAS_INTERNAL_TOKEN;
if (!token || token.length < 24) throw new Error('Configure ATLAS_INTERNAL_TOKEN com pelo menos 24 caracteres.');
if ((process.env.ATLAS_APP_MODE || 'local') !== 'local') throw new Error('Autenticação pública pendente. Esta versão só permite workspace local.');
const tenant = process.env.ATLAS_TENANT_ID || 'local-workspace';

async function cognition(path:string, method='GET', body?:unknown, memory=false, signal?:AbortSignal) {
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

const actions=createActionEngines(tenant,{cognition,judge,remoteMemory:!!process.env.MEMORY_SERVICE_URL,async search(query,signal){
    if (!connection('search').key) throw Object.assign(new Error('Configure FIRECRAWL_API_KEY no servidor para pesquisar na web.'),{status:503});
    const response = await fetch('https://api.firecrawl.dev/v2/search',{method:'POST',headers:{Authorization:`Bearer ${connection('search').key}`,'content-type':'application/json'},body:JSON.stringify({query:query,limit:3}),signal});
    if (!response.ok) throw Object.assign(new Error('Busca web indisponível. Nenhuma chave foi enviada ao navegador.'),{status:503});
    const data = await response.json();
    const results = Array.isArray(data.data) ? data.data : data.data?.web || [];
    const filtered=results.filter((r:{url?:string})=>{try{const url=new URL(r.url||'');return url.protocol==='https:' && !isIP(url.hostname) && url.hostname.includes('.') && !url.hostname.endsWith('.local') && !url.hostname.endsWith('.internal');}catch{return false;}}).slice(0,3).map((item:{url:string;title?:string;description?:string})=>({url:item.url,title:(item.title||'').slice(0,300),description:(item.description||'').slice(0,2000)}));
    const evaluation=await evaluateEvidence(query,filtered.map((item:{title?:string;description?:string},index:number)=>({id:String(index),text:((item.title||'')+' '+(item.description||'')).slice(0,2000)})));
    return {results:filtered.filter((_item:unknown,index:number)=>evaluation.source!=='typesafe'||evaluation.scores.some(score=>score.id===String(index)&&score.score>0)),source:'firecrawl',retrieved_at:new Date().toISOString(),relevance:evaluation};
}});
const brains=createBrains(tenant,actions);
const control=controlPrincipal(tenant);
const factory=createAgentFactory(tenant,process.env.EVE_SERVICE_TOKEN||token,actions,eveRuntime(process.env.EVE_URL||'http://127.0.0.1:2000'),{enabled:()=>process.env.ATLAS_TEAM_DEBATE!=='0'&&!!connection('decision').key,select:selectTeam});

@Controller('v1')
class AtlasController {
  @Get('connections') connections(){return publicConnections();}
  @Post('connections/:slot/test') testConnection(@Param('slot') raw:string){return probeConnection(z.enum(slots).parse(raw));}
  @Post('connections/:slot') saveConnection(@Param('slot') raw:string,@Req() req:Request){
    if(factory.isBusy())throw Object.assign(new Error('Aguarde o agente terminar antes de trocar credenciais.'),{status:409});
    return saveConnection(z.enum(slots).parse(raw),req.body);
  }
  @Delete('connections/:slot') deleteConnection(@Param('slot') raw:string){
    if(factory.isBusy())throw Object.assign(new Error('Aguarde o agente terminar antes de trocar credenciais.'),{status:409});
    return removeConnection(z.enum(slots).parse(raw));
  }
  @Get('bootstrap') async bootstrap(){return cognition('bootstrap');}
  @Get('documents') async documents(){return cognition('documents');}
  @Get('documents/:id/source') async source(@Param('id') id:string){return cognition(`documents/${encodeURIComponent(id)}/source`);}
  @Delete('documents/:id') async removeDocument(@Param('id') id:string){
  const docId = z.string().regex(/^doc_[a-f0-9]{20}$/).parse(id);
  return cognition(`documents/${docId}`, 'DELETE');
}
  @Post('documents')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:10*1024*1024,files:1,fields:0}}))
  async upload(@UploadedFile() file:Express.Multer.File) {
    if (!file) throw Object.assign(new Error('Selecione PDF, Markdown ou TXT.'),{status:400});
    const fixed = Buffer.from(file.originalname,'latin1').toString('utf8');
    const name = fixed.includes('\uFFFD') ? file.originalname : fixed;
    const form = new FormData();
    form.append('file',new Blob([new Uint8Array(file.buffer)],{type:file.mimetype}),name);
    return cognition('documents','POST',form);
  }
  @Post('generations') async generate(@Req() req:Request){
    const input=generationSchema.parse(req.body);
    return brains.respond('generate',input);
  }
  @Post('chat') async chat(@Req() req:Request){
    const body=z.object({agent_id:generationSchema.shape.agent_id,message:z.string().trim().min(3).max(2000),document_ids:generationSchema.shape.document_ids,method:generationSchema.shape.method}).strict().parse(req.body);
    const request=generationSchema.parse({document_ids:body.document_ids,goal:body.message,agent_id:body.agent_id,method:body.method});
    return brains.respond('chat',request);
  }
  @Get('progress') async progress(){return cognition('progress');}
  @Post('quiz/:id/attempt') async attempt(@Param('id') id:string,@Req() req:Request){return cognition(`quiz/${encodeURIComponent(id)}/attempt`,'POST',z.object({item_id:z.string().max(100),option_id:z.string().max(100),event_id:z.string().max(100)}).strict().parse(req.body));}
  @Get('groups') async groups(){return cognition('groups');}
  @Post('groups') async group(@Req() req:Request){return cognition('groups','POST',z.object({name:z.string().trim().min(2).max(60),topic:z.string().trim().min(3).max(200)}).strict().parse(req.body));}
  @Get('groups/:id/messages') async messages(@Param('id') id:string){return cognition(`groups/${encodeURIComponent(id)}/messages`);}
  @Post('groups/:id/messages') async message(@Param('id') id:string,@Req() req:Request){return cognition(`groups/${encodeURIComponent(id)}/messages`,'POST',z.object({text:z.string().trim().min(1).max(2000)}).strict().parse(req.body));}
  @Get('dreamer/status') async memory(){return actions.invoke('atlas.memory.status',{},control);}
  @Post('dreamer/consent') async consent(@Req() req:Request){return actions.invoke('atlas.memory.consent',req.body,control);}
  @Post('dreamer/cycles') async cycle(){return actions.invoke('atlas.memory.cycle',{},control);}
  @Post('dreamer/rollback') async rollback(@Req() req:Request){return actions.invoke('atlas.memory.rollback',req.body,control);}
  @Delete('dreamer/memory') async forget(){
    return actions.invoke('atlas.memory.forget',{},control);
  }
  @Post('web/search') async search(@Req() req:Request){return actions.invoke('atlas.web-search',req.body,control);}
  @Get('orchestration') async orchestration(){return {brains:brains.catalog(),engines:actions.catalog(),factory:factory.catalog()};}
  @Post('internal/judge') async review(@Req() req:Request){return actions.invoke('atlas.judge',req.body,control);}
  @Post('internal/evidence') async evidence(@Req() req:Request){
    const input=z.object({question:z.string().max(2000),passages:z.array(z.object({id:z.string().max(100),text:z.string().max(2000)}).strict()).min(1).max(6)}).strict().parse(req.body);
    return evaluateEvidence(input.question,input.passages);
  }
  @Post('internal/generate') async eveGenerate(@Req() req:Request){
    if(!process.env.EVE_URL)throw Object.assign(new Error('Runtime Eve não configurado.'),{status:503});
    return factory.run(req.body);
  }
  @Post('internal/agent-tool') async agentTool(@Req() req:Request){
    return factory.invokeTool((req.headers.authorization||'').replace(/^Bearer /,''),req.body);
  }
  @Get('integrations/eve') async eve(){
    if(!process.env.EVE_URL)return {status:'not_configured',reason:'Runtime Eve externo ou sob demanda. Credenciais e provedor ainda não configurados.'};
    const client=new Client({host:process.env.EVE_URL,redirect:'error'});
    return {status:'connected',health:await client.health()};
  }
}

@Module({controllers:[AtlasController]})
class AtlasModule {}
const app=await NestFactory.create(AtlasModule,{logger:['error','warn']});
const windows=new Map<string,{start:number;count:number}>();
app.use((req:Request,res:Response,next:()=>void)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','no-store');
  const received=Buffer.from(req.headers.authorization||'');const expected=Buffer.from(`Bearer ${token}`);
  if(req.path!=='/v1/internal/agent-tool'&&(received.length!==expected.length||!timingSafeEqual(received,expected))){res.status(401).json({message:'Acesso interno não autorizado.'});return;}
  const key=req.ip||'local';const current=windows.get(key);const time=Date.now();
  if(!current||time-current.start>60000){windows.set(key,{start:time,count:1});}else if(++current.count>120){res.status(429).json({message:'Muitas solicitações. Aguarde um minuto.'});return;}
  next();
});
app.useGlobalFilters({catch(error:unknown,host){const res=host.switchToHttp().getResponse<Response>();const err=error as {status?:number;getStatus?:()=>number;message?:string;code?:string};const status=error instanceof ZodError||err.code==='INPUT_INVALID'?400:err.code==='FORBIDDEN'?403:err.code==='UNAUTHENTICATED'?401:err.getStatus?.()||err.status||503;res.status(status).json({message:error instanceof ZodError?'Confira os campos enviados.':status<500?err.message:'O serviço não pôde concluir a operação. Fontes e dados anteriores foram preservados.'});}});
await app.listen(Number(process.env.API_PORT||4000),process.env.ATLAS_BIND_ADDRESS||'127.0.0.1');
console.log('Atlas API pronta. Somente workspace local; segredos permanecem no servidor.');
