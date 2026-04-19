import { z } from 'zod';

export const CreateProjectSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  requiredSkills: z.array(z.string().min(1).max(50)).min(1).max(20),
  crossCollege: z.boolean().default(false),
  maxMembers: z.number().int().min(2).max(20).default(5),
});

export const UpdateProjectSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  requiredSkills: z.array(z.string().min(1).max(50)).optional(),
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  maxMembers: z.number().int().min(2).max(20).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
