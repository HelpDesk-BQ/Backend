# Ameaças — HelpDesk BQ (OWASP Top 10 2025, escopo autorizado)

| Classe | Ameaça | Contorno |
|---|---|---|
| Controle de acesso | Trocar IDs/papéis (ver ticket alheio, excluir sem ser admin) | RBAC por papel + propriedade + fila em **toda** rota; `GET /users` sem hash |
| Injeção | SQL via filtros/IDs | 100% parametrizado (`$1`); Zod estrito antes do SQL |
| Configuração | Headers/CORS/mensagens verbosas | Helmet; CORS allowlist + `credentials`; erros genéricos PT-BR |
| Autenticação | Força bruta, enumeração, sessão roubada | Bloqueio 3/5min→10min; mesma resposta p/ e-mail inexistente; JWT com expiração; cookie `httpOnly` + `SameSite=Lax`; logout limpa |
| CSRF | Ação cross-site via cookie | `SameSite=Lax` + **nenhuma** mutação em GET |
| Supply chain | Dependência vulnerável | `package-lock` versionado; `npm audit --audit-level=high` no CI (0 high/critical) |
| Logging | Vazar segredo em log/resposta | Logger só com IDs técnicos; `password_hash`/token/SQL nunca saem |

Ambiguidade é risco (Passo 12): bloqueio conta da 3ª falha; `closed` terminal;
fechamento sempre com comentário; exclusão sempre lógica. Dúvidas viram
decisão com dono, prazo, impacto e documento atualizado — nunca código silencioso.
