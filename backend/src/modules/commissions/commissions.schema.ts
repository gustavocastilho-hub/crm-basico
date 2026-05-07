import { z } from 'zod';

const monthRegex = /^\d{4}-\d{2}$/;

export const createBatchSchema = z.object({
  referenceMonth: z.string().regex(monthRegex, 'Mês inválido (use YYYY-MM)'),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        dealId: z.string().uuid(),
        type: z.enum(['SDR', 'NON_SDR', 'OTHER']),
        implementationFee: z.number().min(0),
        percentage: z.number().min(0).max(100),
      }),
    )
    .min(1, 'Selecione ao menos um negócio'),
});

export const updateCommissionSchema = z.object({
  type: z.enum(['SDR', 'NON_SDR', 'OTHER']).optional(),
  implementationFee: z.number().min(0).optional(),
  percentage: z.number().min(0).max(100).optional(),
  paidAmount: z.number().min(0).nullable().optional(),
  notes: z.string().optional().nullable(),
});

export const markPaidSchema = z.object({
  paidAt: z.string().min(1, 'Data de pagamento é obrigatória'),
  paidAmount: z.number().min(0).optional().nullable(),
});

export const addPaymentSchema = z.object({
  amount: z.coerce.number().positive('Valor deve ser maior que zero'),
  paidAt: z.string().min(1, 'Data de pagamento é obrigatória'),
  notes: z.string().optional().nullable(),
  batchId: z.string().optional().nullable(),
});

export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type UpdateCommissionInput = z.infer<typeof updateCommissionSchema>;
export type MarkPaidInput = z.infer<typeof markPaidSchema>;
export type AddPaymentInput = z.infer<typeof addPaymentSchema>;
