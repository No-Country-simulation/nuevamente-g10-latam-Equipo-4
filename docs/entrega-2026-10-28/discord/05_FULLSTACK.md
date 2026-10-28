# Integração ponta a ponta

Comece pelo GUIA_TECNICO e trace: UI → BFF → comando Nest → brain → capability Invokta → Python → Factory/Eve → pacote/citações → recibo.

Use a branch de trabalho; main somente após revisão/CI. scripts/push-branch-both.sh confere os dois remotes e recusa main/master.

Rodar unidade, env, types, build, runtime de produção e E2E. Não usar mock para fechar gate de integração real. U02–U09 dependem do responsável pelas contas; não compartilhar chaves no canal.

Fonte/quiz/trilha/grupo/memória têm que preservar autorização, idempotência e retomada. Relatar falha com caminho, passo, resultado esperado e evidência sanitizada.
