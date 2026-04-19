import type { Request, Response, NextFunction } from 'express';
import { verifyToken, type JWTPayload } from '../lib/jwt.js';
import { errors } from '../lib/errors.js';

// Extend Express Request to carry authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(errors.unauthorized());
  }

  const token = authHeader.slice(7);

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    next(err);
  }
}
