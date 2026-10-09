import { AppError } from '../utils/AppError.js';
import { parseCookies, SESSION_COOKIE_NAME } from '../utils/cookies.js';

export function createRequireAuth({ verifyToken }) {
  async function requireAuth(req, res, next) {
    try {
      const header = req.headers.authorization;
      // Bearer tem prioridade; cookie httpOnly é o transporte do frontend web.
      const token = header?.startsWith('Bearer ')
        ? header.slice('Bearer '.length)
        : parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME];
      if (!token) {
        throw new AppError(401, 'UNAUTHORIZED', 'Autenticação necessária.');
      }
      const payload = await verifyToken(token);
      req.user = { id: payload.sub, role: payload.role };
      return next();
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError(401, 'UNAUTHORIZED', 'Autenticação necessária.'));
    }
  }

  return requireAuth;
}
