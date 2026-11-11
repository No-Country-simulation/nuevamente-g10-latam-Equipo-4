# Acesso, biblioteca de 80 MiB e personas 0.6

## Entrega implementável sem credenciais externas

Sincronizar frontend da branch da equipe c9e6eb8 com main c6d5f73. Preservar
substituição manual de tutor e exclusão de fontes. Corrigir menu mobile, usar
nomes do catálogo compartilhado e encaminhar entrada para /login.

Acesso: `/login` diferencia o workspace web compartilhado do aplicativo local.
O cliente opcional implementa OAuth usando o DevKit oficial, não captura senha,
não reutiliza Client ID/tokens do Codex e não transfere tokens para Oracle.
A elegibilidade e a inferência real pela conta exigem validação própria.

PDF/MD/TXT: 80 MiB; streaming no BFF, temporário na API, admissão antes de receber
corpos concorrentes em cada serviço. Arquivos são dados não confiáveis: assinatura,
extensão, texto, páginas, caracteres, segmentos, CPU, memória e contexto seguem
limitados. Parser: 1000 páginas, 2M caracteres, 512 MiB, CPU45s/wall60s.
Índice: 4096 segmentos e recuperação limitada; fonte retornada em até16MiB.
LM RAG usa o documento inteiro somente quando cabe no orçamento de contexto;
o resultado registra modo híbrido se o orçamento for insuficiente. Não aumentar
a janela de contexto para80MiB nem remover gates do Dreamer.

Adição de Ágora e Clara em contratos, tickets, Invokta, catálogo, prompts Python,
Eve e interface. Método e persona são independentes. Testar ambos os novos IDs com
chat e geração, override explícito e negação de ferramentas indevidas.

Schema aditivo: package_sources com FK por tenant/pacote/fonte, índice por fonte,
triggers de inserção/atualização e cascade ao excluir material; fonte referenciada
não pode ser removida sem antes tratar dependentes. Não perder JSONs compatíveis.
Backfill inválido vira inventário e quarentena, não sucesso falso; reparar input
somente com referência autorizada, de forma transacional. Guardar backup antes da
migração. Não desativar foreign_keys para operar o sistema.

## OAuth local e autenticação hospedada

Decisão local+Oracle autorizada em novembro. Contrato implementado e limitações:
[ChatGPT local](../architecture/chatgpt-local.md). SDK oficial com registro dinâmico,
PKCE/state/nonce e cofre obrigatório. Não requer Client ID/domínio manual no modo
local. Autorização de uso é explícita; modelo vem do catálogo da conta; sem
fallback pago. Next recebe somente capability/token de serviço, nunca OAuth.

O deployment Oracle ainda precisa de identidade Atlas autenticada por sessão,
workspace/membership/role, tenant derivado de sessão e autorização por recurso.
Não transportar o OAuth loopback do DevKit para a VPS nem chamar a tela /login
de autenticação multiusuário pronta. As contas reais continuam um gate externo.

## Gates

Unitários, migração legada e constraints, PDF válido acima de10MiB, limite exato80MiB,
rejeição de80MiB+1, upload HTTP real e medida RSS (limites384MiB web/API), temporários,
backpressure, recuperação após falha; E2Edesktop/mobile para menu, personas e acesso.
Manter thresholds, baseline e verificações; revisão independente antes de commits.
Serviços externos/assinatura não são validados por doubles nem pela existência da UI.

## Gerenciador de fontes (pedido adicional)

Pesquisar pelo título, selecionar explicitamente até20 fontes e confirmar uma vez.
A seleção de remoção é independente da seleção de documentos usados no estudo.
A interface orquestra os comandos DELETE existentes sequencialmente; as regras,
isolamento e efeitos continuam no backend. A confirmação avisa sobre dependentes,
XP e limpeza de histórico/memória. Não refazer materiais em lote automaticamente.
Não prometer atomicidade entre várias exclusões: listar para cada arquivo deleted,
cleanup_pending ou resultado não confirmado; preservar fontes que falharam.
O gerenciador recarrega bootstrap e permite acompanhar a fila durável existente.
Quarentena de legado bloqueia geração/remoção antes de qualquer purge: dados
ambíguos precisam de reconciliação e não podem produzir sucesso fictício.


## Atualização OAuth após encontrar o DevKit oficial

A investigação posterior encontrou o repositório oficial OpenAI por pesquisa no
GitHub. A hipótese de cadastro manual/Client ID/domínio obrigatório NÃO se aplica
ao fluxo local do DevKit: ele usa registro dinâmico e callback127.0.0.1. Há suporte
explícito ao plano ChatGPT de usuários elegíveis com autorização; não presumir que
isso habilita a VPS multiusuário. Esta atualização prevalece sobre as hipóteses
iniciais acima. Fonte, protocolo, armazenamento e arquitetura autorizada:
[Sign in with ChatGPT verificado](../research/sign-in-with-chatgpt-verified.md).


## Migração e retenção mínima

Versões1–4 em schema_migrations: FK e projeção; inventário/quarentena de legado;
validação de tipos dos IDs, inclusive NULL, objetos, números e refs vazias;
e proveniência por turno de conversa.
O inventário é aditivo; não apaga materiais corrompidos para passar o teste.
Pacotes novos não persistem o contexto histórico no input; turnos têm referências
transacionais de fontes. Só reutilizar histórico cujas fontes sejam subconjunto
das selecionadas, com consentimento para compartilhar entre tutores. Legado sem
proveniência não alimenta contexto. Materiais legados com contexto não-vazio
ficam em quarentena: apagar só o campo não elimina fatos derivados no payload.
[Procedimento de migração e pendências](../architecture/migration-06.md).
