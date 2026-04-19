import type { JWTPayload } from '../lib/jwt.js';
import type { College } from '../db/schema/colleges.js';

// Extend Express Request to include tenant + user
declare global {
  namespace Express {
    interface Request {
      tenant?: College;
      user?: JWTPayload & { iat: number; exp: number };
    }
  }
}

export {};
