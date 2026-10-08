import { loginSchema } from '../schemas/session.schema.js';
import { logger } from '../utils/logger.js';

export function createSessionController({ authService }) {
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
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  return { createSession };
}
