import { AppError } from '../utils/AppError.js';
import { assertTransition } from './transition.js';
import * as defaultCommentRepository from '../repositories/commentRepository.js';
import * as defaultHistoryRepository from '../repositories/historyRepository.js';
import { withTransaction as defaultWithTransaction } from '../db/pool.js';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function normalizePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : DEFAULT_PAGE;
}

function normalizeLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }
  return Math.min(limit, MAX_LIMIT);
}

function assertCanView(ticket, requester) {
  if (!ticket) {
    throw new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.');
  }
  if (requester.role === 'requester' && ticket.requester_id !== requester.id) {
    throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
  }
  if (requester.role === 'technician' && ticket.status === 'closed') {
    throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
  }
}

function assertCanChangeStatus(ticket, requester) {
  if (!ticket) {
    throw new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.');
  }
  // Solicitante só visualiza (R2/R3); escrita é de técnico/admin (R4/R6).
  if (requester.role === 'requester') {
    throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
  }
  // Técnico fora da fila (closed) não atualiza (R5).
  if (requester.role === 'technician' && ticket.status === 'closed') {
    throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
  }
}

export function createTicketService({
  ticketRepository,
  commentRepository = defaultCommentRepository,
  historyRepository = defaultHistoryRepository,
  withTransaction = defaultWithTransaction,
}) {
  async function create({ title, description, priority }, requester) {
    return ticketRepository.create({ title, description, priority, requesterId: requester.id });
  }

  async function list({ status, priority, page, limit }, requester) {
    const args = {
      status,
      priority,
      page: normalizePage(page),
      limit: normalizeLimit(limit),
    };
    if (requester.role === 'requester') {
      args.requesterId = requester.id;
    }
    return ticketRepository.list(args);
  }

  async function getById(id, requester) {
    const ticket = await ticketRepository.findById(id);
    assertCanView(ticket, requester);
    return ticket;
  }

  async function changeStatus(id, { status, comment }, requester) {
    const current = await ticketRepository.findById(id);
    assertCanChangeStatus(current, requester);
    assertTransition({ from: current.status, to: status, comment });

    const trimmedComment = comment?.trim() ? comment.trim() : null;
    return withTransaction(async (tx) => {
      const updated = await ticketRepository.updateStatus({ id, status }, tx);
      await historyRepository.create(
        { ticketId: id, actorId: requester.id, event: 'status.changed', before: current.status, after: status },
        tx
      );
      // Comentário opcional no PATCH vira linha em comments (decisão A7.4).
      let commentRow = null;
      if (trimmedComment) {
        commentRow = await commentRepository.create(
          {
            ticketId: id,
            authorId: requester.id,
            body: trimmedComment,
            isResolution: status === 'resolved' || status === 'closed',
          },
          tx
        );
      }
      return { ticket: updated, comment: commentRow };
    });
  }

  async function addComment(id, { body }, requester) {
    const ticket = await ticketRepository.findById(id);
    assertCanView(ticket, requester);

    const trimmed = body.trim();
    return withTransaction(async (tx) => {
      const commentRow = await commentRepository.create(
        { ticketId: id, authorId: requester.id, body: trimmed, isResolution: false },
        tx
      );
      await historyRepository.create(
        { ticketId: id, actorId: requester.id, event: 'comment.added', before: null, after: trimmed },
        tx
      );
      return commentRow;
    });
  }

  async function listComments(id, requester) {
    const ticket = await ticketRepository.findById(id);
    assertCanView(ticket, requester);
    return commentRepository.listByTicket(id);
  }

  async function listHistory(id, requester) {
    const ticket = await ticketRepository.findById(id);
    assertCanView(ticket, requester);
    return historyRepository.listByTicket(id);
  }

  async function remove(id, { justification }, requester) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.');
    }
    // Somente administrador exclui, com justificativa e auditoria (RF07).
    if (requester.role !== 'admin') {
      throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
    }
    const trimmed = justification.trim();
    return withTransaction(async (tx) => {
      const deleted = await ticketRepository.softDelete(id, tx);
      await historyRepository.create(
        { ticketId: id, actorId: requester.id, event: 'deleted', before: ticket.status, after: trimmed },
        tx
      );
      return deleted;
    });
  }

  return { create, list, getById, changeStatus, addComment, listComments, listHistory, remove };
}
