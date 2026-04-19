import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
});

export const UpdateSkillsSchema = z.object({
  skills: z.array(z.string().min(1).max(50)).min(0).max(20),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type UpdateSkillsInput = z.infer<typeof UpdateSkillsSchema>;
