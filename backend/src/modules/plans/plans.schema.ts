import { z } from 'zod';

export const createPlanSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
