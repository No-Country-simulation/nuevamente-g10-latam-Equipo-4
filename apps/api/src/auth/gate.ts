import type {Request,Response,NextFunction} from 'express';
import {accounts} from './accounts.js';
import {tenantStore,tenantFormat} from './tenant.js';

/** Rotas que funcionam sem estar logado. */
const open = ['/v1/auth/register', '/v1/auth/login', '/v1/auth/logout', '/v1/auth/me', '/v1/health', '/v1/internal/agent-tool'];
const admins=()=>(process.env.ATLAS_ADMIN_EMAILS||'').split(',').map(item=>item.trim().toLowerCase()).filter(Boolean);

/**
 * Só liga com ATLAS_REQUIRE_LOGIN=1 (modo local e testes continuam iguais).
 * 1) Chamadas internas (/v1/internal/*) vêm do Python/Eve com o token interno: usam o espaço do header x-atlas-tenant.
 * 2) Chamadas do navegador exigem sessão: o espaço passa a ser o id do usuário logado.
 */
export function sessionGate(req: Request, res: Response, next: NextFunction): void {
  if (process.env.ATLAS_REQUIRE_LOGIN !== '1' || open.includes(req.path)) {
    next();
    return;
  }

  // Intercepta rotas internas restantes (ex: judge, generate, evidence)
  if (req.path.startsWith('/v1/internal/')) {
    const authHeader = req.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const internalToken = process.env.ATLAS_INTERNAL_TOKEN;

    if (!internalToken || token !== internalToken) {
      res.status(401).json({ message: 'Token interno inválido ou ausente.' });
      return;
    }

const headerTenant = req.headers['x-atlas-tenant'];
    const tenant = (typeof headerTenant === 'string' && headerTenant.trim()) 
      ? headerTenant.trim() 
      : 'local-workspace';

    // Correção: usar .test() em vez de chamar tenantFormat como função
    if (!tenantFormat.test(tenant)) {
      res.status(400).json({ message: 'Formato de tenant inválido.' });
      return;
    }

    tenantStore.run(tenant, () => next());
    return;
  }

  const user=accounts.validate(req.get('x-atlas-session'));
  if(!user){res.status(401).json({message:'Entre na sua conta para continuar.'});return;}
  // Chaves de IA são do servidor: só quem está em ATLAS_ADMIN_EMAILS mexe nelas.
  if(req.path.startsWith('/v1/connections')&&!admins().includes(user.email)){res.status(403).json({message:'Somente administradores.'});return;}
  tenantStore.run(user.id,()=>next());
}