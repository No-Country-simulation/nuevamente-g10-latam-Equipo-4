# Catálogo de configuração — Atlas0.5

Fonte operacional: `.env.example`. `npm run check:env` confere referências estáticas e variantes de arquivos de segredo; não lê nenhum valor da máquina.

## Uso e segurança

Copie o exemplo somente se ainda não houver `.env`. Chaves devem ficar vazias no Git. `setup.sh`/`init:vault` completam token e master ausentes, preservando valores existentes. Nunca girar a master por rotina.

O loader completa apenas ausências do ambiente injetado. `ATLAS_ENV_FILE` seleciona o arquivo no supervisor local para todos os processos; caminhos relativos são convertidos para absoluto antes de iniciar os filhos. Arquivo explicitamente selecionado e ausente interrompe a execução. Em containers, env/arquivos de segredo devem estar injetados ou montados; iniciar Python diretamente não executa o loader. Segredos de provedor aceitam `_FILE` com prioridade e falham fechados se o arquivo configurado não estiver disponível. Token interno, tokens de runner/memória, URLs com senha Mongo e credenciais OCI também são segredos; nem todos têm adapter `_FILE`: use injeção gerenciada ou entregue a configuração com o mecanismo documentado. Não presumir integração OCI Vault nativa provisionada.

`ATLAS_ENV_READY` é marcador interno do supervisor, não campo de produto; `NODE_OPTIONS`, `PATH`, proxies, CAs e identidades injetadas pertencem ao runtime. Preserve-os; nunca exportar/dumpar o ambiente para diagnosticar. `ATLAS_WITH_MONGO` é build arg opcional de imagem, não serviço obrigatório.

Caminhos relativos usam o cwd do serviço; prefira `ATLAS_DATA_DIR=/data` em containers e caminho absoluto no host. Next não monta dados/cofre. Conexões e SDKs ficam no servidor. Produção define NODE_ENV=production e recusa login ChatGPT local.

## Variáveis do exemplo

| Variável | Valor público de exemplo | Grupo/observação |
| --- | --- | --- |
| `ATLAS_INTERNAL_TOKEN` | vazio | Runtime/composição; ver .env.example |
| `ATLAS_APP_MODE` | `local` | Runtime/composição; ver .env.example |
| `ATLAS_BIND_ADDRESS` | `127.0.0.1` | Runtime/composição; ver .env.example |
| `ATLAS_TENANT_ID` | `local-workspace` | Runtime/composição; ver .env.example |
| `ATLAS_SEED_DEMO` | `1` | Runtime/composição; ver .env.example |
| `ATLAS_DATA_DIR` | `../../data` | Runtime/composição; ver .env.example |
| `API_PORT` | `4000` | Runtime/composição; ver .env.example |
| `ATLAS_API_URL` | `http://127.0.0.1:4000` | Runtime/composição; ver .env.example |
| `COGNITION_URL` | `http://127.0.0.1:8000` | Runtime/composição; ver .env.example |
| `TYPESAFE_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `LLM_BASE_URL` | vazio | Fornecedor/modelo; chave nunca no browser |
| `LLM_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `LLM_MODEL` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EMBEDDING_BASE_URL` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EMBEDDING_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EMBEDDING_MODEL` | vazio | Fornecedor/modelo; chave nunca no browser |
| `LM_CONTEXT_CHAR_BUDGET` | `24000` | Runtime/composição; ver .env.example |
| `ATLAS_AGENT_RUNTIME` | `eve` | Runtime/composição; ver .env.example |
| `ATLAS_TEAM_DEBATE` | `1` | Runtime/composição; ver .env.example |
| `EVE_URL` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EVE_MODEL` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EVE_MODEL_CONTEXT_WINDOW` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EVE_SERVICE_TOKEN` | vazio | Fornecedor/modelo; chave nunca no browser |
| `AI_GATEWAY_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `FIRECRAWL_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `STORAGE_PROVIDER` | `local` | Objetos e aceite OCI Always Free |
| `OCI_AUTH_MODE` | `instance_principal` | Objetos e aceite OCI Always Free |
| `OCI_NAMESPACE` | vazio | Objetos e aceite OCI Always Free |
| `OCI_BUCKET` | vazio | Objetos e aceite OCI Always Free |
| `OCI_REGION` | vazio | Objetos e aceite OCI Always Free |
| `OCI_CONFIG_FILE` | vazio | Objetos e aceite OCI Always Free |
| `OCI_CONFIG_PROFILE` | `DEFAULT` | Objetos e aceite OCI Always Free |
| `DREAMER_INTERVAL_SECONDS` | `3600` | Memória/runner; tokens próprios e consentimento |
| `MEMORY_SERVICE_URL` | vazio | Memória/runner; tokens próprios e consentimento |
| `MEMORY_SERVICE_TOKEN` | vazio | Memória/runner; tokens próprios e consentimento |
| `ATLAS_BUILD_CA_BUNDLE` | vazio | Runtime/composição; ver .env.example |
| `VECTOR_BACKEND` | `sqlite` | Integração opcional; SQLite permanece padrão |
| `QDRANT_URL` | vazio | Integração opcional; SQLite permanece padrão |
| `QDRANT_API_KEY` | vazio | Integração opcional; SQLite permanece padrão |
| `MONGODB_URI` | vazio | Integração opcional; SQLite permanece padrão |
| `MONGODB_DATABASE` | `atlas` | Integração opcional; SQLite permanece padrão |
| `ATLAS_JOB_RUNNER` | `local` | Memória/runner; tokens próprios e consentimento |
| `TRIGGER_API_URL` | `https://api.trigger.dev` | Memória/runner; tokens próprios e consentimento |
| `TRIGGER_SECRET_KEY` | vazio | Memória/runner; tokens próprios e consentimento |
| `TRIGGER_PROJECT_REF` | vazio | Memória/runner; tokens próprios e consentimento |
| `ATLAS_JOB_CALLBACK_URL` | vazio | Memória/runner; tokens próprios e consentimento |
| `ATLAS_JOB_RUNNER_TOKEN` | vazio | Memória/runner; tokens próprios e consentimento |
| `ATLAS_CREDENTIAL_MASTER_KEY` | vazio | Cofre/segredo montado; master fora do backup de dados |
| `ATLAS_CREDENTIAL_MASTER_KEY_FILE` | vazio | Cofre/segredo montado; master fora do backup de dados |
| `ATLAS_CREDENTIALS_FILE` | vazio | Cofre/segredo montado; master fora do backup de dados |
| `EVE_MODEL_PROVIDER` | `gateway` | Fornecedor/modelo; chave nunca no browser |
| `OPENROUTER_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `ATLAS_OPENAI_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `ANTHROPIC_API_KEY` | vazio | Fornecedor/modelo; chave nunca no browser |
| `ATLAS_ALLOW_LOCAL_CHATGPT` | `0` | Runtime/composição; ver .env.example |
| `ATLAS_IMAGE_PREFIX` | `ghcr.io/oracle-hackatom-g10-team-4/nova-mente-solution` | Deploy pull-only por SHA |
| `ATLAS_IMAGE_TAG` | vazio | Deploy pull-only por SHA |
| `ATLAS_COMMAND_MAX_ROWS` | `20000` | Recibos: quota/TTL; não libera chave expirada |
| `ATLAS_COMMAND_TTL_SECONDS` | `604800` | Recibos: quota/TTL; não libera chave expirada |
| `ATLAS_COMMAND_MAX_BYTES` | `67108864` | Recibos: quota/TTL; não libera chave expirada |
| `ATLAS_RATE_LIMIT_PER_MINUTE` | `120` | Runtime/composição; ver .env.example |
| `ATLAS_ENV_FILE` | vazio | Cofre/segredo montado; master fora do backup de dados |
| `ATLAS_AGENT_CATALOG` | vazio | Runtime/composição; ver .env.example |
| `AI_GATEWAY_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `OPENROUTER_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `ATLAS_OPENAI_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `ANTHROPIC_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `TYPESAFE_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `FIRECRAWL_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `LLM_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `EMBEDDING_API_KEY_FILE` | vazio | Fornecedor/modelo; chave nunca no browser |
| `NODE_ENV` | vazio | Runtime/composição; ver .env.example |
| `ATLAS_WEB_URL` | `http://127.0.0.1:3000` | Teste/diagnóstico, sem inferência implícita |
| `ATLAS_SMOKE_URL` | `http://127.0.0.1:3000/api/atlas` | Teste/diagnóstico, sem inferência implícita |
| `ATLAS_ACCEPTANCE_DOCUMENT_ID` | vazio | Teste/diagnóstico, sem inferência implícita |
| `ATLAS_E2E_CHROMIUM` | vazio | Teste/diagnóstico, sem inferência implícita |
| `ATLAS_E2E_REUSE` | `0` | Teste/diagnóstico, sem inferência implícita |
| `ATLAS_QUALITY_ENGINE` | vazio | Teste/diagnóstico, sem inferência implícita |

## O que uma variável não comprova

`ATLAS_ENV_READY`, `ATLAS_TEST_SELECTOR` e `ATLAS_TEST_INJECTED` também estão
listados vazios no exemplo por completude do scanner. São marcadores internos
de supervisor/fixtures e não configurações de produto; não precisam ser preenchidos.

Chave preenchida não prova modelo/conta. URL configurada não prova serviço saudável. Config de bucket não é upload verificado. Limite de memória não é benchmark. Login local não é autenticação pública. A matriz Uxx/Pxx identifica qual evidência ainda falta.
