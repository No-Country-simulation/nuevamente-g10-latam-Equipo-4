# Frente de backend

Gavetas Nest: modules, commands, orchestration e connections. Python: trails/policy-service-http, community/service-http, attempts e progression. SQLite é canônico.

Cuidados que viraram regressão: expiração precisa sobreviver ao409; barra final/case estático não pode escapar do ledger; consent/rollback/forget não repetem efeitos; apagar memória invalida respostas privadas inclusive durante chamada externa.

Prioridade: P01 outbox/reconciliação/contrato de chaves; P02 autenticação/tenant e cofre por proprietário; P03 aceite real. Em seguida P04/P05/P06. Ler ENV, ARQUITETURA e os contratos antes de criar endpoints.

Nenhuma política do Dreamer concede permissões, altera código ou substitui revisão de grounding. Não adicionar banco/broker/modelo local sem medição nos4GiB disponíveis.
