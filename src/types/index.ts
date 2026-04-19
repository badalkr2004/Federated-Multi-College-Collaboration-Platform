import { User } from '../db/schema';

// Authenticated user attached to request
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  roles: string[];
  permissions: string[];
}

// Extend Express/Passport types to use our AuthUser
declare global {
  namespace Express {
    // Override Passport's User interface with our AuthUser
    interface User extends AuthUser {}
  }
}

// JWT payload types
export interface AccessTokenPayload {
  sub: string; // User ID
  email: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string; // User ID
  sessionId: string;
  type: 'refresh';
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// OAuth profile types
export interface OAuthProfile {
  provider: 'google' | 'github';
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken?: string;
}

// Auth tokens response
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Public user (without sensitive fields)
export type PublicUser = Pick<User, 'id' | 'email' | 'name' | 'avatarUrl' | 'emailVerified' | 'createdAt'>;
