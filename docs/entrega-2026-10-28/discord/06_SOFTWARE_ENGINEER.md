# Arquitetura e governança

Proposta: monólito modular poliglota, quatro processos, SQLite canônico, modelos externos, Actions/GHCR fora da VPS e OCI para documentos/JSONs.

Quality Engine fixado por SHA é utilizado como sensor; não instalamos MCP global nem assumimos autoridade administrativa humana. Ratchet inclui UI, métricas TS/Python distintas, grafo completo com aliases e fronteiras por AST. Dívida antiga não pode piorar. Erro/inconclusivo nunca conta como PASS.

Ler RELATORIO e REVISAO_INDEPENDENTE. Gate de engenharia da branch não libera Internet/produção. Auth, OCI real, carga4GiB, backup/restore, revisão pedagógica e humana são portas próprias.

São proibidos skips, supressões, redução de asserts/thresholds ou rebaseline para esconder bug. Falha exige correção de código e regressão.
