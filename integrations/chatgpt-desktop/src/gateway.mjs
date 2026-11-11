import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {once} from 'node:events';

function failure(status,message){return Object.assign(new Error(message),{publicStatus:status});}
function authenticate(request,key){
  const expected=Buffer.from(`Bearer ${key}`),received=Buffer.from(request.headers.authorization||'');
  if(request.headers.origin||received.length!==expected.length||!timingSafeEqual(received,expected))throw failure(401,'Acesso local não autorizado.');
}
async function body(request){
  let size=0;const chunks=[];
  for await(const chunk of request){size+=chunk.length;if(size>512*1024)throw failure(413,'O estudo excede o limite de contexto local. Selecione menos fontes.');chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw failure(400,'Solicitação de estudo inválida.');}
}
function messages(input){
  if(!Array.isArray(input)||!input.length||input.length>32)throw failure(400,'Mensagens inválidas.');
  return input.map(message=>{
    if(!['system','developer','user','assistant'].includes(message.role)||typeof message.content!=='string')throw failure(400,'Formato de mensagem não suportado.');
    return {role:message.role==='system'?'developer':message.role,content:message.content};
  });
}
function completionInput(input,model){
  if(!input||input.model!==model||input.stream||input.tools?.length)throw failure(400,'Este perfil local usa geração direta de texto, sem ferramentas do modelo.');
  const maxOutputTokens=outputBudget(input);
  return {model,input:messages(input.messages),maxOutputTokens,responseFormat:{type:'json_object'}};
}
function outputBudget(input){
  const maxOutputTokens=input.max_tokens??2500;
  if(!Number.isInteger(maxOutputTokens)||maxOutputTokens<1||maxOutputTokens>2500)throw failure(400,'O limite local é de 2500 tokens por resposta.');
  if(input.response_format?.type!=='json_object')throw failure(400,'O backend local exige resposta JSON validada.');
  return maxOutputTokens;
}
function reply(response,status,data){if(!response.destroyed)response.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(data));}
function reportError(response,error){
  if(error.publicStatus)return reply(response,error.publicStatus,{error:{message:error.message}});
  if(error.status===429)return reply(response,429,{error:{message:'Limite do plano ChatGPT atingido. Confira o uso na sua conta; não houve troca para API paga.'}});
  reply(response,503,{error:{message:'O ChatGPT não concluiu a resposta. Confira sua conexão e a autorização do plano no aplicativo.'}});
}
async function generate(client,model,request,controller){
  const options=completionInput(await body(request),model);let outputSize=0;
  const result=await client.streamResponse({...options,signal:AbortSignal.any([controller.signal,AbortSignal.timeout(55000)]),onDelta:delta=>{outputSize+=delta.length;if(outputSize>512*1024)controller.abort();}});
  if(typeof result.text!=='string'||result.text.length>512*1024)throw failure(502,'Resposta acima do limite local.');
  let content;try{content=JSON.parse(result.text);}catch{throw failure(502,'O modelo não retornou JSON válido; nenhum material foi publicado.');}
  if(!content||Array.isArray(content)||typeof content!=='object')throw failure(502,'A resposta não corresponde ao formato solicitado.');
  return {id:'atlas-local-'+randomBytes(12).toString('hex'),object:'chat.completion',model,choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(content)}}]};
}
async function route(client,model,profileId,request,response,controller,lease){
  const session=await client.getSession();
  if(session.status!=='connected'||!session.sharing||session.profileId!==profileId)throw failure(403,'Conecte a conta selecionada e autorize o uso do plano.');
  if(request.method==='GET'&&request.url==='/v1/models')return reply(response,200,{data:[{id:model,object:'model'}]});
  if(request.method!=='POST'||request.url!=='/v1/chat/completions')throw failure(404,'Rota local indisponível.');
  if(lease.busy)throw failure(429,'Há uma resposta em andamento. Aguarde.');
  lease.busy=true;
  try{reply(response,200,await generate(client,model,request,controller));}finally{lease.busy=false;}
}
export async function createGateway(client,model,profileId){
  const key=randomBytes(32).toString('base64url'),lease={busy:false};
  const server=createServer(async(request,response)=>{
    const controller=new AbortController();response.once('close',()=>controller.abort());
    try{authenticate(request,key);await route(client,model,profileId,request,response,controller,lease);}
    catch(error){reportError(response,error);}
  });
  server.listen(0,'127.0.0.1');await once(server,'listening');
  let closed=false;
  const baseURL=`http://127.0.0.1:${server.address().port}/v1`;
  return {baseURL,key,async close(){if(closed)return;closed=true;server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}};
}
