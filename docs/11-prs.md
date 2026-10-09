# PRs — HelpDesk BQ (backend + frontend)

Padrão: merge commit, NÃO squash, PRs sequenciais.

## Backend (repo HelpDesk-BQ/Backend)

| PR | Branch | Escopo | Estado |
|---|---|---|---|
| #1 | `feat/base-error-contract` | Erro aninhado, Helmet/CORS/100kb, `GET /health`, Jest+ESLint | merged |
| #2 | `feat/auth-sessions` | Users/login_attempts, login JWT + bloqueio, `POST /sessions` | merged |
| #3 | `feat/tickets-crud` | Tickets CRUD + filtros + paginação | merged |
| #4 | `feat/ticket-status-comments` | Transições + comentários + histórico | merged |
| #5 | `feat/ticket-admin-reports` | Delete, prioridade/responsável, relatórios, seed, logs, CI, carga | merged |
| #6 | `docs/backend` | Este dossiê | a abrir |
| — | `feat/sessao-cookie-httponly` | Cookie `httpOnly`, logout, `/me` | a propor |
| — | (+ `GET /api/users`) | Lista pública p/ atribuição | a propor |

## Frontend (repo HelpDesk-BQ/Frontend)

| PR | Branch | Escopo | Estado |
|---|---|---|---|
| #1 | `frontend-manchete` | Primeira versão (landing, 5 telas, 404, testes) | merged |
| — | `feat/frontend-base` | Evolução: cookie, telas, erros com CTA, CI, SPEC, testes | a propor |

Regra: PR vermelho (lint, testes, audit) não mescla.
