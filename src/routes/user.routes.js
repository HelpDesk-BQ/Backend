import { Router } from 'express';
import { listUsersSchema } from '../schemas/user.schema.js';

export function createUserRoutes({ userService, requireAuth }) {
  const router = Router();

  router.get('/users', requireAuth, async (req, res, next) => {
    try {
      const input = listUsersSchema.parse(req.query);
      const users = await userService.listUsers(input, req.user);
      return res.status(200).json({ data: users });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
