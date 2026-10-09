# Scripts de teste — HelpDesk BQ

| Script | Onde | Uso |
|---|---|---|
| `npm test` / `test:coverage` | Backend e Frontend | suites Jest (unit + integração/API) |
| `npm run lint` | ambos | ESLint antes de todo teste |
| `npm audit --audit-level=high` | ambos | CI; 0 high/critical |
| `scripts/perf-rnf01.mjs` (`npm run perf`) | Backend | Carga RNF01: `--vus/--iters/--base/--out`; cria, mede e **limpa** via delete admin |
| `scripts/seed.mjs` (`db:seed`) | Backend | Massa demo idempotente (3 usuários + 12 chamados) |
| `scripts/migrate.js` | Backend | `up`/`down` das migrations versionadas |
| `tests/e2e/roteiro-manual.md` | Frontend | 2 roteiros com data + responsável |

Evidência de carga versionada em `evidencias/` (local):
`2026-10-08_perf_RNF01_carga-20vu.md`.
