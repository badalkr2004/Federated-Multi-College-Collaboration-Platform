import type { Request, Response, NextFunction } from 'express';
import { errors } from '../lib/errors.js';

export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== 'super_admin') {
    throw errors.forbidden('Super admin access required');
  }
  next();
}
