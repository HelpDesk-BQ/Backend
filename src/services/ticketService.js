import { AppError } from '../utils/AppError.js';

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

export function createTicketService({ ticketRepository }) {
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
    if (!ticket) {
      throw new AppError(404, 'NOT_FOUND', 'Recurso não encontrado.');
    }
    if (requester.role === 'requester' && ticket.requester_id !== requester.id) {
      throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
    }
    if (requester.role === 'technician' && ticket.status === 'closed') {
      throw new AppError(403, 'FORBIDDEN', 'Ação não autorizada.');
    }
    return ticket;
  }

  return { create, list, getById };
}
