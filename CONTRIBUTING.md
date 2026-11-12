# Contribuir com o NovaMente Atlas

Você pode contribuir com código, testes, infraestrutura, acessibilidade, documentação ou sugestões de aprendizagem. Consulte a [equipe e os créditos](CONTRIBUTORS.md) e leia as [regras do projeto](AGENTS.md) antes de começar.

## Preparar a primeira mudança

1. Siga a [primeira execução](README.md#primeira-execução-passo-a-passo). O modo extrativo funciona sem pagar por um provedor de IA.
2. Abra uma issue no repositório em que pretende contribuir. Descreva o problema, o comportamento esperado e como reproduzir. Não inclua documentos pessoais, chaves ou dados de usuários.
3. Combine com quem cuida da área para evitar alterações simultâneas nos mesmos arquivos. Fora da equipe, use um fork.
4. Com o diretório de trabalho limpo, atualize a base e crie uma branch:

```bash
git switch main
git pull --ff-only
git switch -c feat/descricao-curta
```

Se houver alterações locais, preserve-as antes de trocar de branch. Não use `reset --hard`, `clean` ou force push para resolver divergências da equipe.

## Onde trabalhar

| Área | Primeiro lugar para olhar |
| --- | --- |
| Frontend | `apps/web/`; leia também [suas regras](apps/web/AGENTS.md) |
| Backend, orquestração e ações | `apps/api/` |
| Documentos, RAG, memória e progresso | `services/cognition/atlas/` |
| Contratos compartilhados | `packages/contracts/` e `schemas/` |
| Cloud, imagens e entrega | `infra/`, arquivos Compose e `.github/workflows/` |
| Guias e diagramas | `docs/` e `README.md` |

Regras de negócio ficam no backend. Preserve isolamento de usuários, consentimento, citações verificáveis e idempotência de operações. Use `.env.example` como referência; nunca versionar `.env`, tokens ou o cofre.

## Conferir antes do PR

Use as [verificações do projeto](README.md#verificações-qual-comando-responde-a-qual-pergunta) conforme a mudança. Código exige testes de comportamento, tipos e build; mudanças em autenticação, jornadas ou operações exigem as verificações de integração correspondentes. Mudanças apenas em texto ou imagens pedem conferência de links, conteúdo e renderização.

Não remova ou ignore testes, não reduza os quality gates e não altere expectativas para acomodar um bug. Corrija a causa e registre o resultado real. Teste com provedor sintético não comprova uma integração externa.

## Commits pequenos e explicados

Revise `git diff`, selecione arquivos específicos e mantenha **até 400 linhas textuais alteradas por commit**, contando adições e remoções. Binários ficam separados e com origem registrada. Cada commit deve explicar o motivo no corpo:

```bash
git add caminho/do/arquivo
git diff --cached
git commit -m "fix: impede pontuação repetida" -m "Por quê: Repetir o mesmo acerto não deve conceder XP novamente."
git push -u origin feat/descricao-curta
```

Substitua o caminho e a descrição pelos da sua alteração. Abra um PR para `main` com problema, solução, validação e limitações. Aguarde revisão e verificações; não integre conflitos ou testes quebrados.

Mantenedores com acesso aos dois destinos podem usar `bash scripts/push-branch-both.sh` e abrir um PR em cada repositório. Contribuições por fork usam o PR normal; o mantenedor cuida da sincronização. Preserve os commits individuais na integração.

## Créditos e licença

Ao participar, proponha a inclusão ou atualização do seu papel em [CONTRIBUTORS.md](CONTRIBUTORS.md). Documentação, revisão, cloud e testes também recebem crédito; não é preciso disputar contagem de commits.

Contribuições originais ao Atlas seguem a [licença MIT](LICENSE). Envie somente material que você tem direito de contribuir nesses termos. Materiais de terceiros mantêm suas licenças; não altere avisos ou copie um pack para o projeto presumindo que a MIT da raiz o abrange. Leia as [exceções e pendências identificadas](THIRD_PARTY_NOTICES.md).
