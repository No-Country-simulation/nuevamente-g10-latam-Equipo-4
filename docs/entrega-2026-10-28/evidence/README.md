# Evidência local

- `quality-summary.json`: resumo do sensor, digest das fontes/política e dívida.
  O relatório integral é reproduzível por `npm run quality`, não é omitido do gate.
- `runtime.json`: ensaio de processos production-only, não benchmark de pico/VM.
- `checks.json`: contagens e escopo das verificações locais.
- `trails-desktop.png` e `trails-mobile.png`: capturas do E2E, com dados sintéticos.

Os logs completos locais estão em `/tmp/atlas-v05-close-*.log`; CI guarda seus
próprios artifacts. Caminhos temporários não são evidência durável remota.
O parecer vincula o digest revisado; commits de documentação não mudam esse digest.
O SHA candidato do sensor corresponde ao HEAD na hora da coleta, e scope explicita
se há worktree além dele. Não confundir com execução remota do CI ou release.
