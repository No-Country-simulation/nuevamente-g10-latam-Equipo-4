import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,rmSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {boundaryViolations} from './boundaries.mjs';
import {matchBaseline} from './ratchet.mjs';

const root=process.cwd();
const policy=JSON.parse(readFileSync('docs/quality/policy.json','utf8'));
const engine=resolve(process.env.ATLAS_QUALITY_ENGINE||'.quality-tools/engine');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024});
const actual=execFileSync('git',['rev-parse','HEAD'],{cwd:engine,encoding:'utf8'}).trim();
if(actual!==policy.qualityEngineRevision)throw new Error('Quality Engine revision differs from reviewed policy.');
const {measure}=await import(pathToFileURL(join(engine,'src/adapters/eslint-metrics.ts')).href);
const {dependencyEdges}=await import(pathToFileURL(join(engine,'src/adapters/depgraph.ts')).href);
const {evaluateCycles}=await import(pathToFileURL(join(engine,'src/domain/graph.ts')).href);
const {default:ts}=await import(pathToFileURL(join(engine,'node_modules/typescript/lib/typescript.js')).href);
const paths=execFileSync('rg',['--files','apps/api/src','apps/api/agent','apps/web/lib','apps/web/components','apps/web/app'],{encoding:'utf8'}).trim().split('\n').filter(path=>/\.(tsx?|mjs)$/.test(path));
const basePaths=git('ls-tree','-r','--name-only',policy.base,'apps/api/src','apps/api/agent','apps/web/lib','apps/web/components','apps/web/app').trim().split('\n').filter(path=>/\.(tsx?|mjs)$/.test(path));
const current=await measure(paths.map(path=>({path,text:readFileSync(path,'utf8')})));
const baseline=await measure(basePaths.map(path=>({path,text:git('show',`${policy.base}:${path}`)})));
const python=JSON.parse(execFileSync('.venv-quality/bin/python',['scripts/quality/python_metrics.py',policy.base],{encoding:'utf8',maxBuffer:16*1024*1024}));
const findings=[];
function compare(items,previous,language){
  const matches=matchBaseline(items,previous);
  return items.map(item=>{
    const old=matches.get(item);
    for(const [metric,max] of [['cyclomatic',policy.cyclomaticMax],['cognitive',policy.cognitiveMax]]){
      if(item[metric]===undefined||item[metric]<=max)continue;
      const worsened=!old||item[metric]>old[metric];
      findings.push({language,file:item.file,name:item.name,line:item.line,metric,value:item[metric],baseline:old?.[metric]??null,status:worsened?'FAIL':'LEGACY_DEBT'});
    }
    return {...item,baselineCyclomatic:old?.cyclomatic??null};
  });
}
const symbols=[...compare(current.snapshot.symbols,baseline.snapshot.symbols,'typescript'),...compare(python.current,python.baseline,'python')];
const temp=mkdtempSync(join(tmpdir(),'atlas-quality-base-'));
let architecture;
try{
  const archive=execFileSync('git',['archive',policy.base,'apps/api/src','apps/api/agent','apps/api/tsconfig.json','apps/web/app','apps/web/lib','apps/web/components','apps/web/tsconfig.json','packages/contracts'],{maxBuffer:32*1024*1024});
  execFileSync('tar',['-x','-C',temp],{input:archive});
  async function graph(folder){
    const result=[];let unresolved=0;
    for(const [workspace,sources] of [['apps/api',['src','agent']],['apps/web',['app','lib','components']]]){
      const measured=await dependencyEdges(join(folder,workspace),sources,['node_modules','\\.next','\\.eve','\\.output']);
      unresolved+=measured.unresolved;
      result.push(...measured.edges.map(edge=>({...edge,from:`${workspace}/${edge.from}`,to:edge.to.startsWith('npm:')?edge.to:`${workspace}/${edge.to}`})));
    }
    return {edges:result,unresolved};
  }
  const before=await graph(temp),after=await graph(root);
  architecture={...evaluateCycles(before.edges,after.edges,new Map()),unresolved:after.unresolved,edges:after.edges.length};
}finally{rmSync(temp,{recursive:true,force:true});}
// Relative cross-service imports and client-to-server SDK access are checked separately from complexity.
const boundaryFailures=[];
for(const item of paths){
  const source=readFileSync(item,'utf8');
  boundaryFailures.push(...boundaryViolations(ts,item,source));
}
const evidenceFiles=git('ls-files','--cached','--others','--exclude-standard').trim().split('\n').filter(path=>/^(apps\/|services\/|packages\/|infra\/|scripts\/|tests\/|\.github\/|\.env\.example$|package(?:-lock)?\.json$|playwright\.config\.ts$)/.test(path)).sort();
const sourceHash=createHash('sha256');
for(const path of evidenceFiles)sourceHash.update(path+'\0').update(readFileSync(path)).update('\0');
const report={createdAt:new Date().toISOString(),base:policy.base,candidate:git('rev-parse','HEAD').trim(),scope:'working tree; not release or human approval',
  sourceDigest:sourceHash.digest('hex'),evidenceFiles,
  policyDigest:createHash('sha256').update(JSON.stringify(policy)).digest('hex'),engineRevision:actual,
  algorithms:{typescript:current.snapshot.algorithmId,python:python.algorithm},parseErrors:current.parseErrors,
  findings,architecture,boundaryFailures,symbols,
  decision:findings.some(item=>item.status==='FAIL')||current.parseErrors.length||architecture.status!=='PASS'||architecture.unresolved||boundaryFailures.length?'FAIL':'PASS',
  notExecuted:['human policy approval','remote CI/release assessment','SAST/SBOM','mutation testing','pedagogical efficacy']};
mkdirSync('artifacts/quality',{recursive:true});writeFileSync('artifacts/quality/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({decision:report.decision,measuredSymbols:symbols.length,architecture,findings},null,2));
process.exitCode=report.decision==='PASS'?0:1;
