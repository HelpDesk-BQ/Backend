import { Router } from 'express';
import { createSessionController } from '../controllers/session.controller.js';

export function createSessionRoutes({ authService, sessionCookie = null, requireAuth = null }) {
  const router = Router();
  const controller = createSessionController({ authService, sessionCookie });
  router.post('/sessions', controller.createSession);
  router.post('/sessions/logout', controller.destroySession);
  if (requireAuth) {
    router.get('/sessions/me', requireAuth, controller.currentSession);
  }
  return router;
}
