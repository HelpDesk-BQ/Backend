# HelpDesk BQ — Backend

API REST do sistema de chamados HelpDesk BQ (ETEC Bento Quirino — Operação Software Confiável).
Node.js + Express em ESM, PostgreSQL com migrations versionadas, validação Zod,
testes Jest + Supertest, arquitetura em camadas.

## Índice

1. [Stack](#1-stack)
2. [Início rápido](#2-início-rápido)
3. [Variáveis de ambiente](#3-variáveis-de-ambiente)
4. [Rotas](#4-rotas)
5. [Autenticação e bloqueio](#5-autenticação-e-bloqueio)
6. [Contrato de erro](#6-contrato-de-erro)
7. [Arquitetura](#7-arquitetura)
8. [Banco de dados](#8-banco-de-dados)
9. [Testes e qualidade](#9-testes-e-qualidade)
10. [Segurança](#10-segurança)

## 1. Stack

| Camada      | Tecnologia                          |
| ----------- | ----------------------------------- |
| Runtime     | Node.js 22 (ESM, `import`/`export`) |
| HTTP        | Express 5 + Helmet + CORS           |
| Validação   | Zod                                 |
| Banco       | PostgreSQL (`pg`, sem ORM)          |
| Migrations  | `node-pg-migrate` (SQL versionado)  |
| Auth        | `bcrypt` (hash) + `jsonwebtoken`    |
| Testes      | Jest + Supertest                     |
| Lint        | ESLint                              |

## 2. Início rápido

```bash
cp .env.example .env   # ajuste DATABASE_URL e JWT_SECRET
npm install
npm run db:create      # cria o banco local (lê DATABASE_URL)
npm run migrate        # aplica migrations versionadas
npm run db:seed        # usuários fictícios por papel
npm run dev            # sobe em PORT (padrão 3000)
```

```bash
npm test               # testes (sem banco: usa fakes)
npm run test:coverage  # testes + cobertura (mínimo global 70%)
npm run lint           # padrão estático (src, tests, scripts)
npm run migrate:down   # reverte a última migration
```

Base local: `http://localhost:3000`.

## 3. Variáveis de ambiente

| Variável         | Padrão (dev)                                            | Obrigatória em produção              |
| ---------------- | ------------------------------------------------------- | ------------------------------------ |
| `NODE_ENV`       | `development`                                           | —                                    |
| `PORT`           | `3000`                                                  | —                                    |
| `DATABASE_URL`   | `postgres://postgres:postgres@localhost:5432/helpdesk`  | sim (URL real, sem placeholder)      |
| `CORS_ORIGIN`    | `http://localhost:5500,http://127.0.0.1:5500` (lista `,`) | sim (origens do frontend)            |
| `JWT_SECRET`     | segredo somente-dev                                     | sim (aleatório, ≥ 32 caracteres)     |
| `JWT_EXPIRES_IN` | `1h` (formato `\d+[smhd]`)                              | —                                    |
| `BCRYPT_COST`    | `12` (4–15)                                             | —                                    |

Atenção: senha com `#` (ou `@`, `?`, `%`) na `DATABASE_URL` precisa de
percent-encoding (`#` → `%23`), pois aspas no `.env` não protegem a URL.

## 4. Rotas

Prefixo da API: `/api`. Todas as respostas carregam o header
`X-Correlation-Id` (eche o valor enviado ou gera um uuid-v4).

### 4.1 `GET /health`

Sonda de vida. Não toca no banco, não exige autenticação.

```bash
curl -i http://localhost:3000/health
```

```http
HTTP/1.1 200 OK
X-Correlation-Id: 55e80056-30e0-4958-8ac4-403fda005a2e

{ "status": "ok" }
```

### 4.2 `POST /api/sessions` — login (RF01, RF02)

Autentica usuário ativo e devolve token JWT Bearer + usuário público
(sem `password_hash`).

Body (JSON, objeto estrito — campos extras são rejeitados):

```json
{ "email": "lia@exemplo.local", "password": "Solicitante123!" }
```

```bash
curl -i -X POST http://localhost:3000/api/sessions \
  -H 'Content-Type: application/json' \
  -d '{"email":"lia@exemplo.local","password":"Solicitante123!"}'
```

Sucesso:

```http
HTTP/1.1 200 OK

{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "9d331132-6c50-4eee-a9be-9d6749359e49",
      "name": "Lia Solicitante",
      "email": "lia@exemplo.local",
      "role": "requester",
      "active": true
    }
  }
}
```

Falhas (mensagens genéricas — nunca revelam se o e-mail existe):

| Situação                          | HTTP | `code`                |
| --------------------------------- | ---- | --------------------- |
| Credencial inválida / e-mail inexistente / conta inativa | 401 | `INVALID_CREDENTIALS` (`Credenciais inválidas.`) |
| Conta bloqueada (3 falhas/5min → 10min) | 423 | `ACCOUNT_LOCKED` (`Acesso temporariamente indisponível.`) |
| Body malformado (e-mail inválido, campo ausente/extra) | 400 | `VALIDATION_ERROR` (`Revise os campos destacados.`) |

### 4.3 `POST /api/tickets` — criar chamado (RF03, RF04, RF05)

Autenticado. Dono (`requester_id`) sempre extraído do token — campo no body é rejeitado (objeto estrito).

```bash
curl -i -X POST http://localhost:3000/api/tickets \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Impressora do setor fiscal parou","description":"A impressora parou de responder após a última atualização do sistema.","priority":"high"}'
```

```http
HTTP/1.1 201 Created

{ "data": { "id": "...", "title": "...", "description": "...", "priority": "high",
  "status": "open", "requester_id": "...", "assignee_id": null, ... } }
```

Validação (Zod exato do Passo 30): `title` trim 10–100, `description` trim 30–5000, `priority` em `low|medium|high|critical`. Fora disso → `400 VALIDATION_ERROR`.

### 4.4 `GET /api/tickets` — listar com filtros e paginação (RF06, RF09)

Query: `status?` (`open|analysis|in_progress|resolved|closed`), `priority?`, `page?` (≥1, padrão 1), `limit?` (1–100, padrão 20).

```bash
curl -s "http://localhost:3000/api/tickets?status=open&priority=high" \
  -H "Authorization: Bearer $TOKEN"
```

```json
{ "data": { "items": [ ... ], "total": 1, "page": 1, "limit": 20 } }
```

Regra de visibilidade: solicitante recebe só os próprios (filtro de dono forçado); técnico e admin sem restrição de dono. Filtro inválido → `400 VALIDATION_ERROR`.

### 4.5 `GET /api/tickets/:id` — detalhe

`200` com o chamado; inexistente ou excluído → `404 NOT_FOUND`; de outro dono (solicitante) ou fechado (técnico) → `403 FORBIDDEN` (`Ação não autorizada.`).

### 4.6 `PATCH /api/tickets/:id/status` — transição (RF08, RF11, RF12)

Técnico/admin. Solicitante sempre `403`. Técnico em `closed` → `403` (fora da fila).

```bash
curl -X PATCH http://localhost:3000/api/tickets/<id>/status \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"status":"analysis"}'
```

```json
{ "data": { "ticket": { "id": "...", "status": "analysis" }, "comment": null } }
```

Regras: mapa `open→analysis→in_progress→resolved→closed` (+ `resolved→in_progress` reabertura);
salto inválido → `409 INVALID_STATE`; `→closed` sem `comment` não-branco → `409 RESOLUTION_COMMENT_REQUIRED`
(cobre RF12 do crítico). `comment` opcional (1–1000) vira linha em `comments`
(`is_resolution=true` em `resolved`/`closed`); toda troca grava `ticket_history`
(`status.changed`) na mesma transação.

### 4.7 `POST /api/tickets/:id/comments` — comentar (RF10)

Mesma visibilidade do detalhe (dono/técnico não-fechado/admin). Body estrito `{ body }` trim 1–1000.

```bash
curl -X POST http://localhost:3000/api/tickets/<id>/comments \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"body":"Verificando o cabo de rede."}'
```

`201` com o comentário; grava `ticket_history` (`comment.added`) na mesma transação.

### 4.8 `GET /api/tickets/:id/comments` e `/history` — leitura

Mesma visibilidade do detalhe; `200 { data: [...] }` em ordem cronológica.

### 4.9 `DELETE /api/tickets/:id` — exclusão lógica (RF07)

Somente admin. Exige `justification` (1–1000, vira `ticket_history` evento `deleted`).

```bash
curl -X DELETE http://localhost:3000/api/tickets/<id> \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"justification":"Chamado duplicado."}'
```

`200` com o chamado (`deleted_at` preenchido); não-admin → `403`; sem justificativa → `400`.
Excluídos somem de lista/detalhe/filtros/relatórios (`deleted_at IS NULL`).

### 4.10 `PATCH /api/tickets/:id/priority` e `/assignee` — (RF08)

Técnico/admin (mesmo RBAC da transição). Cada troca grava `ticket_history`
(`priority.changed` / `assignee.changed`) na mesma transação; valor igual retorna
`{ changed: false }` sem histórico. `assigneeId` aceita `null` (desatribuir);
responsável inexistente → `404`.

### 4.11 `GET /api/reports/summary` — totais (RF13)

Query opcional `status?`/`priority?`; solicitante restrito aos próprios.
`200 { data: { total, byStatus, byPriority } }`; estado vazio = `total: 0` com mapas vazios.

```bash
curl -s "http://localhost:3000/api/reports/summary?status=open" \
  -H "Authorization: Bearer $TOKEN"
```

### 4.12 `GET /api/users` — listagem para atribuição (RF08)

Query opcional `role?` (`requester|technician|admin`). Técnico/admin apenas
(solicitante → `403`). Retorna colunas públicas (`id, name, email, role`) —
nunca `password_hash`. Sessão também via cookie `helpdesk_token` (`HttpOnly`,
`SameSite=Lax`); `POST /api/sessions/logout` limpa; `GET /api/sessions/me`
devolve `{ id, role }`.

### 4.13 Logs estruturados (RNF07)

`src/utils/logger.js`: `{ level, event, timestamp, correlationId, route, status, ... }`
em JSON por linha no stdout. Eventos: `session.created`, `ticket.created`,
`ticket.status.changed`, `comment.added`, `ticket.deleted`. Nunca senha, token ou corpo sensível.

### 4.14 Rotas autenticadas (padrão geral)

Rota protegida exige:

```http
Authorization: Bearer <token>
```

Sem header, com esquema diferente de `Bearer` ou token inválido/alterado/expirado:

```http
HTTP/1.1 401 Unauthorized

{ "error": { "code": "UNAUTHORIZED", "message": "Autenticação necessária.", "correlationId": "..." } }
```

### 4.15 Erros de infraestrutura (todas as rotas)

| Situação                         | HTTP | `code`              |
| -------------------------------- | ---- | ------------------- |
| Rota inexistente                 | 404  | `NOT_FOUND`         |
| JSON malformado                  | 400  | `INVALID_JSON`      |
| Payload acima de 100 KB          | 413  | `PAYLOAD_TOO_LARGE` |
| Falha inesperada (log interno)   | 500  | `INTERNAL_ERROR`    |

## 5. Autenticação e bloqueio

- Senha verificada com `bcrypt.compare`; banco guarda só `password_hash`.
- E-mail normalizado (trim + minúsculas) antes de qualquer consulta.
- Janela deslizante por e-mail: **3 falhas em 5 min bloqueiam por 10 min**
  (contados da última falha). A 3ª falha já responde `423`.
- Conta bloqueada + senha correta continua `423` **sem** validar a senha
  (não reinicia o prazo silenciosamente).
- Falhas antigas (> 5 min) não contam; sucesso registra tentativa `success=true`.
- Tentativas de e-mail inexistente são registradas com `user_id` nulo —
  mesma resposta `401`, sem enumeração (RF02 + Gherkin do Passo 13 do PDF).
- Token JWT: payload `{ sub: userId, role }`, expiração `JWT_EXPIRES_IN`.
- Relógio injetável no serviço (`now`) — testes controlam o tempo sem `sleep`.

Usuários do seed (`npm run db:seed`, senhas só para dev):

| E-mail                  | Papel        | Senha             |
| ----------------------- | ------------ | ----------------- |
| `admin@exemplo.local`   | `admin`      | `Admin123!`       |
| `tecnico@exemplo.local` | `technician` | `Tecnico123!`     |
| `lia@exemplo.local`     | `requester`  | `Solicitante123!` |

## 6. Contrato de erro

Formato único (PDF, Passo 20), sempre com `correlationId` igual ao header:

```json
{ "error": { "code": "ACCOUNT_LOCKED", "message": "Acesso temporariamente indisponível.", "correlationId": "req_7f31..." } }
```

Regras: `code` estável em SNAKE_CASE; `message` segura e PT-BR para o usuário;
detalhes (`stack`, SQL, token, hash) ficam só no log interno, nunca na resposta.
`AppError(status, code, message)` para erros operacionais; qualquer outro erro
vira `500 INTERNAL_ERROR` genérico. `ZodError` vira `400 VALIDATION_ERROR`.

## 7. Arquitetura

```
HTTP → routes → controllers (finos) → services (regras, sem HTTP)
     → repositories (SQL parametrizado) → PostgreSQL (pg Pool)
```

- `src/app.js` compõe o Express **sem** abrir porta (`createApp({ corsOrigins, container })`
  aceita container injetado — testabilidade, Passo 22 do PDF).
- `src/server.js` só faz `listen` + shutdown gracioso (`SIGTERM`/`SIGINT`).
- `src/container.js` monta as dependências reais (`bcrypt`, `jsonwebtoken`, `pg`);
  testes injetam fakes.
- Código 100% em inglês; comentários raros e em PT-BR, só para o *porquê*.
- Serviços puros e testáveis sem servidor HTTP; repositórios substituíveis por
  dublês; `loadEnv(source)` puro para configuração.

## 8. Banco de dados

Tabelas (migrations em `migrations/`, `up` + `down`):

- `users(id, name, email UNIQUE, password_hash, role CHECK requester|technician|admin, active, created_at, updated_at)` + índice único em `email`.
- `login_attempts(id, user_id → users NULL ON DELETE CASCADE, email, success, created_at)` + índices `(email, created_at)` e `(user_id, created_at)` (janela de bloqueio).
- `tickets(id, title VARCHAR(100) CHECK ≥10, description CHECK ≥30, priority CHECK low|medium|high|critical, status CHECK + DEFAULT 'open', requester_id → users, assignee_id NULL → users, created_at, updated_at, deleted_at NULL)` + `idx_ticket_filter(status, priority)` e índices em `requester_id`/`assignee_id`.
- `comments(id, ticket_id → tickets CASCADE, author_id → users, body CHECK 1–1000, is_resolution DEFAULT false, created_at)` + índice `(ticket_id, created_at)`.
- `ticket_history(id, ticket_id → tickets CASCADE, actor_id → users, event, before NULL, after NULL, created_at)` + índice `(ticket_id, created_at)`.
- `pgcrypto` para `gen_random_uuid()`; datas `timestamptz` (UTC).

Fluxo: `npm run db:create` → `npm run migrate` → `npm run db:seed`.
Seed demo (A12, idempotente): 3 usuários por papel + 12 chamados
(3 open, 3 analysis, 3 in_progress, 2 resolved, 1 closed; prioridades distribuídas,
inclui 2 críticos).
Testes unitários/API **não** tocam o banco (fakes); integração real é manual
contra o banco local.

## 9. Testes e qualidade

```
tests/unit         → regras puras (authService, ticketService, env, correlation, AppError, repositories, container)
tests/integration  → contrato HTTP (errors, hardening, health, sessions, tickets, requireAuth)
```

- TDD/Shift-Left: testes antes do código nos fluxos críticos; relógio e dependências
  injetáveis; cada teste tem um motivo de falha.
- Cobertura atual: **~90% linhas / ~76% branches** (gate: ≥ 70% global, 100% das regras críticas).
- CI (RNF08, `.github/workflows/ci.yml`, Node 22): `npm ci` → `lint` → `test:coverage` → `audit --audit-level=high`; PR vermelho não mescla.
- Desempenho (RNF01, evidência em `evidencias/2026-10-08_perf_RNF01_carga-20vu.md`): 2100 reqs, 20 VUs,
  0 erros 5xx, **p95 = 31 ms** (gate ≤ 800 ms). Reprodução: `npm run dev` + `npm run perf`.

## 10. Segurança

- Helmet (headers), CORS por allowlist via env (sem `*`), JSON limitado a `100kb`.
- Queries 100% parametrizadas (`$1`); e-mail normalizado; nada de SQL concatenado.
- Nenhum segredo no repo (`.env` ignorado, `.env.example` sem valores reais).
- Logs: evento/resultado/`correlationId`; nunca senha, token ou corpo sensível.
- `npm audit --audit-level=high`: 0 vulnerabilidades (base 2026-10-05).
