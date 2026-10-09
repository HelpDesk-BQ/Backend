# Quality Gate — HelpDesk BQ (Passo 63, acordado antes do resultado)

| Critério | Estado |
|---|---|
| Must rastreados 100% | ✅ `24-matriz` |
| Críticos executados 100% | ✅ suíte + carga |
| Aprovação ≥ 90% com falhas analisadas | ✅ 100% verdes; D1–D6 analisados |
| 0 críticos | ✅ |
| 0 altos ou exceção formal | ✅ (19 moderate com plano em `15-divida`) |
| Sem quebra de acesso (RNF02/03 fluxos) | ✅ código; evidência manual pendente |
| a11y sem bloqueador | ✅ exceção botão delete registrada |
| p95 ≤ 800 ms | ✅ 31 ms |
| CI e docs verdes/completas | ⏳ CI no 1º PR; docs deste dossiê |

Exceção só com risco + justificativa + contorno + responsável + prazo + comitê.
Gate atual: **APROVADO COM PENDÊNCIAS** (roteiros assinados + 1º CI verde).
