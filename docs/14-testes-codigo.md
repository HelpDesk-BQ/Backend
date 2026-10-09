# Testes no código — HelpDesk BQ (backend)

## Estratégia
TDD/Shift-Left: regra pura primeiro (`transition`, `assertTransition`), depois
serviço com dublês, depois contrato HTTP com Supertest. Relógio injetável
(`authService({ now })`); cada teste tem um motivo de falha; nada de `sleep`.

## Cobertura (última medição)
- Backend: 24 suites / 160 testes, ~90% linhas / ~76% branches (gate ≥ 70%).
- Regras críticas 100%: bloqueio, transições (válida/inválida/reabertura/fechamento),
  RBAC R1–R6, estados do Passo 45.
- Frontend: 5 suites / 82 testes, ~98% linhas / ~86% branches (gate 80%);
  `pages/*` verificadas pelo roteiro manual.

## Convenções
Unit em `tests/unit`, contrato em `tests/integration`, fakes em vez de banco;
`*.test.js` espelha o módulo. Falhou? Vira caso de regressão antes do fix.
