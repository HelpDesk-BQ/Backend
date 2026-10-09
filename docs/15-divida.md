# Dívida técnica — HelpDesk BQ

| Dívida | Impacto | Plano |
|---|---|---|
| 19 vulnerabilidades moderate (`npm audit`) | Baixo hoje; sobem sem triagem | Revisar 1×/mês; travar majors |
| Sem rate-limit nas rotas | Abuso de login/listagem além do bloqueio | Throttle por IP (fora do MVP) |
| Pool PG fixo em 10 conexões | Carga além de 20 VUs enfileira | Medir antes de mexer (p95 atual 31 ms) |
| Botão delete branco-sobre-vermelho (~3.9:1) | AA em texto normal | Exceção registrada em `06-prototipo.md`; reavaliar no redesign |
| Dashboard sem filtro de período | A14 pede período; API não oferece | Novo parâmetro + índice (pós-MVP) |
| Logs sem agregador | Busca só por grep no stdout | Shipador/centralizador no deploy |
| E2E só manual | Regressão visual depende de gente | Playwright local primeiro, CI depois |

Nada aqui bloqueia o MVP; tudo tem dono (técnico) e revisão no freeze.
