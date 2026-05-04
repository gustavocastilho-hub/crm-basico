import { z } from 'zod';

export const updateCommissionsConfigSchema = z.object({
  plans: z
    .array(
      z.object({
        planId: z.string().uuid(),
        fee: z.number().min(0),
      }),
    )
    .optional(),
  percentages: z
    .object({
      SDR: z.number().min(0).max(100).optional(),
      NON_SDR: z.number().min(0).max(100).optional(),
    })
    .optional(),
  defaultSdrUserId: z.string().uuid().nullable().optional(),
});

export type UpdateCommissionsConfigInput = z.infer<typeof updateCommissionsConfigSchema>;
