import { loginSchema } from '../schemas/session.schema.js';
import { logger } from '../utils/logger.js';
import { SESSION_COOKIE_NAME } from '../utils/cookies.js';

function cookieFlags(sessionCookie) {
  return { httpOnly: true, sameSite: 'lax', secure: sessionCookie.secure, maxAge: sessionCookie.maxAgeMs, path: '/' };
}

export function createSessionController({ authService, sessionCookie = null }) {
  async function createSession(req, res, next) {
    const startedAt = Date.now();
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      logger.info('session.created', {
        correlationId: req.correlationId,
        route: 'POST /api/sessions',
        status: 200,
        userId: result.user.id,
        role: result.user.role,
        durationMs: Date.now() - startedAt,
      });
      if (sessionCookie) {
        res.cookie(SESSION_COOKIE_NAME, result.token, cookieFlags(sessionCookie));
      }
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  async function destroySession(req, res, next) {
    try {
      // Sem autenticação de propósito: limpar o cookie deve funcionar mesmo com sessão expirada.
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      logger.info('session.destroyed', {
        correlationId: req.correlationId,
        route: 'POST /api/sessions/logout',
        status: 200,
      });
      return res.status(200).json({ data: { loggedOut: true } });
    } catch (error) {
      return next(error);
    }
  }

  async function currentSession(req, res, next) {
    try {
      return res.status(200).json({ data: { id: req.user.id, role: req.user.role } });
    } catch (error) {
      return next(error);
    }
  }

  return { createSession, destroySession, currentSession };
}
