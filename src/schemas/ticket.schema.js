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

export const changeTicketStatusSchema = z
  .object({
    status: z.enum(STATUSES),
    comment: z.string().trim().min(1).max(1000).optional(),
  })
  .strict();

export const createCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(1000),
  })
  .strict();

export const deleteTicketSchema = z
  .object({
    justification: z.string().trim().min(1).max(1000),
  })
  .strict();

export const changeTicketPrioritySchema = z
  .object({
    priority: z.enum(PRIORITIES),
  })
  .strict();

export const changeTicketAssigneeSchema = z
  .object({
    assigneeId: z.string().trim().min(1).max(100).nullable(),
  })
  .strict();
