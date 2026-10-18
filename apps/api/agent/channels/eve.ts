import {timingSafeEqual} from 'node:crypto';
import {eveChannel} from 'eve/channels/eve';
import type {AuthFn} from 'eve/channels/auth';
const service: AuthFn<Request> = request => {
  const secret=process.env.EVE_SERVICE_TOKEN || process.env.ATLAS_INTERNAL_TOKEN;
  if(!secret)return null;
  const actual=Buffer.from(request.headers.get('authorization')||'');
  const expected=Buffer.from(`Bearer ${secret}`);
  if(actual.length!==expected.length || !timingSafeEqual(actual,expected))return null;
  return {authenticator:'atlas-service',principalId:'atlas-local-backend',principalType:'service',attributes:{scope:'local-workspace'}};
};
export default eveChannel({auth:[service]});
