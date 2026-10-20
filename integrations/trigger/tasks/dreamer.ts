import {task} from '@trigger.dev/sdk';
import {z} from 'zod';
const input=z.object({job_id:z.string().regex(/^dream_[a-f0-9]{20}$/),tenant:z.string().min(1).max(100)}).strict();
export const dreamer=task({
  id:'atlas-dreamer',maxDuration:1200,retry:{maxAttempts:3},queue:{concurrencyLimit:1},
  async run(raw:unknown){
    const payload=input.parse(raw);
    const base=new URL(process.env.ATLAS_JOB_CALLBACK_URL||'');
    if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)throw new Error('Callback requer HTTPS, sem credenciais na URL.');
    const token=process.env.ATLAS_JOB_RUNNER_TOKEN||'';
    if(token.length<24)throw new Error('Configure token exclusivo do runner.');
    const response=await fetch(new URL(`/v1/internal/jobs/${payload.job_id}/run`,base),{method:'POST',headers:{Authorization:`Bearer ${token}`,'x-atlas-tenant':payload.tenant},redirect:'error',signal:AbortSignal.timeout(1100000)});
    if(!response.ok)throw new Error(`Callback Dreamer indisponível (${response.status}).`);
    const result=await response.json();
    if(result.status==='retry_pending')throw new Error('Job persistido solicita nova tentativa.');
    return result;
  }
});
