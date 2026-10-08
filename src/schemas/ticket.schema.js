import { z } from 'zod';

const STATUSES = ['open', 'analysis', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

export const createTicketSchema = z
  .object({
    title: z.string().trim().min(10).max(100),
    description: z.string().trim().min(30).max(5000),
    priority: z.enum(PRIORITIES),
  })
  .strict();

export const listTicketsSchema = z.object({
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});
