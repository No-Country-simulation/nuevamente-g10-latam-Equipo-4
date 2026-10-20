import {eveChannel} from 'eve/channels/eve';
import type {AuthFn} from 'eve/channels/auth';
import {verifyTicket} from '../../src/orchestration/tickets.js';
const service:AuthFn<Request>=request=>{
  const secret=process.env.EVE_SERVICE_TOKEN||process.env.ATLAS_INTERNAL_TOKEN||'';
  const bearer=request.headers.get('authorization')||'';
  if(!bearer.startsWith('Bearer '))return null;
  try {
    const ticket=bearer.slice(7);const grant=verifyTicket(ticket,secret);
    if(grant.tenant!==(process.env.ATLAS_TENANT_ID||'local-workspace'))return null;
    return {authenticator:'atlas-factory',principalId:`atlas-brain:${grant.agent}`,principalType:'service',attributes:{tenant:grant.tenant,agent:grant.agent,purpose:grant.purpose,ticket}};
  }catch{return null;}
};
export default eveChannel({auth:[service]});
