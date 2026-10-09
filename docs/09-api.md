# API — HelpDesk BQ (contrato)

Prefixo `/api`; toda resposta carrega `X-Correlation-Id`. Autenticadas exigem
`Authorization: Bearer <token>` **ou** cookie `helpdesk_token`.

| Método e rota | Entrada | Saída principal |
|---|---|---|
| `POST /api/sessions` | email, password | 200 `{ data: { token, user } }` + cookie \| 401/423 |
| `POST /api/sessions/logout` | — | 200 `{ data: { loggedOut: true } }` + limpa cookie |
| `GET /api/sessions/me` | — | 200 `{ data: { id, role } }` \| 401 |
| `POST /api/tickets` | title, description, priority (estrito) | 201, `status: open`, dono do token |
| `GET /api/tickets` | status?, priority?, page?, limit? | 200 `{ items, total, page, limit }` |
| `GET /api/tickets/:id` | id | 200 \| 403 \| 404 |
| `PATCH /api/tickets/:id/status` | status, comment? | 200 `{ ticket, comment }` + histórico |
| `PATCH /api/tickets/:id/priority` | priority | 200 `{ ticket, changed }` + histórico |
| `PATCH /api/tickets/:id/assignee` | assigneeId \| null | 200 `{ ticket, changed }` + histórico |
| `POST /api/tickets/:id/comments` | body (1–1000) | 201 + histórico |
| `GET /api/tickets/:id/comments` | — | 200 cronológico |
| `GET /api/tickets/:id/history` | — | 200 cronológico |
| `DELETE /api/tickets/:id` | justification | 200 soft delete + histórico |
| `GET /api/users` | role? | 200 colunas públicas (técnico/admin) |
| `GET /api/reports/summary` | filtros | 200 `{ total, byStatus, byPriority }` |

## Erros (contrato único)
`{ "error": { "code": "ACCOUNT_LOCKED", "message": "Acesso temporariamente indisponível.", "correlationId": "..." } }` · 400 validação 

(`Revise os campos destacados.`) · 401 

(`Autenticação necessária.`) ·403 

(`Ação não autorizada.`) · 404 

(`Recurso não encontrado.`) · 409 transição

(`Transição não permitida.`) · 413/500 genéricos. Stack/SQL/token só no log.
