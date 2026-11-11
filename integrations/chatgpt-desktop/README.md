# Atlas local com Sign in with ChatGPT

Cliente opcional para o computador do estudante. Não instalar Electron na VPS.
Fluxo oficial OAuth com registro dinâmico: este modo não precisa comprar domínio
nem preencher Client ID manualmente. A conta precisa ser elegível e autorizar o
uso; saldo, modelos e limites pertencem ao ChatGPT. Não há garantia de uso gratuito.

## Preparar e abrir

Linux AMD64 com Node24, npm11, Python3.12, ambiente gráfico e GNOME Keyring ou
KWallet desbloqueado. Primeiro prepare o Atlas, na raiz do repositório:

```bash
bash scripts/setup.sh
npm run build
npm run chatgpt:setup
npm run chatgpt:start
```

O setup opcional inicializa o submodule fixado, verifica/aplica o patch restrito,
instala dependências com lock, executa o instalador oficial do binário Electron
e compila o SDK/renderer. O Electron42 não baixa esse binário apenas com npmci. Repetir não apaga edições;
modificações desconhecidas interrompem o build. Em ambiente cloud com proxy,
preserve proxy/CA; Node24 pode precisar de `NODE_USE_ENV_PROXY=1` no download do
Electron. Não desative TLS, sandbox ou cofre para conseguir iniciar.

1. Na janela Atlas, clique no botão oficial **Continue with ChatGPT**.
2. Faça login no navegador aberto pelo SDK e confira a autorização solicitada.
3. Se o uso do plano estiver desligado, ative-o explicitamente na conexão.
4. Selecione um modelo retornado pela conta e clique em **Abrir meu Atlas**.
5. Envie uma fonte e comece o estudo. Memória Dreamer tem consentimento separado.

O menu **Atlas → Conta e uso do ChatGPT** volta à conexão e aos controles de uso.
É possível adicionar/selecionar perfis. Troca de conta encerra os serviços antigos
e abre dados separados. Nome visual de tutor, método e memória não são alterados
por login. Desconectar revoga a conexão pelo SDK e encerra serviços; documentos
ficam no perfil. Remova-os no gerenciador de fontes quando desejar.

O cofre do SO precisa estar disponível. No Linux, `basic_text` não é aceito.
Mensagens de revogação não confirmada/reconexão do SDK devem ser resolvidas antes
de continuar. Não apagar arquivos criptografados como solução para um cofre
bloqueado. Ações na conta ChatGPT também podem ser necessárias.

## O que este modo faz

Geração direta de texto por Responses com JSON e citações validados no backend.
A ponte não suporta ferramentas nativas do modelo, então não anuncia execução
Eve/debate nesse perfil. No modo Oracle/API, a factory Eve continua disponível.
O resolvedor bloqueia troca de geração para chaves pagas, inclusive se houver
uma chave antiga salva. Outras conexões (Jev, Firecrawl, embeddings opcionais)
são independentes e usam suas próprias credenciais quando configuradas.

80MiB é o tamanho máximo do arquivo, não a janela do modelo: parser/contexto têm
limites próprios. Sem Jev, avaliação semântica e promoção Dreamer não são fingidas.
O indicador oficial de uso fica em `unknown` sem confirmação do runtime; não
interpretar “conectado” como prova de saldo/plano versus créditos.

## Desenvolvimento e testes

```bash
npm run build --prefix integrations/chatgpt-desktop
npm run chatgpt:test
# Após build do Atlas; requer display ou Xvfb e dependências nativas Electron:
xvfb-run -a node integrations/chatgpt-desktop/test/native-smoke.mjs
```

Testes usam credenciais e provedor sintéticos; não fazem OAuth real nem gastam
assinatura. Smoke nativo exercita Electron, Next, Nest e Python reais, capability
da janela, geração citada, quota/replay e encerramento dos filhos.
Para login real, o próprio usuário deve clicar/autorizar; não reutilizar tokens
do Codex ou copiar tokens/cookies do navegador. Não enviar segredos no chat.

Mapa do código, ameaças e isolamento: [arquitetura](../../docs/architecture/chatgpt-local.md).
Ainda não há instalador/notarização nem suporte Windows nativo/macOS validado.
Autenticação multiusuário Oracle continua pendente e não é habilitada por este
cliente local. Não expor o workspace web compartilhado na Internet.

## Proveniência e licença

SDK OpenAI: https://github.com/openai/sign-in-with-chatgpt-devkit,
pin `0a36fefeb913055c8c7a1a29b63d82b96b2e841a`. Único patch do Atlas:
limite de tokens e formato JSON encaminhados ao Responses. Verificação exata do
diff antes de compilar; protocolo OAuth permanece no SDK oficial.

Preservar [licença Noncommercial v1.0](devkit/LICENSE),
[avisos de terceiros](devkit/THIRD_PARTY_NOTICES.md) e avisos copiados ao dist.
A licença do Atlas não substitui as condições do DevKit. Ser educacional ou
open-source não significa autorização automática para distribuição comercial.
