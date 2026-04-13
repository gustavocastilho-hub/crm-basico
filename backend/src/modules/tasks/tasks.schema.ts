import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(2, 'Título deve ter ao menos 2 caracteres'),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  clientId: z.string().uuid().optional(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).default('PENDENTE'),
});

export const updateTaskSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  status: z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA']).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
