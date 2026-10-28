import {Controller,Get,Post,Param,Req} from '@nestjs/common';
import type {Request} from 'express';
import {z} from 'zod';
import {cognition,brains} from '../context.js';
import {generationSchema} from '../policy.js';

const trailSchema=generationSchema.pick({document_ids:true,goal:true,profile:true,agent_id:true}).strict();
const empty=z.object({}).strict();

@Controller('v1/trails')
export class TrailsController {
  @Get() list(){return cognition('trails');}
  @Get(':id') get(@Param('id') id:string){return cognition(`trails/${encodeURIComponent(id)}`);}
  @Post() create(@Req() req:Request){return cognition('trails','POST',trailSchema.parse(req.body));}
  @Post(':id/steps/:step/generate') async generate(@Param('id') id:string,@Param('step') step:string,@Req() req:Request){
    empty.parse(req.body);
    const path=`trails/${encodeURIComponent(id)}/steps/${encodeURIComponent(step)}`;
    const trail=await this.get(id);
    const existing=trail.steps.find((item:{id:string})=>item.id===step)?.package_id;
    if(existing)return {trail,package:await cognition(`packages/${encodeURIComponent(existing)}`)};
    const input=generationSchema.parse(await cognition(`${path}/input`));
    const material=await brains.respond('generate',input);
    if(material.status!=='ready')return {trail,package:material};
    return {trail:await cognition(`${path}/material`,'POST',{package_id:material.id}),package:material};
  }
  @Post(':id/steps/:step/complete') complete(@Param('id') id:string,@Param('step') step:string,@Req() req:Request){
    empty.parse(req.body);
    return cognition(`trails/${encodeURIComponent(id)}/steps/${encodeURIComponent(step)}/complete`,'POST',{});
  }
}
