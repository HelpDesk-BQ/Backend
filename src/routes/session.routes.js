import { Router } from 'express';
import { createSessionController } from '../controllers/session.controller.js';

export function createSessionRoutes({ authService }) {
  const router = Router();
  const controller = createSessionController({ authService });
  router.post('/sessions', controller.createSession);
  return router;
}
