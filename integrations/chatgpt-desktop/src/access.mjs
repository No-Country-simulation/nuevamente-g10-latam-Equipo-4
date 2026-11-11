import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
export function allowedPage(url,entry,origin){
  try{const parsed=new URL(url);if(parsed.protocol==='file:')return !parsed.host&&resolve(fileURLToPath(parsed))===resolve(entry);return Boolean(origin)&&parsed.origin===origin&&!parsed.username&&!parsed.password;}catch{return false;}
}
export function requireSender(event,window,entry,origin){
  if(!window||event.sender!==window.webContents||event.senderFrame!==window.webContents.mainFrame||!allowedPage(event.senderFrame.url,entry,origin))throw new Error('Origem local não autorizada.');
}
