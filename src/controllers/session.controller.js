import { loginSchema } from '../schemas/session.schema.js';

export function createSessionController({ authService }) {
  async function createSession(req, res, next) {
    try {
      const input = loginSchema.parse(req.body);
      const result = await authService.login(input);
      return res.status(200).json({ data: result });
    } catch (error) {
      return next(error);
    }
  }

  return { createSession };
}
