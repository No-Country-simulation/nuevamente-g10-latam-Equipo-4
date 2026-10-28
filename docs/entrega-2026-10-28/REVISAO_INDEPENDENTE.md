# Parecer independente — implementação Atlas 0.5

Revisor: agente separado `/root/quality_reviewer`. Data: 28/10/2026.
Este é um parecer técnico de um agente, não aprovação humana ou certificação
do Quality Engine. Nenhum código, teste, política ou dependência foi alterado
pelo revisor. As correções foram feitas pelo autor e reavaliadas.

## Veredito e vínculo com as fontes

**PASS para engenharia local no escopo da branch 0.5.** Não restam bloqueadores
locais identificados após as correções e regressões descritas abaixo.
**Release público: NÃO APROVADO.** Os gates externos e humanos continuam abertos;
este parecer não autoriza merge, publicação pública ou dispensa de requisitos.

A revisão final aconteceu na worktree, antes dos commits de implementação,
conforme solicitado. A identidade verificável da árvore avaliada é:

```text
branch: feat/andre-pos-mvp-quality-20261028
base: 3a58543be83239cd42f48edd9398a18b17f26140
sourceDigest: 3270019cf20a001b516a4d34f6a5ce45259470b59187614cb8cab845adfd082a
policyDigest: fc97002c0917206cb568e9157b85e2e99ae7b492490357ae0fb5b92dd48330bc
Quality Engine auxiliar: d9b145878d2f3d1d9956edb82a1ecbbbd50a4862
```

O revisor recomputou o SHA-256 dos arquivos em `evidenceFiles` e usou assertion
de igualdade com `artifacts/quality/report.json`. Foram conferidos `decision`,
ausência de falhas e completude do grafo. São 616 símbolos medidos, 96 arestas
no grafo TypeScript, zero ciclos runtime e zero imports locais não resolvidos.
Documentação e este parecer não fazem parte do digest de fontes; o relatório
declara explicitamente esse escopo. O SHA de commits posteriores deve manter
o mesmo digest antes de reutilizar o parecer.

### Conferência depois dos commits

Após os commits preparados pelo autor, o revisor conferiu o candidato
`c3534f252617393d79cdf905b426f35f237093de`. O digest das fontes passou a:

```text
e0820f8887a8cf07a6235984fb1d01b297c640af2bfd0bc9db02531bd61d919c
```

A única diferença de bytes no conjunto avaliado foi a remoção de um newline
extra no EOF de `apps/api/src/context.ts`. O revisor recompôs esse único byte
virtualmente durante o cálculo, sem alterar o arquivo, e obteve exatamente o
digest pré-commit `3270019c…adfd082a`. Portanto não houve diferença semântica de
implementação após o parecer. A nova medição manteve PASS, 616 símbolos e 96
arestas, sem novos ciclos/imports não resolvidos. Arquivos documentais anexados
depois deste candidato não alteram as fontes aprovadas nem aprovam o release.

## Gates examinados

| Gate | Resultado local | Evidência e limite |
| --- | --- | --- |
| Idempotência | PASS | Reserva persistente antes do handler, JSON canônico, conflito de payload, replay após reabrir SQLite, duas conexões, quotas/UTF-8, TTL persistido e invalidação. Resultado incerto não libera a chave. |
| Aliases HTTP | PASS | Case/slash e IDs percent-encoded normalizados, preservando casing do recurso. O revisor reproduziu o bypass original e verificou sua correção com Express/HTTP reais. Encoded slash e caminho malformado são recusados. |
| Privacidade e Dreamer | PASS local | Consentimento/rollback/exclusão participam do ledger; exclusão invalida caches antes do efeito remoto e permite replay do próprio recibo. Escrita atrasada não recria conteúdo no cache. Isso não prova purge de backups ou de fornecedores. |
| Trilhas e aprendizagem | PASS | Pré-requisitos, material compatível e acertos do quiz são verificados no backend. Leituras são autodeclaração explicitamente rotulada. XP e evento de tentativa são transacionais; recompensas não duplicam. |
| Complexidade | PASS no ratchet | CC ≤ 10 / cognitiva TS ≤ 15 para novas violações e regressões; TSX também está sujeito ao gate. Matching de baseline é um a um: copiar hotspot não herda orçamento legado. Dívida existente continua listada, sem ser considerada resolvida. |
| Fronteiras | PASS local | Grafo TS com aliases por workspace; controles AST para imports estáticos/dinâmicos/require e acesso do cliente a servidor/SDK. Novos módulos Python foram inspecionados e não introduzem ciclo identificado. Não há sensor cognitivo Python equivalente ao SonarJS. |
| Credenciais e configuração | PASS local | Cofre e fontes env/arquivos mantidos; nenhuma chave nova no cliente/Git. Loader customizado é coerente entre processos. Contrato de env: 62 referências/variantes verificadas, sem ler valores secretos. |
| Dependências | PASS na auditoria executada | Auditoria runtime registra zero vulnerabilidades conhecidas. Não substitui SAST, SBOM, revisão de fornecedores ou monitoramento contínuo. |
| Empacotamento | PASS nos ensaios locais | Dependências production-only da API e execução compilada verificadas. `/data` preparado para UID10001; nested node_modules preservados. Não houve prova de novos containers sob carga de 4 GiB. |
| Interações e E2E | PASS | 14 cenários desktop/mobile sobre Next standalone, Nest compilado e Python, com credenciais externas desligadas. O harness de produção mantém os asserts e verifica assets reais. Sem retries/skips para obter verde. |
| Governança | PASS para preparar commits | Branch separada, main não é destino; commits de implementação devem ocorrer depois deste parecer, com limite de 400 linhas e explicação do motivo. Revisão humana e CI remoto continuam pendentes. |

## Problemas encontrados e corrigidos

1. **TTL revertido por rollback:** expiração dentro da reserva era desfeita no
   próprio 409 ou na quota cheia. Expiração passou a autocommit independente,
   com manutenção periódica e teste que lê `state/body` do SQLite após a recusa.
2. **Bypass por aliases de rota:** slash/case e posteriormente `%5F` em IDs
   contornavam o middleware enquanto Express executava o mesmo endpoint.
   Normalização/validação por segmento e regressões HTTP corrigiram o problema.
   No ensaio independente, duas chamadas encoded e a canônica passaram a
   devolver o mesmo ID1; encoded slash retornou 400.
3. **Consentimento/rollback sem replay:** repetição com a mesma chave podia
   incrementar revisão e invalidar jobs. Os comandos foram incluídos no ledger,
   assim como a exclusão com tratamento próprio da invalidação de memória.
4. **Checkout raso no CI:** a base fixa não estaria disponível para `git show`
   e `archive`. `fetch-depth:0` preserva o histórico requerido pelo ratchet.
5. **Gates insuficientes:** regex simples de imports e matching reutilizável de
   baseline poderiam esconder violações. Foram substituídos por AST e matching
   um a um, com testes negativos/positivos. Limites não foram reduzidos.
6. **Fast-path de upload pulava assinatura:** conteúdo Markdown já conhecido
   podia ser aceito com extensão PDF falsa. Validações baratas de assinatura e
   texto passaram a ocorrer antes da deduplicação, preservando a otimização.
7. **Seleção inconsistente de env:** o loader ignorava `ATLAS_ENV_FILE` usado
   pelo Nest. O caminho passa a ser selecionado uma vez e propagado aos filhos,
   com testes de injeção, caminho relativo/absoluto e arquivo ausente.
8. **Port de nomes multipart:** a correção latina da colega precisava preservar
   Unicode já válido. `uploadFilename` mantém caracteres acima de U+00FF e cobre
   `你好.md`, `☀.md`, `atenção.md`, ASCII e mojibake latino.

Durante os testes do autor também foi corrigido DELETE vazio no BFF. A mudança
do harness para produção remove watchers e recargas de desenvolvimento;
não substitui regras nem relaxa expectativas. As recusas de etapa/quiz passaram
a conferir 409, evitando aceitar indisponibilidade como prova de autorização.

## Trabalho da colega e manutenção dos invariantes

A branch `taylam/backend` em `b9454802bcb8b1bd15b15042c0311ef4d9f9a0b0`
foi comparada. O port do upload e o tratamento explícito de indisponibilidade
TypeSafe são coerentes com os novos módulos. O teste adicional provoca falha
do método do SDK e exige `not_evaluated`, score nulo e abstenção nas três
operações; não inventa avaliação ou vencedor.

Não portar a leitura paralela de memória foi correto: ela iniciaria acesso
antes da validação das fontes e quebraria um invariante existente. O teste foi
mantido. Não há merge de ancestralidade fingindo integrar essa otimização.
Ver [COMPATIBILIDADE_TAYLAM.md](COMPATIBILIDADE_TAYLAM.md).

## Evidências conferidas e o que não foi executado

O revisor executou `npm test` independentemente durante a revisão, os cinco
controles do gate, `check:env`, `git diff --check` e a reprodução HTTP do bypass.
Os últimos logs do autor, conferidos após as correções finais, registram:

- 42 testes API, 45 Python, 3 do loader e 5 controles dos gates, sem skips;
- types dos apps/autoria Eve e build da API sem erros;
- 14 cenários E2E/HTTP aprovados em 24,0 s no ensaio final;
- auditoria runtime zero, runtime production-only e builds documentados.

Os logs locais usados incluem `/tmp/atlas-v05-close-unit.log`,
`/tmp/atlas-v05-close-quality.log`, `/tmp/atlas-v05-close-types.log`,
`/tmp/atlas-v05-close-api-build.log` e `/tmp/atlas-v05-close-e2e-final.log`.
São evidências desta máquina, não check runs remotos de um SHA publicado.

Não foram comprovados por esta revisão: autenticação/isolamento multiusuário
público, geração/judge/busca/embedding reais, readback OCI real e aceite do
edital, eficácia pedagógica com alunos, carga/pico de 4 GiB, restauração e rollout
na VPS, SAST/SBOM ou mutation testing. Essas ausências **bloqueiam release** e
não receberam waiver. O backlog e as ações do responsável continuam necessários.

O parecer permite preparar a branch para revisão humana, mantendo o digest e
os gates. Não declara o pós-MVP completo nem autoriza publicação pública.
