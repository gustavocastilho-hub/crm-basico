import { z } from 'zod';

export const createStageSchema = z.object({
  label: z.string().min(1, 'Nome da etapa é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
  type: z.enum(['OPEN', 'WON', 'LOST']).default('OPEN'),
});

export const updateStageSchema = z.object({
  label: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  type: z.enum(['OPEN', 'WON', 'LOST']).optional(),
});

export const reorderStagesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type CreateStageInput = z.infer<typeof createStageSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type ReorderStagesInput = z.infer<typeof reorderStagesSchema>;
