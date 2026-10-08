import { Router } from 'express';
import { createTicketController } from '../controllers/ticket.controller.js';

export function createTicketRoutes({ ticketService, requireAuth }) {
  const router = Router();
  const controller = createTicketController({ ticketService });

  router.post('/tickets', requireAuth, controller.createTicket);
  router.get('/tickets', requireAuth, controller.listTickets);
  router.get('/tickets/:id', requireAuth, controller.getTicketById);

  return router;
}
