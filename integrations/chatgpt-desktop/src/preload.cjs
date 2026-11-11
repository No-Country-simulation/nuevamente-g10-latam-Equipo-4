const {contextBridge,ipcRenderer}=require('electron');
const call=(operation,...args)=>ipcRenderer.invoke('atlas-plan:'+operation,...args).then(result=>{if(!result.ok)throw new Error(result.error.message);return result.value;});
contextBridge.exposeInMainWorld('atlasLocal',Object.freeze({
  status:()=>call('status'),signIn:(newProfile=false)=>call('sign-in',newProfile),cancel:()=>call('cancel'),disconnect:()=>call('disconnect'),
  profiles:()=>call('profiles'),select:(id)=>call('select',id),models:()=>call('models'),open:(model)=>call('open',model),account:()=>call('account'),usage:()=>call('usage'),
  subscribe:(listener)=>{const receive=(_event,state)=>listener(state);ipcRenderer.on('atlas-plan:state',receive);return()=>ipcRenderer.removeListener('atlas-plan:state',receive);}
}));
