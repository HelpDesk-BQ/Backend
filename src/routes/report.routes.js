import { Router } from 'express';
import { reportSummarySchema } from '../schemas/ticket.schema.js';

export function createReportRoutes({ ticketService, requireAuth }) {
  const router = Router();

  router.get('/reports/summary', requireAuth, async (req, res, next) => {
    try {
      const input = reportSummarySchema.parse(req.query);
      const summary = await ticketService.getSummary(input, req.user);
      return res.status(200).json({ data: summary });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
