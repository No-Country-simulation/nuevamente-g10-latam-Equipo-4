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
- A landing segue o book Atlas enviado pelo usuário: fundo escuro, Instrument Serif/Plus Jakarta Sans, laranja, órbitas e escultura/globo. O estúdio em /studio preserva a estrutura Atelier, o leitor de fontes e as opções de foco/baixo estímulo. Personalizar nome/aparência não concede memória, ferramentas ou muda métodos.
- Validar mudanças importantes com testes de comportamento, typecheck/build e smoke real. Skills instaladas são ferramentas selecionáveis; não aplicar todas simultaneamente nem sobrepor requisitos explícitos do usuário.

- Credenciais manuais são criptografadas no servidor; nunca retornar chaves na API, localStorage ou estado durável Eve. Variáveis `_FILE` têm prioridade e falham fechadas. Next não monta o cofre.
- ChatGPT por assinatura usa o helper nativo do Eve somente em dev local habilitado; não é API de produção e não reutiliza a identidade do Codex desenvolvedor.
- O fluxo cotidiano usa recuperação lexical/seções e Jev opcional, sem exigir serviço dedicado de embeddings. Preserve o caminho semântico opcional para provar o requisito explícito do edital.
- Buildar imagens em GitHub Actions e usar GHCR é permitido pelo PDF; documentos e JSONs continuam obrigatoriamente no OCI Object Storage Always Free. Deploy na VPS usa pull por SHA, sem build e sem publicar o estúdio antes de autenticação.
