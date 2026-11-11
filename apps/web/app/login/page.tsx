import Link from 'next/link';
import {connection} from 'next/server';
import {AuthForm} from '@/components/auth-form';
import './login.css';

export default async function LoginPage(){
  await connection();
  const requiresLogin=process.env.ATLAS_REQUIRE_LOGIN==='1';
  return <main className="access-page">
    <Link href="/" className="access-brand" aria-label="Atlas — início">atlas</Link>
    <section className="access-card" aria-labelledby="access-title">
      <p className="access-eyebrow">SEU ESPAÇO PARA APRENDER</p>
      <h1 id="access-title">Volte à sua<br/><em>próxima descoberta.</em></h1>
      <p>Suas fontes, seus tutores e um caminho de estudo no seu ritmo.</p>
      {requiresLogin ? <AuthForm/> : <><h2>Explorar o ambiente local</h2>
        <p>Este workspace é compartilhado. Continuar não cria uma conta nem autentica você.</p>
        <Link href="/workspace" className="access-local">Continuar no workspace local <span aria-hidden="true">→</span></Link></>}
      <div className="access-divider"/>
      <h2>Continuar com ChatGPT no computador</h2>
      <p>O aplicativo local conecta sua conta por OAuth no navegador oficial. Usuários elegíveis podem autorizar o uso do plano, sem colar chaves ou senhas.</p>
      <Link className="access-local" href="/login/local">Preparar o aplicativo local <span aria-hidden="true">→</span></Link>
      <p className="access-note">A conta e os tokens do ChatGPT ficam no seu computador; sua assinatura não é usada no servidor.</p>
    </section>
  </main>;
}
