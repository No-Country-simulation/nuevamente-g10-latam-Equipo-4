import {Controller,Get,Post,Req} from '@nestjs/common';
import type {Request} from 'express';
import {z} from 'zod';
import {Client} from 'eve/client';
import {evaluateEvidence} from '../policy.js';
import {actions,control,brains,factory} from '../context.js';

@Controller('v1')
export class InternalController {
  @Post('web/search') async search(@Req() req:Request){return actions.invoke('atlas.web-search',req.body,control);}
  @Get('orchestration') async orchestration(){return {brains:brains.catalog(),engines:actions.catalog(),factory:factory.catalog()};}
  @Post('internal/judge') async review(@Req() req:Request){return actions.invoke('atlas.judge',req.body,control);}
  @Post('internal/evidence') async evidence(@Req() req:Request){
    const input=z.object({question:z.string().max(2000),passages:z.array(z.object({id:z.string().max(100),text:z.string().max(2000)}).strict()).min(1).max(6)}).strict().parse(req.body);
    return evaluateEvidence(input.question,input.passages);
  }
  @Post('internal/generate') async eveGenerate(@Req() req:Request){
    if(!process.env.EVE_URL)throw Object.assign(new Error('Runtime Eve não configurado.'),{status:503});
    return factory.run(req.body);
  }
  @Post('internal/agent-tool') async agentTool(@Req() req:Request){
    return factory.invokeTool((req.headers.authorization||'').replace(/^Bearer /,''),req.body);
  }
  @Get('integrations/eve') async eve(){
    if(!process.env.EVE_URL)return {status:'not_configured',reason:'Runtime Eve externo ou sob demanda. Credenciais e provedor ainda não configurados.'};
    const client=new Client({host:process.env.EVE_URL,redirect:'error'});
    return {status:'connected',health:await client.health()};
  }}
