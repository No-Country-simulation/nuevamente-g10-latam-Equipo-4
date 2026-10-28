import {NextRequest,NextResponse} from 'next/server';
import {routes,ProxyError,authorizeOrigin,targetURL,requestHeaders,requestBody,timeout,publicResponse} from '@/lib/server/proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function proxy(request:NextRequest,context:{params:Promise<{path:string[]}>}){
  try{
    const {path}=await context.params;
    if(path.some(part=>!/^[a-zA-Z0-9_-]+$/.test(part)))throw new ProxyError(400,'Caminho inválido.');
    const pathname=path.join('/');
    if(!routes[request.method]?.some(pattern=>pattern.test(pathname)))throw new ProxyError(404,'Rota indisponível.');
    authorizeOrigin(request);
    const headers=requestHeaders(request);
    const body=await requestBody(request,pathname,headers);
    const response=await fetch(targetURL(pathname),{method:request.method,headers,body:body as BodyInit|undefined,signal:AbortSignal.timeout(timeout(pathname)),redirect:'error',cache:'no-store'});
    return await publicResponse(response);
  }catch(error){
    const failure=error instanceof ProxyError?error:new ProxyError(502,'Não foi possível conectar ao Atlas. Verifique os serviços e tente novamente.');
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
}
export {proxy as GET,proxy as POST,proxy as DELETE};
