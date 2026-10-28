# Roadmap de três semanas — fechamento e pós-MVP 1

Planejamento de 15 dias úteis, 28/10–17/11/2026, sem feriados locais contabilizados.
Datas são uma proposta de execução; replanejar se feriados/capacidade diferirem.
Esta branch entrega a base 0.5 e os contratos. A tabela é trabalho futuro,
nunca evidência de que funcionalidades já estão prontas.

## Capacidade e compromisso

Premissa: quatro integrantes, cinco dias por semana, aproximadamente seis horas
de projeto por dia. São 60 pessoa-dias nominais. O backlog propõe cerca de
51 pessoa-dias e nove de margem para integração, aprendizado e retrabalho.
Para iniciantes ou dedicação parcial, a capacidade é menor: preservar gates e
reduzir escopo, sem fingir que todas as funcionalidades cabem no calendário.
Dependências U02–U09 precisam de dono no primeiro dia.

Papéis: **BE** backend/contratos; **FE** frontend/UX; **FS** integrações/IA;
**SE** arquitetura/infra/QA. São funções, não contratações: associar aos nomes
reais em `BACKLOG.csv`. Revisão deve ter uma pessoa diferente do autor.

## Semana 1 — fechar fundamentos e comprovar o MVP

| Dia/data | BE | FE | FS | SE / evidência ao final |
| --- | --- | --- | --- | --- |
| D1 28/10 | P01: contrato de comandos/outbox | Inventário das jornadas e acessibilidade | U02–U07; diagnóstico Eve/Jev/OCI | Definir donos/capacidade e baseline; abrir PR desta branch sem merge automático. |
| D2 29/10 | P02: sessão e identidade confiável | Estado de login/erros, sem painel público aberto | P03: geração/judge/busca reais | Confirmar bucket/quota/IAM e matriz de segredos; fixture de aceite sem dados sensíveis. |
| D3 30/10 | P01: falhas/reconciliação e eventos transacionais | E2E de retry, expiração e navegação | P03: embeddings/reindex/readback | Rodar três cenários reais; manter bloqueio se faltar fornecedor. |
| D4 02/11 | P02: autorização por recurso/usuário | Troca de sessão e tratamento de acesso negado | P04: contrato do planejador de trilhas | Revisar isolamento adversarial. Se feriado da equipe, deslocar calendário e capacidade. |
| D5 03/11 | P02: cofre por proprietário | Jornada fonte → material → quiz → trilha | P03: falha de fornecedor e orçamento | Gate M1: aceite obrigatório do edital, CI e demonstração. Sem aceite, registrar pendência e conter release. |

## Semana 2 — evoluir aprendizagem e colaboração

| Dia/data | BE | FE | FS | SE / evidência ao final |
| --- | --- | --- | --- | --- |
| D6 04/11 | P04: trilha persistente/adaptação/versionamento | Próximo passo e recuperação de sessão | P11: conceitos/pré-requisitos citáveis | Contratos e testes de grounding; sem prometer diagnóstico do aluno. |
| D7 05/11 | P06: membros/papéis/moderação | P09: leitor e anotações por fonte/página | P05: replay/holdout com provedores reais | Medir cobertura dos mundos e rollback; coletividade continua opt-in separado. |
| D8 06/11 | P06: convites e ranking opcional | P08: UI/export do grafo físico | P04/P11: testes pedagógicos controlados | Gate M2a: autorização, consentimento e conflito em todos os recursos. |
| D9 09/11 | P08: export Obsidian seguro e reimport versionado | P12: fluxos com iniciantes, teclado e celular | P10: OCR/visual remoto opcional | Corpus de PDFs difíceis, limites, orçamento e falhas sem truncamento silencioso. |
| D10 10/11 | P05/P06: exclusão e isolamento coletivo | P09/P12: anotações e estados vazios | Revisar resultados de professores/alunos | Gate M2: trilhas + comunidade + Dreamer sem vazamento, com cenários adversariais. |

## Semana 3 — enxugar, medir e polir

| Dia/data | BE | FE | FS | SE / evidência ao final |
| --- | --- | --- | --- | --- |
| D11 11/11 | P13: decompor hotspots sem mudar contratos | P12: decompor UI e corrigir fricção | P07: custo/latência de debates e modelos | Medir carga em limite real de 4 GiB; RAM, OOM, fila e RSS/PSS. |
| D12 12/11 | P07: fila global e cancelamento | P12: acessibilidade e desempenho de produção | P05: avaliação final de promoção/abstenção | P14: telemetria sem prompts/chaves; ensaio de falhas. |
| D13 13/11 | Correções de bloqueadores | Congelamento de features; E2E completo | Reconferir aceite e qualidade pedagógica | Gate M3: backup/restore, rollback, orçamento e revisão independente. |
| D14 16/11 | Hotfixes revisados | Polimento final e demo guiada | P15: três demonstrações/vídeo | Publicar imagens somente após merge aprovado; staging e deploy por SHA com rollback. |
| D15 17/11 | Revisão de contratos/runbooks | Conferência final com iniciantes | Material de pitch e evidências reais | Gate M4: revisão humana, checklist de entrega e relatório final. Se gate faltar: release bloqueado, não “pronto”. |

## Definição de pronto e plano de corte

Cada tarefa exige implementação, unidade/integração/E2E relevantes, documentação,
env, autorização/limites e review. Integrações exigem resposta real e recibo;
um mock não fecha P03. Um LLM não aprova o próprio material nem a própria mudança
de política. Métrica média não compensa falha de segurança ou de grounding.

MVP obrigatório e núcleo Dreamer/Eve/Invokta não são cortes silenciosos. Se a
capacidade cair, os primeiros itens a sair do release são OCR/multimodal (P10),
reimport Obsidian de mão dupla (parte de P08) e ranking público (parte de P06).
Manter specs e registrar o desvio no board; o usuário precisa saber que o
pós-MVP completo não foi atingido. Não implementar inferência local, Mongo como
fonte canônica, Trigger self-host ou Rust para cumprir artificialmente a data.

## Reuniões e acompanhamento

Check-in diário de 10 min: resultado verificável, próximo passo, bloqueio e dono.
Revisão de 30 min em cada gate semanal. A sprint meet usa o roteiro do pacote
Discord; links de PR/testes/evidências ficam no canal `links`. Não postar segredos,
documentos de alunos ou logs de prompts. As specs de cada Pxx estão em
[BACKLOG_E_SPECS.md](BACKLOG_E_SPECS.md), com CSV para o board.
