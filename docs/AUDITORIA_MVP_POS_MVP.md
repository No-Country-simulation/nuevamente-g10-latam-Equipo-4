# Auditoria do MVP e pós-MVP — 24/10/2026

Comparação entre a primeira spec versionada (`c86d386:docs/SPEC.md`), o código atual e o PDF **Projeto 1 – NovaMente – Sistema Inteligente de Adaptação e Geração de Conteúdo Educacional**, reenviado nesta conversa. As solicitações posteriores acrescentam Eve/Invokta, Dream-RSI, times privados, orçamento de 4 GB, book Atlas e conexões configuráveis. Implementação sem credenciais não equivale a uma integração real validada.

PDF consultado: 6 páginas; SHA-256 `eff0a6006a8461ddca95f44a6c915d605a9a7526a5344c8b7b26070d679ef011`. O documento é evidência de requisitos, não uma autorização para criar recursos.

## O que o edital efetivamente exige

| Página do PDF | Exigência e consequência |
| --- | --- |
| 1–2 | Segmentação, embeddings vetoriais, LLM e metadados de aprendizagem. Jev é classificador/judge e não substitui embeddings. |
| 3 | Objetivo do MVP: entrada PDF/MD/texto, RAG com geração e busca de embeddings, LLM, JSON, interface ou REST e OCI Object Storage. |
| 3 | “Requisito Obrigatório (MVP): OCI Object Storage”. Originais e JSONs precisam estar no bucket. |
| 3–4 | OCI Compute é “Recurso Opcional / Diferencial”. Não é obrigatório hospedar o app inteiro na Oracle. |
| 4 | Usar estritamente a camada Always Free da OCI; apresentar pelo menos três cenários a partir do mesmo documento. |
| 5 | Checklist: pelo menos dois perfis e dois formatos, três exemplos, integração OCI ativa e documentação com diagrama. |
| 6 | Frameworks equivalentes são aceitos. Next/Nest/Python, Eve e Invokta são compatíveis com a flexibilidade descrita; não há exclusividade de LangChain/Streamlit. |

Não há obrigação de buildar na VM, usar OCIR ou manter imagens Docker no Object Storage. GitHub Actions + GHCR podem construir e guardar as imagens. O bucket OCI continua obrigatório para os dados do produto. O documento não comprova que uma VM AMD com 4 GB é Always Free; não provisionar um SKU pago para cumprir um diferencial opcional.

## Matriz verificável

| Item da primeira spec / edital | Estado | O que falta para aceite |
| --- | --- | --- |
| PDF textual, Markdown, TXT, limites e isolamento documental | Implementado e testado localmente | Executar os cenários com fontes de demonstração aprovadas pela equipe |
| Segmentação, FTS, contexto de seções/documento completo | Implementado | Calibrar qualidade com perguntas reais |
| Busca sem serviço dedicado de embeddings | Padrão operacional lexical; Jev opcional para reranking | Não anunciar similaridade lexical como semântica |
| Embeddings semânticos e busca vetorial | Adaptador opcional, índice versionado e reindexação | Configurar um provedor permitido, inclusive gratuito se disponível, e provar a geração/busca real para o edital |
| LLM / adaptação de tom, perfil e formato | Eve e modo direto explícito implementados | Chave ou login local válido; geração real e revisão humana |
| Cinco personas, brains e Action Engines | Implementado; SDK e contratos testados | Medir chamadas reais, custo e latência |
| Debate privado e avaliação Jev | Implementado; teste de troca de propostas e gates | Validar com chave Jev, sem expor simulações de debate à interface |
| Métodos automáticos e substituição manual | Implementado | Dataset pedagógico para avaliar a escolha |
| Tutorial, flashcards, quiz e resumo | Implementado | Demonstrar pelo menos dois formatos e dois perfis com LLM real |
| JSON, citações e quiz/XP sem gabarito público | Implementado | Guardar as evidências finais do aceite |
| Conceitos-chave e tempo estimado | Metadados tipados adicionados | Termos extraídos das passagens; tempo explicitamente heurístico. Não é prova de eficácia |
| Pré-requisitos pedagógicos | Identificados como não inferidos | Acrescentar inferência citável e validar pré-requisitos; não inventar uma lista |
| OCI Object Storage | SDK, escrita e readback implementados | Bucket Always Free, identidade mínima e prova de original + JSON verificados |
| Três demonstrações do mesmo documento | Roteiro automatizado de aceite adicionado | Rodar `node scripts/acceptance.mjs` com provedores reais/OCI e revisar os resultados |
| Dreamer individual / Dream-RSI | Replay, consentimento, fila, gates, versão e rollback implementados | Histórico consentido suficiente e ciclos reais com modelo/judge. Benefício humano ainda precisa ser avaliado |
| Memórias compartilhadas entre agentes do workspace | Estado e contexto autorizados existentes | Validar integração real e retenção dos serviços externos |
| Comunidade / grupos | Chat e grupos locais implementados | Identidade multiusuário, moderação, publicação consentida e políticas de ranking |
| Trilhas completas geradas por LLM | Pendente | Plano versionado, pré-requisitos, missões e agentes dentro das atividades |
| Grafo físico / Obsidian | Pendente | Exportação, notas, relações tipadas e confirmação humana |
| Leitor PDF original / anotações | Extração paginada existente | PDF.js/anotações; OCR e multimodal no pós-MVP |
| Crie seu Atlas | Nome/cor/tutor-base locais implementados | Sincronização por conta e autoapresentação do modelo são etapas futuras |
| Landing do book e estúdio Atelier | Implementado e conferido em desktop/mobile | Testes com usuários, acessibilidade e eficácia pedagógica |
| Painel de conexões | Implementado neste incremento | Chaves reais, conectividade externa e validação de cada provedor |
| Cofre / ambiente / arquivo de segredo | Leitura de env e `*_FILE`, chave manual criptografada | Gestão operacional de rotação/backup. Não há provisionamento automático de OCI Vault |
| Login ChatGPT | Helper nativo do Eve preparado para dev local | Operador habilita e conclui `/login`; não é OAuth do Atlas nem assinatura disponível para produção |
| SDKs de provedores independentes | OpenAI-compatible/OpenRouter, Anthropic e Gateway integrados ao Eve | Testar os modelos escolhidos, ferramentas e JSON reais |
| Deploy em 4 GB disponíveis | Limites definidos; imagens pré-compiladas | Benchmark real sob carga de IA e confirmação de custo/SKU |
| CI / registry | Workflows e Compose sem build adicionados | Primeira execução no GitHub e publicação manual das imagens. Validação local de YAML não é execução remota |
| Autenticação pública | Pendente / bloqueio de publicação | Sessões, usuário/tenant derivados do servidor, CSRF, quotas, isolamento de chaves e testes cruzados |

## Ordem de execução

1. **MVP local demonstrável:** configurar geração, Jev e OCI; manter busca lexical no cotidiano e ativar o caminho vetorial apenas para provar o critério obrigatório. Completar os três cenários, metadados pedagógicos e revisão de fidelidade.
2. **Operação:** executar CI, publicar imagens por SHA, preparar volume/backup, pull na VPS e medir carga. Manter acesso local/privado enquanto não houver autenticação.
3. **MVP público, se desejado:** autenticação e isolamento por usuário antes de abrir o estúdio ou permitir chaves pessoais de visitantes.
4. **Pós-MVP:** trilhas completas, pré-requisitos validados, grafo físico, PDF/anotações/OCR, grupos multiusuário, moderação e memória coletiva consentida.
5. **Depois de profiling:** Rust, novas divisões de serviços e otimizações que justifiquem a complexidade. Qdrant/Mongo/Trigger externos continuam opcionais.

Nenhuma pendência de serviço externo foi marcada como concluída só por existir uma variável ou SDK. Chaves reais, login local, bucket e quotas pertencem à conta do operador; não foram criados serviços pagos.
