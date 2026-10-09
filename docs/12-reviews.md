# Reviews — HelpDesk BQ (backend)

Checklist aplicado em todo PR (self-review + CI como segundo revisor):

- [ ] Contrato de erro preservado (`code` estável, mensagem PT-BR, `correlationId`)
- [ ] Queries 100% parametrizadas; Zod estrito na borda
- [ ] RBAC no serviço (nunca só no frontend); `requesterId` do token
- [ ] Transição + histórico na mesma transação
- [ ] Sem segredo, sem `console.log`, sem `innerHTML` com dados (frontend)
- [ ] Testes nomeados pelo motivo da falha; cobertura do diff 100% nas regras críticas
- [ ] README e docs do lote atualizados no mesmo PR

Sem revisor externo dedicado: declarar por PR quem revisou (registrar no merge).
Dívidas encontradas no review vão para `15-divida.md`, nunca somem em silêncio.
