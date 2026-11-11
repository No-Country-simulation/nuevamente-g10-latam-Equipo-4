#!/usr/bin/env node
// Grava um tour guiado do Atlas para divulgação/apresentação.
// Uso: node scripts/record-demo.mjs [baseURL]
// Requer o web (3000), a API (4000) e a cognition (8000) em execução.
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
import {resolve} from 'node:path';

const base=process.argv[2]||'http://127.0.0.1:3000';
const outDir=resolve('artifacts/demo');
const tmpDir=resolve('artifacts/demo/raw');
mkdirSync(tmpDir,{recursive:true});

const CAPTION=`
(() => {
  if (window.__atlasCaptionReady) return;
  window.__atlasCaptionReady = true;
  const hideDev = () => {
    if (!document.documentElement || document.getElementById('atlas-demo-hide-dev')) return;
    const style = document.createElement('style');
    style.id = 'atlas-demo-hide-dev';
    style.textContent = 'nextjs-portal{display:none!important}';
    (document.head || document.documentElement).appendChild(style);
  };
  document.addEventListener('DOMContentLoaded', hideDev);
  hideDev();
  const ensure = () => {
    if (!document.body) return;
    if (document.getElementById('atlas-demo-caption')) return;
    const box = document.createElement('div');
    box.id = 'atlas-demo-caption';
    box.style.cssText = [
      'position:fixed','left:50%','bottom:44px','transform:translateX(-50%)',
      'max-width:min(860px,78vw)','padding:15px 26px','border-radius:12px',
      'background:rgba(8,9,10,.88)','border:1px solid rgba(255,112,79,.35)',
      'box-shadow:0 18px 50px rgba(0,0,0,.55)','backdrop-filter:blur(10px)',
      'color:#f4f2ec','font:400 16px/1.5 "Plus Jakarta Sans",system-ui,sans-serif',
      'letter-spacing:.2px','text-align:center','z-index:2147483647','opacity:0',
      'transition:opacity .45s ease','pointer-events:none'
    ].join(';');
    document.body.appendChild(box);
  };
  ensure();
  window.__atlasSay = (text) => {
    ensure();
    const box = document.getElementById('atlas-demo-caption');
    if (!box) return;
    box.textContent = text || '';
    box.style.opacity = text ? '1' : '0';
  };
})();
`;

const browser=await chromium.launch({channel:process.env.ATLAS_DEMO_CHANNEL||'chrome'});
const context=await browser.newContext({
  viewport:{width:1280,height:800},
  deviceScaleFactor:1,
  recordVideo:{dir:tmpDir,size:{width:1280,height:800}},
  locale:'pt-BR',
  colorScheme:'dark',
});
await context.addInitScript(CAPTION);
const page=await context.newPage();
const video=page.video();
const pause=(ms)=>page.waitForTimeout(ms);
const say=async(text)=>{
  await page.evaluate((t)=>window.__atlasSay(t),text);
  await pause(900);
};
const scrollTo=async(selector)=>{
  await page.evaluate((s)=>{
    const el=s?document.querySelector(s):null;
    const top=el?el.getBoundingClientRect().top+window.scrollY-90:document.body.scrollHeight;
    window.scrollTo({top,behavior:'smooth'});
  },selector);
  await pause(1600);
};

try{
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await pause(1200);

  await say('Atlas: um estúdio de aprendizagem com agentes educacionais.');
  await pause(2600);
  await say('Suas fontes viram conversas, perspectivas e prática.');
  await pause(2200);

  await scrollTo('#produto');
  await say('O estúdio reúne suas fontes, seus tutores e o material que você cria.');
  await pause(2400);

  await scrollTo('#metodos');
  await say('Três métodos que fazem pensar: pergunta, explicação e conexão.');
  await pause(2600);

  await scrollTo('#agentes');
  await say('Cinco perspectivas: Guia, Faísca, Prisma, Trama e Elo.');
  await pause(2600);

  await scrollTo('#seu-atlas');
  await say('Você escolhe o nome, as cores e o tutor de base do seu Atlas.');
  await pause(2600);

  await scrollTo('#perguntas');
  await say('Segurança, fontes e limites explicados sem letras miúdas.');
  await pause(2200);

  await page.evaluate(()=>window.scrollTo({top:0,behavior:'smooth'}));
  await pause(1400);
  await say('Agora, o sistema por dentro.');
  await pause(1600);
  await page.getByRole('link',{name:/Entrar no sistema/i}).click();
  await page.waitForURL('**/workspace');
  await pause(3200);

  await say('Estúdio de adaptação: escolha as fontes e diga o que quer compreender.');
  await pause(3200);
  await scrollTo('#workspace');
  await pause(800);

  await page.getByRole('button',{name:'Atlas de conhecimento'}).click();
  await say('Atlas de conhecimento: o mapa das fontes, com citações rastreáveis.');
  await pause(3400);

  await page.getByRole('button',{name:'Oficina & prática'}).click();
  await say('Oficina & prática: guias, flashcards, quiz e resumo gerados do seu material.');
  await pause(3400);

  await page.getByRole('button',{name:'Trilhas de estudo'}).click();
  await say('Trilhas de estudo: etapas curtas com progresso e prática guiada.');
  await pause(3200);

  await page.getByRole('button',{name:'Grupos de estudo'}).click();
  await say('Grupos de estudo: o mesmo material discutido em outra perspectiva.');
  await pause(3200);

  await page.getByRole('button',{name:'Memória & Dreamer'}).click();
  await say('Memória & Dreamer: aprendizado com consentimento, versões e rollback.');
  await pause(3600);

  await page.getByRole('link',{name:'Conexões e modelos'}).click();
  await page.waitForURL('**/workspace/settings');
  await say('Conexões e modelos: chaves ficam no servidor, nunca no navegador.');
  await pause(3400);

  await page.getByRole('link',{name:/atlas/i}).first().click();
  await page.waitForURL(base+'/');
  await pause(2000);
  await page.evaluate(()=>document.querySelector('#seu-atlas')?.scrollIntoView({behavior:'smooth',block:'center'}));
  await pause(1800);
  await say('Comece pelo seu Atlas. O resto cresce com você.');
  await pause(2600);
  await say('');
}finally{
  await context.close();
}

const target=resolve(outDir,'atlas-demo.webm');
if(video){
  try{
    await video.saveAs(target);
    console.log('Vídeo gravado em',target);
  }catch(error){
    console.log('Não foi possível salvar o vídeo:',error.message);
  }
}else{
  console.log('Gravação concluída em',tmpDir);
}
await browser.close();
