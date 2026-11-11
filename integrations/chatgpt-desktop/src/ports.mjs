import {createServer} from 'node:net';
import {readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
async function bind(port){
  const socket=createServer();
  await new Promise((resolve,reject)=>{socket.once('error',reject);socket.listen(port,'127.0.0.1',resolve);});
  return socket;
}
async function savedPort(path){
  try{
    const port=Number(await readFile(path,'utf8'));
    if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Porta local persistida inválida.');
    return port;
  }catch(error){if(error.code==='ENOENT')return 0;throw error;}
}
export async function localPorts(directory){
  const path=join(directory,'web-port');const sockets=[];
  try{
    sockets.push(await bind(await savedPort(path)));
    sockets.push(await bind(0));sockets.push(await bind(0));
    const ports=sockets.map(socket=>socket.address().port);
    await writeFile(path,String(ports[0]),{mode:0o600});
    return ports;
  }finally{await Promise.all(sockets.map(socket=>new Promise(resolve=>socket.close(resolve))));}
}
