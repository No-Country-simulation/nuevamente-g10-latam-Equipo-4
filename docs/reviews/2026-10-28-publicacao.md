# Publicação via PR — 28/10/2026

O responsável autorizou merge em main via PR nesta sessão, substituindo a
restrição anterior de manter a entrega apenas na branch. Preservar commits,
sem squash e sem `--admin`, bypass de checks ou force push.

Ordem: abrir/conferir PR da `feat/andre-pos-mvp-quality-20261028` em ambos os
repositórios, aguardar os checks exigidos e mergear preservando commits. Depois
conferir o PR #1 da Taylam já reconciliado; publicar o comentário técnico,
aprovar somente o SHA corrigido com checks passando e mergear por PR. O outro
repositório recebe a mesma reconciliação por PR, para preservar os históricos.

A correção da Taylam descende de nossa entrega e do HEAD original dela. Assim,
quando a entrega principal entrar em main, o PR #1 fica limitado ao delta final.
Nenhuma branch deve ser apagada até confirmar os dois destinos.

Arquivos preparados:

- `2026-10-28-main-pr.md`: corpo do PR da entrega principal, para ambos os repos.
- `2026-10-28-taylam-pr-1-comment.md`: comentário técnico, com impacto/correção.
- `../entrega-2026-10-28/REVISAO_TAYLAM_PR.md`: parecer do código corrigido.

O Git funciona por HTTPS. Nesta sessão a API `api.github.com` retornou Forbidden
na política do ambiente; não confundir push de branch com merge/aprovação no
GitHub. Foi salvo rascunho acrescentando esse domínio, preservando os anteriores.
Salvar o rascunho não publica/aplica a configuração. Após publicação, consultar
PRs/checks com gh antes de qualquer merge. Se a API ainda negar autorização,
registrar o erro real em vez de substituir o merge por push direto à main.
