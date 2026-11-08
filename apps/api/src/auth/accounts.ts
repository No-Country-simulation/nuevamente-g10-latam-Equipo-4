import {join} from 'node:path';
import {Accounts} from './users.js';

/** Uma única instância para a API toda. O arquivo fica no mesmo volume (/data) dos outros bancos. */
export const accounts=new Accounts(join(process.env.ATLAS_DATA_DIR||'../../data','users.sqlite3'));
setInterval(()=>{try{accounts.cleanup();}catch{console.warn('Limpeza de sessões indisponível.');}},60000).unref();