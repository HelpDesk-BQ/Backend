import {
  createTicketSchema,
  listTicketsSchema,
  changeTicketStatusSchema,
  createCommentSchema,
  deleteTicketSchema,
  changeTicketPrioritySchema,
  changeTicketAssigneeSchema,
} from '../schemas/ticket.schema.js';
import { logger } from '../utils/logger.js';

export function createTicketController({ ticketService }) {
  async function createTicket(req, res, next) {
    const startedAt = Date.now();
    try {
      const input = createTicketSchema.parse(req.body);
      const ticket = await ticketService.create(input, req.user);
      logger.info('ticket.created', {
        correlationId: req.correlationId,
        route: 'POST /api/tickets',
        status: 201,
        ticketId: ticket.id,
        actorId: req.user.id,
        durationMs: Date.now() - startedAt,
      });
      return res.status(201).json({ data: ticket });
    } catch (error) {
      return next(error);
    }
  }

  async function listTickets(req, res, next) {
    try {
      const input = listTicketsSchema.parse(req.query);
      const result = await ticketService.list(input, req.user);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async function getTicketById(req, res, next) {
    try {
      const ticket = await ticketService.getById(req.params.id, req.user);
      return res.status(200).json({ data: ticket });
    } catch (error) {
      return next(error);
    }
  }

  async function changeTicketStatus(req, res, next) {
    const startedAt = Date.now();
    try {
      const input = changeTicketStatusSchema.parse(req.body);
      const result = await ticketService.changeStatus(req.params.id, input, req.user);
      logger.info('ticket.status.changed', {
        correlationId: req.correlationId,
        route: 'PATCH /api/tickets/:id/status',
        status: 200,
        ticketId: req.params.id,
        actorId: req.user.id,
        to: input.status,
        durationMs: Date.now() - startedAt,
      });
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async function addComment(req, res, next) {
    try {
      const input = createCommentSchema.parse(req.body);
      const comment = await ticketService.addComment(req.params.id, input, req.user);
      logger.info('comment.added', {
        correlationId: req.correlationId,
        route: 'POST /api/tickets/:id/comments',
        status: 201,
        ticketId: req.params.id,
        actorId: req.user.id,
      });
      return res.status(201).json({ data: comment });
    } catch (error) {
      return next(error);
    }
  }

  async function listComments(req, res, next) {
    try {
      const comments = await ticketService.listComments(req.params.id, req.user);
      return res.status(200).json({ data: comments });
    } catch (error) {
      return next(error);
    }
  }

  async function listHistory(req, res, next) {
    try {
      const history = await ticketService.listHistory(req.params.id, req.user);
      return res.status(200).json({ data: history });
    } catch (error) {
      return next(error);
    }
  }

  async function removeTicket(req, res, next) {
    try {
      const input = deleteTicketSchema.parse(req.body);
      const ticket = await ticketService.remove(req.params.id, input, req.user);
      logger.info('ticket.deleted', {
        correlationId: req.correlationId,
        route: 'DELETE /api/tickets/:id',
        status: 200,
        ticketId: req.params.id,
        actorId: req.user.id,
      });
      return res.status(200).json({ data: ticket });
    } catch (error) {
      return next(error);
    }
  }

  async function changePriority(req, res, next) {
    try {
      const input = changeTicketPrioritySchema.parse(req.body);
      const result = await ticketService.changePriority(req.params.id, input, req.user);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async function changeAssignee(req, res, next) {
    try {
      const input = changeTicketAssigneeSchema.parse(req.body);
      const result = await ticketService.changeAssignee(req.params.id, input, req.user);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  return {
    createTicket,
    listTickets,
    getTicketById,
    changeTicketStatus,
    addComment,
    listComments,
    listHistory,
    removeTicket,
    changePriority,
    changeAssignee,
  };
}
