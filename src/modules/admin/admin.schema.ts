import { z } from 'zod';

export const RejectSchema = z.object({
  reason: z.string().min(10, 'Please provide a meaningful rejection reason'),
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
