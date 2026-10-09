# Defeitos — HelpDesk BQ (todos fechados)

| # | Achado | Causa | Correção | Status |
|---|---|---|---|---|
| D1 | `transition.test.js` esperava `INVALID_STATE` na mensagem | Teste checava `message` PT-BR em vez de `error.code` | Teste verifica `code` | ✅ fechado, com regressão |
| D2 | Resíduos de carga no banco (14 tickets) | 1º run quebrou antes da limpeza | Removidos via `DELETE` admin; script com `finally` conceitual | ✅ banco em 12 |
| D3 | `Response.clone()` após corpo consumido no `perf-rnf01` | `timed()` já lia o corpo | Guarda `bodyText` na resposta | ✅ + teste de fumaça manual |
| D4 | Detalhe sem carregar (genérico) | `await reload()` no topo + `deleteButton` em TDZ | Inicialização no fim do módulo; `console.error` no catch | ✅ + regra: init por último |
| D5 | `STATUS_PT` sem import no detalhe | Lint sem `recommended` | Import adicionado | ✅ |
| D6 | CSP bloqueando `style=""` e `.style` no JS | Estilos inline | Tudo virou classe (`actions-row--center` etc.) + favicon data-URI | ✅ grep recorrente |

Sem defeitos abertos. Todo achado virou teste ou verificação antes do fix.
