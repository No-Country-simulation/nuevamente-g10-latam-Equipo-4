import {Controller,Get,Post,Delete,Req,Param} from '@nestjs/common';
import type {Request} from 'express';
import {z} from 'zod';
import {factory} from '../context.js';
import {probeConnection} from '../connections/probe.js';
import {publicConnections,saveConnection,removeConnection,slots} from '../connections/vault.js';

@Controller('v1')
export class ConnectionsController {
  @Get('connections') connections(){return publicConnections();}
  @Post('connections/:slot/test') testConnection(@Param('slot') raw:string){return probeConnection(z.enum(slots).parse(raw));}
  @Post('connections/:slot') saveConnection(@Param('slot') raw:string,@Req() req:Request){
    if(factory.isBusy())throw Object.assign(new Error('Aguarde o agente terminar antes de trocar credenciais.'),{status:409});
    return saveConnection(z.enum(slots).parse(raw),req.body);
  }
  @Delete('connections/:slot') deleteConnection(@Param('slot') raw:string){
    if(factory.isBusy())throw Object.assign(new Error('Aguarde o agente terminar antes de trocar credenciais.'),{status:409});
    return removeConnection(z.enum(slots).parse(raw));
  }
}
