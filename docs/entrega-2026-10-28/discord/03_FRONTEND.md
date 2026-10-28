# Frente de interface

Já nesta branch: módulo Trails, projeção de progresso recebida do servidor, identidade personalizada compatível com IDs e cenários ilustrativos na landing.

Próximos pacotes: P04 trilhas adaptativas; P09 leitor/anotações; P12 fluxos, acessibilidade e polimento. Negócio pertence ao backend: não decidir XP, desbloqueio, membership ou consentimento pela UI.

Testes: npm run build e npm run test:e2e. Harness usa Next standalone/Nest compilado/Python, dados isolados e sem provedores pagos; em cloud ATLAS_E2E_CHROMIUM=/usr/bin/chromium. Assertions de citações, progressão, cofre e exclusão não podem ser relaxadas para ficar verde.

Anexar capturas verificadas e o guia técnico. Não confundir componentes de demonstração visual com recurso pronto no backend.
