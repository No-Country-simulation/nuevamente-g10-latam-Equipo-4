# Atlas — plano do primeiro incremento

**Objetivo:** transformar o checkout vazio em um fluxo local real de fonte → material citável → prática, com design do HTML e arquitetura evolutiva para o MVP ONE.
**Spec:** [SPEC.md](./SPEC.md). Execução autorizada pelo usuário imediatamente após consolidar a spec. Continuar sem confirmação intermediária e manter o checkout existente. O usuário autorizou posteriormente commit e push do código; deploy público continua fora do escopo.
**Stack:** Next/TypeScript; NestJS + Eve/Invokta; Python/FastAPI/SQLite; SDK OCI opcional; Motion/Anime, Radix e Material UI.

## Restrições globais

Workspace único local até autenticação de produção; loopback; segredos server-side. Inferência pesada externa. Tokens limitados. Nenhum score ou upload fictício. Demonstrativo extrativo distinguido de geração LLM. Arquivos de fonte não são instruções. Contratos em packages/contracts/index.d.ts; rota web /api/atlas/* faz proxy server-side para Nest /v1/*, que autentica chamada interna para Python /v1/*.

## Tarefa 1 — Fontes e material real

- [x] Implementar `services/cognition/` com SQLite/FTS, uploads limitados, passagens/âncoras, recuperação vector/hybrid/lm e Pydantic.
- [x] Expor documentos, fontes, bootstrap e geração conforme contrato; prova de upload e citação recuperada de arquivo real.
- [x] Adapters LLM/embedding e Object Storage com limites e readback; sem chaves, modo extrativo explícito.
- [x] Testar isolamento por tenant, arquivo inválido, abstenção e formatos.

## Tarefa 2 — Orquestração e fronteira

- [x] Implementar Nest em apps/api; validar entradas e token interno; encaminhar tenant fixo local do servidor.
- [x] Integrar API real de Eve/Invokta onde comprovada, TypeSafe para decisão tipada e política como fallback explícito.
- [x] Mapear erros seguros, sem incluir chaves em logs; Firecrawl sem importação de URL arbitrária.
- [x] Adicionar quiz/XP idempotente e grupos/chat locais via Python.
- [x] Dreamer basilar: memória consentida separada do frontend, ciclos persistidos, proposta/avaliação baseline-candidato/promoção/rollback e configuração de serviço externo; sem chave, estado aguardando avaliação explícito.

## Tarefa 3 — Interface integrada

- [x] Implementar apps/web: sidebar, agentes, estúdio, fontes em papel, upload, perfil/formato/objetivo e método automático.
- [x] Consumir /api/atlas/bootstrap, documents, generations, chat, progress, quiz e grupos; mensagens de falha e capacidades reais.
- [x] Mostrar tutorial/flashcards/quiz/resumo, exportar JSON e abrir página citada; agente selecionado independente do método.
- [x] UI responsiva, modo foco/redução, SVG/canvas2D documental, prática e comunidade local sem métricas inventadas.
- [x] Aplicar Motion e Anime somente em interações úteis; Radix e MUI compartilham tokens.

## Tarefa 4 — Validação e operação

- [x] Scripts de instalação/start/stop controlado, .env.example completo, README com arquitetura e limites.
- [x] Docker/Compose AMD64 com limites somando menos de 6GB; portas públicas ausentes; não declarar Always Free sem checar SKU.
- [x] Tests Python e Node, typecheck/build e smoke HTTP com documentos/quiz/idempotência.
- [x] Capturar a UI desktop e mobile; revisar funcionalidade, acessibilidade básica e ausência de chaves no bundle.
- [x] Registrar resultados reais e pendências em docs/STATUS.md e salvar setup/start do ambiente.

## Revisão de interfaces e decisões

Web e API compartilham o contrato TypeScript de dados. Nest acrescenta decisões validadas e Python verifica novamente decisões/limites. Questões corretas e token interno nunca transitam no contrato público. O primeiro corte usa leitor textual por página, não anuncia PDF.js/quad implementado. Dreamer é núcleo deste primeiro corte: ciclo, política versionada e rollback; avaliação externa ausente impede promoção, sem impedir captura consentida de memória. Trilhas LLM completas são evolução.

## Incremento 0.3 — factory, times e 4 GB

- [x] Copiar o principal ao destino No Country antes das novas mudanças, preservando históricos.
- [x] Publicar a spec e os incrementos nos dois repositórios, sem force push.
- [x] Catálogo único, sessões Eve autenticadas e ferramentas Invokta com escopo mínimo.
- [x] Times com mensagens cruzadas, Jev na avaliação/seleção e síntese privada ao usuário.
- [x] Adaptar Dream-RSI: históricos reais, simulador sem novas execuções, split de validação e promoção restrita.
- [x] Jobs persistentes, recuperação e revisão de memória; conectores opcionais Qdrant/Mongo/Trigger.
- [x] Containers com orçamento principal de 2560 MiB incluindo Eve; Qdrant opcional de 512 MiB.
- [x] Testes, builds, smoke HTTP, Qdrant real controlado e Eve prewarm/reset autenticado.
- [x] Atualizar README e guia didático de arquitetura.
- [ ] Inferência/decisão/judge/embeddings/Firecrawl reais, custo/latência e provas OCI após inserir credenciais.
- [ ] Autenticação pública, memória coletiva, trilhas completas e avaliação pedagógica com usuários.

Os números e limites deste incremento prevalecem sobre os registros históricos
0.1/0.2 acima. Veja `docs/STATUS.md` para distinguir testes reais de fixtures.
