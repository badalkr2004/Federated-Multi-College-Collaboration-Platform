import { z } from 'zod';

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  // collegeApiKey is now in X-College-Key header, not body
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  // collegeApiKey is now in X-College-Key header, not body
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
