# Identidade visual no README

- `atlas-readme-banner.svg`: composição vetorial com a paleta Atlas e a marca orbital de `apps/web/app/icon.svg`. O wordmark usa contornos de Instrument Serif, fonte já fornecida por `@fontsource/instrument-serif` no aplicativo. O SVG é autossuficiente; não carrega scripts, fontes ou imagens externas.
- `atlas-workspace.png`: captura real do build de produção, feita na verificação de 12/11/2026 com dados sintéticos. A própria tela identifica o modo extrativo. Não contém credenciais ou documentos pessoais.

A direção de cores, marca e tipografia está em [DESIGN_ATLAS.md](../DESIGN_ATLAS.md). O banner tem fundo próprio para manter a identidade nos temas claro e escuro do GitHub. A descrição alternativa e o texto do README continuam legíveis sem as imagens.

Ao atualizar a captura, use uma fonte sintética e preserve as indicações reais de capacidades. O arquivo é uma imagem da interface, não um mockup ou comprovação de uma integração externa.

Os badges em `badges/` são SVGs locais, com rótulos e descrições acessíveis. Suas versões resumem os manifests de frontend/backend, o lock Python e o runtime do CI; revise-os junto com atualizações dessas dependências. Não consultam serviços externos, não contam visitas e não representam status de CI ou deploy. Cada badge no README leva ao arquivo ou guia correspondente.

O badge MIT aponta à licença das contribuições originais do Atlas; não cobre conteúdo de terceiros. O banner inclui contornos de Instrument Serif: [copyright e OFL-1.1](licenses/instrument-serif-OFL.txt). Veja também as [exceções da licença do projeto](../../THIRD_PARTY_NOTICES.md).

## Operação e animação

- `atlas-operation.svg`: ilustração conceitual autoral do fluxo de estudo. Usa animações CSS locais, sem scripts, fontes ou imagens externas; `prefers-reduced-motion: reduce` desativa todas as animações. A arte distingue geração remota configurada e modo extrativo, sem representar telemetria real.
- `atlas-source-evidence.png`: captura sintética original `17-demo-citacao.png`, com a passagem de origem destacada.
- `atlas-quiz-feedback.png`: captura sintética original `18-demo-xp.png`, com feedback do quiz e XP.

As capturas foram verificadas em 12/11/2026. São do aplicativo em modo extrativo, sem documentos pessoais ou credenciais. Preserve esses avisos ao reutilizá-las.
