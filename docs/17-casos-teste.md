# Casos de teste — HelpDesk BQ (amostra rastreável; suíte completa no código)

## Funcionais (15)
F1 login válido 200 + JWT · F2 bloqueio na 3ª falha (423) · F3 criar chamado 201
com dono do token · F4 listar com filtros + paginação · F5 detalhe do dono 200 ·
F6 `open→analysis→in_progress→resolved→closed` · F7 reabertura justificada ·
F8 comentário 201 + histórico · F9 prioridade/responsável com histórico ·
F10 delete admin com justificativa · F11 `summary` por filtros · F12 `/users`
sem hash · F13 cookie `httpOnly` no login · F14 logout limpa cookie ·
F15 `/me` devolve papel.

## Negativos (5)
N1 credencial inválida 401 genérico · N2 e-mail inexistente = mesmo 401 (sem
enumeração) · N3 solicitante em ticket alheio 403 · N4 salto `open→closed` 409 ·
N5 fechar sem comentário 409.

## Limites (3)
L1 título 9/10/100/101 · L2 descrição 29/30 · L3 comentário 0/1/1000/1001;
janela 0–2 libera, 3ª bloqueia, após 10 min libera.

## API (3)
A1 envelope `{ error: { code, message, correlationId } }` em todo erro ·
A2 `X-Correlation-Id` ecoado · A3 JSON > 100 KB → 413.

## Segurança (2)
S1 técnico fora da fila (`closed`) 403 · S2 requester em escrita 403.

## Acessibilidade (2)
A11y1 erro junto ao campo + foco · A11y2 pills com texto + símbolo (nunca só cor).

## Desempenho (1)
P1 carga 20 VUs: p95 ≤ 800 ms (medido 31 ms, 2100 reqs, 0 erros).
