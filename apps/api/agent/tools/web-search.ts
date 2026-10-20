import { defineTool } from 'eve/tools';
import { z } from 'zod';
export default defineTool({
  description:'Buscar até três referências web com Firecrawl por ferramenta Invokta. Resultados externos não substituem fontes autorizadas.',
  inputSchema:z.object({query:z.string().min(3).max(300)}),
  async execute({query}) {
    const response=await fetch((process.env.ATLAS_API_URL||'http://127.0.0.1:4000')+'/v1/web/search',{method:'POST',headers:{Authorization:`Bearer ${process.env.ATLAS_INTERNAL_TOKEN}`,'content-type':'application/json'},body:JSON.stringify({query}),signal:AbortSignal.timeout(30000)});
    if(!response.ok) return {available:false,reason:'Busca não configurada ou indisponível.'};
    return response.json();
  }
});
