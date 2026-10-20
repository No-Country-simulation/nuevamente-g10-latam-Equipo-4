# NovaMente Atlas — regras do projeto

Leia docs/SPEC.md, docs/STATUS.md e docs/research/integrations.md antes de alterar arquitetura ou declarar integrações prontas.

- Use o checkout existente. As tarefas cloud já são isoladas; não crie worktrees sem pedido explícito.
- Stack: Next.js/TypeScript, NestJS, Python. Eve orquestra agentes; Invokta expõe ações tipadas. Rust somente na fase 2 após profiling.
- Dreamer é núcleo do sistema: memória consentida, autoaperfeiçoamento pedagógico com replay, versões e rollback. Não remova nem adie silenciosamente esse módulo. Nunca se autoconceder ferramentas, permissões ou alterar segurança.
- Agente, método cognitivo e formato são entidades independentes. O decision model sugere; o usuário pode substituir e os limites de execução são do servidor.
- Nunca exponha chaves de Typesafe, LLM, embeddings, Firecrawl ou OCI no cliente, NEXT_PUBLIC_, logs, prompts para terceiros não autorizados ou Git. Mantenha .env.example atualizado, sem segredos.
- Cite somente passagens existentes e autorizadas. Sem credenciais, modo extrativo explícito; não chamar hashes lexicais de embeddings semânticos ou inventar veredito do judge/recibo OCI.
- OCI Object Storage é obrigatório para encerrar o MVP. Sempre verificar upload com readback. Não provisionar recursos pagos nem presumir que AMD/6GB está em Always Free.
- Alvo AMD64/6GB: inferência externa, um parser isolado, backpressure, sem banco/broker pesado. Memória e agentes podem ser movidos para outra VM via contrato autenticado; frontend permanece sem credenciais.
- Não publicar na Internet antes de autenticação/isolamento multiusuário. Esta primeira versão é um workspace local em loopback.
- Preserve o design Atelier do HTML de referência e suas opções de foco/baixo estímulo. Não troque por dashboard genérico ou pelo print do portal do hackathon.
- Validar mudanças importantes com testes de comportamento, typecheck/build e smoke real. Skills instaladas são ferramentas selecionáveis; não aplicar todas simultaneamente nem sobrepor requisitos explícitos do usuário.
