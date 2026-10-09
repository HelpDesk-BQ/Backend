# Plano de testes — HelpDesk BQ

## Escopo
Backend (API + regras) e frontend (lógica JS + fluxos). Fora: carga além de
20 VUs, pentest formal, compat além de Chrome/Firefox/Edge.

## Níveis
- **Unit** (Jest): regras puras, serviços com dublês, repositórios com PG falso.
- **Integração/API** (Supertest): contrato HTTP por rota e papel.
- **Carga** (`scripts/perf-rnf01.mjs`): 20 VUs × 25 iterações, mix leitura/escrita.
- **Manual** (`tests/e2e/roteiro-manual.md`): 2 roteiros (solicitante; técnico+admin),
  incluindo 360 px, teclado e rede lenta.

## Saída mínima (Passo 47)
15 funcionais, 5 negativos, 3 limites, 3 API, 2 segurança, 2 acessibilidade,
1 desempenho — todos mapeados em `17-casos-teste.md`.

## Critérios de saída
Suíte verde nos dois repos, cobertura nos gates, 0 defeitos críticos/abertos
altos, carga com p95 ≤ 800 ms, roteiros assinados por 2 colegas.
