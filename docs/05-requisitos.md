# Requisitos — HelpDesk BQ

## Funcionais

| ID | Requisito | Status |
|---|---|---|
| RF01 | Autenticar usuário ativo com credenciais válidas | ✅ `POST /api/sessions` |
| RF02 | Bloquear após 3 falhas/5min por 10min | ✅ janela deslizante, 423 |
| RF03 | Só autenticado cria chamado | ✅ `requireAuth` + 401 |
| RF04 | Título 10–100, descrição ≥ 30 | ✅ Zod Passo 30 |
| RF05 | Prioridade low/medium/high/critical | ✅ enum + CHECK |
| RF06 | Solicitante vê os seus; técnico a fila | ✅ filtro de dono forçado |
| RF07 | Só admin exclui, com justificativa e auditoria | ✅ soft delete + `deleted` |
| RF08 | Mudança de status/prioridade/responsável gera histórico | ✅ mesma transação |
| RF09 | Filtrar por status e prioridade, isolados ou combinados | ✅ query + índice |
| RF10 | Comentários até 1000 em chamado autorizado | ✅ trim 1–1000 |
| RF11 | Transições open→…→closed (+reabertura) | ✅ `assertTransition` |
| RF12 | Crítico não fecha sem comentário | ✅ `RESOLUTION_COMMENT_REQUIRED` |
| RF13 | Relatório por status/prioridade conforme filtros | ✅ `GET /reports/summary` |
| RF14 | Estado vazio explica e oferece ação | ⚠️ API retorna `total: 0`; UI pendente (frontend) |
| RF15 | Erros com código, mensagem segura e identificador | ✅ `{ error: { code, message, correlationId } }` |

## Não funcionais

| ID | Requisito | Status |
|---|---|---|
| RNF01 | 95% ≤ 800 ms com 20 usuários | ✅ p95 = 31 ms (2100 reqs) |
| RNF02 | 360 px sem rolagem horizontal | ⏳ frontend |
| RNF03 | WCAG 2.2 AA | ⏳ frontend (vermelho só em acentos grandes) |
| RNF04 | Hash forte; segredos fora do repo | ✅ bcrypt 12, `.env` ignorado |
| RNF05 | Erros sem stack/SQL/token | ✅ testes de envelope |
| RNF06 | Cobertura ≥ 70%; 100% regras críticas | ✅ ~90%/76% |
| RNF07 | Logs com evento/hora/rota/status/correlationId | ✅ 5 eventos |
| RNF08 | CI com lint+testes em todo PR | ✅ `ci.yml` |
