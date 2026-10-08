import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userRepository from './repositories/userRepository.js';
import * as loginAttemptRepository from './repositories/loginAttemptRepository.js';
import { createAuthService } from './services/authService.js';
import * as ticketRepository from './repositories/ticketRepository.js';
import { createTicketService } from './services/ticketService.js';
import { createSessionRoutes } from './routes/session.routes.js';
import { createTicketRoutes } from './routes/ticket.routes.js';
import { createRequireAuth } from './middlewares/requireAuth.js';

export function buildContainer(env) {
  const authService = createAuthService({
    userRepository,
    loginAttemptRepository,
    comparePassword: (plain, hash) => bcrypt.compare(plain, hash),
    signToken: (payload) => jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN }),
  });

  const verifyToken = (token) =>
    new Promise((resolve, reject) => {
      jwt.verify(token, env.JWT_SECRET, (error, decoded) => (error ? reject(error) : resolve(decoded)));
    });

  const ticketService = createTicketService({ ticketRepository });
  const requireAuth = createRequireAuth({ verifyToken });

  return {
    authService,
    ticketService,
    requireAuth,
    sessionRoutes: createSessionRoutes({ authService }),
    ticketRoutes: createTicketRoutes({ ticketService, requireAuth }),
  };
}
