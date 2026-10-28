# Entrega Atlas0.5 — arquitetura, qualidade e pós-MVP

Data:28/10/2026. Sincronização inicial: os dois repositórios já estavam em
`3a58543`. Trabalho em `feat/andre-pos-mvp-quality-20261028`; main não é destino
desta entrega. Os materiais abaixo descrevem implementação e pendências.

## Comece por aqui

| Necessidade | Arquivo |
| --- | --- |
| Saber o que foi feito e comprovado | [Relatório](RELATORIO.md) e [revisão independente](REVISAO_INDEPENDENTE.md) |
| Saber o que depende de você | [Ações U01–U16](SUA_PARTE.md) |
| Executar as próximas três semanas | [Roadmap](ROADMAP_3_SEMANAS.md), [15 specs](BACKLOG_E_SPECS.md) e [CSV](BACKLOG.csv) |
| Entender as regras desta entrega | [Spec0.5](SPEC.md) |
| Entender o monólito modular | [Arquitetura Markdown](ARQUITETURA.md) e [PDF](Atlas_Arquitetura_05.pdf) |
| Entender tecnicamente o código | [Guia fonte](GUIA_TECNICO.md) e [guia PDF](Atlas_Guia_Tecnico_Codigo.pdf) |
| Apresentar o produto | [Pitch fonte](PITCH.md) e [pitch PDF, seis slides](Atlas_Pitch.pdf) |
| Configurar segredos/ambiente | [Catálogo ENV](ENV.md) e [exemplo sem segredos](../../.env.example) |
| Documentar nos canais da imagem | [Pacote Discord, oito arquivos](discord/00_COMO_USAR.md) |
| Evitar sobreposição com a Taylam | [Comparação de branches](COMPATIBILIDADE_TAYLAM.md) |
| Conferir gates e ferramentas | [Qualidade](../quality/README.md) |

## Implementado nesta branch

- Trilhas persistentes com quatro etapas, fontes/versionamento, material validado
  e progresso decidido no servidor. O roteiro inicial é local, explicitamente.
- Comandos com recibos persistentes: replay, conflito, recuperação segura após
  queda, quotas, TTL e invalidação ao esquecer memória. Clientes sem ID ainda
  são compatíveis; P01 fecha o contrato obrigatório e a reconciliação.
- Quiz com evento imutável e XP único mesmo em concorrência; nível/projeção
  retornam do backend.
- Controllers Nest separados, módulos Python de comunidade/trilhas e backend
  responsável pelas regras. Upload repetido não reexecuta parser; RAG de seções
  não carrega fontes integrais.
- Guia, Faísca, Prisma, Trama e Elo, preservando os IDs e a personalização visual.
- Dependências corrigidas e árvore de produção separada da árvore de
  desenvolvimento/web; builds continuam fora da VPS.
- Testes reproduzíveis e gates de regressão, incluindo UI, com revisão separada.

## Limites e próximos passos

Não houve merge em main, publicação de imagens, VM/bucket provisionado nem
deploy público. Contas/provedores/OCI, autenticação multiusuário, medição4GiB e
restauração têm gates próprios. O pós-MVP completo tem specs e plano, não está
declarado pronto. O roadmap assume quatro pessoas com capacidade disponível e
registra como cortar escopo de modo explícito se dependências atrasarem.

Não usar a contagem de testes ou o parecer de um agente como substituto de
avaliação pedagógica, revisão humana ou aceite real do edital. Nenhum teste
foi removido/desativado para obter verde; falhas encontradas exigiram correção.
