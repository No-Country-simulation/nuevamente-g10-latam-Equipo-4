import {Controller,Get,Post,Req,Param} from '@nestjs/common';
import type {Request} from 'express';
import {z} from 'zod';
import {cognition} from '../context.js';

@Controller('v1')
export class CommunityController {
  @Get('groups') async groups(){return cognition('groups');}
  @Post('groups') async group(@Req() req:Request){return cognition('groups','POST',z.object({name:z.string().trim().min(2).max(60),topic:z.string().trim().min(3).max(200)}).strict().parse(req.body));}
  @Get('groups/:id/messages') async messages(@Param('id') id:string){return cognition(`groups/${encodeURIComponent(id)}/messages`);}
  @Post('groups/:id/messages') async message(@Param('id') id:string,@Req() req:Request){return cognition(`groups/${encodeURIComponent(id)}/messages`,'POST',z.object({text:z.string().trim().min(1).max(2000)}).strict().parse(req.body));}
}
