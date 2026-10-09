# Arquitetura — HelpDesk BQ (backend)

## Camadas
| Camada | Responsabilidade | Não deve |
|---|---|---|
| Rotas/Controller | HTTP, validação Zod, status | Escrever SQL |
| Serviço | Regras, permissões, transições, transações | Depender de HTTP/HTML |
| Repositório | Persistência parametrizada | Decidir regra de negócio |
| Banco (pg Pool) | Integridade, índices, histórico | Guardar senha em texto puro |

Dependências apontam para o núcleo: serviços testáveis sem HTTP; banco
substituível por dublê. Sem ORM: `pg` + `node-pg-migrate`.

## Fluxo (pergunta de qualidade por etapa)
Navegador → API/Controller (payload e auth verificados?) → Serviço (regra e
permissão centralizadas?) → Repositório (parametrizada e transacional?) →
Banco (integridade e histórico?) → Resposta/Log (erro seguro + `correlationId`?).

## Sessão (evolução)
Login devolve JWT no corpo (compat) **e** cookie `helpdesk_token` (`HttpOnly`,
`SameSite=Lax`, `Secure` só em prod). `requireAuth` aceita Bearer (prioridade)
ou cookie. `POST /sessions/logout` limpa; `GET /sessions/me` devolve
`{ id, role }`. `GET /api/users?role=` lista colunas públicas (técnico/admin).

## Estrutura e bootstrap
`src/app.js` (Express sem `listen`) + `src/server.js` (só `listen` + shutdown).
`helmet()`, `express.json({ limit: '100kb' })`, `correlationId` (`crypto.randomUUID`,
header `x-correlation-id`), `app.use('/api', routes)`, `errorHandler` por último.
`requesterId` sempre do token, nunca do body; 201 na criação.
