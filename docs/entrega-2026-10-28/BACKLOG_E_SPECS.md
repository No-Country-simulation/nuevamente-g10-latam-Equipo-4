# Levantamento completo e specs executáveis — pós-MVP 1

28/10/2026. Fontes: primeira spec versionada, edital oficial e solicitações acumuladas.
A matriz anterior em `docs/AUDITORIA_MVP_POS_MVP.md` continua sendo evidência do edital.
Esta revisão acrescenta comandos, trilhas, nomes, governança e testes da0.5.

## Inventário atual

Já existe: landing Atlas e criação visual de companheiro; PDF/MD/TXT; quatro formatos;
três estratégias RAG; citações canônicas; brains/Invokta/Eve; debate privado; Jev/Firecrawl;
Dreamer/replay/rollback/consentimento; cofre manual/env/arquivos; OCI com readback;
conectores opcionais; containers limitados, CI e registry externo. Cada integração
real continua exigindo chave/quota/evidência, conforme STATUS.

Nesta branch: módulos de comunidade/trilhas, roteiro persistente e progressão
server-side, recibos de comando, eventos de quiz imutáveis, nível calculado no
backend, parser evitado em upload repetido e RAG de seções sem carregar fontes
integrais. Novos nomes preservam IDs. Landing não declara alunos/depoimentos fictícios.

Ainda não há autorização multiusuário, comunidade pública, coletivo Dreamer,
planejador LLM de trilhas, OCR, anotações PDF ou vault físico Obsidian aprovados.
Rust, voz, inferência local e integrações não solicitadas ficam fora do release
pós-MVP1; precisam de nova decisão baseada em medição e capacidade.

## Como executar uma spec

1. Atribuir autor/revisor e confirmar dependências Uxx/Pxx.
2. Refinar exemplos e contratos antes do endpoint; estimar novamente se mudar escopo.
3. Implementar primeiro domínio e persistência, depois adaptador e apresentação.
4. Executar cenários felizes, adversariais, falhas e repetição; anexar evidência por SHA.
5. Atualizar env, runbook, arquitetura e guia. Revisão independente e humana antes de merge.

Não há teste que substitua permissão de conta ou valide fornecedor sem chamada real.

<a id="p01"></a>

## P01 — Comandos, reconciliação e outbox

Prioridade P0; papel BE; estimativa 3 pessoa-dias; dependências: U01.

**Situação:** Reserva/replay e tentativas transacionais existem na 0.5. Clientes antigos sem chave e eventos Dreamer pós-commit são lacunas.

**Contrato:** Exigir Idempotency-Key nos comandos de escrita, publicar consulta de recibo somente ao proprietário e implementar outbox SQLite para experiências/efeitos internos. Um resultado remoto incerto nunca é retentado automaticamente.

**Dados e fronteiras:** receipts: tenant/user/operation/key, digest e estado; outbox: ID imutável, destino, revisão, tentativas e lease. Nenhum corpo com credencial.

**Falhas e segurança:** Mesmo ID com payload diferente:409; falta de ID:428; falha antes de reserva:503; resultado incerto:409 até reconciliação. Exclusão invalida escritores por revisão.

**Aceite/testes:** Concorrência entre processos, crash antes/depois do efeito, reinício, TTL, quota, outbox duplicada e exclusão durante entrega. XP e experiência não duplicam; mesma resposta no replay.

**Plano de execução:** Migrar clientes/scripts e exemplos REST; usar handlers de domínio; ligar outbox no mesmo commit da tentativa; worker com lease/limite; executar falhas controladas e atualizar o guia.

<a id="p02"></a>

## P02 — Autenticação e isolamento multiusuário

Prioridade P0; papel BE; estimativa 8 pessoa-dias; dependências: P01;U09;U10.

**Situação:** Hoje só há workspace local e token interno; o app recusa modo público.

**Contrato:** Adicionar sessão OIDC ou identidade escolhida, RBAC administrador/aluno/moderador e autorização por recurso. Derivar tenant/user da sessão; nunca de header arbitrário do browser. Cofre por proprietário.

**Dados e fronteiras:** users, memberships, sessions e owner_id em documentos/pacotes/trilhas/grupos/credenciais/memórias; migração do workspace local com backup e dono explícito.

**Falhas e segurança:** 401 sem sessão;403 sem vínculo/papel;404 para recurso alheio; origem/CSRF em mutações; rotação/revogação de sessão; URL callback allowlist.

**Aceite/testes:** Dois usuários e dois tenants, IDs adivinhados, troca de sessão, CSRF, escalada de papel, revogação e cofre inacessível entre donos. Gate obrigatório antes de Internet.

**Plano de execução:** Firmar ADR de identidade; criar migração/portas; autorizar Nest e serviços internos; adaptar BFF; implementar telas; E2E multiusuário; revisar segurança humana.

<a id="p03"></a>

## P03 — Aceite real de Eve, Jev, Firecrawl, vetores e OCI

Prioridade P0; papel FS; estimativa 4 pessoa-dias; dependências: U02;U03;U04;U05;U06;U07.

**Situação:** SDKs/contratos existem, mas testes controlados não provam acesso real.

**Contrato:** Provar geração nativa Eve, decisão/judge Jev e relevância web/documental; embedding real e três cenários do mesmo documento. Original e JSON devem ter readback OCI verificado.

**Dados e fronteiras:** Relatório sem segredos: modelo/versão, região, hashes, IDs de fontes, formatos/perfis, recibos, latência e custo; scripts/acceptance.mjs falha se algum gate não cumprir.

**Falhas e segurança:** Timeout/quota/autenticação do fornecedor produzem erro explícito/abstenção. Sem fallback SubQ inventado nem hash lexical apresentado como vetor semântico.

**Aceite/testes:** Duas personas/perfis e dois formatos no mínimo; três cenários completos; fonte não autorizada rejeitada; falha OCI não gera recibo verified; revisar material com pessoa.

**Plano de execução:** Configurar contas por finalidade; validar cada integração pequena; rodar aceite; revisar fontes e qualidade; anexar evidências e custo; manter modo local se não houver aprovação.

<a id="p04"></a>

## P04 — Trilhas planejadas por LLM e revisão espaçada

Prioridade P1; papel FS; estimativa 5 pessoa-dias; dependências: P02;P03.

**Situação:** 0.5 tem roteiro local persistente, materiais gerados na cadeia comum e progressão validada.

**Contrato:** Planejador LLM retorna plano tipado com evidências, objetivos, duração estimada e pré-requisitos; validação server-side, plano versionado e substituição manual. Revisões por desempenho observado, sem inferir diagnóstico.

**Dados e fronteiras:** plan_version, planner/model, evidence_refs, prerequisites, due_at e evidence_kind; preservar trilhas existentes local_template_v1. Uma alteração não apaga progresso confirmado.

**Falhas e segurança:** Plano sem suporte é rejeitado; referência a fonte alheia é403/404; ciclo de pré-requisitos é422; orçamento excedido usa roteiro local explicitamente identificado mediante política.

**Aceite/testes:** Planos inválidos/cíclicos, adaptação sem consentimento, troca de fontes, retomada/reload, quiz como gate, revisões vencidas e estudante com pouca experiência.

**Plano de execução:** Definir schema; adaptar propósito da factory; validar DAG; persistir versões; mostrar próximo passo; adicionar revisão espaçada; avaliar com corpus e alunos.

<a id="p05"></a>

## P05 — Dreamer individual e coletivo avaliado

Prioridade P1; papel FS; estimativa 3 pessoa-dias; dependências: P02;P03;U10;U11.

**Situação:** Replay de histórico, gates, consentimento, promoção e rollback individuais existem. Coletivo ainda não existe.

**Contrato:** Calibrar holdout separado e melhoria sem regressão de suporte. Consentimento coletivo é independente, revogável e inicialmente desligado. Consolidar apenas padrões pedagógicos permitidos, nunca conversas privadas brutas no pool comum.

**Dados e fronteiras:** Experiências com proveniência/revisão; policy_version, evaluation_dataset_version e cohort com limiar de agregação aprovado. Retenção/exclusão em todos os stores e backups conforme política.

**Falhas e segurança:** Sem consentimento ou cobertura suficiente: aguarda, não promove. Revogação cancela jobs/escritores; candidato não altera ferramentas, permissões, código ou segurança.

**Aceite/testes:** Holdout contaminado, regressão de grounding, membro removido, comunidade pequena, replay sem chamadas extras, revogação concorrente e rollback. Métrica média não oculta falha crítica.

**Plano de execução:** Definir dataset/limiar; executar baseline real; separar memória coletiva; persistir prova da promoção; testar exclusão; revisão pedagógica e privacidade.

<a id="p06"></a>

## P06 — Grupos reais, moderação e ranking opcional

Prioridade P1; papel BE; estimativa 4 pessoa-dias; dependências: P02;P05;U10.

**Situação:** Grupos/mensagens locais existem; member_count=1 não prova colaboração entre usuários.

**Contrato:** Membros autenticados, convites limitados, tutor no grupo com evidências, moderação/denúncia e ranking opt-in. Pontuação só vem de eventos de domínio, não do payload do cliente.

**Dados e fronteiras:** memberships, invites hash/expiry, messages owner/moderation state, ranking projection; paginação por cursor e limites de retenção.

**Falhas e segurança:** Papéis validados em todo comando; mute/ban/revogação imediatos; antispam/rate limit; nenhuma memória privada compartilhada por ingresso no grupo.

**Aceite/testes:** Convite expirado/reutilizado, aluno acessando grupo alheio, moderação sem papel, pontuação duplicada, remoção durante resposta do tutor e fuga de memória.

**Plano de execução:** Implementar modelo/permissões; comandos idempotentes; UI dos membros; tutor por capability; denúncia; ranking voluntário; teste multiusuário e runbook de moderação.

<a id="p07"></a>

## P07 — Performance e operação em 4 GiB

Prioridade P0; papel SE; estimativa 3 pessoa-dias; dependências: P01;P03;U08.

**Situação:** Compose limita serviços em 2560 MiB; medições antigas de idle não são benchmark de pico.

**Contrato:** Fila compartilhada para trabalhos pesados e parser único; deadline/cancelamento por operação, budgets de custo/tokens/turnos e benchmark reproduzível sob 4 GiB reais.

**Dados e fronteiras:** job_id, queue_depth, duration, status, memory_peak e fornecedor/modelo sem prompt. Documentar requests de até10MiB/100p/300k caracteres e carga representativa.

**Falhas e segurança:** Fila cheia retorna429 com recuperação; timeout não repete cobrança; nenhum OOM/restart silencioso; não escalar workers sem rever teto global.

**Aceite/testes:** Uma ingestão no limite em paralelo com quatro leitores e um fluxo de geração/debate; 30 min de soak, falha remota, backpressure, pico<3.5GiB conjunto e reserva de host documentada. P95 deve ser medido, meta inicial<=20s para geração curta com fornecedor disponível, não garantia.

**Plano de execução:** Subir imagens de produção em host/cgroup limitado; instrumentar RSS/PSS/cgroup; rodar cenários; perfilar; corrigir gargalos; repetir somente cenários afetados; registrar configuração e números.

<a id="p08"></a>

## P08 — Grafo físico Obsidian e export versionado

Prioridade P1; papel BE; estimativa 3 pessoa-dias; dependências: P02;P04.

**Situação:** Hoje existe grafo visual de fontes/citações da sessão, sem vault físico.

**Contrato:** Export ZIP de Markdown com wikilinks, IDs e proveniência; paths sanitizados e contrato de versões. Reimport exige preview de conflitos e nunca executa conteúdo do vault.

**Dados e fronteiras:** manifest.json com schema_version, hashes, export_id; notas por documento/conceito e arestas por citação suportada.

**Falhas e segurança:** Bloquear traversal, links arbitrários para arquivo do host, overwrite silencioso e fonte de outro usuário. ZIP tem quota e limite de entradas; reimport é opcional no primeiro release se não couber.

**Aceite/testes:** Roundtrip controlado, colisões de nome, ../, nomes Unicode, ZIP bomb, versão divergente e exclusão de recurso. Grafo não infere relação factual sem evidência.

**Plano de execução:** Fixar formato; gerar export em serviço; testar sanitização; UI de download/preview; implementar reimport com resolução explícita; documentação e exemplo sanitizado.

<a id="p09"></a>

## P09 — Leitor PDF e anotações persistentes

Prioridade P1; papel FE; estimativa 2 pessoa-dias; dependências: P02.

**Situação:** Leitor textual e citações por página existem; anotações no PDF ainda não.

**Contrato:** Renderizar PDF autorizado e armazenar notas/destaques por versão/página/trecho. Manter fallback textual e navegação por teclado; não alterar o original.

**Dados e fronteiras:** annotation_id, owner, document_version/hash, page, anchor/hash e comentário; comando idempotente e consulta autorizada.

**Falhas e segurança:** Mudança da fonte marca âncora desatualizada; impedir script/HTML de nota e compartilhamento implícito. Nenhum link público direto ao bucket privado.

**Aceite/testes:** Página inexistente, fonte trocada, nota alheia, XSS, teclado/leitor de tela, celular e reload.

**Plano de execução:** Contrato e persistência backend; viewer carregado sob demanda; seleção/âncora; UI de notas; testes e acessibilidade.

<a id="p10"></a>

## P10 — OCR e fontes visuais opcionais

Prioridade P2; papel FS; estimativa 2 pessoa-dias; dependências: P03;P07;U10.

**Situação:** Uploads sem texto selecionável são recusados com mensagem clara.

**Contrato:** Adaptador OCR/visão remoto ou tarefa isolada escolhida após perfil, com consentimento para fornecedor e resultado por página rotulado como extraído/inseguro. Sem modelo local pesado.

**Dados e fronteiras:** PageExtraction com kind=text/ocr/visual, confidence quando fornecida, source_hash e provider; citações distinguem extração de transcrição conferida.

**Falhas e segurança:** Limite de páginas/custo/tempo; baixa qualidade pede conferência e pode abster; nenhuma certeza fabricada para imagem ilegível.

**Aceite/testes:** PDF escaneado, página mista, imagem ruim, timeout/custo, rota sem consentimento e acentuação. Não degrada parser textual.

**Plano de execução:** Escolher fornecedor/licença/custo; criar adapter/desligado por padrão; corpus pequeno; marcar proveniência; integrar viewer; medir orçamento.

<a id="p11"></a>

## P11 — Pré-requisitos e metadados pedagógicos citáveis

Prioridade P1; papel FS; estimativa 2 pessoa-dias; dependências: P03;P04.

**Situação:** Tempo é heurístico e conceitos vêm dos títulos; pré-requisitos são explicitamente não inferidos.

**Contrato:** Inferir pré-requisitos/conceitos com evidências e incerteza; validar DAG do plano; manter estimativas rotuladas e opção de correção pelo usuário.

**Dados e fronteiras:** concept_id, source_refs, relation_type, confidence_source e prerequisite_status; sem score pessoal inferido de identidade.

**Falhas e segurança:** Sem evidência suficiente mantém unknown; não criar pré-requisito falso para bloquear aluno; referências precisam pertencer à versão da fonte.

**Aceite/testes:** Termo ambíguo, conflito entre documentos, ciclo, fonte ausente e correção manual. Avaliar com gabarito humano.

**Plano de execução:** Schema; propósito de extração; validação de referências/DAG; UI de correção; dataset e avaliação.

<a id="p12"></a>

## P12 — Polimento, acessibilidade e menos atrito

Prioridade P1; papel FE; estimativa 4 pessoa-dias; dependências: P02;P04;P06;P09;U11.

**Situação:** Book Atlas, preferências locais e foco/baixo estímulo existem; testes E2E iniciais foram adicionados na0.5.

**Contrato:** Fluxos de primeiro uso, upload, pergunta, prática, trilha, comunidade, conexões e exclusão com estados vazios/erros úteis. Teclado, reduced-motion, contraste e mobile320px.

**Dados e fronteiras:** Eventos de produto agregados e consentidos; métricas de conclusão de tarefa, erros e tempo para primeiro material, sem prompts/dados pessoais.

**Falhas e segurança:** Nenhum botão habilita recurso não autorizado; falha recuperável sem perder trabalho; controles avançados não atrapalham iniciantes. Remover métricas/depoimentos fictícios.

**Aceite/testes:** Cinco sessões moderadas, E2E desktop/mobile, keyboard-only, sem overflow320/390/768/1440, fonte/citação navegável e auditoria a11y com triagem de todos os serious/critical.

**Plano de execução:** Roteiro/dataset; observar iniciantes; priorizar fricções; decompor componentes; testes acessibilidade/visual; repetir jornadas afetadas.

<a id="p13"></a>

## P13 — Fronteiras modulares e dívida de complexidade

Prioridade P1; papel BE; estimativa 3 pessoa-dias; dependências: P01;P04.

**Situação:** Controllers Nest e módulos Python foram separados; Factory/RAG/generation/UI ainda têm hotspots.

**Contrato:** Extrair políticas e portas testáveis sem fragmentar artificialmente funções só para baixar métrica. Ratchet contra baseline e revisão humana de clareza.

**Dados e fronteiras:** Portas de repositório/provedor; DTOs públicos; domínios não importam composição/controller/framework quando não necessário. Migrações aditivas e compatibilidade de IDs.

**Falhas e segurança:** Proibir novos ciclos, supressões para ocultar problema, testes apagados e dependência frontend→backend privado. Não alterar gates para fazer a própria mudança passar.

**Aceite/testes:** Complexidade TS/Python, grafo completo com aliases, testes críticos, mutação pontual de XP/consentimento/grounding e revisão de responsabilidades.

**Plano de execução:** Escolher hotspot por risco; escrever characterization tests; extrair regra/porta; medir com mesmo algoritmo; revisar nome/responsabilidade; atualizar guia técnico.

<a id="p14"></a>

## P14 — Observabilidade, backup e release seguro

Prioridade P0; papel SE; estimativa 3 pessoa-dias; dependências: P02;P03;P07;U12;U13;U14.

**Situação:** Actions/GHCR e pull por SHA existem; execução remota/deploy não foram provados nesta branch.

**Contrato:** Logs estruturados com correlação e redaction, orçamento de fornecedor, backup consistente SQLite+objetos+cofre e master separada; restauração/rollback em ambiente isolado.

**Dados e fronteiras:** Release manifest com GitSHA/digests/schema_version, métricas e gates. Alertas de fila, erros, disco/RAM, gasto e quota OCI.

**Falhas e segurança:** Sem segredo em log/artifact/imagem; backups criptografados e acesso mínimo; mudança de schema compatível com rollback ou plano explícito.

**Aceite/testes:** Restore completo, master ausente, disco cheio, deployment interrompido, container morto, imagem anterior e rota ainda privada quando auth falha. RPO/RTO são medidos.

**Plano de execução:** Fixar política; implementar backup/checksum; testar restore; gerar imagens noCI; staging; carga; revisão humana; deploy e rollback ensaiado.

<a id="p15"></a>

## P15 — Demonstração, pitch e documentação final

Prioridade P1; papel SE; estimativa 2 pessoa-dias; dependências: P03;P12;P14;U15.

**Situação:** Pitch e guias desta entrega são materiais de trabalho; vídeo/produção dependem de execução humana.

**Contrato:** Gravar fluxo real de três cenários, mostrar citações/OCI e explicar limitações. Atualizar arquitetura, ferramentas, links, custos e relatório de teste para o commit entregue.

**Dados e fronteiras:** Pacote de evidências sanitizado: relatório de aceite, diagrama, vídeoURL, README, PDFs e changelog; sem métricas inventadas.

**Falhas e segurança:** Não chamar mock/extrativo de IA validada; não prometer eficácia sem observação; retirar credenciais/dados pessoais dos vídeos.

**Aceite/testes:** Outra pessoa executa o guia do zero; linkcheck/PDF legível; checklist do edital e SHA de release conferidos.

**Plano de execução:** Roteirizar pitch; gravar após gates; revisar; publicar vídeo/links; preencher entregáveis e compartilhar arquivos nos canais pela equipe.
