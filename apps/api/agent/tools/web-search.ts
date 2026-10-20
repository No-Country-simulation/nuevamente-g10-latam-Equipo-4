import {defineTool} from 'eve/tools';
import {z} from 'zod';
export default defineTool({
  description:'Pesquisar até três referências web via Action Engine Invokta. Somente uma busca por execução; não substitui as evidências documentais.',
  inputSchema:z.object({query:z.string().min(3).max(300)}).strict(),
  async execute(input,ctx){
    const ticket=ctx.session.auth.current?.attributes.ticket;
    if(typeof ticket!=='string')return {available:false,reason:'Execução sem autorização de pesquisa.'};
    const response=await fetch((process.env.ATLAS_API_URL||'http://127.0.0.1:4000')+'/v1/internal/agent-tool',{method:'POST',headers:{Authorization:`Bearer ${ticket}`,'content-type':'application/json'},body:JSON.stringify({capability:'atlas.web-search',input}),redirect:'error',signal:AbortSignal.timeout(30000)});
    if(!response.ok)return {available:false,reason:'Busca não autorizada, não configurada ou orçamento esgotado.'};
    return response.json();
  }
});
