import { z } from 'zod';

export const createNicheSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100),
});

export type CreateNicheInput = z.infer<typeof createNicheSchema>;
