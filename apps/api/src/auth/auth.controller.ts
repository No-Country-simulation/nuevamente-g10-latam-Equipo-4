import {Controller,Get,Post,Req} from '@nestjs/common';
import type {Request} from 'express';
import {z} from 'zod';
import {accounts} from './accounts.js';

const email=z.string().trim().toLowerCase().email().max(200);
const registerSchema=z.object({name:z.string().trim().min(2).max(80),email,password:z.string().min(10).max(128)}).strict();
const loginSchema=z.object({email,password:z.string().min(1).max(128)}).strict();

@Controller('v1')
export class AuthController {

  @Post('auth/register') async register(@Req() req:Request){
    const input=registerSchema.parse(req.body);
    const {user,session}=await accounts.register(input.email,input.name,input.password);
    return {user,session_token:session.token,expires_at:session.expires_at};
  }
  @Post('auth/login') async login(@Req() req:Request){
    const input=loginSchema.parse(req.body);
    const {user,session}=await accounts.login(input.email,input.password);
    return {user,session_token:session.token,expires_at:session.expires_at};
  }
  @Post('auth/logout') logout(@Req() req:Request){
    accounts.logout(req.get('x-atlas-session'));
    return {status:'ok'};
  }
  @Get('auth/me') me(@Req() req:Request){
    const user=accounts.validate(req.get('x-atlas-session'));
    if(!user)throw Object.assign(new Error('Entre na sua conta para continuar.'),{status:401});
    return {user};
  }
}