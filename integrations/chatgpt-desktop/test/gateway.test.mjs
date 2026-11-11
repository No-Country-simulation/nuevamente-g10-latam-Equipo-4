import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGateway} from '../src/gateway.mjs';
const input={model:'test-model',messages:[{role:'system',content:'Return JSON'},{role:'user',content:'Study only this source'}],max_tokens:2500,response_format:{type:'json_object'}};
function fixture(){
  let calls=0,state={status:'connected',sharing:true,profileId:'test-profile'};
  const client={getSession:async()=>state,streamResponse:async options=>{calls++;assert.equal(options.maxOutputTokens,2500);assert.deepEqual(options.responseFormat,{type:'json_object'});assert.equal(options.input[0].role,'developer');return {text:'{"title":"Valid"}'};}};
  return {client,calls:()=>calls,setState:value=>{state=value;}};
}
async function post(gateway,payload=input,headers={}){return fetch(gateway.baseURL+'/chat/completions',{method:'POST',headers:{Authorization:'Bearer '+gateway.key,'Content-Type':'application/json',...headers},body:JSON.stringify(payload)});}

test('gateway denies unauthorized, browser, foreign profile and non-sharing calls before inference',async()=>{
  const f=fixture(),gateway=await createGateway(f.client,'test-model','test-profile');
  try{
    assert.equal((await post(gateway,input,{Authorization:'Bearer invalid'})).status,401);
    assert.equal((await post(gateway,input,{Origin:'http://127.0.0.1'})).status,401);
    f.setState({status:'connected',sharing:true,profileId:'foreign'});assert.equal((await post(gateway)).status,403);
    f.setState({status:'connected',sharing:false,profileId:'test-profile'});assert.equal((await post(gateway)).status,403);
    assert.equal(f.calls(),0);
  }finally{await gateway.close();}
});
test('valid request carries output budget/JSON; invalid models, tools, limits and malformed JSON never publish',async()=>{
  const f=fixture(),gateway=await createGateway(f.client,'test-model','test-profile');
  try{
    for(const patch of [{model:'other'},{max_tokens:2501},{tools:[{}]},{stream:true},{response_format:{type:'text'}},{messages:[]}])assert.equal((await post(gateway,{...input,...patch})).status,400);
    const response=await post(gateway);assert.equal(response.status,200);assert.deepEqual(JSON.parse((await response.json()).choices[0].message.content),{title:'Valid'});assert.equal(f.calls(),1);
    f.client.streamResponse=async()=>({text:'partial JSON'});assert.equal((await post(gateway)).status,502);
  }finally{await gateway.close();await gateway.close();}
});
test('concurrency and provider 429 do not retry or use a paid fallback; errors redact sensitive details',async()=>{
  const f=fixture();let release,started;
  const beginning=new Promise(resolve=>{started=resolve;});
  f.client.streamResponse=()=>{started();return new Promise(resolve=>{release=resolve;});};
  const gateway=await createGateway(f.client,'test-model','test-profile');
  try{
    const first=post(gateway);await beginning;assert.equal((await post(gateway)).status,429);release({text:'{}'});assert.equal((await first).status,200);
    let calls=0;f.client.streamResponse=async()=>{calls++;throw Object.assign(new Error('test-only-secret'),{status:429});};
    const limited=await post(gateway);assert.equal(limited.status,429);assert.equal(calls,1);assert.match(await limited.text(),/não houve troca/);
    f.client.streamResponse=async()=>{throw new Error('test-only-secret');};
    const error=await post(gateway);assert.equal(error.status,503);assert.doesNotMatch(await error.text(),/test-only-secret/);
  }finally{await gateway.close();}
});
