import {NextRequest, NextResponse} from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_FILE = 10 * 1024 * 1024;
const MAX_BODY = MAX_FILE + 64 * 1024;
const routes: Record<string, RegExp[]> = {
  GET: [/^bootstrap$/, /^documents$/, /^documents\/[a-zA-Z0-9_-]+\/source$/, /^progress$/, /^groups$/, /^groups\/[a-zA-Z0-9_-]+\/messages$/, /^dreamer\/status$/],
  POST: [/^documents$/, /^generations$/, /^chat$/, /^quiz\/[a-zA-Z0-9_-]+\/attempt$/, /^groups$/, /^groups\/[a-zA-Z0-9_-]+\/messages$/, /^dreamer\/(consent|cycles|rollback)$/],
  DELETE: [/^documents\/[a-zA-Z0-9_-]+$/, /^dreamer\/memory$/]
};
async function proxy(request: NextRequest, context: {params: Promise<{path: string[]}>}) {
  const {path} = await context.params;
  if (path.some(part => !/^[a-zA-Z0-9_-]+$/.test(part))) return NextResponse.json({error:'Caminho inválido.'}, {status:400});
  const pathname = path.join('/');
  if (!routes[request.method]?.some(pattern => pattern.test(pathname))) return NextResponse.json({error:'Rota indisponível.'}, {status:404});
  const origin = request.headers.get('origin');
  if (request.method !== 'GET' && origin) {
    let sameOrigin = false;
    try {
      const parsed = new URL(origin);
      sameOrigin = parsed.origin === origin && !parsed.username && !parsed.password && parsed.host === request.headers.get('host') && parsed.protocol === request.nextUrl.protocol;
    } catch {}
    if (!sameOrigin) return NextResponse.json({error:'Origem não autorizada.'}, {status:403});
  }
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY) return NextResponse.json({error:'O arquivo deve ter até 10 MiB.'}, {status:413});
  const token = process.env.ATLAS_INTERNAL_TOKEN;
  if (!token) return NextResponse.json({error:'O serviço precisa de configuração no servidor.'}, {status:503});
  try {
    const base = new URL(process.env.ATLAS_API_URL || 'http://127.0.0.1:4000');
    if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Invalid server URL');
    const target = new URL(`/v1/${pathname}`, base);
    const headers = new Headers({'Authorization':`Bearer ${token}`, 'Accept':'application/json'});
    let body: Uint8Array | undefined;
    if (request.method !== 'GET' && request.body) {
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.length;
        if (size > MAX_BODY) {await reader.cancel(); return NextResponse.json({error:'O arquivo deve ter até 10 MiB.'}, {status:413});}
        chunks.push(chunk.value);
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {body.set(chunk, offset); offset += chunk.length;}
      const contentType = request.headers.get('content-type') || '';
      if (pathname === 'documents' ? !contentType.startsWith('multipart/form-data; boundary=') : !contentType.startsWith('application/json')) return NextResponse.json({error:'Formato de solicitação inválido.'}, {status:415});
      if (pathname === 'documents') {
        let form: FormData;
        try {form = await new Request('http://localhost', {method:'POST', headers:{'Content-Type':contentType}, body:body as BodyInit}).formData();}
        catch {return NextResponse.json({error:'O envio do arquivo está incompleto ou inválido.'}, {status:400});}
        const files = form.getAll('file');
        if (files.length !== 1 || !(files[0] instanceof File)) return NextResponse.json({error:'Selecione um único arquivo.'}, {status:400});
        if (files[0].size > MAX_FILE) return NextResponse.json({error:'O arquivo deve ter até 10 MiB.'}, {status:413});
      } else if (size > 64 * 1024) return NextResponse.json({error:'A solicitação excede o limite de tamanho.'}, {status:413});
      headers.set('Content-Type', contentType);
    }
    const response = await fetch(target, {method:request.method, headers, body: body as BodyInit | undefined, signal:AbortSignal.timeout(pathname === 'generations' || pathname === 'chat' || pathname === 'dreamer/cycles' ? 120_000 : 30_000), redirect:'error', cache:'no-store'});
    if (!response.ok) {
      const messages: Record<number,string> = {400:'Confira os dados e o formato do arquivo.',404:'O conteúdo não foi encontrado.',409:'Esta ação não está disponível no estado atual.',413:'O arquivo deve ter até 10 MiB.',415:'Use um arquivo PDF, Markdown ou TXT.',422:'Não foi possível processar este conteúdo. Confira se a fonte contém texto.',429:'O serviço está ocupado. Aguarde um instante e tente novamente.'};
      return NextResponse.json({error:messages[response.status] || 'O serviço não conseguiu concluir a solicitação. Tente novamente.'}, {status:response.status >= 500 ? 502 : response.status});
    }
    if (response.status === 204) return new NextResponse(null, {status:204});
    return new NextResponse(await response.text(), {status:response.status, headers:{'Content-Type':'application/json', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff'}});
  } catch {return NextResponse.json({error:'Não foi possível conectar ao Atlas. Verifique os serviços e tente novamente.'}, {status:502});}
}
export {proxy as GET, proxy as POST, proxy as DELETE};
