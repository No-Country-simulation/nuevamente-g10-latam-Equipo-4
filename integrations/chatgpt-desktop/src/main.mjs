import {app,BrowserWindow,Menu,ipcMain,safeStorage,shell,utilityProcess,dialog} from 'electron';
import {createChatGPT,ChatGPTError,CHATGPT_USAGE_URL} from '@siwc/local';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash,randomBytes} from 'node:crypto';
import {join} from 'node:path';
import {credentialEncryption} from './encryption.mjs';
import {createGateway} from './gateway.mjs';
import {launchStack} from './stack.mjs';
import {requireSender} from './access.mjs';
import {createWindow as makeWindow,entry} from './windows.mjs';
import {LocalSession} from './lifecycle.mjs';

app.setName('NovaMente Atlas');
if(!app.requestSingleInstanceLock())app.exit(0);
let accountWindow,atlasWindow,client,encryption;
const runtime=new LocalSession();
const windows=new Set();
function createWindow(origin,capability,partition){return makeWindow(windows,origin,capability,partition);}
function showAccount(){if(accountWindow&&!accountWindow.isDestroyed()){accountWindow.show();accountWindow.focus();}}
function publicError(error){
  if(error instanceof ChatGPTError)return {code:error.code,message:error.message,retryable:error.retryable};
  return {code:'local_failed',message:'Não foi possível concluir a operação local. Confira o cofre do sistema e a preparação do Atlas.',retryable:false};
}
function handle(name,run){
  ipcMain.handle('atlas-plan:'+name,async(event,...args)=>{
    try{
      const window=BrowserWindow.fromWebContents(event.sender);
      if(!windows.has(window))throw new Error('Unknown window');
      requireSender(event,window,entry,window===atlasWindow?runtime.current?.url:undefined);
      return {ok:true,value:await run(...args)};
    }catch(error){return {ok:false,error:publicError(error)};}
  });
}
async function backendKey(directory){
  const path=join(directory,'backend-key.enc');
  try{return encryption.decrypt(await readFile(path));}
  catch(error){if(error.code!=='ENOENT')throw error;}
  const key=randomBytes(32).toString('base64');
  await writeFile(path,encryption.encrypt(key),{mode:0o600,flag:'wx'});return key;
}
async function authorizeModel(model,signal){
  signal.throwIfAborted();
  const state=await client.getSession();signal.throwIfAborted();
  if(state.status!=='connected'||!state.sharing||!state.profileId)throw new Error('Plan not authorized');
  const models=await client.listModels({signal});
  if(!models.some(item=>item.slug===model))throw new Error('Unknown model');
  return state;
}
async function openAtlas(model){
  await runtime.start(async signal=>{
    const state=await authorizeModel(model,signal);signal.throwIfAborted();
    const owner=createHash('sha256').update(state.profileId).digest('hex');
    const directory=join(app.getPath('userData'),'profiles',owner);await mkdir(directory,{recursive:true,mode:0o700});
    signal.throwIfAborted();
    const gateway=await createGateway(client,model,state.profileId);
    let stack,window;
    try{
      const key=await backendKey(directory);signal.throwIfAborted();
      stack=await launchStack(utilityProcess,gateway,model,directory,key,'plan-'+owner.slice(0,32),signal);
      signal.throwIfAborted();
      window=createWindow(stack.url,stack.capability,'persist:atlas-'+owner);atlasWindow=window;
      const resource=workspaceResource(stack,window);
      await window.loadURL(stack.url+'/workspace');accountWindow.hide();
      return resource;
    }catch(error){if(window&&!window.isDestroyed())window.destroy();if(stack)await stack.stop();await gateway.close();throw error;}
  });
  return {started:true};
}
function shutdownFailure(){
  showAccount();
  dialog.showErrorBox('Encerramento não confirmado','Um serviço local não confirmou o encerramento. O Atlas não abrirá outro perfil. Verifique os processos locais antes de reiniciar.');
}
async function stopAndReturn(){
  try{await runtime.stop();showAccount();}catch{shutdownFailure();}
}
function workspaceResource(stack,window){
  const stop=async()=>{
    if(atlasWindow===window)atlasWindow=undefined;
    if(!window.isDestroyed())window.destroy();
    await stack.stop();
  };
  window.on('closed',()=>{if(atlasWindow===window)void stopAndReturn();});
  stack.onExit(()=>{void stopAndReturn();});
  return {...stack,stop};
}
app.whenReady().then(async()=>{
  encryption=credentialEncryption(safeStorage,()=>app.isReady());
  client=createChatGPT({appName:'NovaMente Atlas',appId:'novamente-atlas',redirectPort:0,storageDir:join(app.getPath('userData'),'chatgpt'),credentialEncryption:encryption,openBrowser:async url=>{if(new URL(url).origin!=='https://auth.openai.com')throw new Error('Invalid OAuth origin');await shell.openExternal(url);}});
  accountWindow=createWindow();
  accountWindow.on('close',event=>{if(!quitReady){event.preventDefault();app.quit();}});
  client.subscribe(state=>{for(const window of windows)if(!window.isDestroyed())window.webContents.send('atlas-plan:state',state);});
  handle('status',async()=>({session:await client.getSession(),encryptionAvailable:await encryption.isAvailable(),mode:'local-direct'}));
  handle('sign-in',async(newProfile=false)=>{if(typeof newProfile!=='boolean')throw new Error('Invalid profile');if(runtime.startup)throw new Error('Startup in progress');const state=await client.getSession();await runtime.stop();return client.signIn({newProfile,reconsent:!newProfile&&state.status==='connected'&&!state.sharing});});
  handle('cancel',()=>client.cancelSignIn());
  handle('disconnect',async()=>{if(runtime.startup)throw new Error('Startup in progress');await runtime.stop();await client.disconnect();showAccount();return client.getSession();});
  handle('profiles',()=>client.listProfiles());
  handle('select',async id=>{if(runtime.startup||typeof id!=='string'||id.length>200)throw new Error('Invalid profile');await runtime.stop();return client.selectProfile(id);});
  handle('models',()=>client.listModels());
  handle('open',model=>{if(typeof model!=='string'||model.length>200)throw new Error('Invalid model');return openAtlas(model);});
  handle('account',showAccount);
  handle('usage',()=>shell.openExternal(CHATGPT_USAGE_URL));
  Menu.setApplicationMenu(Menu.buildFromTemplate([{label:'Atlas',submenu:[{label:'Conta e uso do ChatGPT',click:showAccount},{role:'quit'}]},{role:'editMenu'},{role:'viewMenu'}]));
  await accountWindow.loadFile(entry);
}).catch(()=>{console.error('O Atlas local não iniciou. Verifique o build e o cofre do sistema.');app.quit();});
app.on('second-instance',()=>{if(accountWindow)showAccount();});
app.on('window-all-closed',()=>app.quit());
let quitRequested=false,quitReady=false;
app.on('before-quit',event=>{
  if(quitReady)return;
  event.preventDefault();
  if(quitRequested)return;
  quitRequested=true;client?.cancelSignIn();
  void runtime.stop().then(()=>{quitReady=true;app.quit();}).catch(()=>{
    quitRequested=false;shutdownFailure();
  });
});
