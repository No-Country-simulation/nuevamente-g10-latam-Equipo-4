import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {chromium,expect} from '@playwright/test';

const browser=await chromium.launch({executablePath:process.env.ATLAS_E2E_CHROMIUM||undefined,headless:true});
try {
  const context=await browser.newContext();
  const page=await context.newPage();
  const base=process.env.ATLAS_WEB_URL||'http://127.0.0.1:3000';
  const email=`browser-${randomUUID()}@example.test`;
  const password='password-1234';
  await page.goto(`${base}/workspace`);
  await page.waitForURL('**/login');
  assert.equal(await page.getByRole('link',{name:/Continuar no workspace local/}).count(),0);
  assert.equal(await page.getByRole('link',{name:/Preparar o aplicativo local/}).count(),1);
  await page.getByRole('button',{name:'Criar uma conta'}).click();
  await page.getByLabel('Nome').fill('Teste Browser');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button',{name:'Criar conta',exact:true}).click();
  await page.waitForURL('**/workspace');
  const cookie=(await context.cookies()).find(item=>item.name==='atlas_session');
  assert.ok(cookie?.httpOnly);
  assert.equal(await page.evaluate(()=>document.cookie.includes('atlas_session')),false);
  assert.equal(await page.evaluate(token=>[localStorage,sessionStorage].some(storage=>
    Object.keys(storage).some(key=>storage.getItem(key)?.includes(token))),cookie.value),false);
  await context.clearCookies();
  await page.goto(`${base}/studio`);
  await page.waitForURL('**/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('senha-incorreta');
  const failedLogin=page.waitForResponse(response=>response.url().endsWith('/api/atlas/auth/login') && response.request().method()==='POST');
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  assert.equal((await failedLogin).status(),401);
  await expect(page.getByRole('alert').filter({hasText:'Não foi possível entrar. Confira seu e-mail e sua senha.'})).toHaveText('Não foi possível entrar. Confira seu e-mail e sua senha.');
  await page.getByLabel('Senha').fill(password);
  await page.getByRole('button',{name:'Entrar',exact:true}).click();
  await page.waitForURL('**/workspace');
  assert.ok((await context.cookies()).find(item=>item.name==='atlas_session')?.httpOnly);
  await context.close();
  console.log('Browser register, failed login and successful login passed');
} finally {
  await browser.close();
}
