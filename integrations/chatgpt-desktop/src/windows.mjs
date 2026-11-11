import {BrowserWindow} from 'electron';
import {fileURLToPath} from 'node:url';
export const entry=fileURLToPath(new URL('../dist/index.html',import.meta.url));
const preload=fileURLToPath(new URL('./preload.cjs',import.meta.url));
function sameOrigin(url,origin){try{return Boolean(origin)&&new URL(url).origin===origin;}catch{return false;}}
export function createWindow(windows,origin,capability,partition){
  const window=new BrowserWindow({width:1120,height:850,minWidth:390,minHeight:620,backgroundColor:'#08090a',webPreferences:{preload,partition,contextIsolation:true,nodeIntegration:false,sandbox:true,webSecurity:true}});
  windows.add(window);window.on('closed',()=>windows.delete(window));
  window.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  window.webContents.on('will-attach-webview',event=>event.preventDefault());
  window.webContents.on('will-navigate',(event,url)=>{if(!sameOrigin(url,origin))event.preventDefault();});
  window.webContents.session.setPermissionRequestHandler((_contents,_permission,answer)=>answer(false));
  if(capability)window.webContents.session.webRequest.onBeforeSendHeaders((details,callback)=>{
    const headers={...details.requestHeaders};
    delete headers['x-atlas-desktop-key'];
    if(details.webContentsId===window.webContents.id&&sameOrigin(details.url,origin))headers['x-atlas-desktop-key']=capability;
    callback({requestHeaders:headers});
  });
  return window;
}
