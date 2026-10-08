import { createTicketSchema, listTicketsSchema } from '../schemas/ticket.schema.js';

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

  return { createTicket, listTickets, getTicketById };
}
