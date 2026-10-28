import {Controller,Get,Post,Delete,Req} from '@nestjs/common';
import type {Request} from 'express';
import {actions,control} from '../context.js';

@Controller('v1')
export class MemoryController {
  @Get('dreamer/status') async memory(){return actions.invoke('atlas.memory.status',{},control);}
  @Post('dreamer/consent') async consent(@Req() req:Request){return actions.invoke('atlas.memory.consent',req.body,control);}
  @Post('dreamer/cycles') async cycle(){return actions.invoke('atlas.memory.cycle',{},control);}
  @Post('dreamer/rollback') async rollback(@Req() req:Request){return actions.invoke('atlas.memory.rollback',req.body,control);}
  @Delete('dreamer/memory') async forget(){
    return actions.invoke('atlas.memory.forget',{},control);
  }
}
