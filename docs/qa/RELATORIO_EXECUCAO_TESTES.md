# Relatório de Execução de QA e Testes Unitários

**Data de Execução:** 09/11/2026  
**Responsável QA:** Samuel Souza Ferreira  
**Ambiente:** Local (WSL2 Ubuntu / `extractive_demo`)

---

## 1. Testes Automatizados (Backend, API e Cognition)

Comando executado: `npm test`

- **Total de testes rodados:** 121
- **Passaram:** 121 (100%)
- **Falhas:** 0

### Detalhamento por Módulo:
* **API Node.js/TypeScript (`@atlas/api`):** 50 testes passados (`PASS`)
  * Cofre de provedores, isolamento por tenant, criptografia e políticas do Dreamer/Eve.
* **Módulo de Cognição (Python `unittest`):** 66 testes passados (`PASS`)
  * Ingestão de documentos, ciclo de vida/remoção no Qdrant/Mongo, validação de XP e trilhas.
* **Validação de Ambiente (Scripts Node.js):** 5 testes passados (`PASS`)
  * Verificação de chaves e variáveis em `env-loader.test.mjs` e `check-env.test.mjs`.

---

## 2. Testes Manuais de Interface (UI)

* **UI-01 (Responsividade):** PASSOU — Layout adapta corretamente sem quebras.
* **UI-02 (Painéis e Modais):** PASSOU — Transições e fechamento de gavetas operacionais.
* **UI-03 (Tema Claro/Escuro):** NÃO IMPLEMENTADO — Recurso ausente na versão atual.
* **UI-04 (Indicador de Carregamento):** PASSOU — Exibe "extraindo e indexando" durante upload.
* **UI-05 (Notificações de Erro):** PASSOU — Alerta *inline* exibido ("O arquivo deve ter até 10 MiB").

---

## 3. Issues Registradas

* **UPL-09 (Bug de Upload 9MB):** Registrado em Issue no GitHub. Arquivo de 9 MiB dentro do limite travou a renderização da interface.

---
*Planilha completa atualizada em: `docs/qa/Casos_de_Teste_NovaMente_Atlas.xlsx`*
