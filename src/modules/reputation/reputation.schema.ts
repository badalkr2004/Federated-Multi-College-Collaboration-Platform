import { z } from 'zod';

export const RateSchema = z.object({
  ratedUserId: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export type RateInput = z.infer<typeof RateSchema>;
