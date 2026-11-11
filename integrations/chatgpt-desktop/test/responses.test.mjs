import {test} from 'node:test';
import assert from 'node:assert/strict';
import {streamResponse} from '../devkit/packages/local/dist/responses.js';
test('patched official Responses adapter forwards cap/JSON/store:false and rejects incomplete SSE',async()=>{
  const original=globalThis.fetch;let completed=true,calls=0;
  globalThis.fetch=async(resource,init)=>{
    const request=new Request(resource,init);
    calls++;assert.equal(request.url,'https://api.openai.com/v1/responses');assert.equal(request.headers.get('authorization'),'Bearer synthetic-oauth-token');
    const body=await request.json();assert.equal(body.max_output_tokens,2500);assert.deepEqual(body.text,{format:{type:'json_object'}});assert.equal(body.store,false);assert.equal(body.stream,true);
    const events=[{type:'response.output_text.delta',delta:'{"ok":true}'},{type:completed?'response.completed':'response.incomplete',response:{}}];
    return new Response(events.map(event=>'data: '+JSON.stringify(event)+'\n\n').join(''),{headers:{'content-type':'text/event-stream'}});
  };
  try{
    const options={model:'synthetic-model',input:'Return JSON',maxOutputTokens:2500,responseFormat:{type:'json_object'}};
    assert.deepEqual(await streamResponse('synthetic-oauth-token',options,new AbortController().signal),{text:'{"ok":true}'});
    completed=false;await assert.rejects(streamResponse('synthetic-oauth-token',options,new AbortController().signal));assert.equal(calls,2);
  }finally{globalThis.fetch=original;}
});
