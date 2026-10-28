# Relatório de entrega e limites — Atlas 0.5

Entrega em branch `feat/andre-pos-mvp-quality-20261028`, para revisão e merge
posterior. Base: `3a58543` comum aos dois repositórios. Nenhuma main foi alterada.

## O que foi entregue

- Monólito com controllers Nest por responsabilidade e gavetas Python de
  trilhas, comunidade, tentativas e progressão. UI solicita comandos e apresenta
  projeções; desbloqueio, compatibilidade de material, acertos e XP são regras
  do backend.
- Quatro etapas persistentes de trilha com fontes/versionamento e retomada.
  Planejador inicial `local_template_v1`: ainda não é planejamento por LLM.
- Recibos SQLite de comandos com reserva, replay, conflito, limites de
  armazenamento, expiração e invalidação ao apagar memória. Resultados incertos
  não executam outra vez automaticamente; clientes sem chave ainda são aceitos.
- Eventos imutáveis de quiz e XP único em transação. Escrita de experiência
  Dreamer após commit tem lacuna conhecida de crash; outbox/reconciliação são P01.
- RAG de seções sem carregar fontes integrais; uploads repetidos pulam parser
  após validar tipo/assinatura. Jev continua decisão/avaliação, não embedder.
- Guia, Faísca, Prisma, Trama e Elo mantêm IDs anteriores. Personalização visual
  não muda ferramentas/permissões. Removidas provas sociais sem comprovação.
- API com dependências de produção separadas no Dockerfile; sem serviços pesados
  adicionais por padrão. Builds e ferramentas de qualidade ficam fora da VPS.
- Catálogo ENV, três PDFs, quinze specs executáveis, roadmap de três semanas,
  checklist U01–U16 e oito arquivos preparados para os canais da equipe.

## Compatibilidade com a equipe

A [análise da Taylam](COMPATIBILIDADE_TAYLAM.md) identifica três commits e os
pontos de sobreposição. Portamos correção de upload e fallback TypeSafe.
Preservamos o teste que exige autorização das fontes antes da leitura de memória;
a otimização paralela da colega requer revisão conjunta. A branch dela está intacta.

Commits desta entrega são feitos após revisão independente, com até 400 linhas
textuais alteradas por commit, inclusive documentação/lockfile. PDFs e capturas
são arquivos binários em commits próprios. O corpo de cada mensagem explica a
motivação; o histórico é o índice auditável dos incrementos.

## Evidência local e reprodução

| Verificação | Resultado e escopo |
| --- | --- |
| Unidade/integração de domínio | 42 testes API, 45 Python e 3 do loader ENV; nenhum skip. Incluem tenant, permissões Invokta, Dreamer, replay, concorrência, persistência e falha TypeSafe. |
| Sensores de qualidade | 5 testes de calibração de fronteiras/ratchet; análise real de funções e grafo; limites CC10/cognitiva TS15, sem piora de dívida legada. |
| E2E/HTTP | 14 cenários em Chromium desktop/mobile, um worker, sem retries; aplicação compilada, fixture isolada, fluxo extrativo. Mobile é emulação, não Safari real. |
| Tipos/builds | Next/Nest e autoria/runtime Eve compilados. Não implica inferência externa real. |
| Segurança de dependências | Auditoria npm de produção sem vulnerabilidades conhecidas na consulta. Não substitui SAST/pentest. |
| ENV | 62 referências catalogadas; carregamento preserva injeção e usa ATLAS_ENV_FILE canônico; seleção explícita ausente falha fechada. |
| Runtime enxuto | Ensaio executa API compilada com árvore production-only e Python; bootstrap, replay e XP único. Números em evidence/runtime.json são amostra RSS, não pico de carga. |
| Infra/artefatos | Compose config, sintaxe shell, actionlint e PDFs verificados localmente. Actions remotas e imagens Docker deste incremento não foram executadas. |

```bash
npm ci --include=dev --ignore-scripts
npm test
npm run typecheck
npm run build
npm run quality:setup
npm run quality
npm run check:env
npm audit --omit=dev --audit-level=high
npm run test:runtime
npx playwright install chromium
npm run test:e2e
```

Neste ambiente, o download do browser foi negado pela política de rede. Foi usado
o Chromium já instalado, explicitamente: `ATLAS_E2E_CHROMIUM=/usr/bin/chromium
npm run test:e2e`. A execução sem esse seletor falha por executável ausente;
nenhum teste foi removido ou marcado como aprovado por isso. O CI instala o
browser oficial. O harness roda o build de produção para reproduzir o deploy;
não depende de hot reload durante mutações da árvore.

Achados corrigidos durante a revisão: rollback da expiração de recibos, bypass
por URL codificada/slash/case estático, repetição de consentimento/rollback,
recibos após esquecimento, DELETE vazio rejeitado pelo BFF, assinatura de upload
antes do hash e seleção divergente do arquivo ENV. Corrigimos implementação e
reexecutamos os asserts. Não reduzimos thresholds nem trocamos a baseline.

Evidências resumidas versionadas em `evidence/`; relatório completo de símbolos
é reproduzido em `artifacts/quality/report.json` e retido pelo CI. O digest das
fontes permite conferir a árvore medida. O [parecer independente](REVISAO_INDEPENDENTE.md)
separa engenharia local de autorização humana/release.

## O que falta para MVP e pós-MVP

O aceite oficial ainda precisa de fornecedores reais, vetor semântico e
OCI Object Storage com readback em três cenários. O fluxo lexical gratuito
continua válido no cotidiano; um classifier não comprova embedding semântico.
Não há credenciais/recurso pago provisionado nesta entrega.

Antes de Internet: autenticação, autorização individual, isolamento de cofre,
retention/consentimento por usuário e revisão de segurança. A competição privada,
Eve, Invokta e Dreamer existentes não equivalem a aprendizagem autônoma sem
supervisão: promoção de políticas exige replay, limites e rollback. Evolução
coletiva, planejador LLM, colaboração ampliada, OCR/anotações/Obsidian e UX
com usuários continuam no [backlog P01–P15](BACKLOG_E_SPECS.md).

Não foram executados: pico em VM AMD com 4GiB disponíveis, carga prolongada,
backup/restore real, inferência/latência Jev, Firecrawl real, OCI readback real,
SAST/SBOM/mutation, Safari físico, eficácia pedagógica e revisão humana de release.
Limite Compose não prova consumo real. Não anunciar produção pronta.

## Entrega operacional

[Suas tarefas](SUA_PARTE.md) listam contas, modelos, IAM, orçamento, dados
permitidos, testes com alunos e revisão dos PRs. O [roadmap](ROADMAP_3_SEMANAS.md)
assume quatro integrantes e 51 pessoas-dia mais nove de reserva; registra
priorização e cortes se a capacidade/dependências não se confirmarem.

Os arquivos [Discord](discord/00_COMO_USAR.md) estão preparados para copiar e
anexar; não foram enviados a terceiros. O rascunho do cloud environment foi salvo
para revisão; não foi publicado/aplicado. A publicação Git desta entrega usa
somente a branch em ambos os remotes, sem force e sem merge automático.
