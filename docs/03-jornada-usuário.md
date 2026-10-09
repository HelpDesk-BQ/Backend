# Jornada do Usuário — HelpDesk BQ

## Solicitante — abrir e acompanhar

1. Acessa o login e autentica (bloqueio após 3 falhas protege a conta).
2. Abre novo chamado (título 10–100, descrição ≥ 30, prioridade).
3. Recebe confirmação com identificador e acompanha status na lista própria.
4. Comenta para complementar; recebe o chamado resolvido/fechado com justificativa.

## Técnico — atender a fila

1. Autentica e vê a fila autorizada (`status != closed`), filtrável e paginada.
2. Assume (`analysis` → `in_progress`, definindo responsável).
3. Comenta o andamento; resolve com comentário de resolução.
4. Fecha (`resolved` → `closed`, comentário obrigatório) ou reabre com justificativa.

## Administrador — administrar e auditar

1. Enxerga tudo, inclusive relatórios por status/prioridade.
2. Exclui logicamente com justificativa (vira histórico `deleted`).
3. Audita qualquer mutação pelo histórico (ator, antes/depois, data).

## Estados e transições

`open → analysis → in_progress → resolved → closed`, mais reabertura
`resolved → in_progress`. `closed` é terminal. Crítico não fecha sem comentário.
