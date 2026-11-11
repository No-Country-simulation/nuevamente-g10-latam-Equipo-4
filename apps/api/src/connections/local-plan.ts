export function localPlan() {
  return process.env.ATLAS_LOCAL_CHATGPT_PLAN === '1';
}

function isLocalURL(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' && url.hostname === '127.0.0.1' &&
      !!url.port && url.pathname === '/v1' && !url.username && !url.password &&
      !url.search && !url.hash;
  } catch {return false;}
}
export function requireLocalBroker() {
  if (process.env.ATLAS_AGENT_RUNTIME !== 'direct' || !isLocalURL(process.env.LLM_BASE_URL || ''))
    throw Object.assign(new Error('O modo ChatGPT local requer a ponte privada do aplicativo desktop.'), {status: 503});
}

export function requireEditable(slot: string) {
  if (localPlan() && slot === 'generation')
    throw Object.assign(new Error('Gerencie a conta e o modelo ChatGPT no aplicativo desktop. A geração não troca para chaves de API neste modo.'), {status: 409});
}
