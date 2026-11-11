import {_electron,expect} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../../..');
const directory=await mkdtemp(join(tmpdir(),'atlas-onboarding-'));
let desktop;
try{
  desktop=await _electron.launch({executablePath:join(root,'integrations/chatgpt-desktop/node_modules/electron/dist/electron'),args:[join(root,'integrations/chatgpt-desktop')],env:{...process.env,XDG_CONFIG_HOME:directory}});
  const page=await desktop.firstWindow();await expect(page.getByRole('heading',{name:'Uma conexão. Novas descobertas.'})).toBeVisible();
  const preferences=await desktop.evaluate(({BrowserWindow})=>{const p=BrowserWindow.getAllWindows()[0].webContents.getLastWebPreferences();return {sandbox:p.sandbox,contextIsolation:p.contextIsolation,nodeIntegration:p.nodeIntegration,webSecurity:p.webSecurity};});
  assert.deepEqual(preferences,{sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true});
  const status=await page.evaluate(()=>window.atlasLocal.status());
  assert.equal('credentials' in status.session,false);assert.equal('accessToken' in status.session,false);
  if(status.encryptionAvailable)await expect(page.getByRole('button',{name:'Continue with ChatGPT',exact:true})).toBeVisible();
  else{
    await expect(page.getByText('Desbloqueie um cofre seguro do sistema operacional para conectar.',{exact:false})).toBeVisible();
    await expect(page.getByRole('button',{name:'Conectar outra conta'})).toBeDisabled();
  }
  await page.screenshot({path:join(root,'artifacts/chatgpt-onboarding-native.png'),fullPage:true});
  console.log('Production onboarding: isolated profile, real IPC and sandbox verified. OS encryption availability:',status.encryptionAvailable,'. No OAuth authorization attempted.');
}finally{if(desktop)await desktop.close();await rm(directory,{recursive:true,force:true});}
