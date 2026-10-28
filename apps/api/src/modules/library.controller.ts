import {Controller,Get,Post,Param,UseInterceptors,UploadedFile} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {cognition} from '../context.js';
import {uploadFilename} from '../uploads.js';

@Controller('v1')
export class LibraryController {
  @Get('packages/:id') async package(@Param('id') id:string){return cognition(`packages/${encodeURIComponent(id)}`);}
  @Get('bootstrap') async bootstrap(){return cognition('bootstrap');}
  @Get('documents') async documents(){return cognition('documents');}
  @Get('documents/:id/source') async source(@Param('id') id:string){return cognition(`documents/${encodeURIComponent(id)}/source`);}
  @Post('documents')
  @UseInterceptors(FileInterceptor('file',{limits:{fileSize:10*1024*1024,files:1,fields:0}}))
  async upload(@UploadedFile() file:Express.Multer.File) {
    if (!file) throw Object.assign(new Error('Selecione PDF, Markdown ou TXT.'),{status:400});
    const name=uploadFilename(file.originalname);
    const form = new FormData();
    form.append('file',new Blob([new Uint8Array(file.buffer)],{type:file.mimetype}),name);
    return cognition('documents','POST',form);
  }
}
