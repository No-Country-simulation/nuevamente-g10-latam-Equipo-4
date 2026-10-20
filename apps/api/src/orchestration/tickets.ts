import {createHmac,randomUUID,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
const claimsSchema=z.object({id:z.string().uuid(),tenant:z.string().min(1).max(100),agent:z.enum(['nilo','lumi','prisma','fio','soma']),purpose:z.enum(['learning','dreamer_replay','dreamer_policy']),expires:z.number().int(),capabilities:z.array(z.literal('atlas.web-search')).max(1)}).strict();
export type AgentGrant=z.infer<typeof claimsSchema>;
function signature(data:string,secret:string){return createHmac('sha256',secret).update(data).digest('base64url');}
export function issueTicket(claims:Omit<AgentGrant,'id'|'expires'>,secret:string,time=Date.now()) {
  if(secret.length<24)throw new Error('Configure um token Eve com pelo menos 24 caracteres.');
  const grant=claimsSchema.parse({...claims,id:randomUUID(),expires:time+180000});
  const data=Buffer.from(JSON.stringify(grant)).toString('base64url');
  return {ticket:`${data}.${signature(data,secret)}`,grant};
}
export function verifyTicket(ticket:string,secret:string,time=Date.now()):AgentGrant {
  try {
    if(secret.length<24||ticket.length>2048)throw new Error();
    const parts=ticket.split('.');if(parts.length!==2)throw new Error();
    const [data,received]=parts as [string,string];
    const actual=Buffer.from(received);const expected=Buffer.from(signature(data,secret));
    if(actual.length!==expected.length||!timingSafeEqual(actual,expected))throw new Error();
    const grant=claimsSchema.parse(JSON.parse(Buffer.from(data,'base64url').toString()));
    if(grant.expires<=time||grant.expires>time+180000)throw new Error();
    return grant;
  }catch{throw Object.assign(new Error('Ticket de agente inválido ou expirado.'),{status:403});}
}
