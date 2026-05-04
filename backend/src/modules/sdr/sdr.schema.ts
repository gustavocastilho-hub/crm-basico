import { z } from 'zod';

export const createSdrContactSchema = z.object({
  contactDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  contactTime: z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido (use HH:mm)'),
  name: z.string().min(1, 'Nome é obrigatório'),
  company: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  summary: z.string().min(1, 'Resumo é obrigatório'),
});

export const updateSdrContactSchema = createSdrContactSchema.partial();

export type CreateSdrContactInput = z.infer<typeof createSdrContactSchema>;
export type UpdateSdrContactInput = z.infer<typeof updateSdrContactSchema>;
