# Revisão independente — integração de autenticação e builds

Data: 2026-11-11. Candidato: HEAD `2acc28a0156ae2547e4453d0f61eb16a6e3a51ac` com merge em andamento de `f8fa867d6248be8ed3b6fab7279c805bab1c765d` e alterações no working tree. Esta revisão refere-se ao conteúdo local, não a uma publicação.

O digest de fontes do quality gate é `a0044a96ff6f4b379be218b4130d77cacbe78d42cbe20d9a1df3b8885657f948`. Recalculei-o a partir dos arquivos atuais: os 255 caminhos, a revisão do DevKit e o digest de política coincidem com `artifacts/quality/report.json`, cuja decisão é PASS. Não há alterações na política ou baseline de qualidade.

Revisei autenticação, isolamento de tenant, propagação aos jobs e ferramentas Eve, upload e proveniência, capacidade do desktop e configuração dos workflows. Identifiquei inicialmente um bloqueio no canal Eve: `import.meta.env` ficava indefinido no Node e rejeitava tickets válidos. A correção usa `process.env`. Executei independentemente `npm run test:eve-auth`: o servidor Eve compilado aceitou ticket válido e rejeitou ticket inválido e alterado. O workflow executa esse teste após o build Eve. Não encontrei outro bloqueio concreto no escopo revisado.

Os demais resultados abaixo foram verificados pela leitura dos logs locais em `artifacts/verification-2026-11-11/integration-*.log`, não reexecutados nesta revisão:

- API 81, Python 78, web 7, scripts 5, desktop 16 e E2E 26 testes passaram.
- Typecheck, builds, runtime e quality passaram; o teste HTTP/browser de autenticação também passou. O audit de runtime registrou uma vulnerabilidade de baixa severidade; o audit desktop registrou zero vulnerabilidades.
- O teste nativo local não executou porque `xvfb-run` não está disponível. O job CI mantém os três testes nativos.

OAuth real, OCI, carga em 4 GiB e prontidão de produção não foram comprovados por esta revisão. Os checks CI remotos ainda devem passar antes da integração nas branches principais. Este registro não constitui aprovação humana nem certificação de segurança.
