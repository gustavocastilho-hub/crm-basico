import { z } from 'zod';

export const createDealSchema = z.object({
  title: z.string().min(2, 'Título deve ter ao menos 2 caracteres'),
  value: z.number().positive().optional(),
  clientId: z.string().uuid('ID do cliente inválido'),
  stage: z.enum(['LEAD', 'PROPOSTA', 'NEGOCIACAO', 'FECHADO_GANHO', 'FECHADO_PERDIDO']).default('LEAD'),
});

export const updateDealSchema = z.object({
  title: z.string().min(2).optional(),
  value: z.number().positive().optional().nullable(),
  stage: z.enum(['LEAD', 'PROPOSTA', 'NEGOCIACAO', 'FECHADO_GANHO', 'FECHADO_PERDIDO']).optional(),
  position: z.number().int().min(0).optional(),
  ownerId: z.string().uuid('ID do responsável inválido').optional(),
});

export const moveDealSchema = z.object({
  stage: z.enum(['LEAD', 'PROPOSTA', 'NEGOCIACAO', 'FECHADO_GANHO', 'FECHADO_PERDIDO']),
  position: z.number().int().min(0),
});

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type MoveDealInput = z.infer<typeof moveDealSchema>;
