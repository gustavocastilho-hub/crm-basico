import { z } from 'zod';

export const createCommissionSchema = z.object({
  dealId: z.string().uuid('Negócio inválido'),
  userId: z.string().uuid('Vendedor inválido'),
  percentage: z.number().min(0).max(100),
  notes: z.string().optional().nullable(),
});

export const updateCommissionSchema = z.object({
  percentage: z.number().min(0).max(100).optional(),
  notes: z.string().optional().nullable(),
});

export type CreateCommissionInput = z.infer<typeof createCommissionSchema>;
export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>;
