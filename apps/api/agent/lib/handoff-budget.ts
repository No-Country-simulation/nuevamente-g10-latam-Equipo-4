import type {WorkflowStepToolContext} from 'eve/tools';
export async function reserveHandoffs(count:number,ctx:WorkflowStepToolContext){
  "use step";
  const ticket=ctx.session.auth.current?.attributes.ticket;
  if(typeof ticket!=='string')throw new Error('Delegação sem autorização.');
  const response=await fetch((process.env.ATLAS_API_URL||'http://127.0.0.1:4000')+'/v1/internal/agent-tool',{method:'POST',headers:{Authorization:`Bearer ${ticket}`,'content-type':'application/json'},body:JSON.stringify({capability:'atlas.handoff.reserve',input:{count}}),redirect:'error',signal:AbortSignal.timeout(5000)});
  if(!response.ok)throw new Error('Delegação não autorizada ou limite de três handoffs atingido.');
}
