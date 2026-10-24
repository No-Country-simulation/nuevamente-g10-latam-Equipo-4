"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  RefreshCw,
  Server,
  ShieldCheck,
} from "lucide-react";
import { AtlasLogo } from "./atlas-orb";
import { api, post } from "@/lib/api";

type Slot = "generation" | "embeddings" | "decision" | "search";
type Profile = {
  slot: Slot;
  provider: string;
  model: string;
  source: string;
  configured: boolean;
  status: string;
  context_window: number;
};
type State = {
  scope: string;
  manual_available: boolean;
  chatgpt_local_allowed: boolean;
  runtime: string;
  eve_configured: boolean;
  connections: Profile[];
};
const labels: Record<Slot, string> = {
  generation: "Geração e agentes",
  decision: "Decisão e avaliação",
  search: "Pesquisa na web",
  embeddings: "Embeddings · opcional",
};
const choices: Record<Slot, [string, string][]> = {
  generation: [
    ["openrouter", "OpenRouter"],
    ["openai", "OpenAI"],
    ["anthropic", "Anthropic"],
  ],
  embeddings: [
    ["openai", "OpenAI"],
    ["openrouter", "OpenRouter"],
  ],
  decision: [["typesafe", "TypeSafe / Jev"]],
  search: [["firecrawl", "Firecrawl"]],
};
const variables: Record<Slot, string> = {
  generation:
    "EVE_MODEL_PROVIDER, EVE_MODEL e a chave do provedor. Modo direto de diagnóstico: LLM_BASE_URL, LLM_MODEL e LLM_API_KEY.",
  embeddings:
    "EMBEDDING_BASE_URL, EMBEDDING_MODEL e EMBEDDING_API_KEY. Pode deixar sem configurar.",
  decision: "TYPESAFE_API_KEY",
  search: "FIRECRAWL_API_KEY",
};
export default function Connections() {
  const [state, setState] = useState<State | null>(null),
    [slot, setSlot] = useState<Slot>("generation"),
    [mode, setMode] = useState<"server" | "manual" | "local_login">("server");
  const [provider, setProvider] = useState("openrouter"),
    [model, setModel] = useState(""),
    [key, setKey] = useState(""),
    [context, setContext] = useState(32768),
    [show, setShow] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  async function load() {
    try {
      setState(await api<State>("connections"));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    setProvider(choices[slot][0][0]);
    setKey("");
    setModel("");
    setNotice("");
    setError("");
    setShow(false);
    if (slot !== "generation") setMode("server");
  }, [slot]);
  const active = state?.connections.find((p) => p.slot === slot);
  async function perform(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    void perform(async () => {
      const value = await post<State>(`connections/${slot}`, {
        mode,
        provider: mode === "local_login" ? "chatgpt_local" : provider,
        ...(slot === "generation" || slot === "embeddings" ? { model } : {}),
        ...(mode === "manual" ? { key } : {}),
        ...(slot === "generation" ? { context_window: context } : {}),
      });
      setKey("");
      setShow(false);
      setState(value);
      setNotice(
        mode === "local_login"
          ? "Preferência local salva. Conclua o login no terminal do Eve; uma geração real ainda precisa ser validada."
          : "Chave salva com criptografia no servidor. A configuração será usada nas próximas operações; salvar não testa o provedor.",
      );
    });
  }
  return (
    <div className="connection-settings">
      <header>
        <Link href="/" aria-label="Atlas, início">
          <AtlasLogo />
        </Link>
        <Link href="/studio">
          <ArrowLeft size={16} />
          Voltar ao estúdio
        </Link>
      </header>
      <main>
        <div className="settings-heading">
          <span>Seu workspace</span>
          <h1>Conexões, do seu jeito.</h1>
          <p>
            Escolha como seus agentes acessam os modelos e as ferramentas. As
            chaves ficam no servidor; suas fontes continuam sob seu controle.
          </p>
        </div>
        <div
          className="settings-modes"
          role="group"
          aria-label="Forma de conexão"
        >
          {(
            [
              {
                id: "server",
                title: "Gerenciado pelo servidor",
                text: "Variáveis de ambiente ou arquivos de um cofre.",
                icon: Server,
              },
              {
                id: "manual",
                title: "Minha chave de API",
                text: "OpenRouter e outros provedores, com armazenamento criptografado.",
                icon: KeyRound,
              },
              {
                id: "local_login",
                title: "Login com ChatGPT",
                text: "Assinatura no Eve local. Disponibilidade diferente de uma API.",
                icon: LockKeyhole,
              },
            ] as const
          ).map(({ id, title, text, icon: Icon }) => (
            <button
              key={id}
              aria-pressed={mode === id}
              onClick={() => {
                setMode(id);
                setKey("");
                setNotice("");
                setError("");
                if (id === "local_login") setSlot("generation");
              }}
              className={mode === id ? "selected" : ""}
            >
              <Icon size={21} />
              <strong>{title}</strong>
              <span>{text}</span>
              {mode === id && <Check size={16} />}
            </button>
          ))}
        </div>
        <div className="settings-layout">
          <aside aria-label="Finalidade da conexão">
            {(["generation", "decision", "search", "embeddings"] as Slot[]).map(
              (value) => (
                <button
                  key={value}
                  aria-pressed={slot === value}
                  onClick={() => setSlot(value)}
                >
                  <span>{labels[value]}</span>
                  <small>
                    {state?.connections.find((p) => p.slot === value)
                      ?.configured
                      ? "Configurado · não verificado"
                      : "Sem chave verificada"}
                  </small>
                </button>
              ),
            )}
            <p>
              <ShieldCheck size={16} />
              Este é um workspace local. Conexões pessoais por conta dependem da
              autenticação multiusuário.
            </p>
          </aside>
          <section
            className="settings-panel"
            aria-labelledby="connection-title"
          >
            <div className="settings-panel-heading">
              <h2 id="connection-title">{labels[slot]}</h2>
              <button
                onClick={() => void load()}
                aria-label="Atualizar conexões"
                disabled={busy}
              >
                <RefreshCw size={16} />
              </button>
            </div>
            {active && (
              <div className="connection-summary">
                <span>
                  Em uso: <strong>{active.provider}</strong>
                  {active.model && <> · {active.model}</>}
                </span>
                <small>
                  {active.source === "manual"
                    ? "Chave manual criptografada"
                    : active.source === "local_login"
                      ? "Login local requer verificação"
                      : active.source === "secret_file"
                        ? "Arquivo gerenciado no servidor"
                        : "Ambiente do servidor"}{" "}
                  ·{" "}
                  {active.status === "login_requires_local_verification"
                    ? "login ainda não verificado"
                    : active.configured
                      ? "configuração presente, uso real ainda não verificado"
                      : "não configurado"}
                </small>
              </div>
            )}
            {slot === "embeddings" && (
              <p className="settings-note">
                Não é necessário contratar um modelo de embeddings para começar.
                A busca lexical, o contexto dos documentos e o reranking Jev
                funcionam sem ele. Configure esta opção apenas se precisar de
                busca semântica; o índice existente precisará ser refeito.
              </p>
            )}
            {mode === "server" ? (
              <div className="server-instructions">
                <h3>Ambiente ou cofre de segredos</h3>
                <p>
                  O operador configura as variáveis abaixo. Arquivos montados
                  por OCI Vault, um agente de segredos ou o runtime podem
                  fornecer a chave com o sufixo <code>_FILE</code>.
                </p>
                <code>{variables[slot]}</code>
                <p>
                  Chaves de ambiente não são exibidas nem editadas aqui. Remover
                  uma chave manual restaura a configuração do servidor.
                </p>
                {active &&
                  (active.source === "manual" ||
                    active.source === "local_login") && (
                    <button
                      className="settings-primary"
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          setState(
                            await api<State>(`connections/${slot}`, {
                              method: "DELETE",
                            }),
                          );
                          setNotice(
                            "Configuração manual removida. A conexão voltou a usar o servidor.",
                          );
                        })
                      }
                    >
                      Usar configuração do servidor
                      <ArrowRight size={16} />
                    </button>
                  )}
              </div>
            ) : (
              <form onSubmit={save} className="connection-form">
                {mode === "manual" ? (
                  <>
                    <label>
                      Provedor
                      <select
                        value={provider}
                        onChange={(e) => {
                          setProvider(e.target.value);
                          setKey("");
                          setModel("");
                        }}
                      >
                        {choices[slot].map(([id, label]) => (
                          <option value={id} key={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Chave de API
                      <span className="key-input">
                        <input
                          type={show ? "text" : "password"}
                          value={key}
                          onChange={(e) => setKey(e.target.value)}
                          minLength={8}
                          maxLength={4096}
                          autoComplete="new-password"
                          spellCheck={false}
                          required
                          placeholder="Cole sua chave aqui"
                        />
                        <button
                          type="button"
                          aria-label={show ? "Ocultar chave" : "Mostrar chave"}
                          onClick={() => setShow(!show)}
                        >
                          {show ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </span>
                    </label>
                  </>
                ) : (
                  <div className="chatgpt-instructions">
                    <h3>Autenticação local do Eve</h3>
                    <p>
                      A assinatura ChatGPT não é uma chave OpenAI. O helper
                      nativo <code>chatgpt()</code> usa um login local separado
                      e falha em deployment de produção.
                    </p>
                    <ol>
                      <li>
                        O operador habilita{" "}
                        <code>ATLAS_ALLOW_LOCAL_CHATGPT=1</code> apenas em
                        desenvolvimento.
                      </li>
                      <li>
                        Em uma conta de sistema dedicada ao Atlas, abra o
                        terminal do Eve com <code>bash scripts/eve.sh dev</code>
                        .
                      </li>
                      <li>
                        Use <code>/login</code>, escolha ChatGPT e conclua o
                        fluxo oficial no navegador.
                      </li>
                      <li>
                        Salve abaixo o modelo permitido pela sua conta e teste
                        no estúdio.
                      </li>
                    </ol>
                    <p>
                      Não cole senhas, cookies ou tokens de sessão neste painel.
                      O Atlas não importa credenciais desta sessão do Codex.
                    </p>
                    <a
                      href="https://github.com/vercel/eve"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Documentação oficial do Eve ↗
                    </a>
                  </div>
                )}
                {(slot === "generation" || slot === "embeddings") && (
                  <label>
                    Identificador do modelo
                    <input
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      required
                      maxLength={160}
                      placeholder={
                        slot === "embeddings"
                          ? "ID do modelo opcional de embeddings"
                          : "ID exato disponível no provedor"
                      }
                    />
                  </label>
                )}
                {slot === "generation" && (
                  <label>
                    Janela de contexto reservada
                    <input
                      type="number"
                      min={16000}
                      max={200000}
                      value={context}
                      onChange={(e) => setContext(Number(e.target.value))}
                      required
                    />
                    <small>
                      Confirme o limite do modelo. Reservar uma janela não
                      aumenta a capacidade do provedor.
                    </small>
                  </label>
                )}
                <p className="settings-note">
                  A chave será enviada uma vez e criptografada no servidor. Ela
                  não é salva no armazenamento do navegador nem devolvida pela
                  API. Memória de aprendizagem exige consentimento separado.
                </p>
                {!state?.manual_available && (
                  <p className="settings-warning">
                    O operador precisa configurar a chave mestra do cofre antes
                    de salvar conexões.
                  </p>
                )}
                {mode === "local_login" && !state?.chatgpt_local_allowed && (
                  <p className="settings-warning">
                    Login ChatGPT local não foi habilitado pelo operador. Use
                    uma chave de API ou siga as instruções acima.
                  </p>
                )}
                <button
                  className="settings-primary"
                  disabled={
                    busy ||
                    !state?.manual_available ||
                    (mode === "local_login" && !state?.chatgpt_local_allowed)
                  }
                >
                  {busy
                    ? "Salvando…"
                    : mode === "local_login"
                      ? "Salvar preferência de login local"
                      : "Salvar chave no servidor"}
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
            {active?.configured &&
              ["openai", "openrouter", "anthropic"].includes(
                active.provider,
              ) && (
                <button
                  className="settings-secondary"
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      const result = await post<{
                        authenticated: boolean;
                        model_listed?: boolean;
                      }>(`connections/${slot}/test`, {});
                      setNotice(
                        result.authenticated
                          ? `Catálogo acessível. ${result.model_listed ? "Modelo encontrado." : "O modelo não foi encontrado nessa lista."} A geração e o uso de ferramentas ainda precisam de teste real.`
                          : "O provedor recusou a credencial ou não pôde ser acessado. Confira a chave, o acesso de rede e os limites.",
                      );
                    })
                  }
                >
                  Testar acesso ao catálogo · sem gerar conteúdo
                </button>
              )}
            {slot === "generation" &&
              state?.runtime === "eve" &&
              !state.eve_configured && (
                <p className="settings-warning">
                  O runtime escolhido é Eve e ainda não tem endereço
                  configurado. O operador deve iniciar o Eve e definir EVE_URL;
                  salvar uma chave não inicia esse serviço.
                </p>
              )}
            {notice && (
              <p className="settings-success" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="settings-error" role="alert">
                {error}
              </p>
            )}
            {!state && !error && <p role="status">Carregando conexões…</p>}
          </section>
        </div>
      </main>
      <footer>Atlas · Chaves no servidor. Clareza no caminho.</footer>
    </div>
  );
}
