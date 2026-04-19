import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { errors } from './errors.js';

export interface JWTPayload {
  userId: string;
  collegeId: string;
  collegeSlug: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JWTPayload & { iat: number; exp: number } {
  try {
    return jwt.verify(token, env.JWT_SECRET) as JWTPayload & { iat: number; exp: number };
  } catch {
    throw errors.unauthorized('Invalid or expired token');
  }
}
