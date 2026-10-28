# Revisão da branch da Taylam

Consulta em 28/10/2026: `origin/taylam/backend` em
`b9454802bcb8b1bd15b15042c0311ef4d9f9a0b0`. As duas main continuam na
base `3a58543be83239cd42f48edd9398a18b17f26140`.

A branch da colega não foi alterada. Foram comparados os três commits,
a diferença completa desde a base e os caminhos que nossa modularização moveu.

| Commit da Taylam | Alteração | Tratamento nesta entrega |
| --- | --- | --- |
| `c720cf4` | Corrige acentos do nome multipart no upload | Portado ao novo `LibraryController`. O controller antigo em main foi dividido; preservar a correção no módulo evita perdê-la na refatoração. |
| `deb1238` | TypeSafe indisponível em judge/selectTeam/evaluateEvidence | Portado para policy. Falha resulta em `not_evaluated`/abstenção, sem inventar pontuação. Teste adicional força falha do SDK nas três operações. |
| `b945480` | Consulta fontes e estado de memória em paralelo | Não portado: inicia leitura de memória antes de validar IDs de fontes. Quebra a garantia já testada de rejeitar fontes não autorizadas antes dessa leitura. Mantivemos o teste e a ordem de autorização. |

## Integração posterior sem perder trabalho

As correções foram portadas com atribuição nos commits. Não há merge fictício
que marque a paralelização como incorporada. Um merge posterior de
`taylam/backend` pode apontar conflito textual em `apps/api/src/main.ts`, pois
os endpoints migraram para `apps/api/src/modules/`. A resolução correta é
preservar a composição enxuta e a correção em `library.controller.ts`.
`policy.ts` já contém o comportamento de fallback da colega.

Antes do merge humano, comparar novamente os SHAs: esta análise cobre somente
o estado indicado, não novos commits futuros. Para retomar a otimização de
memória, propor um contrato de snapshot autorizado ou medir o custo primeiro;
não retirar o teste de autorização para aceitar a paralelização.

```bash
git fetch origin refs/heads/taylam/backend:refs/remotes/origin/taylam/backend
git log --oneline main..origin/taylam/backend
git diff main...origin/taylam/backend
npm test
npm run typecheck
```

## Atualização para o PR #1

A consulta posterior encontrou `68f6c25390a2925ef095be46ff553c821d45fecc`.
A Taylam já reverteu a paralelização em `8d99053`; o ponto anterior está resolvido.
Também adicionou testes TypeSafe e uma rota DELETE sem correspondente no Python.
A revisão atual reconcilia os históricos, preserva os testes com falha de SDK
determinística e não porta a rota incompleta. Veja
[parecer do PR](REVISAO_TAYLAM_PR.md). A análise anterior registra o estado
histórico, não uma pendência atribuída à colega depois do revert.
