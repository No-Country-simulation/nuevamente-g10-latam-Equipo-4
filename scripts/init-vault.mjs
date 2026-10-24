import {config} from 'dotenv';
import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync,existsSync,chmodSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),path=resolve(root,'.env');
config({path,quiet:true});
if(process.env.ATLAS_CREDENTIAL_MASTER_KEY||process.env.ATLAS_CREDENTIAL_MASTER_KEY_FILE){
 const existing=process.env.ATLAS_CREDENTIAL_MASTER_KEY_FILE?readFileSync(process.env.ATLAS_CREDENTIAL_MASTER_KEY_FILE,'utf8').trim():process.env.ATLAS_CREDENTIAL_MASTER_KEY;
 if(!existing||!/^[A-Za-z0-9+/]{43}=$/.test(existing))throw new Error('A chave mestra existente não contém 32 bytes em base64. Corrija a fonte original sem substituir um cofre existente.');
 console.log('Chave mestra existente validada e preservada, sem exibir seu valor.');
}else{
 const vaultPath=process.env.ATLAS_CREDENTIALS_FILE?resolve(root,'apps/api',process.env.ATLAS_CREDENTIALS_FILE):resolve(root,'apps/api',process.env.ATLAS_DATA_DIR||'../../data','credentials/providers.enc');
 if(existsSync(vaultPath))throw new Error('Há um cofre existente. Restaure a chave original antes de continuar.');
 let source=readFileSync(path,'utf8');const value=randomBytes(32).toString('base64');
 if(/^ATLAS_CREDENTIAL_MASTER_KEY=.*$/m.test(source))source=source.replace(/^ATLAS_CREDENTIAL_MASTER_KEY=.*$/m,`ATLAS_CREDENTIAL_MASTER_KEY=${value}`);
 else source+=`\nATLAS_CREDENTIAL_MASTER_KEY=${value}\n`;
 writeFileSync(path,source,{mode:0o600});chmodSync(path,0o600);
 console.log('Chave mestra criada em .env. Faça backup seguro; reinicie os serviços para carregá-la.');
}
