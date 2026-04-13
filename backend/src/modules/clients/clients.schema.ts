import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const addActivitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'EMAIL', 'MEETING']),
  content: z.string().min(1, 'Conteúdo é obrigatório'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type AddActivityInput = z.infer<typeof addActivitySchema>;
