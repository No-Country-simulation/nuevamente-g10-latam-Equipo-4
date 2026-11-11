import type {Request,Response,NextFunction} from 'express';
import {accounts} from './accounts.js';
import {tenantStore,tenantFormat} from './tenant.js';

const open = ['/v1/auth/register', '/v1/auth/login', '/v1/auth/logout', '/v1/auth/me', '/v1/health', '/v1/internal/agent-tool'];

function internalGate(req:Request,res:Response,next:NextFunction):void {
  const token=(req.get('authorization')||'').replace(/^Bearer\s+/i, '').trim();
  if(!process.env.ATLAS_INTERNAL_TOKEN||token!==process.env.ATLAS_INTERNAL_TOKEN){
    res.status(401).json({message:'Token interno inválido ou ausente.'});return;
  }
  const header=req.headers['x-atlas-tenant'];
  const tenant=typeof header==='string'&&header.trim()?header.trim():'local-workspace';
  if(!tenantFormat.test(tenant)){
    res.status(400).json({message:'Formato de tenant inválido.'});return;
  }
  tenantStore.run(tenant,next);
}

/** The session determines the workspace; internal requests use an authenticated service token. */
export function sessionGate(req:Request,res:Response,next:NextFunction):void {
  const path=req.path.toLowerCase();
  if(process.env.ATLAS_REQUIRE_LOGIN!=='1'||open.includes(path)){next();return;}
  if(path.startsWith('/v1/internal/')){internalGate(req,res,next);return;}
  const user=accounts.validate(req.get('x-atlas-session'));
  if(!user){res.status(401).json({message:'Entre na sua conta para continuar.'});return;}
  if((path==='/v1/connections'||path.startsWith('/v1/connections/'))&&!accounts.isAdmin(user.id)){
    res.status(403).json({message:'Somente administradores.'});return;
  }
  tenantStore.run(user.id,next);
}
