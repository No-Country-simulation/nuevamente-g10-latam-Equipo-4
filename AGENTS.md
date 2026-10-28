# NovaMente Atlas — regras do projeto

Leia docs/SPEC_AGENT_FACTORY_V03.md, docs/SPEC.md, docs/STATUS.md, docs/architecture/connections-and-delivery.md e docs/research/integrations.md antes de alterar arquitetura ou declarar integrações prontas.

- Use o checkout existente. As tarefas cloud já são isoladas; não crie worktrees sem pedido explícito.
- Stack: Next.js/TypeScript, NestJS, Python. Eve orquestra agentes; Invokta expõe ações tipadas. Rust somente na fase 2 após profiling.
- Dreamer é núcleo do sistema: memória consentida, autoaperfeiçoamento pedagógico com replay, versões e rollback. Não remova nem adie silenciosamente esse módulo. Nunca se autoconceder ferramentas, permissões ou alterar segurança.
- Agente, método cognitivo e formato são entidades independentes. O decision model sugere; o usuário pode substituir e os limites de execução são do servidor.
- Nunca exponha chaves de Typesafe, LLM, embeddings, Firecrawl ou OCI no cliente, NEXT_PUBLIC_, logs, prompts para terceiros não autorizados ou Git. Mantenha .env.example atualizado, sem segredos.
- Cite somente passagens existentes e autorizadas. Sem credenciais, modo extrativo explícito; não chamar hashes lexicais de embeddings semânticos ou inventar veredito do judge/recibo OCI.
- OCI Object Storage é obrigatório para encerrar o MVP. Sempre verificar upload com readback. Não provisionar recursos pagos nem presumir que AMD/4GB disponíveis está em Always Free.
- Alvo AMD64/4GB disponíveis: inferência externa, um parser isolado, backpressure, sem banco/broker pesado. Memória e agentes podem ser movidos para outra VM via contrato autenticado; frontend permanece sem credenciais.
- Não publicar na Internet antes de autenticação/isolamento multiusuário. Esta primeira versão é um workspace local em loopback.
- A landing preserva a direção Atlas e o redesign editorial da equipe (ca87c9e): preto/bege, assets de marca e Instrument Serif/Plus Jakarta Sans. O estúdio em /workspace, com alias /studio, preserva a estrutura Atelier, o leitor de fontes e as opções de foco/baixo estímulo. Personalizar nome/aparência não concede memória, ferramentas ou muda métodos.
- Validar mudanças importantes com testes de comportamento, typecheck/build e smoke real. Skills instaladas são ferramentas selecionáveis; não aplicar todas simultaneamente nem sobrepor requisitos explícitos do usuário.

- Credenciais manuais são criptografadas no servidor; nunca retornar chaves na API, localStorage ou estado durável Eve. Variáveis `_FILE` têm prioridade e falham fechadas. Next não monta o cofre.
- ChatGPT por assinatura usa o helper nativo do Eve somente em dev local habilitado; não é API de produção e não reutiliza a identidade do Codex desenvolvedor.
- O fluxo cotidiano usa recuperação lexical/seções e Jev opcional, sem exigir serviço dedicado de embeddings. Preserve o caminho semântico opcional para provar o requisito explícito do edital.
- Buildar imagens em GitHub Actions e usar GHCR é permitido pelo PDF; documentos e JSONs continuam obrigatoriamente no OCI Object Storage Always Free. Deploy na VPS usa pull por SHA, sem build e sem publicar o estúdio antes de autenticação.

## Entrega atual — branch obrigatória

- Leia docs/entrega-2026-10-28/SPEC.md, ARQUITETURA.md, GUIA_TECNICO.md e docs/quality/README.md.
- Trabalhar na branch feat/andre-pos-mvp-quality-20261028; não atualizar main nesta entrega. scripts/push-branch-both.sh verifica os dois remotes. Não usar push-both.sh.
- Proibido bypass para testes verdes: não remover/skippiar testes críticos, afrouxar asserts, mudar expectativas para combinar com bug ou reduzir gates/baseline. Corrigir código e repetir regressão. Achados externos sem evidência permanecem pendentes.
- Novas regras de negócio devem ficar no backend; usar as gavetas commands/modules/trails/community/attempts/progression. UI usa projeções e pede comandos.
- Recibos: normalizar segmentos estáticos/slash sem alterar case de IDs; expirar conteúdo fora de transação de reserva que pode falhar; consent/rollback/exclusão também são comandos idempotentes. Esquecer invalida recibos privados antes de exclusão externa.
- Nomes públicos Guia/Faísca/Prisma/Trama/Elo; IDs nilo/lumi/prisma/fio/soma permanecem.
- Analisadores rodam apenas em desenvolvimento/CI. Ratchet também na UI; dívida legada explícita, nenhuma piora acima dos limites. Revisão por agente não é aprovação humana ou produção.

- Após revisão independente, commits desta entrega com no máximo 400 linhas textuais alteradas por commit; PDFs binários separados. Todo commit deve explicar o porquê no corpo. Conferir taylam/backend e registrar conflitos/decisões antes da publicação.
