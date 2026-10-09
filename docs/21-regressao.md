# Regressão — HelpDesk BQ

## Estratégia
Suíte total roda a cada mudança (`npm test` nos dois repos + carga sob
demanda). Fatiamento em branches com tips verdes prova regressão por
incremento: A 76 → B 118 → C 139 testes (backend); base 31 → 82 (frontend).

## Regressões blindadas
- R1 transição inválida/reabertura/fechamento (D1).
- R2 RBAC leitura/escrita por papel após cada endpoint novo.
- R3 contrato de erro e `correlationId` em toda rota nova.
- R4 cookie: Bearer continua prioritário; sem cookie-config, sem `Set-Cookie`.
- R5 frontend: imports vs. uso (D5), init por último (D4), CSP sem inline (D6).

## Critério
Nenhum teste removido sem aprovação; thresholds de cobertura travam queda
silenciosa (70% backend, 80% frontend).
