import jwt, { SignOptions, JwtPayload } from 'jsonwebtoken';
import { StringValue } from 'ms';
import { v4 as uuidv4 } from 'uuid';
import { env } from '../utils/env';
import { AccessTokenPayload, RefreshTokenPayload } from '../types';

// Parse duration string to seconds (e.g., '15m' -> 900, '7d' -> 604800)
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration format: ${duration}`);
  
  const value = parseInt(match[1], 10);
  const unit = match[2];
  
  const multipliers: Record<string, number> = {
    's': 1,
    'm': 60,
    'h': 3600,
    'd': 86400,
  };
  
  return value * multipliers[unit];
}

// Generate access token (short-lived)
export function generateAccessToken(userId: string, email: string): string {
  const payload: AccessTokenPayload = {
    sub: userId,
    email,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as StringValue,
    algorithm: 'HS256',
    jwtid: uuidv4(),
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, options);
}

// Generate refresh token (long-lived)
export function generateRefreshToken(userId: string, sessionId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    sessionId,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as StringValue,
    algorithm: 'HS256',
    jwtid: uuidv4(),
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

// Verify access token
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload & AccessTokenPayload;
    
    if (decoded.type !== 'access') {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

// Verify refresh token
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload & RefreshTokenPayload;
    
    if (decoded.type !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch {
    return null;
  }
}

// Get expiry time for refresh token (in seconds)
export function getRefreshTokenExpiry(): Date {
  const seconds = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
  return new Date(Date.now() + seconds * 1000);
}

// Get access token expiry in seconds
export function getAccessTokenExpirySeconds(): number {
  return parseDuration(env.JWT_ACCESS_EXPIRES_IN);
}
