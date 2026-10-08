# Termo de Abertura — HelpDesk BQ

## Problema

Solicitantes perdem tempo buscando atualizações de incidentes por canais informais;
técnicos não têm fila única priorizada; não há trilha auditável de quem fez o quê
em cada chamado. Nenhuma tecnologia é antecipada aqui: o problema é operacional.

## Objetivo

Criar uma mudança observável: todo incidente registrado, acompanhável pelo
solicitante e tratado por técnicos em fila priorizada, com histórico completo
de status, prioridade, responsável e comentários.

## Usuários

- **Solicitantes:** abrem e acompanham chamados.
- **Técnicos:** atendem a fila autorizada (`status != closed`), transicionam e comentam.
- **Administradores:** administram tudo, excluem com justificativa e auditam.

## Escopo (MVP)

**Inclui:** autenticação com bloqueio, CRUD de chamados, filtros e paginação,
transições de estado, comentários, exclusão lógica admin, relatórios por
status/prioridade, logs estruturados, seed demo, CI com lint/testes/auditoria.
**Exclui explicitamente:** chat, anexos pesados, notificações reais, integração
externa (A16 — só após o núcleo).

## Sucesso (mensurável)

- RNF01: p95 ≤ 800 ms com 20 usuários simulados (medido: 31 ms, 2100 reqs, 0 erros).
- RNF06: cobertura ≥ 70% (atual: ~90% linhas / ~76% branches) e 100% das regras críticas testadas.
- 139 testes verdes, `npm audit --audit-level=high` com 0 vulnerabilidades altas/críticas.
- 90% das aberturas concluídas sem ajuda (meta de uso, a medir no Demo Day).

## Riscos iniciais

| Risco | Responsável |
|---|---|
| Credenciais locais divergentes atrasam validação no PG | Técnico (ambiente documentado no README) |
| Escopo crescer para chat/anexos antes do núcleo | Comitê (gate A16) |
| Sem papel Write no org, PRs travam | Admin do org (fallback fork + PR cross-repo) |
