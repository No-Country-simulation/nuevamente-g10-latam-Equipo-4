# Estado do kickoff — 18/10/2026

Esta entrega inicia a implementação da [spec consolidada](SPEC.md). É um workspace local funcional; o MVP completo e o deploy Oracle continuam em desenvolvimento. Não houve publicação pública da aplicação nem provisionamento de infraestrutura paga. O envio das fontes ao GitHub não constitui deploy.

## Implementado

| Área | Comportamento disponível |
| --- | --- |
| Interface | Design Atelier do HTML anexado, cinco personas, biblioteca/upload, estúdio, evidências, prática, grupos e painel Dreamer; Motion, Anime.js, Material UI e Radix |
| Documentos | PDF textual, Markdown e TXT; limites de tamanho/páginas; índice SQLite/FTS; fontes e citações por página/seção |
| Materiais | Tutorial, flashcards, quiz e resumo; JSON estruturado em `conteudo_adaptado`; abstenção quando não há evidência |
| RAG | Vetor, híbrido e documento integral com orçamento explícito; reindexação atômica ao trocar modelo |
| Aprendizado | Métodos automáticos com possibilidade de substituição pelo usuário, quiz com respostas no servidor e XP idempotente |
| Agentes | Configuração Eve para Nilo, Lumi, Prisma, Fio e Soma; chat individual e histórico consentido; ferramenta de pesquisa via Nest/Invokta |
| Dreamer basilar | Consentimento, eventos e casos de replay, proposta restrita, avaliação baseline/candidato, promoção versionada, rollback, exclusão e invalidação de operações pendentes |
| Memória externa | Contrato autenticado e configuração para outra VM/serviço HTTPS; frontend sem credenciais |
| Operação | Setup reproduzível, exemplo de variáveis, processos separados, containers AMD64 e limites de memória |

Sem credenciais, o gerador usa trechos literais e o índice usa hashing lexical de demonstração. Isso não equivale a geração LLM nem a embeddings semânticos. A interface informa o modo e a avaliação ausente. As etapas de processamento locais não são conversas fictícias entre modelos.

O Dreamer já faz parte do serviço. Sem LLM e judge, registra a dependência de avaliação e não promove uma melhoria. Os testes de promoção usam provedores controlados e demonstram o contrato, não eficácia pedagógica com usuários. Políticas promovidas influenciam o método automático e a geração seguinte; não alteram código, segurança, autorização ou limites.

## Evidências e validação

- Testes de domínio: 14 casos Python, incluindo isolamento de fontes, formatos, abstenção, citações, XP, consentimento, replay, exclusão concorrente e reindexação atômica.
- Política/orquestração: 11 testes Node; preferência aprovada do Dreamer respeita a escolha explícita do usuário.
- Proxy Next: 8 verificações de rotas, origem, payload, erros e retenção de credenciais no servidor.
- Navegador: fluxo real em desktop 1440px, tablet 820px e celular 390px; upload/geração/chat/quiz/fonte, redução de movimento e ausência de overflow horizontal ou erros JavaScript no percurso inspecionado.
- PDF real do briefing anexado: extração de 6 páginas e 13.850 caracteres, seguida de persistência local.
- Revisão independente: cinco achados de consentimento/concorrência/orçamento corrigidos e revalidados; relatório em [review/kickoff.md](review/kickoff.md).

- `bash scripts/setup.sh`: instalação com lockfiles concluída, preservando o `.env` existente.
- `npm run typecheck`: aplicações e configuração de agentes aprovadas.
- `docker compose build`: Nest e Next standalone compilados e três imagens AMD64 construídas com validação TLS ativa.
- Eve: build com cinco sandboxes virtuais JS e modelo explícito de teste; health `ready`, acesso anônimo negado e acesso de serviço autenticado aprovado. Nenhum turno de inferência foi executado.
- `bash scripts/reindex.sh`: 20 passagens locais reindexadas, mantendo fontes e citações.

Capturas de tela são outputs locais ignorados em `apps/web/artifacts/`.

## Verificação dos containers

`docker compose up -d --wait --wait-timeout 90` concluiu com os três serviços saudáveis e usuários sem root. O smoke completo e as oito verificações do proxy passaram nas imagens de produção. O teste identificou e corrigiu inicialmente a propriedade de arquivos copiados com permissão 0600; as imagens finais já atribuem os arquivos ao usuário do serviço.

Além do smoke, foi enviado o PDF de especificação anexado: **41 páginas, 60.420 caracteres, upload/extração/indexação em 2,71s**. A geração extrativa terminou em 2,77s totais e quatro citações foram conferidas contra as páginas originais. É uma observação única neste host, não benchmark de inferência ou de uma VM Oracle.

| Serviço | Limite cgroup | Pico individual observado (`memory.peak`) |
| --- | --- | --- |
| Next standalone | 768 MiB | 134,3 MiB |
| Nest | 512 MiB | 84,7 MiB |
| Python + parser | 1536 MiB | 64,7 MiB |
| Soma | 2816 MiB | 283,6 MiB (soma dos picos individuais) |

Depois desse percurso, `docker stats` indicou cerca de 178 MiB em uso pelo núcleo. Os números excluem SO, Docker daemon, ferramentas de desenvolvimento e runtime Eve; não incluem LLM/embeddings remotos nem carga multiusuário. O alvo de 6GB ainda precisa de ensaio de carga no hardware Oracle. O build deve ocorrer fora da VM-alvo.

O token interno teve zero ocorrências nos arquivos versionáveis e no bundle estático da imagem web final. O container web recebe somente o token do proxy e a URL interna; chaves dos provedores não são repassadas a ele. O `.env` local permanece ignorado no Git e com permissão 0600.

A construção repetida das imagens preencheu o disco de 32GB da sessão. Foram removidos apenas imagens antigas, sandboxes e caches de build produzidos neste trabalho; fontes, `.env`, bibliotecas de documentos e volumes de dados foram preservados. Esse incidente de disco não foi tratado como consumo de RAM do produto.

Ao encerrar a verificação, os containers foram parados preservando o volume `atlas-data`, e `npm run dev` foi reiniciado. O bootstrap integrado voltou a responder com os cinco agentes. A biblioteca de desenvolvimento fica em `data/`; a biblioteca do teste em containers permanece no volume Docker separado.

## Integrações ainda dependentes de execução real

| Integração | Situação |
| --- | --- |
| Eve/Invokta | APIs e schemas consultados no código dos pacotes oficiais; Invokta executa ações tipadas no fluxo local. Eve possui configuração compilável; inferência entre agentes depende de modelo/chaves |
| TypeSafe/Jev | SDK oficial para decisão e judge; falta executar e calibrar com chave real. Não é o serviço de embeddings |
| SubQ Snap | Site fornecido pelo usuário registrado; contrato, modelo e compatibilidade ainda não confirmados. Não há endpoint inventado |
| Firecrawl | Adapter de `/v2/search` e ferramenta Eve; falta chamada autenticada real |
| OCI | SDK com instance principal/perfil externo, upload e conferência por readback; falta bucket/identidade e prova real do original+JSON, obrigatória para concluir o MVP |
| Memória em outra VM/Railway | Contrato preparado; serviço externo não provisionado nem testado |
| Dream-RSI | Inspiração registrada; não presumimos SDK instalado ou integração oficial com o artigo |
| Antigravity CLI | Não instalado: documentação oficial inacessível neste ambiente; pacote npm homônimo não comprovou origem oficial |

Os sites oficiais de alguns fornecedores retornaram bloqueio do proxy nesta sessão. A pesquisa e as fontes verificadas estão em [research/integrations.md](research/integrations.md). Adicionar domínios ao rascunho do ambiente não demonstra acesso atual nem execução de integração.

## Dependências

O lockfile usa override de `guarded-fetch` para 0.1.6, removendo o alerta alto de `undici` presente na árvore original. `npm audit` terminou com zero alertas altos/críticos e três moderados relacionados à mesma dependência transitiva `sprintf-js` (GHSA-hp3w-g68c-fv3c), sem correção compatível anunciada pelo audit. Não aplicamos downgrade forçado de Eve. Ferramentas padrão de execução ficam desativadas; atualizar/remover esse caminho antes de habilitar execução de comandos ou liberar o runtime publicamente.

Nesta versão de npm com workspaces, `npm ls` ainda sinaliza a versão sobrescrita como divergente do pin upstream. Instalação congelada, compilação e runtime usam 0.1.6, como confirmado no build Eve. Esse diagnóstico de metadados não foi apresentado como teste aprovado.

## Próximos incrementos

1. Inserir credenciais no servidor, confirmar o contrato SubQ e executar geração/decisão/judge/embeddings/pesquisa reais com fontes de teste.
2. Validar original e JSON no OCI Object Storage com readback; confirmar SKU AMD, cotas e custo da conta Oracle.
3. Avaliar Dreamer com dataset e revisão humana, depois separar memória/runtime quando os números justificarem.
4. Implementar trilhas completas geradas por LLM, leitor PDF com anotações e grafo físico editável.
5. Adicionar autenticação e isolamento multiusuário antes de grupos públicos, ranking, memória coletiva consentida e deploy na Internet.

O chat de grupos atual tem um único participante local; não representa uma comunidade multiusuário pronta. O grafo inicial representa fontes locais; não anuncia física Obsidian concluída. Não há OCR nem runtime Rust nesta fase.

## Ambiente cloud reutilizável

Foram salvas instruções de instalação dos oito packs de skills e do projeto, inicialização dos três serviços, readiness e verificações. A allowlist preserva os domínios anteriores e acrescenta os destinos oficiais de Eve, Invokta, TypeSafe, SubQ, Dream-RSI, Antigravity, Vercel AI Gateway e Firecrawl. Nenhuma credencial foi incluída no rascunho.

O salvamento do rascunho foi confirmado; ele não aplica mudanças à máquina nem publica o ambiente. Para ativar essa configuração, revise/salve nas configurações do ambiente e publique-o. A restauração em uma nova tarefa ainda não foi testada. O código deste kickoff é versionado separadamente da publicação do ambiente; `.env`, bibliotecas locais e volumes Docker ficam fora do Git.

## Incremento 0.2 — brains e Action Engines

A integração inicial limitada a duas capacidades foi substituída por cinco brains de domínio e três Action Engines Invokta: aprendizagem, pesquisa e memória. Geração/chat compartilham seleção de fontes, memória consentida e decisão; pesquisa, judge e controles Dreamer usam capacidades autenticadas. Brains não recebem permissão para consentir, apagar, iniciar ciclos administrativos ou fazer rollback. Veja [arquitetura e capacidades](architecture/brains-and-action-engines.md).

Foram adicionados oito testes de comportamento ao conjunto Node (11 no total), cobrindo Invokta real com portas controladas. As medições de containers acima pertencem à versão anterior e não são uma nova medição desta refatoração. Integrações remotas continuam pendentes das mesmas credenciais.

Validação 0.2 concluída: 11 testes Node, typecheck incluindo configuração Eve, compilação Nest, smoke HTTP e oito verificações de proxy passaram. Uma requisição real de chat com Lumi percorreu o novo brain; o catálogo interno respondeu com cinco brains/três engines, recusou acesso anônimo e permaneceu indisponível no BFF. Os provedores desse teste foram o modo extrativo local e fixtures controladas, sem inferência remota.
