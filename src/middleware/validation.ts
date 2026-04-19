import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from './error-handler';

// Validation middleware factory
export function validate<T extends ZodSchema>(schema: T, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = schema.parse(req[source]);
      req[source] = data;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}

// Common validation schemas
export const schemas = {
  // Auth schemas
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  verifyEmail: z.object({
    token: z.string().min(1, 'Verification token is required'),
  }),

  // User schemas
  updateProfile: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),

  // Admin schemas
  updateUserRole: z.object({
    roleId: z.string().uuid('Invalid role ID'),
  }),

  // Pagination
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  }),

  // UUID param
  uuidParam: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),
};

export type RegisterInput = z.infer<typeof schemas.register>;
export type LoginInput = z.infer<typeof schemas.login>;
export type UpdateProfileInput = z.infer<typeof schemas.updateProfile>;
