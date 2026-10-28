// Only fingerprints/IDs in memory; manual retries reuse the command ID.
// Request bodies, provider keys and receipts are never stored in localStorage.
const pending=new Map<string,string>();
type Receipt={fingerprint:string;key:string};
async function commandId(path:string,body:string):Promise<Receipt>{
  const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(`${path}:${body}`));
  const fingerprint=Array.from(new Uint8Array(bytes),byte=>byte.toString(16).padStart(2,'0')).join('');
  let key=pending.get(fingerprint);
  if(!key){
    if(pending.size>=100)throw new Error('Há muitas operações sem confirmação. Confira o estado antes de continuar.');
    key=crypto.randomUUID();pending.set(fingerprint,key);
  }
  return {fingerprint,key};
}
async function prepare(path:string,options:RequestInit):Promise<{receipt:Receipt|null;headers:Headers}>{
  const method=options.method||'GET';
  const tracked=['POST','DELETE'].includes(method)&&!(options.body instanceof FormData)&&!path.startsWith('connections/');
  const receipt=tracked?await commandId(`${method}:${path}`,String(options.body||'')):null;
  const headers=new Headers(options.headers);
  if(!(options.body instanceof FormData))headers.set('Content-Type','application/json');
  if(receipt)headers.set('Idempotency-Key',receipt.key);
  return {receipt,headers};
}
async function decode<T>(response:Response,receipt:Receipt|null):Promise<T>{
  if(!response.ok){
    if(receipt&&response.status<500&&response.status!==409)pending.delete(receipt.fingerprint);
    const body=await response.json().catch(()=>({}));
    const message=body.error??body.message;
    throw new Error(typeof message==='string'?message:`A solicitação falhou (${response.status}). Tente novamente.`);
  }
  const value=await response.json();
  if(receipt)pending.delete(receipt.fingerprint);
  return value;
}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
  const {receipt,headers}=await prepare(path,options);
  const response=await fetch(`/api/atlas/${path}`,{...options,headers,cache:'no-store'});
  return decode<T>(response,receipt);
}
export const post=<T>(path:string,value:unknown)=>api<T>(path,{method:'POST',body:JSON.stringify(value)});
