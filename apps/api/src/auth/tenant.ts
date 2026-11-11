import {AsyncLocalStorage} from 'node:async_hooks';

/** Guarda "de quem é esta requisição" enquanto ela está sendo processada (sem passar parâmetro pra todo lado). */
export const tenantStore=new AsyncLocalStorage<string>();

/** Formato aceito de espaço: usuário (usr_ + 20 hex) ou o workspace local. Evita nomes estranhos virarem pasta/chave. */
export const tenantFormat=/^(usr_[a-f0-9]{20}|local-workspace)$/;

/** Lido na hora (não no import) porque o .env só é carregado depois. */
export const currentTenant=():string=>tenantStore.getStore()??(process.env.ATLAS_TENANT_ID||'local-workspace');