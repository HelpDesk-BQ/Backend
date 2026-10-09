import { z } from 'zod';

export const listUsersSchema = z.object({
  role: z.enum(['requester', 'technician', 'admin']).optional(),
});
