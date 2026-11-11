# Sign in with ChatGPT — fonte oficial verificada

Verificado em 08/11/2026 no repositório oficial
https://github.com/openai/sign-in-with-chatgpt-devkit,
revisão `0a36fefeb913055c8c7a1a29b63d82b96b2e841a`.
O site learn.chatgpt.com e o redirecionador share.google estavam bloqueados pelo
proxy deste ambiente; o código e a documentação oficial no GitHub foram acessados.

## Correções em relação à hipótese inicial

O README confirma login com conta ChatGPT e, com permissão, uso do plano de usuários
elegíveis para recursos de IA, sem configurar chave da Platform API.
Não é correto afirmar genericamente que a assinatura nunca serve para um app externo.
Tampouco se deve inventar elegibilidade de uma conta ou garantir quota/modelos.

O DevKit é destinado a aplicativos open-source executados na máquina do usuário.
O fluxo local não depende de comprar domínio ou informar Client ID manualmente:
`authorize` inicia com `dynamic_agent_client`, recebe o Client ID emitido no callback
e persiste o registro para futuras autorizações. Isso não é reutilização do Client
ID do Codex. Não transportar esse fluxo para um servidor Oracle multiusuário sem
verificar separadamente o suporte e os termos dessa arquitetura.

## Fluxo comprovado pelo código

- `@siwc/local` roda em Node local; `@siwc/react` fornece UI e estados seguros.
- OAuth Authorization Code + PKCE S256 + state + nonce, com ID token verificado.
- Callback HTTP exclusivamente em `127.0.0.1`, porta configurável ou automática,
  caminho `/auth/callback`; SDK valida método, host, caminho e state.
- Escopos usados pelo SDK: `openid profile email offline_access resource.invoke
  chatgpt.tokens.use.direct`; resource: `https://api.openai.com/v1`.
- A descoberta real do issuer https://auth.openai.com foi consultada. O SDK usa
  os endpoints descobertos e valida que pertencem ao issuer esperado.
- Inferência usa SDK oficial OpenAI, Responses API com streaming e `store:false`.
- Login e autorização de uso do plano são estados distintos: `sharing` pode ser
  false. Não forçar reconsentimento nem inferência sem escolha explícita.
- Access/refresh/ID tokens ficam no processo local confiável, nunca no renderer,
  localStorage, logs ou telemetria; UI recebe estado seguro, não credenciais.
- Encryption provider é obrigatório e deve ser apoiado pelo SO. Não há fallback
  plaintext; não substituir por chave fixa ou simples env de servidor.
- Rotação, refresh pendente, falha temporária de JWKS, revogação não confirmada e
  múltiplos perfis precisam preservar os comportamentos do SDK oficial.

## Arquitetura autorizada e implementada na branch

Modo local Atlas: SDK na máquina do estudante + cofre do SO + ponte local restrita
para UI/modelos. Modo hospedado Oracle: preservar as conexões de API atuais até
haver confirmação oficial de uma alternativa suportada para o uso do plano nesse
modelo. Não enviar tokens OAuth pessoais para a VPS como solução improvisada.

O responsável autorizou continuar com local+Oracle. A implementação usa o SDK
oficial no cliente opcional Electron, com cofre do SO, componentes oficiais e
ponte de geração direta restrita. `/login` orienta a preparação; não simula
autenticação na VPS. [Arquitetura e limites](../architecture/chatgpt-local.md).
O código foi testado com provedor sintético; elegibilidade, autorização OAuth
e uso real de uma assinatura ainda precisam do teste interativo do usuário.

O DevKit possui licença Noncommercial v1.0; código independente não muda de licença
apenas por chamar sua interface, mas a inclusão/distribuição do componente deve
preservar os avisos e respeitar suas condições. Ser open-source não basta para
concluir que qualquer uso comercial está autorizado.

## Referências oficiais

- README: https://github.com/openai/sign-in-with-chatgpt-devkit/blob/0a36fefeb913055c8c7a1a29b63d82b96b2e841a/README.md
- OAuth: https://github.com/openai/sign-in-with-chatgpt-devkit/blob/0a36fefeb913055c8c7a1a29b63d82b96b2e841a/packages/local/src/oauth.ts
- Segurança: https://github.com/openai/sign-in-with-chatgpt-devkit/blob/0a36fefeb913055c8c7a1a29b63d82b96b2e841a/docs/security.md
- Exemplo Responses: https://github.com/openai/sign-in-with-chatgpt-devkit/blob/0a36fefeb913055c8c7a1a29b63d82b96b2e841a/examples/paste-perfect/README.md
- Cookbook indicado pelo README: https://developers.openai.com/cookbook/articles/sign-in-with-chatgpt
