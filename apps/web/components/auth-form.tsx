'use client';

import {useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';

export function AuthForm(){
  const router=useRouter();
  const [register,setRegister]=useState(false);
  const [pending,setPending]=useState(false);
  const [error,setError]=useState('');
  const submitting=useRef(false);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(submitting.current)return;
    submitting.current=true;
    setPending(true);
    setError('');
    const data=new FormData(event.currentTarget);
    const body={email:String(data.get('email')),password:String(data.get('password')),
      ...(register?{name:String(data.get('name'))}:{})};
    try {
      const response=await fetch(`/api/atlas/auth/${register?'register':'login'}`,{
        method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),
      });
      if(!response.ok){
        setError(response.status===429?'Muitas tentativas. Aguarde alguns minutos.':
          register?'Não foi possível criar a conta. Confira os dados e tente novamente.':
          'Não foi possível entrar. Confira seu e-mail e sua senha.');
        return;
      }
      router.push('/workspace');
      router.refresh();
    } catch {
      setError('Não foi possível conectar. Tente novamente.');
    } finally {
      submitting.current=false;
      setPending(false);
    }
  }

  return <section aria-labelledby="auth-title">
    <h2 id="auth-title">{register?'Criar conta':'Entrar na sua conta'}</h2>
    <form className="access-form" onSubmit={submit}>
      {register && <label>Nome<input name="name" autoComplete="name" minLength={2} maxLength={80} required/></label>}
      <label>E-mail<input name="email" type="email" autoComplete="email" maxLength={200} required/></label>
      <label>Senha<input name="password" type="password" autoComplete={register?'new-password':'current-password'} minLength={register?10:1} maxLength={128} required/></label>
      {register && <p className="access-note">Use pelo menos 10 caracteres na senha.</p>}
      {error && <p className="access-error" role="alert">{error}</p>}
      <button className="access-local" type="submit" disabled={pending}>{pending?'Aguarde…':register?'Criar conta':'Entrar'}</button>
    </form>
    <button className="access-switch" type="button" disabled={pending} onClick={()=>{setRegister(!register);setError('');}}>
      {register?'Já tenho conta':'Criar uma conta'}
    </button>
  </section>;
}
