import { z } from 'zod';

export const createImprovementSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional().nullable(),
});

export const updateImprovementSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  action: z.enum(['delete', 'mark_implemented', 'mark_pending']),
});

export type CreateImprovementInput = z.infer<typeof createImprovementSchema>;
export type UpdateImprovementInput = z.infer<typeof updateImprovementSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
