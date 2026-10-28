# Atlas 0.5 — especificação da entrega e contrato de qualidade

Data: 28/10/2026. Base sincronizada: `3a58543` nos dois repositórios.
Branch: `feat/andre-pos-mvp-quality-20261028`. Nenhum push desta entrega deve atualizar `main`.

## Objetivo e limites

Preparar uma evolução revisável do monólito modular, reduzir risco de duplicação
em retries e tornar trilhas e progresso regras do servidor. O pós-MVP completo
tem plano de três semanas; esta entrega não transforma integrações não testadas
em funcionalidades aprovadas. Dreamer, Eve e Invokta permanecem centrais.

## Requisitos executáveis

| ID | Critério de aceite |
| --- | --- |
| S01 | Fetch explícito das duas mains; preservar históricos; publicar somente branch de trabalho em ambos os remotes. |
| S02 | Comando com `Idempotency-Key` deve ter reserva persistente antes do efeito; mesmo payload devolve a resposta original; payload diferente retorna 409. Concorrência, reinício e resultado incerto nunca executam novamente a mesma chave. |
| S03 | Recibos têm limite de tamanho/quantidade, expiração de conteúdo sem reutilização automática da chave e invalidação após esquecer memória. Não guardar requisições/chaves de provedores. |
| S04 | Grupos, mensagens, XP, nível, desbloqueio de trilhas e conclusão de quiz são decididos no backend; o cliente só pede comandos e apresenta o estado. |
| S05 | Trilhas persistentes fixam fontes/versões, perfil e tutor. Sequência inicial explícita: compreender, revisar, praticar, sintetizar. Sem LLM, o planejamento é identificado como roteiro local. Nenhuma alegação de trilha gerada por IA sem chamada real. |
| S06 | Uma etapa só avança após pré-requisito. Material deve ter formato, tutor, perfil e fontes compatíveis. Quiz só conclui com acertos registrados pelo servidor; leitura é confirmação declarada, não prova de domínio. |
| S07 | Novos nomes públicos coerentes com Atlas, mantendo IDs e dados persistidos compatíveis. Nome pessoal do usuário continua prevalecendo apenas na apresentação. |
| S08 | `.env.example` e catálogo documentado cobrem variáveis lidas pelo código de aplicação/deploy, fontes de segredo e configurações opcionais. Nenhum segredo real ou OAuth fictício. |
| S09 | Testes unitários, concorrência/recuperação, integração HTTP e E2E desktop/mobile reproduzíveis no repo e CI; distinguir doubles de integrações reais. |
| S10 | Medir complexidade TS/Python e dependências; mudanças não podem introduzir ciclos nem aumentar funções legadas acima do limite. Novas funções de negócio: complexidade ciclomática ≤10 e cognitiva TS ≤15. Dívida existente permanece explícita. |
| S11 | Entregar arquitetura, guia técnico PDF, pitch PDF, roadmap de 15 dias úteis, lista de ações do responsável e arquivos Markdown/CSV prontos para os canais do Discord. Não enviar mensagens sem instrução. |
| S12 | Revisão por agente separado, com evidências e veredito por gate; aprovação de engenharia não significa liberação para produção ou aprovação humana do PR. |

## Arquitetura alvo

Next: apresentação/BFF. Nest: comandos, brains/Invokta, autorização local,
recibos idempotentes e integrações. Python: domínios de aprendizagem, comunidade,
trilhas, RAG e Dreamer, com SQLite canônico. Eve: execução das personas.
Módulos expõem serviços públicos; adaptadores HTTP não contêm regras pedagógicas.
O estado ainda é de um workspace local; autenticação pública será um gate do roadmap.

## Infra enxuta

Padrão sem Mongo, Qdrant, Trigger ou modelo local: quatro processos, SQLite WAL,
inferência externa, um trabalho pesado por vez. Build em Actions; imagens no
GHCR; documentos/JSONs em OCI Always Free no aceite. O teto de 2560 MiB dos
containers não é medição de pico. Release exige carga e restauração verificadas.

## Fora da aprovação local

Fornecedor real, OCI readback, vetores semânticos, latência de debates, eficácia
com alunos, login por assinatura, isolamento multiusuário e operação pública
precisam de evidência própria. O guia anterior e o edital continuam aplicáveis.
