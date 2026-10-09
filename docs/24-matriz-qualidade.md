# Matriz de qualidade — HelpDesk BQ

| Must (RF/RNF) | Teste | Resultado | Tendência |
|---|---|---|---|
| RF01–RF13, RF15 | suites + contrato | ✅ 100% rastreados | estável |
| RF14 vazio | renderEmpty + roteiro | ✅ API + UI | estável |
| RNF01 p95 ≤ 800 ms | carga 20 VUs | ✅ 31 ms | folga 25× |
| RNF02 360 px | roteiro + CSS | ✅ sem rolagem (a assinar) | — |
| RNF03 AA | pills/labels/foco | ✅ exceção botão delete registrada | — |
| RNF04–05 segredos/erros | envelope + testes | ✅ | estável |
| RNF06 cobertura | gates 70/80 | ✅ 90/76 e 98/86 | estável |
| RNF07 logs | 5 eventos | ✅ | estável |
| RNF08 CI | 2 workflows | ✅ arquivos; run no 1º PR | — |

Defeitos por severidade: 0 críticos, 0 altos, 6 baixos (todos fechados, ver `20-defeitos.md`).
Origem: 3 em teste, 2 em integração manual, 1 em DX (lint).
