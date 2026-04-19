import { v4 as uuidv4 } from 'uuid';
import { generateAccessToken, generateRefreshToken } from '../../auth/jwt';
import { hashPassword } from '../../auth/password';
import type { AuthUser } from '../../types';

// ============================================
// USER FACTORIES
// ============================================

export interface MockUser {
  id: string;
  email: string;
  passwordHash: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
}

export async function createMockUser(overrides: Partial<MockUser> = {}): Promise<MockUser> {
  const id = overrides.id || uuidv4();
  const email = overrides.email || `test-${id}@example.com`;
  
  return {
    id,
    email,
    passwordHash: overrides.passwordHash || await hashPassword('TestPassword123!'),
    name: overrides.name ?? 'Test User',
    avatarUrl: overrides.avatarUrl ?? null,
    emailVerified: overrides.emailVerified ?? true,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt || new Date(),
    updatedAt: overrides.updatedAt || new Date(),
    lastLoginAt: overrides.lastLoginAt ?? null,
  };
}

export function createMockAuthUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: overrides.id || uuidv4(),
    email: overrides.email || 'test@example.com',
    name: overrides.name ?? 'Test User',
    roles: overrides.roles || ['user'],
    permissions: overrides.permissions || ['profile:read', 'profile:write'],
  };
}

export function createMockAdminUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return createMockAuthUser({
    roles: ['admin'],
    permissions: ['admin:access', 'admin:users', 'admin:roles', 'users:read', 'users:write', 'users:delete'],
    ...overrides,
  });
}

// ============================================
// TOKEN HELPERS
// ============================================

export function generateTestTokens(user: AuthUser) {
  const accessToken = generateAccessToken(user.id, user.email);
  const refreshToken = generateRefreshToken(user.id, 'test-session-id');
  
  return { accessToken, refreshToken };
}

export function getAuthHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  };
}

// ============================================
// SESSION FACTORIES
// ============================================

export interface MockSession {
  id: string;
  userId: string;
  refreshToken: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  createdAt: Date;
  lastUsedAt: Date;
}

export function createMockSession(userId: string, overrides: Partial<MockSession> = {}): MockSession {
  return {
    id: overrides.id || uuidv4(),
    userId,
    refreshToken: overrides.refreshToken || `refresh-${uuidv4()}`,
    userAgent: overrides.userAgent ?? 'Test Agent',
    ipAddress: overrides.ipAddress ?? '127.0.0.1',
    expiresAt: overrides.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: overrides.createdAt || new Date(),
    lastUsedAt: overrides.lastUsedAt || new Date(),
  };
}

// ============================================
// ROLE/PERMISSION FACTORIES
// ============================================

export interface MockRole {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
}

export function createMockRole(name: string, overrides: Partial<MockRole> = {}): MockRole {
  return {
    id: overrides.id || uuidv4(),
    name,
    description: overrides.description ?? `${name} role`,
    createdAt: overrides.createdAt || new Date(),
  };
}

// ============================================
// REQUEST BODY HELPERS
// ============================================

export const validRegistrationData = {
  email: 'newuser@example.com',
  password: 'StrongPassword123!',
  name: 'New User',
};

export const validLoginData = {
  email: 'existing@example.com',
  password: 'ExistingPassword123!',
};

export const weakPasswordData = {
  email: 'weakpass@example.com',
  password: '123', // Too weak
  name: 'Weak Password User',
};

export const invalidEmailData = {
  email: 'not-an-email',
  password: 'StrongPassword123!',
  name: 'Bad Email User',
};
