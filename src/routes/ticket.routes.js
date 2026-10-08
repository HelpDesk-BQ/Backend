import { Router } from 'express';
import { createTicketController } from '../controllers/ticket.controller.js';

export function createTicketRoutes({ ticketService, requireAuth }) {
  const router = Router();
  const controller = createTicketController({ ticketService });

  router.post('/tickets', requireAuth, controller.createTicket);
  router.get('/tickets', requireAuth, controller.listTickets);
  router.get('/tickets/:id', requireAuth, controller.getTicketById);
  router.patch('/tickets/:id/status', requireAuth, controller.changeTicketStatus);
  router.patch('/tickets/:id/priority', requireAuth, controller.changePriority);
  router.patch('/tickets/:id/assignee', requireAuth, controller.changeAssignee);
  router.post('/tickets/:id/comments', requireAuth, controller.addComment);
  router.get('/tickets/:id/comments', requireAuth, controller.listComments);
  router.get('/tickets/:id/history', requireAuth, controller.listHistory);
  router.delete('/tickets/:id', requireAuth, controller.removeTicket);

  return router;
}
