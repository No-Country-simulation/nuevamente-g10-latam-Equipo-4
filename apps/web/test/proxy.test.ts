import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {NextRequest} from 'next/server';
import {requestBody,uploadSlot,proxyFailure,ProxyError,publicResponse} from '../lib/server/proxy';

test('empty DELETE remains compatible and nonempty DELETE validates JSON content type',async()=>{
  const headers=new Headers();
  const empty=new NextRequest('http://localhost/api/atlas/documents/doc_a',{method:'DELETE',body:''});
  assert.equal(await requestBody(empty,'documents/doc_a',headers),undefined);
  const json=new NextRequest('http://localhost/api/atlas/dreamer/memory',{method:'DELETE',body:'{}',headers:{'Content-Type':'application/json'}});
  const bytes=await requestBody(json,'dreamer/memory',headers);
  assert.equal(new TextDecoder().decode(bytes as Uint8Array),'{}');
  const invalid=new NextRequest('http://localhost/api/atlas/dreamer/memory',{method:'DELETE',body:'bad',headers:{'Content-Type':'text/plain'}});
  await assert.rejects(requestBody(invalid,'dreamer/memory',new Headers()),error=>error instanceof ProxyError&&error.status===415);
});

test('upload admission rejects concurrent work and releases the slot after failure',async()=>{
  let release!:()=>void;
  const first=uploadSlot('documents',()=>new Promise<void>(resolve=>{release=resolve;}));
  let called=false;
  await assert.rejects(uploadSlot('documents',async()=>{called=true;}),error=>error instanceof ProxyError&&error.status===429);
  assert.equal(called,false);release();await first;
  await assert.rejects(uploadSlot('documents',async()=>{throw new Error('test failure');}));
  assert.equal(await uploadSlot('documents',async()=>42),42);
});

test('real Undici streaming failure preserves the local 413 instead of becoming 502',async()=>{
  const server=createServer((request,response)=>{request.on('error',()=>undefined);request.on('data',()=>undefined);request.on('end',()=>response.end('{}'));});
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const address=server.address();assert.ok(address&&typeof address!=='string');
    let remaining=81;
    const chunk=new Uint8Array(1024*1024);
    const source=new ReadableStream<Uint8Array>({pull(controller){if(remaining-- >0)controller.enqueue(chunk);else controller.close();}});
    const request=new NextRequest('http://localhost/api/atlas/documents',{method:'POST',headers:{'Content-Type':'multipart/form-data; boundary=test'},body:source,duplex:'half'});
    const headers=new Headers();const body=await requestBody(request,'documents',headers);
    await assert.rejects(fetch(`http://127.0.0.1:${address.port}`,{method:'POST',headers,body:body as BodyInit,duplex:'half'} as RequestInit),error=>{
      assert.equal(error instanceof ProxyError,false);
      assert.equal(proxyFailure(error).status,413);return true;
    });
    assert.equal(proxyFailure({status:413}).status,502,'arbitrary untrusted objects cannot forge the status');
  }finally{
    server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));
  }
});

test('public errors redact upstream details and distinguish document and form errors',async()=>{
  const failure=new Response(JSON.stringify({secret:'test-only-private-value'}),{status:401});
  await assert.rejects(publicResponse(failure),error=>{
    assert.ok(error instanceof ProxyError);assert.equal(error.status,401);
    assert.equal(error.message.includes('sessão expirou'),false);assert.equal(error.message.includes('private-value'),false);return true;
  });
  await assert.rejects(publicResponse(new Response('{}',{status:400}),'generations'),error=>error instanceof ProxyError&&!error.message.includes('PDF'));
  await assert.rejects(publicResponse(new Response('{}',{status:400}),'documents'),error=>error instanceof ProxyError&&error.message.includes('1000 páginas'));
});

test('desktop BFF requires a private capability on reads and writes and never forwards it upstream',async()=>{
  const {authorizeDesktop,requestHeaders}=await import('../lib/server/proxy');
  const before={...process.env};
  process.env.ATLAS_LOCAL_CHATGPT_PLAN='1';process.env.ATLAS_DESKTOP_CAPABILITY='test-only-desktop-capability-with-32-characters';process.env.ATLAS_INTERNAL_TOKEN='internal-test-token';
  try{
    for(const method of ['GET','POST','DELETE']){
      const denied=new NextRequest('http://127.0.0.1/api/atlas/bootstrap',{method});
      assert.throws(()=>authorizeDesktop(denied),error=>error instanceof ProxyError&&error.status===401);
      const valid:NextRequest=new NextRequest('http://127.0.0.1/api/atlas/bootstrap',{method,headers:{'x-atlas-desktop-key':process.env.ATLAS_DESKTOP_CAPABILITY}});
      assert.doesNotThrow(()=>authorizeDesktop(valid));
      assert.equal(requestHeaders(valid).has('x-atlas-desktop-key'),false);
    }
    process.env.ATLAS_DESKTOP_CAPABILITY='';assert.throws(()=>authorizeDesktop(new NextRequest('http://localhost')));
    process.env.ATLAS_LOCAL_CHATGPT_PLAN='0';assert.doesNotThrow(()=>authorizeDesktop(new NextRequest('http://localhost')));
  }finally{for(const key of Object.keys(process.env))if(!(key in before))delete process.env[key];Object.assign(process.env,before);}
});

test('known plan errors give actionable notices without echoing arbitrary upstream diagnostics',async()=>{
  for(const [status,code] of [[429,'chatgpt_limit'],[503,'chatgpt_unavailable']] as const){
    const upstream=new Response('private-test-diagnostic',{status,headers:{'X-Atlas-Error-Code':code}});
    await assert.rejects(publicResponse(upstream),error=>error instanceof ProxyError&&error.status===status&&error.message.includes('ChatGPT')&&!error.message.includes('private-test'));
  }
  await assert.rejects(publicResponse(new Response('private-test-diagnostic',{status:429,headers:{'X-Atlas-Error-Code':'invented-code'}})),error=>error instanceof ProxyError&&!error.message.includes('private-test'));
});

test('quarantined legacy material has an actionable safe notice instead of a generic server failure',async()=>{
  await assert.rejects(publicResponse(new Response('private-legacy-context',{status:409,headers:{'X-Atlas-Error-Code':'source_reconciliation_required'}})),error=>error instanceof ProxyError&&error.status===409&&error.message.includes('quarentena')&&!error.message.includes('private-legacy-context'));
});
