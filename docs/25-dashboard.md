# Dashboard da qualidade — HelpDesk BQ (atualizar por release)

| Sinal | Atual | Gate |
|---|---|---|
| Testes backend | 24 suites / 160 ✅ | verde |
| Testes frontend | 5 suites / 82 ✅ | verde |
| Cobertura backend | ~90% linhas / ~76% branches | ≥ 70% ✅ |
| Cobertura frontend | ~98% linhas / ~86% branches | ≥ 80% ✅ |
| Audit (ambos) | 0 high/critical | ✅ |
| Carga p95 (20 VUs) | 31 ms | ≤ 800 ms ✅ |
| Defeitos críticos/altos abertos | 0 / 0 | ✅ |
| Roteiros manuais assinados | 0 / 2 | ⏳ pendente |
| CI verde em PR | ⏳ 1º PR de cada repo | — |

Comando de atualização: `npm run lint && npm test -- --coverage && npm audit --audit-level=high` nos dois repos.
