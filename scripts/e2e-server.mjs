import {spawn} from 'node:child_process';
import {mkdtempSync,cpSync,existsSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes} from 'node:crypto';

const env={...process.env,ATLAS_ENV_READY:'1',ATLAS_ENV_FILE:'/dev/null',
  ATLAS_APP_MODE:'local',NODE_ENV:'production',ATLAS_BIND_ADDRESS:'127.0.0.1',
  ATLAS_INTERNAL_TOKEN:'e2e-only-internal-token-with-32-characters',ATLAS_TENANT_ID:'e2e-workspace',
  ATLAS_DATA_DIR:mkdtempSync(join(tmpdir(),'atlas-e2e-data-')),ATLAS_AGENT_RUNTIME:'extractive',
  ATLAS_SEED_DEMO:'1',STORAGE_PROVIDER:'local',VECTOR_BACKEND:'sqlite',ATLAS_JOB_RUNNER:'local',
  API_PORT:'4000',COGNITION_URL:'http://127.0.0.1:8000',ATLAS_API_URL:'http://127.0.0.1:4000',
  EVE_URL:'',ATLAS_ALLOW_LOCAL_CHATGPT:'0',MEMORY_SERVICE_URL:'',MONGODB_URI:'',
  ATLAS_CREDENTIAL_MASTER_KEY:randomBytes(32).toString('base64'),ATLAS_CREDENTIAL_MASTER_KEY_FILE:'',
  ATLAS_CREDENTIALS_FILE:'',ATLAS_AGENT_CATALOG:'',ATLAS_RATE_LIMIT_PER_MINUTE:'600'};
for(const name of ['TYPESAFE_API_KEY','FIRECRAWL_API_KEY','EMBEDDING_API_KEY','EMBEDDING_BASE_URL','EMBEDDING_MODEL','LLM_API_KEY','LLM_BASE_URL','LLM_MODEL','OPENROUTER_API_KEY','ATLAS_OPENAI_API_KEY','ANTHROPIC_API_KEY','AI_GATEWAY_API_KEY']){
  env[name]='';env[`${name}_FILE`]='';
}
const root=process.cwd();
const standalone=join(root,'apps/web/.next/standalone/apps/web');
if(!existsSync(join(standalone,'server.js'))||!existsSync('apps/api/dist/main.js'))throw new Error('Execute npm run build antes dos testes E2E de produção.');
mkdirSync(join(standalone,'.next'),{recursive:true});
cpSync('apps/web/public',join(standalone,'public'),{recursive:true});
cpSync('apps/web/.next/static',join(standalone,'.next/static'),{recursive:true});
// Exercise actual build artifacts with no watchers. All children share the
// Playwright process group so teardown reaps the complete isolated application.
const apps=[
  spawn(`${root}/.venv/bin/uvicorn`,['atlas.main:app','--host','127.0.0.1','--port','8000'],{cwd:`${root}/services/cognition`,stdio:'inherit',env}),
  spawn(process.execPath,['apps/api/dist/main.js'],{stdio:'inherit',env}),
  spawn(process.execPath,[join(standalone,'server.js')],{stdio:'inherit',env:{...env,HOSTNAME:'127.0.0.1',PORT:'3000'}}),
];
let stopping=false;
function stop(code){
  if(stopping)return;stopping=true;
  for(const app of apps)app.kill('SIGTERM');
  process.exitCode=code;
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop(0));
for(const app of apps){app.on('error',()=>stop(1));app.on('exit',code=>stop(code??1));}
