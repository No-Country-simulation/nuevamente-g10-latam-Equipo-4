import React, {useEffect, useState, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {ChatGPTConnectionCard, ChatGPTUsageIndicator} from '@siwc/react';
import type {SessionState, ChatGPTModel, LoginProfile} from '@siwc/local';
import '@siwc/react/styles.css';
import './style.css';

type Status = {session: SessionState; encryptionAvailable: boolean; mode: string};
interface Bridge {
  status(): Promise<Status>; signIn(newProfile?: boolean): Promise<SessionState>;
  cancel(): Promise<void>; disconnect(): Promise<void>; models(): Promise<ChatGPTModel[]>;
  profiles(): Promise<LoginProfile[]>; select(id: string): Promise<void>;
  open(model: string): Promise<void>; usage(): Promise<void>;
  subscribe(listener: (state: SessionState) => void): () => void;
}
declare global {interface Window {atlasLocal: Bridge}}
const bridge = window.atlasLocal;
function useConnection() {
  const [status, setStatus] = useState<Status>();
  const [profiles, setProfiles] = useState<LoginProfile[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const available=useRef(false);
  async function refresh() {
    const next=await bridge.status();available.current=next.encryptionAvailable;setStatus(next);
    setProfiles(next.encryptionAvailable?await bridge.profiles():[]);
  }
  async function perform(operation: () => Promise<unknown>) {
    setBusy(true); setError('');
    try {await operation(); await refresh();}
    catch (error) {setError((error as Error).message);}
    finally {setBusy(false);}
  }
  useEffect(() => {
    void refresh().catch(() => setError('Não foi possível consultar a conta local.'));
    return bridge.subscribe(session => {
      setStatus(previous => previous ? {...previous, session} : previous);
      if(!available.current)return;
      void bridge.profiles().then(setProfiles).catch(() => setError('Não foi possível atualizar os perfis.'));
    });
  }, []);
  return {status, profiles, error, busy, perform};
}
function StudyLauncher({session, disabled, perform}: {
  session: SessionState; disabled: boolean; perform: (op: () => Promise<unknown>) => Promise<void>;
}) {
  const [models, setModels] = useState<ChatGPTModel[]>([]);
  const [model, setModel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    bridge.models().then(items => {if (active) {setModels(items); setModel(items[0]?.slug || '');}})
      .catch(() => {if (active) setError('Não foi possível obter os modelos. Reconecte a conta ou consulte o uso.');})
      .finally(() => {if (active) setLoading(false);});
    return () => {active = false;};
  }, [session.profileId]);
  return <section className="launch" aria-label="Abrir estudos">
    <ChatGPTUsageIndicator source="unknown" onManageUsage={() => void perform(() => bridge.usage())}/>
    <p>O uso depende da elegibilidade e dos limites da sua conta. O Atlas não confirma a origem de cobrança e não troca para API paga automaticamente.</p>
    <label>Modelo disponível na sua conta<select value={model} onChange={event => setModel(event.target.value)} disabled={disabled || loading}>
      {models.map(item => <option key={item.slug} value={item.slug}>{item.displayName}</option>)}
    </select></label>
    {error && <p role="alert">{error}</p>}
    <button className="primary" disabled={disabled || loading || !model} onClick={() => void perform(() => bridge.open(model))}>{loading ? 'Consultando modelos…' : 'Abrir meu Atlas →'}</button>
  </section>;
}
function Account() {
  const {status, profiles, error, busy, perform} = useConnection();
  if (!status) return <main><p role="status">Preparando conexão segura…</p>{error && <p role="alert">{error}</p>}</main>;
  const {session} = status;
  return <main><header><span className="brand">atlas</span><span>SEU ESPAÇO PARA APRENDER</span></header>
    <h1>Uma conexão.<br/><em>Novas descobertas.</em></h1>
    <p>Conecte sua própria conta no navegador oficial do ChatGPT. Senhas e tokens não passam pelo servidor Oracle.</p>
    <AccountControls status={status} profiles={profiles} busy={busy} error={error} perform={perform}/>
    {session.status === 'connected' && session.sharing && <StudyLauncher key={session.profileId} session={session} disabled={busy} perform={perform}/>}
    <footer>Biblioteca local · memória de aprendizagem somente com seu consentimento. Ao gerar com ChatGPT, o contexto autorizado do estudo é enviado à OpenAI. Desconectar mantém seus documentos.</footer>
  </main>;
}
function AccountControls({status,profiles,busy,error,perform}: {
  status: Status; profiles: LoginProfile[]; busy: boolean; error: string;
  perform: (operation: () => Promise<unknown>) => Promise<void>;
}) {
  const {session,encryptionAvailable}=status;
  const connect=()=>{if(encryptionAvailable&&!busy)void perform(()=>bridge.signIn());};
  return <>
    {!encryptionAvailable ? <p role="alert" className="warning">Desbloqueie um cofre seguro do sistema operacional para conectar. No Linux, instale e desbloqueie GNOME Keyring ou KWallet. O Atlas não usa armazenamento de tokens sem proteção. <button disabled={busy} onClick={() => void perform(async () => {})}>Verificar cofre</button></p> :
      <ChatGPTConnectionCard status={session.status} sharing={session.sharing} identity={session.identity} appName="Atlas" onConnect={connect} onDisconnect={() => {if (!busy) void perform(() => bridge.disconnect());}} onManageUsage={() => void perform(() => bridge.usage())}/>}
    {session.status === 'connecting' && <button onClick={() => void bridge.cancel()}>Cancelar conexão</button>}
    {error && <p role="alert" className="warning">{error}</p>}
    <SessionNotice session={session} enabled={encryptionAvailable}/>
    {busy && <p role="status">Aguarde a operação atual…</p>}
    {profiles.length > 0 && <label>Conta local<select value={session.profileId || ''} disabled={busy} onChange={event => void perform(() => bridge.select(event.target.value))}>
      {!session.profileId && <option value="">Escolha uma conta</option>}
      {profiles.map(profile => <option key={profile.id} value={profile.id}>{profile.label}</option>)}
    </select></label>}
    <button disabled={busy || !encryptionAvailable} onClick={() => void perform(() => bridge.signIn(true))}>Conectar outra conta</button>
  </>;
}
function SessionNotice({session,enabled}: {session: SessionState;enabled: boolean}){
  if(!enabled||!session.error)return null;
  return <p role="status">{session.error.message}</p>;
}
createRoot(document.getElementById('root')!).render(<Account/>);
