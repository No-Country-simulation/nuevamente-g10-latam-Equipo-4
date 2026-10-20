# Revisão independente do kickoff — NovaMente Atlas

Revisão de 18/10/2026. Escopo: primeiro incremento descrito em `docs/SPEC.md` e `docs/IMPLEMENTATION_PLAN.md`; API Nest/Invokta/Typesafe/Eve, domínio Python/RAG/Dreamer e BFF/interface Next. Não exige autenticação pública, OCR, comunidade multiusuário nem conclusão integral do produto. Não valida provedores externos sem credenciais.

**Resultado após revalidação:** os cinco achados abaixo foram corrigidos no primeiro incremento. Não permanece um bloqueador confirmado desta revisão. O teste de provedores externos e de serviço remoto real de memória continua pendente de configuração.

Os achados abaixo registram o estado inicial e sua correção; as linhas nessa seção se referem à versão inicial. Nenhum código de aplicação ou dado real foi modificado pelo revisor.

## Achados

### 1. P1 — Replay reaproveita material anterior ao consentimento ou à exclusão

**Local:** `services/cognition/atlas/dreamer.py:72-75`, `services/cognition/atlas/store.py:95-100`, `services/cognition/atlas/learning.py:99`.

Quando não há `replay_cases`, o ciclo usa os três últimos `packages`, sem vínculo com o consentimento de captura. O caminho local descarta o campo `replay` do evento e não cria `replay_cases`, tornando o fallback a regra. Além disso, `packages.input` conserva `conversation_context`; apagar memórias mantém os pacotes. Após reativar a memória e gerar três eventos de tentativa, o ciclo pode reenviar conversas anteriores à exclusão ao LLM e promover uma política com essas experiências.

**Evidência:** reprodução em diretório temporário criou três pacotes sem consentimento com `conversation_context=OLD_PRIVATE_CONTEXT`, concedeu/apagou/reconcedeu consentimento e criou três eventos simples. O replay foi `promoted` e as seis chamadas baseline/candidato receberam o contexto antigo.

**Correção concreta:** remover fallback a `packages`; persistir casos dedicados somente na captura consentida, vinculados à revisão de consentimento; apagá-los com as memórias. Manter materiais na biblioteca não deve autorizar automaticamente seu uso posterior como memória de avaliação.

### 2. P1 — Exclusão concorrente não cobre todos os escritores de memória

**Local:** `services/cognition/atlas/main.py:138-142`, `services/cognition/atlas/main.py:189-199`, `services/cognition/atlas/store.py:95-100`.

O chat aguarda a geração e depois grava `conversations` sem verificar se houve exclusão durante a espera. A proteção `epochs/state_lock` do Dreamer não alcança essa gravação. De forma semelhante, o endpoint de experiências verifica consentimento antes da inserção de replay, e `Store.event` separa leitura do consentimento e escrita sem a mesma proteção da exclusão/revogação.

**Evidência:** a reprodução fez `forget()` durante a geração de um chat. A operação de exclusão terminou, mas a resposta do chat recriou duas conversas e o consentimento continuou `false`. As janelas adicionais de experiência/evento foram identificadas por leitura do fluxo.

**Correção concreta:** centralizar a revisão de consentimento/exclusão em estado compartilhado pelo store e Dreamer; verificar a revisão capturada antes da operação dentro da mesma seção crítica/transação que grava conversas, eventos e replay. O apagamento deve invalidar escritores pendentes. Testar revogação/exclusão em cada caminho de escrita, inclusive memória externa.

**Variante externa identificada na revalidação:** em `apps/api/src/main.ts:85`, quando `MEMORY_SERVICE_URL` está configurado, o DELETE inicialmente alcançava somente o serviço remoto. As conversas guardadas no cognition local permaneciam disponíveis ao próximo chat (`main.py`, seleção de `conversations`), e o epoch local não era invalidado. A exclusão precisa coordenar a limpeza remota com o histórico/invalidação local; usar outro serviço para memória não pode deixar uma segunda cópia ativa no caminho do chat.

### 3. P1 — Gate avalia somente um prefixo e aprova o material completo

**Local:** `services/cognition/atlas/providers.py:62`, `services/cognition/atlas/models.py` (`RemoteContent`/`RemoteItem`), `services/cognition/atlas/learning.py:70-78`.

`providers.judge` corta silenciosamente a resposta em 18.000 caracteres. O schema aceita até seis corpos de 6.000 caracteres, além de título/introdução e campos `front/back` sem limite. Assim, a parte final publicada pode nunca ter sido enviada ao avaliador, apesar de `judge_verdict: supported`. O mesmo judge é usado para decidir promoção do Dreamer.

**Evidência:** uma chamada com 18.016 caracteres enviou somente 18.000 ao adapter; o marcador final não foi avaliado e o resultado retornou `supported`.

**Correção concreta:** validar orçamento total antes da avaliação e da publicação; rejeitar/abster quando o resultado não cabe, ou avaliar integralmente blocos com agregação conservadora. Não truncar resposta/evidência de modo silencioso. Limitar também `front/back/options` no schema.

### 4. P2 — Ciclo em andamento desfaz rollback solicitado pelo usuário

**Local:** `services/cognition/atlas/dreamer.py:46-51`, `services/cognition/atlas/dreamer.py:104-110`.

O rollback muda a política ativa, mas não incrementa o epoch nem invalida o baseline usado pelo ciclo. Um replay já iniciado continua com a política antiga e pode ativar a candidata após o usuário restaurar a política inicial.

**Evidência:** um replay sofreu `rollback(0)` na primeira geração; ao concluir, retornou `promoted` e a versão ativa era 2.

**Correção concreta:** executar rollback sob a mesma proteção de estado usada para revogação, incrementando a revisão que invalida ciclos pendentes. Antes da promoção, verificar também que a versão baseline continua sendo a avaliada.

### 5. P2 — Concorrência deixa ciclos eternamente enfileirados

**Local:** `services/cognition/atlas/main.py:42-47`, `services/cognition/atlas/main.py:210-216`, `services/cognition/atlas/dreamer.py:55-56`, `apps/web/components/atlas.tsx:103`.

O endpoint registra `queued` antes de adquirir a trava do Dreamer. Se já existe um ciclo em execução, `cycle()` lança erro antes de seu bloco de tratamento; `background_cycle` engole esse erro sem atualizar o registro. O painel continua consultando indefinidamente porque o ciclo nunca sai de `queued`.

**Evidência:** com a trava ocupada, executar o background de um ciclo previamente enfileirado deixou seu estado final em `queued`.

**Correção concreta:** reservar a execução antes de registrar/enfileirar, ou persistir um estado terminal explícito `busy/cancelled/failed` para toda tentativa rejeitada. Não recriar registros depois de uma exclusão concorrente.

## Validação e limites

- Os nove testes Python existentes passaram (`.venv/bin/python -m unittest discover -s services/cognition/tests -v`).
- As cinco reproduções acima usaram `TemporaryDirectory`, provedores simulados e nenhuma chave real ou chamada externa.
- O modo extrativo e o hashing lexical estão identificados como demonstração; não foram tratados como bugs ou como prova de geração/embeddings semânticos.
- Os filtros de documento/tenant antecedem a recuperação; não foi encontrado acesso cruzado no fluxo inspecionado. O BFF mantém rotas internas de judge/geração fora de sua allowlist e não encaminha o token ao navegador.
- A revisão não transforma a configuração de Eve/Typesafe/OCI em prova de execução dos serviços. Credenciais, avaliação externa, limites de 6 GB e autenticação pública continuam dependências explícitas do projeto.

## Revalidação das correções

O implementador corrigiu os cinco caminhos locais. Releitura confirmou replay dedicado sem fallback, revisão persistida de consentimento, gravação transacional, snapshot de memória capturado antes da geração, rollback invalidando o ciclo, interrupção antes de novas chamadas externas e orçamento integral do judge. Os 13 testes Python passaram na revalidação.

Reproduções independentes adicionais, novamente em diretório temporário:

- Rollback durante a primeira geração de replay: versão ativa permaneceu 0, nenhum judge foi chamado depois da invalidação e o ciclo ficou `cancelled`.
- Apagar e reconsentir durante a proposta: nenhuma chamada de replay foi executada e nenhum ciclo apagado reapareceu.
- Apagar e reconsentir enquanto o chat responde: nenhuma conversa foi recriada.

A releitura de `apps/api/src/main.ts:85` confirmou a correção da variante externa: o DELETE chama a memória remota e, em `finally`, apaga também memórias/conversas e invalida o estado no cognition local. A revisão persistida acompanha as experiências remotas e é conferida novamente na gravação. Essa coordenação foi validada por inspeção; não houve execução contra serviço remoto real.

O implementador também recebeu a recomendação de chamar os traces locais de etapas de processamento, evitando apresentar registros estáticos de recuperação/gate como handoffs executados por agentes Eve.
