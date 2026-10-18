# Integrações NovaMente Atlas — pesquisa primária

Verificado em 18/10/2026. Pesquisa documental e leitura de código/metadados; não houve instalação de CLIs, chamada autenticada, benchmark ou validação de inferência. Versões abaixo são `latest` observadas no npm nessa data. Referências `main` são mutáveis; o lockfile deve fixar as versões efetivamente adotadas.

## Resultado e arquitetura recomendada

**Node 24+ com NestJS + Invokta; Eve como runtime de agentes; Python como worker leve; decisão/judge TypeSafe hospedado e geração em provedor remoto.** Nest pode injetar o mesmo engine Invokta e chamar `engine.invoke` diretamente. Tools Eve delegam ao mesmo engine, ou consomem seu MCP HTTP. Uma integração completa com Eve exige executar seu runtime e consumir suas sessões; importar `defineAgent` não executa agente.

Para AMD x86_64 / 6 GB RAM: iniciar um processo Nest com capacidades Invokta, um worker Python com concorrência limitada e armazenamento leve; executar o runtime Eve quando necessário. Usar Firecrawl e modelos hospedados. Não carregar modelos gerativos, OpenVINO ou browser de scraping local por padrão. Essa é recomendação de orçamento operacional, não medição de consumo. Separar as portas: `DecisionProvider`/`Judge`, `GenerationProvider`, `WebCrawler` e `Dreaming`; não transformar um classificador ou embedding em gerador por troca de nome.

## Eve — identidade e API confirmadas

- Oficial: [vercel/eve](https://github.com/vercel/eve), cujo [README](https://raw.githubusercontent.com/vercel/eve/main/README.md) liga diretamente a `eve.dev`. Framework de agentes duráveis com autoria baseada em arquivos; está em beta.
- Pacote **`eve@0.80.1`**, Node **`>=24`**: [metadados npm](https://registry.npmjs.org/eve/0.80.1). Peer `ai: ^7.0.137`; não presumir compatibilidade com AI SDK antigo.
- APIs comprovadas: `defineAgent` de `eve`, `defineTool` de `eve/tools`, `Client` de `eve/client`, `defineMcpClientConnection` de `eve/connections`. [Exports de autoria](https://raw.githubusercontent.com/vercel/eve/main/packages/eve/src/public/index.ts).
- `defineAgent({ model: "<id-do-provedor>", reasoning: "high" })` define configuração. Não aceita `name`: o compilador deriva identidade do projeto. `defineTool({description, inputSchema, execute(input, ctx)})` define a ferramenta, com schema compatível e contexto real do runtime.
- O [README](https://raw.githubusercontent.com/vercel/eve/main/README.md) comprova `npx eve@latest init my-agent`, `npm run dev`, `eve link` e `eve deploy`; inicialização cria diretório, instala dependências e inicializa Git. Não executar scaffolding sobre o projeto existente sem avaliar esses efeitos.
- Cliente para um runtime já iniciado, conforme documentação distribuída em [`eve@0.80.1`](https://registry.npmjs.org/eve/-/eve-0.80.1.tgz), `package/docs/guides/client/overview.mdx`:

```ts
import { Client } from 'eve/client';
const client = new Client({ host: 'http://127.0.0.1:2000' });
await client.health();
const { response } = await client.sessions.create({ message: 'Analise este contexto.' });
const result = await response.result();
```

O mesmo pacote contém `docs/connections/mcp.mdx`: `defineMcpClientConnection({url, description, protocolVersionDiscovery: false})` suporta servidor com handshake `initialize` 2025-11-25. O `false` é ajuste por conexão quando o servidor não oferece `server/discover`, não um padrão obrigatório. Tokens podem vir de `auth.getToken`, fora dos argumentos produzidos pelo modelo.

No modo local/self-hosted, a durabilidade usa Workflow SDK e dados em `.eve/.workflow-data`; há exigências próprias de inicialização e versionamento. Fonte: `package/docs/concepts/execution-model-and-durability.mdx` no tarball acima. A leitura das declarações/README não demonstra que o runtime iniciou no Atlas.

## Invokta — capacidades de domínio e quatro transportes

- Oficial: [vinilana/invokta](https://github.com/vinilana/invokta), confirmado pelo repositório de cada pacote npm. **`@invokta/core`, `@invokta/cli`, `@invokta/mcp` versão `0.9.0`**, Node **`>=22.20.0`**. Fontes: [core](https://registry.npmjs.org/@invokta%2fcore/0.9.0), [cli](https://registry.npmjs.org/@invokta%2fcli/0.9.0), [mcp](https://registry.npmjs.org/@invokta%2fmcp/0.9.0).
- [Guia oficial](https://raw.githubusercontent.com/vinilana/invokta/main/docs/getting-started.md) e [exports core](https://raw.githubusercontent.com/vinilana/invokta/main/packages/core/src/index.ts) comprovam `defineCapability`, `defineConnector`, `createEngine` e `engine.invoke`.
- O runtime valida entrada e saída, autorização e execução. Invokta explicitamente não é model router, agent harness ou workflow engine: [README](https://raw.githubusercontent.com/vinilana/invokta/main/README.md). A política Atlas de roteamento precisa ser implementação do domínio.

Contrato mínimo, adaptado do exemplo oficial (não é implementação do Atlas):

```ts
import { createEngine, defineCapability } from '@invokta/core';
import { z } from 'zod'; // documentação usa Zod 4
const capability = defineCapability({
  description: 'Cria uma mensagem.',
  input: z.object({ name: z.string() }),
  output: z.object({ message: z.string() }),
  access: 'public',
  async run({ input }) { return { message: input.name }; },
});
const engine = createEngine({
  name: 'atlas-example', version: '1.0.0',
  capabilities: { 'atlas.example': capability },
});
await engine.invoke('atlas.example', { name: 'Ada' }, {
  source: 'direct', principal: null,
});
```

O ID é a chave de `capabilities`, não um campo duplicado dentro de `defineCapability`. Para capacidades protegidas, o principal confiável entra nas opções de invocação; não no input de negócio.

[MCP oficial](https://raw.githubusercontent.com/vinilana/invokta/main/packages/mcp/README.md): `serveMcpStdio(engine,{principal})`; `serveMcpHttp(engine,{port,auth:{mode:'required',authenticate}})`; endpoint padrão **`/mcp`**, HTTP stateless; `connectMcpClient({transport:'http',url,authentication:{type:'bearer',token}})`. Em Nest, preferir engine compartilhado no processo a criar um servidor MCP desnecessário; publicar MCP para consumidores de agentes quando houver esse fluxo.

## TypeSafe / Jev — decisão e judge, não geração

- Oficial hospedado: [typesafe.ai](https://typesafe.ai/) e [typesafe-ai/typesafe-sdk-js](https://github.com/typesafe-ai/typesafe-sdk-js). **`@typesafe-ai/sdk@0.7.0`**, Node **`>=22`**: [npm](https://registry.npmjs.org/@typesafe-ai%2fsdk/0.7.0), [README oficial](https://raw.githubusercontent.com/typesafe-ai/typesafe-sdk-js/main/README.md).
- [Código do cliente](https://raw.githubusercontent.com/typesafe-ai/typesafe-sdk-js/main/src/client.ts) comprova base **`https://api.typesafe.ai`**, **`POST /v1/systemone`**, Bearer auth e modelo padrão **`jev-latest`**. Variável do SDK oficial: **`TYPESAFE_API_KEY`**. `TypeSafeClient({apiKey,baseURL,defaultModel,...})` permite configuração; nunca duplicar `/v1` na base do SDK.
- `client.systemOne({state,questions})`; helpers **`noul`**, **`choice`**, **`score`**. Exemplo: `questions: {method: choice('Qual método?', {retrieve: null, answer: null}), supported: noul('A resposta é apoiada pelas fontes?')}`. `answers.method.choice` é a opção e `answers.supported.noul` a probabilidade. A rubrica, limiar de aceitação e fallback são políticas Atlas que precisam de avaliação própria.
- [Provider oficial Vercel](https://raw.githubusercontent.com/vercel/ai/main/packages/typesafe-ai/src/typesafe-ai-provider.ts) oferece `decisionModel`; `languageModel`, `embeddingModel` e `imageModel` lançam `NoSuchModelError`. Esse provider usa **`TYPESAFE_AI_API_KEY`**, nome diferente do SDK direto. Não misturar as duas configurações.
- A página solicitada [Jev LLM-as-a-judge](https://jevmodel.org/use-cases/llm-as-a-judge/) não pôde ser lida (403). Não inferir dela capacidades extras nem alegar renomeação comercial. O SDK hospedado já demonstra que `jev-latest` pertence à API TypeSafe.
- [feder-cr/jev](https://github.com/feder-cr/jev) é implementação local distinta do serviço TypeSafe. Seu [README](https://raw.githubusercontent.com/feder-cr/jev/main/README.md) anuncia **jevos-v5**, binário CPU/OpenVINO, formato `/v1/systemone`, `/health` e artefato `jev-linux-x64.tar.gz`. Memória anunciada: cerca de 1 GB, 1,4 GB com cache cheio; medidas são do autor em Intel Core Ultra 7 255H, não comprovação em AMD/6 GB. [Código CLI](https://raw.githubusercontent.com/feder-cr/jev/main/src/main.cpp) confirma `--threads`, `--ctx`, `--state-cache`, `JEV_API_KEY`. Não instalar como substituto transparente sem testar hardware, contratos e qualidade. A preferência Atlas de não executar inferência local torna isso opcional, desativado.

## SubQ Snap — fornecedor confirmado, contrato pendente

[https://subq.ai/](https://subq.ai/) é a identidade fornecida pelo usuário para o fallback generativo. Tanto o site quanto `docs.subq.ai` responderam bloqueio de túnel **403**. Não foi encontrado nesta pesquisa contrato primário acessível que comprove nome/ID **Snap**, base URL, endpoint de geração, streaming, auth ou compatibilidade OpenAI.

O npm retorna [`@subq-ai/subqcode@0.1.1`](https://registry.npmjs.org/@subq-ai%2fsubqcode/0.1.1), um wrapper binário `opencode`, sem README/repositório informados; isso não é evidência de SDK de inferência nem instrução de instalação. Não instalar nem deduzir API desse nome. Manter adaptador generativo configurável e não anunciar integração SubQ operacional até obter documentação oficial e chave. Um endpoint configurável de formato OpenAI representa capacidade do adaptador Atlas, não compatibilidade verificada de SubQ.

## Firecrawl — integração comprovada

- Oficial: [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl), [README](https://raw.githubusercontent.com/firecrawl/firecrawl/main/README.md). SDK Node recomendado atual **`firecrawl@4.46.0`**, Node **`>=22`**: [npm](https://registry.npmjs.org/firecrawl/4.46.0). Python instala **`firecrawl-py`**, importa `Firecrawl` de `firecrawl`; versão Python não verificada nesta pesquisa.
- `import {Firecrawl} from 'firecrawl'; new Firecrawl({apiKey}).scrape(url,{formats:['markdown']})`; Python `Firecrawl(api_key=...).scrape(url, formats=['markdown'])`.
- README comprova **`https://api.firecrawl.dev/v2/scrape`**, **`/v2/search`**, **`/v2/map`**, **`/v2/crawl`** e polling `GET /v2/crawl/{id}`; Bearer **`FIRECRAWL_API_KEY`**. O serviço hospedado exige chave/créditos; não houve chamada real.
- Existe [exemplo oficial Invokta crawl-engine](https://raw.githubusercontent.com/vinilana/invokta/main/examples/crawl-engine/README.md) com port `WebCrawler`, connector Firecrawl v2 e capacidades `crawl.scrape-page`, `crawl.map-site`, `crawl.crawl-site`; reaproveitar esse padrão, seus limites e cancelamento. Site/crawl arbitrário precisa manter a validação de destino do exemplo.
- MCP oficial **`firecrawl-mcp@3.30.3`**: [npm](https://registry.npmjs.org/firecrawl-mcp/3.30.3), [repositório](https://github.com/firecrawl/firecrawl-mcp-server). Preferir uma integração direta no worker ou engine a abrir simultaneamente conectores redundantes.

## Dreaming / Dream-RSI — identidade da API pendente

[https://www.dream-rsi.com/](https://www.dream-rsi.com/) respondeu **403**. Buscas npm por `dream-rsi` encontraram implementações de terceiros (`pi-dream-rsi`, `dsh-open-dream-rsi`), mas nenhum vínculo primário comprovado com o domínio solicitado. Não assumir que esses pacotes são oficiais, nem inventar endpoint/API.

Proposta Atlas independente de fornecedor: registrar avaliações e falhas, agrupar experiências em job assíncrono limitado, produzir candidatos de melhoria de prompts/políticas e promovê-los após replay de avaliações. Trata-se de desenho proposto, não alegação de integração Dream-RSI pronta. Sem inferência ou treino pesado local; não alterar automaticamente código/política de produção a partir de conteúdo recuperado.

## Antigravity CLI — instalação segura ainda bloqueada

O [README oficial Google Gemini CLI](https://raw.githubusercontent.com/google-gemini/gemini-cli/main/README.md) informa substituição para usuários unpaid/Google One em **18/06/2026** e direciona a [Antigravity CLI oficial](https://antigravity.google/product/antigravity-cli). Esse destino e `https://antigravity.google/docs/cli` responderam **403**. Não foi possível obter comando/artefato oficial de instalação nem versão nesta sessão.

**Não instalar `antigravity-cli` do npm:** [metadados](https://registry.npmjs.org/antigravity-cli/0.0.1) declaram literalmente “Antigravity CLI - placeholder”, sem repositório e com binário `kirox`. `@google/antigravity-cli` e `@google/antigravity` retornaram 404 no npm. Gemini CLI continua tendo comandos próprios documentados; instalá-lo não comprova instalação do Antigravity.

Próximo passo concreto: permitir acesso ao destino oficial e seguir o instalador/artefato ali publicado, validando plataforma Linux x86_64 e integridade conforme a documentação obtida. Nenhum `curl | sh`, wrapper comunitário ou pacote homônimo foi executado. Não há comando seguro confirmado a recomendar neste relatório.

## Bloqueios e critérios de conclusão

Acessíveis: `raw.githubusercontent.com` e `registry.npmjs.org`. Bloqueados por política de túnel: `eve.dev`, `www.invokta.dev`, `jevmodel.org`, `typesafe.ai`, `subq.ai`, `docs.subq.ai`, `www.dream-rsi.com`, `antigravity.google`. Um 403 de proxy não prova indisponibilidade do fornecedor.

Chaves serão adicionadas posteriormente pelo usuário. Validação remota ainda pendente: chamadas TypeSafe/Firecrawl, contrato e geração SubQ, contrato Dream-RSI e instalação oficial Antigravity. Acesso a código e instalação de dependências não substituem smoke tests autenticados. A demo local pode operar explicitamente com extração e políticas determinísticas, mas deve identificar esse modo e não chamar sua saída de geração remota verificada.

## Aplicação no incremento Atlas 0.2

A implementação usa três instâncias reais de `createEngine` com `defineCapability`, regras por principal/tenant, schemas, timeout e cancelamento. Os brains são uma abstração Atlas (`src/orchestration/brains.ts`), não um export nativo presumido do Invokta. Referência de categoria e limites: README oficial, seções “What Invokta owns” e “What an Action Engine can own”, relido nesta alteração. Arquitetura: [brains e engines](../architecture/brains-and-action-engines.md).
