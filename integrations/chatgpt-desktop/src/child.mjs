// Trusted local utility process. Configuration arrives over its private parent port.
import {Server} from 'node:net';
import {pathToFileURL} from 'node:url';
process.parentPort.once('message',async({data})=>{
  Object.assign(process.env,data.env);
  const original=Server.prototype.listen;
  Server.prototype.listen=function(...args){
    this.once('listening',()=>{
      const address=this.address();
      if(address&&typeof address!=='string'&&address.port===data.port&&address.address==='127.0.0.1'){
        Server.prototype.listen=original;
        process.parentPort.postMessage({ready:true});
      }
    });
    return original.apply(this,args);
  };
  try{await import(pathToFileURL(data.module).href);}catch{process.parentPort.postMessage({failed:true});process.exitCode=1;}
});
