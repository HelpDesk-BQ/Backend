# Execução de testes — HelpDesk BQ (última rodada completa)

## Backend
- `npm run lint`: limpo.
- `npm test`: **24 suites / 160 testes verdes** (unit + integração, sem banco real).
- `npm run test:coverage`: ~90% linhas / ~76% branches (gate ≥ 70%).
- `npm audit --audit-level=high`: 0 high/critical (19 moderate).
- Carga RNF01: 2100 reqs, 20 VUs, 0 erros 5xx, **p95 = 31 ms**; banco limpo de
  volta aos 12 do seed (resíduos do 1º run removidos via API).

## Frontend
- `npm run lint`: limpo.
- `npm test`: **5 suites / 82 testes verdes** (fetch/DOM mockados).
- `npm run test:coverage`: ~98% linhas / ~86% branches (gate 80%; `pages/*`
  cobertas pelo roteiro manual).
- `npm audit --audit-level=high`: 0 high/critical.

## Manual
Roteiros R1 (solicitante) e R2 (técnico+admin): **a executar** por 2 colegas
(data + nomes no próprio roteiro). 360 px, teclado e rede lenta inclusos.
