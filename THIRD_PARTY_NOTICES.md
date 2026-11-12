# Licença do Atlas e materiais de terceiros

A [licença MIT](LICENSE) da raiz aplica-se ao código e à documentação originais do NovaMente Atlas que os respectivos autores podem licenciar nesses termos. Ela não substitui licenças de dependências, conteúdo importado, fontes, marcas, documentos enviados por usuários ou componentes identificados abaixo.

| Material | Termos que devem ser preservados |
| --- | --- |
| Dependências npm e Python | Licenças e avisos de cada pacote; versões em `package-lock.json` e nos locks Python. A licença da raiz não relicencia essas dependências. |
| `.agents/skills/` | Materiais de apoio de terceiros com termos distintos. Preserve os arquivos `LICENSE*` e os campos `license` existentes; não presuma MIT para um diretório sem aviso. |
| Sign in with ChatGPT DevKit | [Licença do submódulo](integrations/chatgpt-desktop/devkit/LICENSE): **Sign-in with ChatGPT DevKit Noncommercial License 1.0**. Preserve seus avisos e [notas de terceiros](integrations/chatgpt-desktop/devkit/THIRD_PARTY_NOTICES.md). |
| Patch do DevKit | `integrations/chatgpt-desktop/patches/bounded-responses.patch` modifica o DevKit e segue as condições aplicáveis a modificações, incluindo a seção 4 de sua licença; não é relicenciado pela MIT da raiz. |
| Instrument Serif, Plus Jakarta Sans e JetBrains Mono | Fontes distribuídas por `@fontsource`, sob **SIL Open Font License 1.1**, com os respectivos copyrights nos pacotes. |
| Banner do README | Composição Atlas com contornos de Instrument Serif. O [aviso e a licença da fonte](docs/assets/licenses/instrument-serif-OFL.txt) acompanham o recurso; não são substituídos pela MIT. |
| Documentos e conteúdo de usuários | Direitos dos respectivos titulares. Upload no Atlas não concede licença para publicar esse conteúdo no repositório. |
| Nomes e marcas de organizações/provedores | Identificam tecnologias e o contexto do projeto. A MIT não concede direitos sobre marcas Oracle, Alura, No Country, OpenAI ou de terceiros, nem implica endosso. |

## Pendências concretas de redistribuição

A conferência dos avisos locais em **12/11/2026** encontrou termos proprietários em [pdf](.agents/skills/pdf/LICENSE.txt), [docx](.agents/skills/docx/LICENSE.txt), [pptx](.agents/skills/pptx/LICENSE.txt) e [xlsx](.agents/skills/xlsx/LICENSE.txt). Esses avisos restringem cópia, distribuição e sublicenciamento. Os arquivos já estavam rastreados antes da inclusão da MIT.

Este aviso registra a pendência; **não concede autorização nem regulariza a distribuição existente**. Antes de redistribuir esses packs, a equipe precisa verificar autorização expressa ou substituí-los/removê-los da distribuição. As demais skills também precisam de revisão pelos respectivos termos; não foi feita uma auditoria exaustiva de direitos de todo o acervo.

O DevKit permite os usos não comerciais definidos em sua própria licença, que não equivalem a qualquer uso de um projeto educacional ou gratuito. Uso comercial exige a autorização prevista naquele documento. O cliente é opcional e separado do perfil Atlas que usa APIs de provedores.

## Ao preparar uma distribuição

Preserve as licenças e os avisos dos componentes efetivamente incluídos. As dependências e os termos de serviços externos não passam a ser MIT por serem usadas pelo Atlas. Não inclua documentos pessoais, credenciais ou marcas de terceiros como se fossem conteúdo autoral da equipe.
