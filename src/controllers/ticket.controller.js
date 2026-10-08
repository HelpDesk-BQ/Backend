import {
  createTicketSchema,
  listTicketsSchema,
  changeTicketStatusSchema,
  createCommentSchema,
  deleteTicketSchema,
} from '../schemas/ticket.schema.js';

export function createTicketController({ ticketService }) {
  async function createTicket(req, res, next) {
    try {
      const input = createTicketSchema.parse(req.body);
      const ticket = await ticketService.create(input, req.user);
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
    try {
      const input = changeTicketStatusSchema.parse(req.body);
      const result = await ticketService.changeStatus(req.params.id, input, req.user);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async function addComment(req, res, next) {
    try {
      const input = createCommentSchema.parse(req.body);
      const comment = await ticketService.addComment(req.params.id, input, req.user);
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
      return res.status(200).json({ data: ticket });
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
  };
}
