# Ações do André e da equipe

Não envie chaves no Discord ou no chat. Use painel local, env injetado ou arquivos
de segredo. Os itens abaixo exigem titularidade de conta, orçamento ou decisão
pedagógica; desenvolvimento e testes locais continuam sem eles.

## Antes de fechar o MVP

| ID | Sua ação | Evidência de conclusão | Desbloqueia |
| --- | --- | --- | --- |
| U01 | Confirmar quatro responsáveis e horas disponíveis; atribuir dono a cada tarefa do CSV. | Nome e capacidade no board; revisor diferente do autor. | Compromisso realista das três semanas. |
| U02 | Selecionar provedor/modelo de geração e teto de gasto. Colocar chave com a finalidade geração. | Uma geração real pelo Eve com JSON/citações, custo e latência registrados sem segredos. | P03, trilhas generativas, Dreamer real. |
| U03 | Configurar Jev/TypeSafe e confirmar acesso do plano/modelo. | Decisão, relevância e judge reais; timeouts/recusa documentados. | Debate e avaliação reais. |
| U04 | Configurar Firecrawl com quota pequena de teste. | Busca de três resultados e relevância conferida, com URL/data. | Busca web. |
| U05 | Escolher embedding semântico permitido, inclusive gratuito com licença/quota adequadas. | Modelo/dimensão identificados; reindexação e busca reais. | Critério vetorial do edital. Jev não gera vetores. |
| U06 | Criar/selecionar bucket OCI Always Free privado e identidade de acesso mínimo; confirmar região, namespace e quota. | Original e JSON enviados com readback verificado; recibos no relatório de aceite. | Encerrar MVP obrigatório. Compute é opcional. |
| U07 | Escolher documento de demonstração que possa ser enviado aos fornecedores. | Permissão da equipe e três cenários do mesmo documento revisados. | `scripts/acceptance.mjs` e vídeo. |
| U08 | Confirmar se AMD/VM proposta tem custo; informar SO, CPU, disco e RAM realmente livres. | Verificação de SKU/contrato/cotas, sem provisionamento pago automático. | P07 deploy/carga. |

## Durante as três semanas

| ID | Sua ação | Evidência de conclusão | Desbloqueia |
| --- | --- | --- | --- |
| U09 | Escolher autenticação/OIDC e domínio para staging privado; definir perfis administrador/aluno/moderador. | Decisão arquitetural e URLs de callback autorizadas. | P02 e comunidade multiusuário. |
| U10 | Definir retenção, exclusão, consentimentos individual/coletivo e responsável pela moderação. | Política revisada; opção coletiva separada e inicialmente desligada. | P05/P06. |
| U11 | Convidar cinco participantes para sessões de 20–30 min, incluindo iniciantes; escolher objetivo e quiz de avaliação. | Consentimento e agenda; observações sem dados pessoais no repo. | Validação pedagógica/UX. |
| U12 | Revisar a branch e abrir/aceitar PRs nos dois repositórios após CI. Ativar proteção da main e revisão obrigatória. | PRs com mesmo SHA, check runs reais e revisão humana. | Merge posterior. Esta entrega não atualiza main. |
| U13 | Executar publicação manual de imagens do commit aprovado em main, conferir visibilidade/cotas GHCR e fazer deploy por SHA. | Digests, health, smoke e rollback na VPS. | P14 release. Fontes no Git não são deploy. |
| U14 | Guardar master do cofre separada do volume e testar restauração com a equipe. | Restore isolado com SQLite, blobs e cofre; RPO/RTO medidos. | Release confiável. |
| U15 | Gravar demo, publicar vídeo e preencher entregáveis do hackathon. | Documentação, vídeo, ferramentas e links reais. | Submissão. |
| U16 | Revisar/publicar o rascunho do ambiente cloud quando quiser aplicá-lo. | Novo runtime confirma política e ferramentas; salvar draft não aplica. | Reproduzir setup em próxima sessão. |

## Decisões já tomadas que não exigem nova confirmação

Next/TS + Nest/Python; Eve como runtime de personas; Invokta como limite de
ações; Dreamer central; debates privados; inferência externa; monólito modular;
SQLite padrão; chaves fora do cliente; deploy sem build na VPS; nova branch em
ambos os remotes. Mongo/Qdrant/Trigger só se a medição justificar. Rust fica
depois de profiling. Não é necessário instalar toda a infraestrutura opcional.
