# Estado do Atlas 0.4

A camada de agentes foi ampliada segundo [SPEC_AGENT_FACTORY_V03.md](SPEC_AGENT_FACTORY_V03.md).
O código está disponível para desenvolvimento local. Enviar fontes ao GitHub não
é deploy: não houve publicação pública nem provisionamento de VM/serviço pago.
O MVP completo continua dependendo de integrações reais e autenticação pública.

## Conexões, auditoria e entrega — 24/10/2026

O redesign da equipe `ca87c9e` foi integrado sem force push, preservando a
landing editorial, assets e `/workspace`. `/studio` continua funcional e ambos
os estúdios têm `/settings`; o criador Seu Atlas foi mantido na landing.

O PDF oficial foi conferido: Object Storage e prova vetorial são obrigatórios;
Compute OCI é diferencial. Build Actions/GHCR é permitido. A matriz de pendências
está em [AUDITORIA_MVP_POS_MVP.md](AUDITORIA_MVP_POS_MVP.md); arquitetura em
[conexões e entrega](architecture/connections-and-delivery.md).

- Painel `/studio/settings`: ambiente/arquivo de segredo, chave manual cifrada e
  instruções de login ChatGPT local, desativado por padrão e recusado em produção.
- SDKs independentes no modelo dinâmico Eve: OpenRouter/OpenAI-compatible,
  Anthropic e AI Gateway. Chaves são resolvidas fora dos prompts.
- Cofre AES-256-GCM, AAD de tenant/versão, escrita atômica, master externa e
  snapshot de configuração durante operações Python. Next não monta o cofre.
- Uso cotidiano segue lexical/seções/LM RAG com Jev opcional, sem serviço dedicado
  de embeddings. Caminho semântico opcional preservado para o critério do edital.
- Metadados tipados com termos das fontes e tempo heurístico; pré-requisitos
  explicitamente não inferidos. Script de aceite exige três cenários reais,
  suporte Jev, prova vetorial e recibos OCI verificados.
- CI/checks e quatro imagens AMD64; publicação manual GHCR por SHA; Compose e
  script de deploy com pull/up sem build. API/Python/Eve alinham UID no volume.

Verificações deste incremento: 30 testes Node + 37 Python; typecheck dos apps e
modelos Eve; build Next/Nest e compilação nativa Eve. Chromium desktop/mobile
conferiu chave manual sem eco/localStorage, leitura da configuração pelo Python,
restauração de ambiente, gate do login local, rejeição de origem/destino arbitrário
e navegação. Smoke HTTP e oito verificações do proxy passaram em modo extrativo.
Runtime Eve ativo: health, ticket inválido, prewarm/reset autenticado, sem turno
LLM. Workflows passaram por actionlint; Compose e scripts de deploy validados.

Ainda não verificados: login do operador, geração/judge/busca/embeddings reais,
readback OCI real, primeira execução remota Actions/GHCR e pull na VPS. A mudança
de UID/volume foi definida no empacotamento, sem benchmark de containers novos.
Nenhum serviço pago, VM ou registry foi provisionado; o estúdio não foi exposto
publicamente. O guia PDF foi atualizado para a edição 1.3, 42 páginas/34 capítulos.
As medições de containers abaixo são históricas da versão 0.3.

## Landing e identidade pessoal — 21/10/2026

A entrada `/` segue o novo book Atlas; o estúdio existente está em `/studio`.
O criador permite nome, cor e tutor-base, com preferência local validada,
edição/restauração no estúdio e manutenção dos IDs das personas no backend.
Método e consentimento Dreamer continuam independentes. Não há sincronização por
conta nem nome personalizado nos prompts nesta primeira etapa.

Validação deste incremento: typecheck web e build Next de produção; fluxos reais
em Chromium para criação, edição, restauração, persistência após reload, chat com
ID original e método automático, armazenamento bloqueado, dados locais inválidos
e consentimento Dreamer preservado. Sem overflow horizontal em 320, 390, 768,
1024 e 1440 px; menu mobile e preferência de movimento reduzido conferidos.
As oito verificações do proxy continuam passando. Rotas `/`, `/studio` e arte WebP
retornam 200 no standalone de produção, com CSS, fontes e hidratação verificados.

O PDF foi atualizado para edição 1.2, com 37 páginas e 31 capítulos. A nova seção
foi renderizada e revisada; nenhum texto está fora das páginas. Tokens, arquivos
e limites estão em [DESIGN_ATLAS.md](DESIGN_ATLAS.md). O estágio Docker web copia
os assets públicos; não foi necessário adicionar dependências ou serviços.

## Implementado na camada de agentes

| Área | Comportamento |
| --- | --- |
| Agent Factory | Um runtime Eve com cinco personas autenticadas, catálogo compartilhado por Nest/Python/Eve, contratos por propósito e backpressure |
| Times | Nilo/Fio trocam propostas; Lumi/Soma revisam quando necessário; a persona escolhida sintetiza. Três a cinco turnos sequenciais |
| Jev/TypeSafe | Decisão de método/RAG, relevância documental/web, avaliação das propostas e escolha entre times. Saídas passam por gates |
| Invokta | Três Action Engines reais; ferramentas com principal de brain e permissões limitadas. O modelo não recebe o token administrativo |
| Debate privado | Resultado público contém material/fontes. Auditoria de turnos fica no backend com consentimento, separada do pool usado pelo proponente |
| Dream-RSI | Exploração real → árvores avaliadas → simulador de histórico → candidata → validação separada → promoção/rollback. Replay sem executar novamente agente/judge |
| Jobs Dreamer | SQLite, deduplicação, lease, tentativas limitadas, recuperação e invalidação por revisão de memória |
| Qdrant opcional | REST com filtros tenant/documento/modelo, payload só de referências e troca de coleção após reindexação |
| Mongo opcional | Projeção externa de metadados, TLS, pool pequeno, índices, paginação e backfill. SQLite permanece canônico |
| Trigger opcional | Despacho idempotente por IDs e task externa com callback/token exclusivos; scheduler local continua padrão |
| Operação | Compose de 4 serviços com limites somando 2560 MiB; Qdrant local opcional acrescenta 512 MiB |
| Biblioteca | Metadados pré-calculados e índices por workspace/documento; listar fontes não carrega seus textos integrais no Python |
| Ambiente | Scripts preservam credenciais/variáveis injetadas e completam apenas ausências com `.env`; exemplos sem segredos |
| Documentação | README detalhado e guia didático PDF com 34 capítulos, fontes Markdown e diagramas editáveis |

A interface Atelier, upload PDF/MD/TXT, três estratégias RAG, quatro formatos,
citações canônicas, quiz/XP idempotente, chat individual e grupos locais continuam
presentes. Sem modelos/embeddings configurados, a demonstração é extrativa e
lexical, explicitamente identificada. Não há debate, score ou melhoria fictícios.

## Verificações concluídas

- 22 testes Node: Invokta, brains, tickets, escopo, limite de execução/cancelamento global, troca de
  propostas, revisões, síntese e recusa de citações/propostas não autorizadas.
- 32 testes Python: documentos/RAG, persistência,
  grounding/XP, replay sem chamadas remotas, cobertura de ramos, promoção,
  cancelamento, exclusão, auditoria privada, filas, backpressure e conectores.
- Typecheck dos dois apps e autoria Eve; build Next/Nest; build do runtime Eve
  0.80.1 com modelo/teto de contexto explicitamente informados.
- Smoke HTTP real nos containers: upload, material, citações, quiz/XP, Dreamer,
  grupo/chat. O modo usado foi `extractive_demo`, sem API generativa remota.
- Oito verificações reais do proxy Next: método, rotas internas, origem, formato,
  multipart e limites de corpo/arquivo.
- Eve real: health, recusa de ticket inválido, prewarm autenticado e reset pelo SDK.
  Nenhum turno de modelo foi solicitado nessa verificação.
- Qdrant 1.15.4 real: ingestão, consulta filtrada, recusa entre workspaces e
  reindexação com coleção nova. Embeddings foram vetores controlados de teste.
- PyMongo 4.19.0 instalado; queries de projeção verificadas com driver controlado,
  sem MongoDB remoto. SDK/task Trigger 4.7.6 com instalação congelada e typecheck;
  despacho verificado com HTTP controlado, sem conta externa provisionada.
- PDF na edição anterior 1.2: 37 páginas e 31 entradas de sumário, extração de texto, links locais conferidos,
  renderização visual dos capítulos novos e nenhuma palavra fora da página.

Testes controlados demonstram mecanismos e contratos. Não comprovam qualidade de
um fornecedor, latência real de debate ou eficácia educacional em pessoas.

## Recursos observados e seus limites

| Container | Memória observada após smoke/health | Limite |
| --- | --- | --- |
| Next | aproximadamente 101 MiB | 384 MiB |
| Nest | aproximadamente 59 MiB | 384 MiB |
| Python | aproximadamente 38 MiB | 896 MiB |
| Eve | aproximadamente 103 MiB | 896 MiB |
| Soma aproximada | 301 MiB | 2560 MiB |

São amostras da demonstração local e de um runtime Eve sem inferência. Não são
benchmark de pico, parser máximo, debate remoto ou multiusuário. O host de teste
não foi limitado a 4 GB; os limites individuais dos containers foram aplicados.
Nas amostras não houve OOM nem restart dos quatro serviços saudáveis. Qdrant foi
exercitado separadamente sob limite de 512 MiB, com corpus pequeno de teste.

A imagem standalone Eve ficou com cerca de 246 MB; inicia o servidor Nitro
compilado diretamente, sem exigir o CLI e fontes do projeto em produção. As
imagens-base foram construídas com CA pública por secret BuildKit e TLS ativo.
A API atual foi reempacotada com os artefatos TypeScript novos sobre as mesmas
dependências congeladas. O Dockerfile do projeto continua fazendo build a partir das
fontes. O daemon cloud usa VFS: seus builds/cache ocuparam o disco temporário;
foram removidos apenas caches e imagens antigas desta tarefa, preservando dados.
Por isso o build deve ficar em CI/máquina própria, fora da VPS de operação.

## Dependências para operação real

- Inserir chaves no servidor e validar geração Eve, Jev, embeddings e Firecrawl
  com fontes não sensíveis. Medir custo/latência do fluxo completo.
- Confirmar contrato/modelo SubQ Snap antes de habilitar fallback. O modo `direct`
  é explícito; uma falha Eve não troca de fornecedor silenciosamente.
- Provar upload e readback do original e JSON no OCI Object Storage, obrigatório
  no MVP. Confirmar SKU AMD, região, quotas e preço. OCIR guarda imagens; a VM
  executa serviços; Object Storage guarda documentos e resultados.
- Antes de usar memória externa, validar identidade, retenção e exclusão nos dois
  lados. `forget` Atlas não é purge de backups, provedores ou runs Workflow.
- Escolher e testar serviços externos Qdrant/Mongo/Trigger apenas se necessários.
  Trigger self-host não cabe neste orçamento; seus requisitos oficiais excedem 4 GB.
- Autenticação e isolamento multiusuário antes de Internet, comunidade pública e
  memória coletiva. Trilhas completas, leitor PDF com anotações e grafo físico
  continuam no backlog. A eficácia pedagógica exige avaliação com usuários.

## Publicação e ambiente cloud

Os mesmos commits são enviados aos dois repositórios por `scripts/push-both.sh`,
que confere o SHA e informa falha parcial sem force push. A importação inicial
preservou os dois históricos, cujas árvores eram iguais.

Setup/start e allowlist do ambiente têm rascunho próprio. Salvar esse rascunho não
aplica a política à máquina nem publica um snapshot. Processos devem ser
reiniciados pela instrução salva após uma restauração. Não há alegação de
restauração futura validada ou deploy público concluído.
