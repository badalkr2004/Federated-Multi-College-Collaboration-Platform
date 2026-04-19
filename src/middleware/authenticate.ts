import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt.js';
import { errors } from '../lib/errors.js';

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw errors.unauthorized();

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token); // throws AppError if expired or invalid

    // Cross-check JWT tenant against subdomain-resolved tenant
    // Prevents College A token being used on projects.b.localhost
    if (payload.role !== 'super_admin' && payload.collegeId !== req.tenant?.id) {
      throw errors.tenantMismatch();
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}
