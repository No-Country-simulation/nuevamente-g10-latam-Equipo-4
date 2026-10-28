# Gates de engenharia e de release

Política desta branch: `policy.json`. Limites definidos na spec antes da medição:
CC≤10 para funções novas de backend/adaptadores e cognitiva TS≤15. Função legada
acima do limite não pode piorar. Dívida existente é um resultado explícito,
nunca um certificado de simplicidade. UI declarativa TSX também está sujeita ao ratchet: funções novas ou pioras
acima do limite falham. Dívida legada fica explícita, com types/build/E2E e
decomposição em P12/P13.

## Ferramenta auxiliar e proveniência

Utilizamos os adapters de medição e grafo do
[Quality Engine](https://github.com/andrecodexvictor/Quality-engine), revisão
`d9b145878d2f3d1d9956edb82a1ecbbbd50a4862`. Não instalamos o MCP global, não
executamos `quality-admin`, não alteramos política administrativa nem emitimos
`release.assess` em nome de revisão humana. É uma integração de desenvolvimento
que mede a árvore local e tem perfil de gates próprio explicitamente versionado.
O código da ferramenta fica ignorado em `.quality-tools`, fora do runtime.

TS: ESLint classic/SonarJS por função. Python: Radon6.0.1+AST por função. Não
comparar números cognitivos entre linguagens: só TS tem esse sensor. O grafo TS
é analisado por workspace com seus aliases; ciclos type-only são separados.
Erro de parser, import local não resolvido ou analyzer ausente não é PASS.
Regras de fronteira adicionais impedem importar SDK/backend privado na UI.

```bash
npm run quality:setup
npm run quality
npm run check:env
npm audit --omit=dev --audit-level=high
```

`artifacts/quality/report.json` contém revisão-base, algoritmo, hash da política,
digest das fontes medidas, símbolos e dívida. É feedback da worktree, não
evidência de release. Mudança da base/política/tool exige revisão; não regenerar
baseline para ocultar regressões. CI e review humano devem avaliar o SHA real.

## Matriz obrigatória

| Gate | Critério de falha | Evidência |
| --- | --- | --- |
| Funcionalidade | Regra quebrada, teste crítico removido ou skipped sem justificativa | Unitários Node/Python, integração e E2E reais. |
| Idempotência | Efeito repetido, replay alterado, reserva reutilizada após crash ou payload trocado aceito | Concorrência, reinício, quotas, esquecimento, grupos/mensagens e quiz. |
| Complexidade | Função nova acima do limite ou legado acima do limite agravado | Mesmo algoritmo/base; relatório de símbolos. |
| Arquitetura | Novo ciclo runtime, import privado no cliente ou grafo obrigatório incompleto | Grafo completo e revisão das gavetas. |
| Segurança | Chave exposta, acesso alheio permitido, origem indevida aceita ou vulnerabilidade alta/crítica runtime | Cofre/tenant/CSRF controlados, auditoria de dependências e revisão. |
| Contratos | Type/build/schema inválidos ou variável de aplicação sem exemplo | Compiladores, builds e `check:env`. |
| UX | Jornada principal falha em desktop/mobile, citação inacessível ou falso estado de sucesso | Chromium E2E e capturas. Auditoria a11y ampliada é P12. |
| Recursos | OOM, fila sem limite, build necessário na VPS ou evidência de carga ausente | P07; limite de Compose não substitui benchmark. |
| Aceite externo | Falta de LLM/Jev/vetores/OCI reais ou cenários do edital | P03 e relatório de aceite. |
| Governança | Main alterada nesta entrega, parecer humano forjado ou publicação automática fora de escopo | Branch em ambos os remotes; review separado e revisão humana pendente. |

Um agente independente revisa código/evidências e pode pedir correções. Não tem
autoridade para aprovar política humana, dispensar SAST ou liberar produção.
Os gates locais são conjunção; nenhum score médio compensa bloqueador. O release
segue INCONCLUSIVO/BLOQUEADO até os gates externos e humanos. SAST/SBOM/mutation
não executados precisam constar no relatório, sem marcação verde inventada.
