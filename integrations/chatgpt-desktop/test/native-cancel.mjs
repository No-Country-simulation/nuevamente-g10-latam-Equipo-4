import {_electron} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const configuration=await mkdtemp(join(tmpdir(),'atlas-cancel-config-'));
let desktop,directory;
try{
  desktop=await _electron.launch({executablePath:join(root,'integrations/chatgpt-desktop/node_modules/electron/dist/electron'),args:[join(import.meta.dirname,'runtime-fixture.mjs'),'--cancel-startup'],env:{...process.env,XDG_CONFIG_HOME:configuration},timeout:60000});
  await desktop.firstWindow();
  const info=await desktop.evaluate(()=>globalThis.atlasCancellation);directory=info.directory;
  assert.deepEqual(info.leftovers,[]);
  console.log('Native startup cancellation: actual Electron utilities and Python cleaned before a workspace was published.');
}finally{if(desktop)await desktop.close();if(directory)await rm(directory,{recursive:true,force:true});await rm(configuration,{recursive:true,force:true});}
