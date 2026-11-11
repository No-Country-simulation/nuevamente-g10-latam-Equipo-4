import type {Response} from 'express';
export class CognitionError extends Error {
  constructor(message:string,public readonly status:number,public readonly publicCode:string|null){super(message);}
}
export function unwrapCognitionError(error:unknown):unknown {
  let current=error;
  for(let depth=0;depth<4;depth++){
    if(current instanceof CognitionError)return current;
    if(!(current instanceof Error))break;
    current=current.cause;
  }
  return error;
}
export function publicErrorHeader(response: Response, error: unknown) {
  const code = publicErrorCode(error);
  if(code)response.setHeader('X-Atlas-Error-Code', code);
}
export function publicErrorCode(error:unknown) {
  const code = (unwrapCognitionError(error) as {publicCode?: string}).publicCode;
  if (code === 'chatgpt_limit' || code === 'chatgpt_unavailable' || code === 'source_reconciliation_required')
    return code;
}
export function replayErrorHeader(response:Response,body:unknown){
  if(!body||typeof body!=='object')return;
  publicErrorHeader(response,{publicCode:(body as {code?:unknown}).code});
}
