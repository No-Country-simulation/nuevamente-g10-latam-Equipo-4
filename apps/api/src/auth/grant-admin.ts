import {join} from 'node:path';
import {Accounts} from './users.js';

// Run on the trusted server: npx tsx src/auth/grant-admin.ts usr_<id>
const id=process.argv[2];
if(!id||!/^usr_[a-f0-9]{20}$/.test(id))throw new Error('Informe o ID exato do usuário.');
const accounts=new Accounts(join(process.env.ATLAS_DATA_DIR||'../../data','users.sqlite3'));
try {accounts.grantAdmin(id);console.log(`Administrador concedido: ${id}`);} finally {accounts.close();}
