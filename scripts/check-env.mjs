import {readFileSync} from 'node:fs';
import {sourceFiles} from './source-files.mjs';
const roots=['apps/api/src','apps/api/agent','apps/web/lib','apps/web/app','services/cognition/atlas','integrations/trigger/tasks','integrations/trigger/trigger.config.ts','scripts'];
const files=roots.flatMap(sourceFiles).sort();
const names=new Set();
const patterns=[/process\.env\.([A-Z][A-Z_0-9]+)/g,/process\.env\[['"]([A-Z][A-Z_0-9]+)['"]/g,/os\.(?:getenv|environ\.get)\(['"]([A-Z][A-Z_0-9]+)['"]/g,/os\.environ\[['"]([A-Z][A-Z_0-9]+)['"]/g];
for(const file of files)for(const pattern of patterns)for(const match of readFileSync(file,'utf8').matchAll(pattern))names.add(match[1]);
const declared=new Set([...readFileSync('.env.example','utf8').matchAll(/^([A-Z][A-Z_0-9]+)=/gm)].map(match=>match[1]));
const requiredFiles=['AI_GATEWAY_API_KEY','OPENROUTER_API_KEY','ATLAS_OPENAI_API_KEY','ANTHROPIC_API_KEY','TYPESAFE_API_KEY','FIRECRAWL_API_KEY','LLM_API_KEY','EMBEDDING_API_KEY','ATLAS_CREDENTIAL_MASTER_KEY'];
for(const key of requiredFiles)names.add(`${key}_FILE`);
const missing=[...names].filter(name=>!declared.has(name));
if(missing.length){console.error('Missing .env.example declarations:',missing);process.exitCode=1;}
else console.log(`Environment contract: ${names.size} references/secret-file variants documented; no values read.`);
