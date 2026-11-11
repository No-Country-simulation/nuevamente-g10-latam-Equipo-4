# Migração0.6 — fontes e conversas

Faça backup consistente de SQLite e dos objetos antes de atualizar. Não copiar
apenas atlas.sqlite3 de um servidor escrevendo em WAL: parar os serviços ou usar
backupSQLite. Guardar a master do cofre separadamente, sem incluí-la no Git.

A migração aditiva registra versões1–4. Ela não apaga dados para passar no teste.
Referências inválidas, NULL/tipos não textuais e contextos históricos sem escopo
seguro viram `package_integrity_issues`. Consultar somente IDs/contagens para
planejar a migração; não copiar texto privado para issues ou logs públicos.

Novos turnos têm `conversation_sources`, com FK por tenant/turno/documento.
Contexto só é reutilizado se todas suas fontes estiverem selecionadas no estudo
atual; compartilhar entre tutores ainda depende de consentimento. Não apagar a
proveniência deixando o texto disponível ao modelo. Histórico legado sem refs
continua armazenado até a limpeza autorizada, mas não alimenta novas gerações.

Um material antigo pode conter fatos derivados do contexto, mesmo que cite só
uma fonteB. Limpar o campo input.conversation_context não remove esses fatos.
Por isso contexto legado não-vazio bloqueia leitura do material, geração e
remoção antes de efeitos. O aviso público é409/source_reconciliation_required.
Dados originais permanecem; o responsável precisa revisar a reconstrução.

Procedimento administrativo ainda manual, em cópia isolada do backup:

1. Inventariar pacote/tenant/ref problemática e localizar o artefato correspondente.
2. Determinar todas as dependências de conteúdo, incluindo histórico, trilhas e XP.
3. Escolher reconstruir com fontes autorizadas ou retirar o artefato e seus efeitos.
4. Validar citações, proveniência, objetos, recibos e vínculos após a correção.
5. Repetir migração/testes e só então aplicar o procedimento revisado na instalação.

Não liberar a quarentena apenas apagando o campo, o inventário ou desativando FK.
Não apontar `atlas.documents.reconcile` como reparo desses materiais: esse CLI
trata outboxes de remoção já iniciadas; esta quarentena bloqueia antes do outbox.
Uma interface/comando administrativo de reconstrução de pacotes legados ainda é
pendência, sem aprovação de migração automática para uma base com esses casos.

Temporários de upload são separados dos originais canônicos. Cada processo usa
pasta0700/manifesto0600; shutdown limpa sua pasta. Após um crashSIGKILL, próximo
startup remove apenas diretórios privados reconhecidos cujo PID não existe.
Um PID ainda existente, pasta sem manifesto ou symlink não é apagado por palpite.
Interromper ingestão não comprova se o Python já persistiu a fonte: conferir a
biblioteca antes de reenviar. O hash deduplica dentro do mesmo proprietário.
