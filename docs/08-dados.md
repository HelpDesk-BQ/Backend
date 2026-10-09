# Dados — HelpDesk BQ

## Entidades
| Entidade | Campos essenciais | Relação |
|---|---|---|
| users | id, name, email UNIQUE, password_hash, role, active | 1:N tickets/comments/history |
| tickets | id, title(10–100), description(≥30), priority, status, requester_id, assignee_id NULL, deleted_at NULL | N:1 solicitante |
| comments | id, ticket_id, author_id, body(1–1000), is_resolution | N:1 chamado (CASCADE) |
| ticket_history | id, ticket_id, actor_id, event, before, after | N:1 chamado (CASCADE) |
| login_attempts | user_id NULL, email, success, created_at | apoia bloqueio (janela 5min) |

## Regras
- Checks no DDL (título, descrição, priority/status em enums); `idx_ticket_filter(status, priority)`; índices em `requester_id`, `assignee_id`, `(email, created_at)`.
- Datas `timestamptz` (UTC); `pgcrypto` para `gen_random_uuid()`; migrations versionadas com `up`+`down`.
- Exclusão lógica (`deleted_at`); toda leitura filtra `deleted_at IS NULL`.
- Privacidade: só dados necessários; seed fictício (`@exemplo.local`); sem dado pessoal real; senhas só como hash (bcrypt 12).

## Seed demo (idempotente)
3 usuários por papel + 12 chamados (3 open, 3 analysis, 3 in_progress, 2 resolved,
1 closed; 2 críticos), dono `lia`, responsável `tecnico` fora de `open`.
