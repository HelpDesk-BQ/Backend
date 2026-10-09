# Política de qualidade — HelpDesk BQ (1 página)

**Valor:** chamado certo, no estado certo, com trilha auditável — sem expor nada
a quem não deve ver.
**Prática:** TDD com motivo de falha por teste; contrato de erro único;
transação cobrindo mutação + histórico; revisão por PR com checklist.
**Evidência:** suites verdes por tip, cobertura nos gates, carga p95 31 ms,
audits limpos, roteiros manuais assinados.
**Responsabilidade:** técnico implementa e testa; comitê (Passo 63) aprova
exceções formais; dívida registrada em `15-divida.md`, nunca oculta.
Cobertura ≠ qualidade: 100% das regras críticas têm teste dedicado.
