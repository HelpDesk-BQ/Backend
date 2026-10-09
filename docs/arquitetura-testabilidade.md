# Testabilidade da arquitetura — evidência (Passo 22)

| Item do checklist | Evidência |
|---|---|
| App exportado sem iniciar porta | `createApp()` em `src/app.js`; `listen` só em `src/server.js` |
| Dependências por parâmetro | `createApp({ container })`, serviços recebem `{ repository, withTransaction }`, `requireAuth({ verifyToken })` |
| Datas e IDs previsíveis em teste | Relógio injetável (`authService({ now })`); repositórios/serviços com dublês; UUID só em produção |
| Banco de teste separado | Unit/API usam fakes (sem PG); PG local só para validação manual e carga |
| Códigos de erro estáveis | `AppError(status, code)` + `errorHandler` com contrato único; 139→160 testes verdes por tip |

Observar/controlar/isolar/reproduzir: cada teste tem um motivo de falha;
falhas de tempo usam relógio injetado, nunca `sleep`.
