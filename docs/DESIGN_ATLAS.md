# Atlas: direção visual e identidade pessoal

Direção implementada a partir do book de design enviado em 21/10/2026. O pedido atual atualiza a direção da landing; a estrutura funcional do estúdio Atelier continua disponível em `/studio`.

## Identidade

| Token | Valor | Uso |
| --- | --- | --- |
| Fundo | `#08090A` | Canvas e composição editorial |
| Superfície | `#111316` | Prévia, formulário e painéis |
| Borda | `#1F242B` / `#303139` | Separação de superfícies e controles |
| Ação | `#FF4F38` | Botões e destaque do título |
| Texto | `#EDEDEF` | Leitura principal |
| Texto secundário | `#A2A6AE` | Descrições e apoio |
| Cores pessoais | `#FF704F`, `#A89BFF`, `#55DCE8`, `#8FDDB5` | Identidade orbital do companheiro |
| Títulos e marca | Instrument Serif | Expressão editorial e identidade |
| Interface | Plus Jakarta Sans | Navegação, controles e leitura curta |

Fontes são servidas pelo próprio aplicativo. A arte do hero (`Atlas` segurando o globo) é a única imagem raster do site: `apps/web/public/images/atlas-world.webp` (1 536 × 1 240, ~170 KB, com alfa esfumado nas quatro bordas), servida por `next/image` com `fill`, `priority`, `sizes` responsivo e entrega AVIF/WebP otimizada pelo Next. O alfa é gerado em pós-produção para a arte se dissolver no fundo `#08090A` sem corte visível; o CSS ancora a peça à borda direita da janela (`right: calc(50% - 50vw - 40px)`) e a estica à altura do hero, então o lado direito nunca fica vazio nem encostado. Ela foi mantida em raster porque é uma ilustração fotorrealista: vetorizar perderia a fidelidade pedida pelo usuário. Todas as demais imagens estáticas — marca, orbes, avatares de agente, favicon e diagramas — são SVG (inline ou componentes), para manter o carregamento leve. O book não foi usado como captura de interface nem como uma página inteira em imagem.

## Organização e comportamento

- `/`: navegação, hero Atlas/globo, prévia ilustrativa, métodos, cinco perspectivas, criador, perguntas e convite final. Sem rankings, preços, métricas ou depoimentos fictícios.
- `/studio`: biblioteca, geração, conversas, prática, grupos e Dreamer existentes. A marca volta à landing.
- `#seu-atlas`: nome, quatro cores, tutor-base e prévia imediata. Salvar leva ao estúdio com a persona escolhida.
- A navegação mobile é uma expansão simples; os links fecham o menu. Há foco visível, campos rotulados, feedback de erro e respeito a `prefers-reduced-motion`. Os modos de foco/baixo estímulo continuam no estúdio.
- A prévia da landing é marcada como ilustrativa. O estúdio consulta as capacidades reais e identifica a demonstração extrativa.
- O rail do estúdio mantém o logotipo, a busca, os sete espaços, os cinco tutores e as ações de rodapé sempre alcançáveis. Abaixo de 1180 px de altura a lista de tutores passa a duas colunas compactas (avatar e nome) e o bloco inferior encurta, para nada ficar cortado em portáteis de 768–900 px; em alturas extremas o rail inteiro rola. Abaixo de 761 px de largura o rail dá lugar ao menu-drawer, que mantém alvos de 44 px e rola dentro do diálogo. O painel de fontes fecha por padrão em ecrãs até 1250 px.

## Primeira etapa de “Crie seu Atlas”

`apps/web/lib/atlas-identity.ts` valida e persiste um objeto versão 1, com nome, cor permitida e ID de uma das cinco personas. JSON inválido ou adulterado é ignorado; falha de escrita é informada. O React apresenta o nome como texto. Nome vazio não é salvo, e nomes longos são limitados a 24 caracteres.

A identidade é local ao navegador e não é uma conta. Um tutor recebe nome e cor personalizados no seletor, na barra lateral e no chat. As requisições seguem usando o ID original da persona; a identidade visual não é injetada no prompt. O usuário continua podendo trocar de tutor e método. Não há permissão, ferramenta, diagnóstico ou consentimento implícito.

No estúdio, **Personalizar [nome]** abre o mesmo criador. **Restaurar tutores originais** remove a preferência do navegador. Apagar a memória Dreamer não apaga essa preferência visual; restaurar nomes não apaga memórias ou documentos. Limpar os dados do site também remove a identidade local.

Sincronização por conta, nomes reconhecidos na autoapresentação do modelo, avatares enviados pelo usuário e novas personas editáveis no servidor ficam para uma próxima etapa com autenticação e contratos próprios.

## Entrega e operação

A imagem é local e não depende de um CDN externo. `infra/Dockerfile.node` inclui `apps/web/public` no estágio web. O restante da landing é renderizado no servidor; navegação e criador usam pequenos componentes interativos. Não há novas dependências de runtime, banco, worker ou serviço de IA.

Uma landing pronta não torna o estúdio apto a publicação pública: a exigência de autenticação e isolamento multiusuário permanece.


## Integração da equipe — 24/10/2026

O commit `ca87c9e` acrescentou landing editorial preta/bege, marca/avatares em
SVG (`apps/web/components/atlas-orb.tsx`) e a entrada `/workspace`. Essas alterações foram
preservadas no merge, junto do estúdio Atelier e leitor de fontes. `/studio`
continua funcional; `/workspace/settings` e `/studio/settings` apresentam o mesmo
painel de conexões. A seção **Seu Atlas** usa o criador existente e segue para
`/workspace`, mantendo nome/cor/tutor-base locais. O conteúdo visual/mockups da
landing não constitui evidência das métricas de marketing ou integrações reais.
