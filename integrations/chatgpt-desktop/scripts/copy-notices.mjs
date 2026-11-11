import {mkdir,copyFile} from 'node:fs/promises';
import {copyPackageNotices} from '../devkit/scripts/copy-package-notices.mjs';
const output=new URL('../dist/',import.meta.url);
await copyPackageNotices(output);
await mkdir(new URL('licenses/',output),{recursive:true});
for(const name of ['inter-OFL.txt','open-sans-OFL.txt'])
  await copyFile(new URL('../devkit/assets/fonts/'+name,import.meta.url),new URL('licenses/'+name,output));
await copyFile(new URL('../NOTICE.md',import.meta.url),new URL('ATLAS_NOTICE.md',output));
