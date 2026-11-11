import {NextRequest,NextResponse} from 'next/server';
import {timingSafeEqual} from 'node:crypto';

const MAX_FILE=80*1024*1024;
const MAX_BODY=MAX_FILE+64*1024;
export const routes:Record<string,RegExp[]>={
  GET:[/^connections$/,/^bootstrap$/,/^auth\/me$/,/^health$/,/^documents$/,/^documents\/[\w-]+\/(source|deletion|removal)$/,/^packages\/[\w-]+$/,/^trails(?:\/[\w-]+)?$/,/^progress$/,/^groups$/,/^groups\/[\w-]+\/messages$/,/^dreamer\/status$/],
  POST:[/^auth\/(register|login|logout)$/,/^connections\/(generation|embeddings)\/test$/,/^connections\/(generation|embeddings|decision|search)$/,/^documents$/,/^generations$/,/^chat$/,/^quiz\/[\w-]+\/attempt$/,/^trails(?:\/[\w-]+\/steps\/[\w-]+\/(generate|complete))?$/,/^groups$/,/^groups\/[\w-]+\/messages$/,/^dreamer\/(consent|cycles|rollback)$/],
  DELETE:[/^connections\/(generation|embeddings|decision|search)$/,/^documents\/[\w-]+$/,/^dreamer\/memory$/],
};
export class ProxyError extends Error {
  constructor(public readonly status:number,message:string){super(message);}
}
export function authorizeDesktop(request:NextRequest):void {
  if(process.env.ATLAS_LOCAL_CHATGPT_PLAN!=='1')return;
  const expected=Buffer.from(process.env.ATLAS_DESKTOP_CAPABILITY||'');
  const received=Buffer.from(request.headers.get('x-atlas-desktop-key')||'');
  if(expected.length<32||received.length!==expected.length||!timingSafeEqual(expected,received))
    throw new ProxyError(401,'Abra o Atlas pela janela autorizada do aplicativo desktop.');
}
export function authorizeOrigin(request:NextRequest):void {
  const origin=request.headers.get('origin');
  if(request.method==='GET'||!origin)return;
  let allowed=false;
  try{
    const parsed=new URL(origin);
    allowed=parsed.origin===origin&&!parsed.username&&!parsed.password&&parsed.host===request.headers.get('host')&&parsed.protocol===request.nextUrl.protocol;
  }catch{}
  if(!allowed)throw new ProxyError(403,'Origem não autorizada.');
}
export function targetURL(path:string):URL {
  const base=new URL(process.env.ATLAS_API_URL||'http://127.0.0.1:4000');
  if(!['http:','https:'].includes(base.protocol)||base.username||base.password)throw new Error('Invalid server URL');
  return new URL(`/v1/${path}`,base);
}
export function requestHeaders(request:NextRequest):Headers {
  const token=process.env.ATLAS_INTERNAL_TOKEN;
  if(!token)throw new ProxyError(503,'O serviço precisa de configuração no servidor.');
  const headers=new Headers({Authorization:`Bearer ${token}`,Accept:'application/json'});
  const session=request.cookies.get('atlas_session')?.value||request.headers.get('x-atlas-session');
  if(session)headers.set('x-atlas-session',session);
  const key=request.headers.get('Idempotency-Key');
  if(key){
    if(!/^[a-zA-Z0-9_-]{16,100}$/.test(key))throw new ProxyError(400,'Identificador de operação inválido.');
    headers.set('Idempotency-Key',key);
  }
  return headers;
}
async function boundedBytes(stream:ReadableStream<Uint8Array>,max:number):Promise<Uint8Array> {
  const reader=stream.getReader();const chunks:Uint8Array[]=[];let size=0;
  while(true){
    const chunk=await reader.read();if(chunk.done)break;
    size+=chunk.value.length;
    if(size>max){await reader.cancel();throw new ProxyError(413,'O conteúdo excede o limite de tamanho.');}
    chunks.push(chunk.value);
  }
  const result=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}
  return result;
}
function uploadStream(stream:ReadableStream<Uint8Array>):ReadableStream<Uint8Array>{
  let size=0;
  return stream.pipeThrough(new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){
    size+=chunk.byteLength;
    if(size>MAX_BODY)throw new ProxyError(413,'O arquivo deve ter até 80 MiB.');
    controller.enqueue(chunk);
  }}));
}
function bodyMetadata(request:NextRequest,path:string,headers:Headers){
  const upload=path==='documents';
  const max=upload?MAX_BODY:64*1024;
  if(Number(request.headers.get('content-length')||0)>max)throw new ProxyError(413,'O conteúdo excede o tamanho permitido. Arquivos: até 80 MiB.');
  const type=request.headers.get('content-type')||'';
  const expected=upload?'multipart/form-data; boundary=':'application/json';
  if(!type.startsWith(expected))throw new ProxyError(415,'Formato de solicitação inválido.');
  headers.set('Content-Type',type);
  return {upload,max};
}
async function deleteBody(request:NextRequest,headers:Headers){
  const bytes=await boundedBytes(request.body!,64*1024);
  if(!bytes.length)return;
  bodyMetadata(request,'',headers);
  return bytes;
}
export async function requestBody(request:NextRequest,path:string,headers:Headers):Promise<Uint8Array|ReadableStream<Uint8Array>|undefined>{
  if(request.method==='GET'||!request.body)return;
  if(request.method==='DELETE')return deleteBody(request,headers);
  const {upload,max}=bodyMetadata(request,path,headers);
  return upload?uploadStream(request.body):boundedBytes(request.body,max);
}
export function timeout(path:string):number {
  return ['documents','generations','chat','dreamer/cycles'].includes(path)||path.endsWith('/generate')?120000:30000;
}
export async function publicResponse(response:Response,path=''):Promise<NextResponse> {
  if(!response.ok){
    publicFailure(response,path);
  }
  if(response.status===204)return new NextResponse(null,{status:204});
  const headers=new Headers({'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
  if(response.headers.get('Idempotency-Replayed'))headers.set('Idempotency-Replayed','true');
  const body=response.body?await boundedBytes(response.body,16*1024*1024):null;
  return new NextResponse(body as BodyInit|null,{status:response.status,headers});
}


let uploading=false;
export async function uploadSlot<T>(path:string,run:()=>Promise<T>):Promise<T>{
  if(path!=='documents')return run();
  if(uploading)throw new ProxyError(429,'Outro arquivo está sendo processado. Aguarde a conclusão antes de enviar o próximo.');
  uploading=true;
  try{return await run();}finally{uploading=false;}
}

export function proxyFailure(error:unknown):ProxyError{
  let cause=error;
  for(let depth=0;depth<4;depth++){
    if(cause instanceof ProxyError)return cause;
    if(!(cause instanceof Error))break;
    cause=cause.cause;
  }
  if(error instanceof Error&&['TimeoutError','AbortError'].includes(error.name))return new ProxyError(504,'A operação demorou mais que o esperado. Confira o estado antes de tentar novamente.');
  return new ProxyError(502,'Não foi possível conectar ao Atlas. Aguarde e tente novamente; se persistir, contate a equipe.');
}

function publicFailure(response:Response,path:string):never {
    providerFailure(response);
    const messages:Record<number,string>={400:'Confira o arquivo e os pré-requisitos. PDFs devem conter texto selecionável, até 1000 páginas e 2 milhões de caracteres; arquivos protegidos precisam ser desbloqueados.',401:'Entre na sua conta para continuar. Se o problema persistir, solicite a revisão da configuração do ambiente.',403:'Você não tem acesso a este recurso.',404:'O conteúdo não foi encontrado ou foi removido.',409:'Confira o estado da operação ou conclua a etapa anterior antes de continuar.',413:'O arquivo deve ter até 80 MiB.',415:'Use um arquivo PDF, Markdown ou TXT.',422:'Confira se a fonte contém texto.',429:'O serviço está ocupado. Aguarde um instante e tente novamente.'};
    if(response.status===400&&path!=='documents')throw new ProxyError(400,'Confira os campos, as fontes selecionadas e os pré-requisitos desta etapa.');
    throw new ProxyError(response.status>=500?502:response.status,messages[response.status]||'O serviço não conseguiu concluir a solicitação. Tente novamente.');
}

const providerNotices:Record<string,{status:number;message:string}>={
  source_reconciliation_required:{status:409,message:'Há materiais antigos em quarentena por proveniência inconsistente. Seus arquivos foram preservados; solicite reconciliação ao responsável antes de continuar.'},
  chatgpt_limit:{status:429,message:'O ChatGPT está ocupado ou atingiu um limite. Consulte Conta e uso no aplicativo desktop; não houve troca para API paga.'},
  chatgpt_unavailable:{status:503,message:'O ChatGPT não concluiu a resposta. Confira a conexão e reconecte sua conta no aplicativo desktop. Seus documentos foram preservados.'},
};
function providerFailure(response:Response){
  const notice=providerNotices[response.headers.get('X-Atlas-Error-Code')||''];
  if(notice&&notice.status===response.status)throw new ProxyError(notice.status,notice.message);
}

const authMessages:Record<number,string>={400:'Confira nome, e-mail e senha (mínimo 10 caracteres).',401:'E-mail ou senha incorretos.',409:'Não foi possível criar a conta com estes dados.',429:'Muitas tentativas. Aguarde alguns minutos.'};

async function authData(response:Response,logout:boolean) {
  if(!response.ok||!response.body||logout)return {};
  return JSON.parse(new TextDecoder().decode(await boundedBytes(response.body,64*1024)));
}

export async function authResponse(response:Response,request:NextRequest,path:string):Promise<NextResponse> {
  const logout=path==='auth/logout';
  if(!response.ok&&!logout)throw new ProxyError(response.status>=500?502:response.status,authMessages[response.status]||'Não foi possível concluir. Tente novamente.');
  const data=await authData(response,logout);
  const result=NextResponse.json(logout?{status:'ok'}:{user:data.user},{status:response.status,headers:{'Cache-Control':'no-store'}});
  const secure=(request.headers.get('x-forwarded-proto')||request.nextUrl.protocol.replace(':',''))==='https';
  const base={httpOnly:true,secure,sameSite:'lax' as const,path:'/'};
  if(data.session_token)result.cookies.set('atlas_session',data.session_token,{...base,expires:new Date(data.expires_at)});
  if(logout)result.cookies.set('atlas_session','',{...base,maxAge:0});
  return result;
}
