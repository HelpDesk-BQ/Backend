# Auditoria — HelpDesk BQ (C conforme · NC não conforme · OM oportunidade · NA não se aplica)

| Dimensão | Marca | Achado |
|---|---|---|
| Arquitetura | C | Camadas respeitadas; serviços sem HTTP; `25-dashboard` espelha código |
| Código | C | Lint limpo nos dois repos; sem `TODO` solto |
| Dados | C | Checks, índices, UTC, seed fictício; exclusão sempre lógica |
| Segurança | C | RBAC testado R1–R6; hash bcrypt 12; cookie `httpOnly`+Lax; 0 high/critical |
| Testes | C | 160 + 82 verdes; regras críticas 100%; carga com evidência |
| Versionamento | OM | Cookie/`/users`/frontend sem PR (working tree) — propor ao fechar |
| Operação | OM | Sem agregador de logs; JWT demo placeholder; roteiros a assinar |

Zero NC. OMs viram itens do freeze, não bloqueios do MVP.
