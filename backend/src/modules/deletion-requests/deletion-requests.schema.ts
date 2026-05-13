import { z } from 'zod';

export const createDeletionRequestSchema = z.object({
  entityType: z.enum(['CLIENT', 'DEAL']),
  entityId: z.string().uuid(),
  reason: z.string().max(1000).optional().nullable(),
});

export const rejectDeletionRequestSchema = z.object({
  reviewNotes: z.string().max(1000).optional().nullable(),
});

export type CreateDeletionRequestInput = z.infer<typeof createDeletionRequestSchema>;
export type RejectDeletionRequestInput = z.infer<typeof rejectDeletionRequestSchema>;
