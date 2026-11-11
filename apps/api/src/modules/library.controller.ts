import {Controller,Get,Post,Param,UseInterceptors,UploadedFile,UseGuards,Injectable,Req,type CanActivate,type ExecutionContext} from '@nestjs/common';
import {diskStorage} from 'multer';
import type {Request} from 'express';
import {UploadAdmission} from '../upload-admission.js';
import {randomUUID} from 'node:crypto';
import {openAsBlob} from 'node:fs';
import {unlink} from 'node:fs/promises';
import {FileInterceptor} from '@nestjs/platform-express';
import {cognition} from '../context.js';
import {uploadFilename} from '../uploads.js';
import {createUploadDirectory,installUploadCleanup} from '../upload-temp.js';

const uploadDirectory=createUploadDirectory();
installUploadCleanup(uploadDirectory);
const admission=new UploadAdmission();
const permits=new WeakMap<Request,ReturnType<UploadAdmission['reserve']>>();
@Injectable()
class UploadGuard implements CanActivate{
  canActivate(context:ExecutionContext){
    const permit=admission.reserve();
    permits.set(context.switchToHttp().getRequest(),permit);
    context.switchToHttp().getResponse().once('close',permit.close);
    return true;
  }
}

@Controller('v1')
export class LibraryController {
  @Get('packages/:id') async package(@Param('id') id:string){return cognition(`packages/${encodeURIComponent(id)}`);}
  @Get('bootstrap') async bootstrap(){return cognition('bootstrap');}
  @Get('documents') async documents(){return cognition('documents');}
  @Get('documents/:id/source') async source(@Param('id') id:string){return cognition(`documents/${encodeURIComponent(id)}/source`);}
  @Post('documents')
  @UseGuards(UploadGuard)
  @UseInterceptors(FileInterceptor('file',{storage:diskStorage({destination:uploadDirectory,filename:(_request,_file,done)=>done(null,'atlas-upload-'+randomUUID())}),limits:{fileSize:80*1024*1024,files:1,fields:0}}))
  async upload(@UploadedFile() file:Express.Multer.File,@Req() req:Request) {
    if (!file) throw Object.assign(new Error('Selecione PDF, Markdown ou TXT.'),{status:400});
    const permit=permits.get(req);
    try{
      if(!permit)throw Object.assign(new Error('Reserva de upload ausente.'),{status:503});
      permit.start();
      const name=uploadFilename(file.originalname);
      const form = new FormData();
      form.append('file',await openAsBlob(file.path,{type:file.mimetype}),name);
      return await cognition('documents','POST',form);
    }finally{await unlink(file.path).catch(()=>undefined);permit?.finish();}

  }
}
