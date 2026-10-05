import { AppError } from '../utils/AppError.js';

export function createRequireAuth({ verifyToken }) {
  async function requireAuth(req, res, next) {
    try {
      const header = req.headers.authorization;
      if (!header || !header.startsWith('Bearer ')) {
        throw new AppError(401, 'UNAUTHORIZED', 'Autenticação necessária.');
      }
      const payload = await verifyToken(header.slice('Bearer '.length));
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
