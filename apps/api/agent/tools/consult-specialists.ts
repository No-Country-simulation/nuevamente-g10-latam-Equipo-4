import {defineWorkflowTool} from 'eve/tools';
import {z} from 'zod';
import {reserveHandoffs} from '../lib/handoff-budget.js';
export default defineWorkflowTool({
  description:'Consultar Faísca, Prisma, Trama ou Elo sequencialmente, até três handoffs por sessão. Encaminhe somente evidências autorizadas. Não pode alterar permissões ou substituir judge.',
  inputSchema:z.object({agents:z.array(z.enum(['lumi','prisma','fio','soma'])).min(1).max(3),question:z.string().min(3).max(2000),evidence:z.string().max(18000)}).strict(),
  async execute(input,ctx){
    "use workflow";
    await reserveHandoffs(input.agents.length,ctx);
    const replies=[];
    for(const agent of input.agents){
      const response=await ctx.agent(agent).send(JSON.stringify({question:input.question,authorized_evidence:input.evidence}));
      const reply=await response.result();
      replies.push({agent,reply});
    }
    return {replies};
  }
});
