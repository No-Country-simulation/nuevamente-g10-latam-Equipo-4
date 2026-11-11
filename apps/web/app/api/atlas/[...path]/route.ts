import {NextRequest,NextResponse} from 'next/server';
import {routes,ProxyError,authorizeDesktop,authorizeOrigin,targetURL,requestHeaders,requestBody,timeout,publicResponse,uploadSlot,proxyFailure,authResponse} from '@/lib/server/proxy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function proxy(request:NextRequest,context:{params:Promise<{path:string[]}>}){
  try{
    authorizeDesktop(request);
    const {path}=await context.params;
    if(path.some(part=>!/^[a-zA-Z0-9_-]+$/.test(part)))throw new ProxyError(400,'Caminho inválido.');
    const pathname=path.join('/');
    if(!routes[request.method]?.some(pattern=>pattern.test(pathname)))throw new ProxyError(404,'Rota indisponível.');
    authorizeOrigin(request);
    return await uploadSlot(request.method==='POST'?pathname:'',async()=>{
      const headers=requestHeaders(request);
      const body=await requestBody(request,pathname,headers);
      const response=await fetch(targetURL(pathname),{method:request.method,headers,body:body as BodyInit|undefined,...(body instanceof ReadableStream?{duplex:'half' as const}:{}),signal:AbortSignal.timeout(timeout(pathname)),redirect:'error',cache:'no-store'});
      return await (['auth/register','auth/login','auth/logout'].includes(pathname)?authResponse(response,request,pathname):publicResponse(response,pathname));
    });
  }catch(error){
    const failure=proxyFailure(error);
    return NextResponse.json({error:failure.message},{status:failure.status});
  }
}
export {proxy as GET,proxy as POST,proxy as DELETE};
