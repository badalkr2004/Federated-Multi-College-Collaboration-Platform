import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { errors } from '../lib/errors.js';

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        errors.badRequest('Validation failed', result.error.flatten().fieldErrors),
      );
    }
    req.body = result.data; // strips unknown keys
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return next(
        errors.badRequest('Query validation failed', result.error.flatten().fieldErrors),
      );
    }
    req.query = result.data as Record<string, string>;
    next();
  };
}
