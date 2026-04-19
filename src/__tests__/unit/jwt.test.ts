import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment before importing jwt module
vi.stubEnv('JWT_ACCESS_SECRET', 'test-access-secret-that-is-at-least-32-characters-long');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-refresh-secret-that-is-at-least-32-characters-long');
vi.stubEnv('JWT_ACCESS_EXPIRES_IN', '15m');
vi.stubEnv('JWT_REFRESH_EXPIRES_IN', '7d');

import {
  generateAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  getAccessTokenExpirySeconds,
} from '../../auth/jwt';

describe('JWT Utilities', () => {
  const mockUserId = 'test-user-id-123';
  const mockEmail = 'test@example.com';
  const mockSessionId = 'session-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAccessToken', () => {
    it('should create a valid JWT token', () => {
      const token = generateAccessToken(mockUserId, mockEmail);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include user data in the token payload', () => {
      const token = generateAccessToken(mockUserId, mockEmail);
      const decoded = verifyAccessToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockUserId);
      expect(decoded?.email).toBe(mockEmail);
      expect(decoded?.type).toBe('access');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = generateAccessToken(mockUserId, mockEmail);
      const decoded = verifyAccessToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockUserId);
    });

    it('should return null for an invalid token', () => {
      const decoded = verifyAccessToken('invalid.token.here');
      
      expect(decoded).toBeNull();
    });

    it('should return null for a malformed token', () => {
      const decoded = verifyAccessToken('not-a-jwt');
      
      expect(decoded).toBeNull();
    });

    it('should return null for an empty token', () => {
      const decoded = verifyAccessToken('');
      
      expect(decoded).toBeNull();
    });
  });

  describe('generateRefreshToken', () => {
    it('should create a valid refresh token', () => {
      const token = generateRefreshToken(mockUserId, mockSessionId);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include userId and sessionId in the payload', () => {
      const token = generateRefreshToken(mockUserId, mockSessionId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockUserId);
      expect(decoded?.sessionId).toBe(mockSessionId);
      expect(decoded?.type).toBe('refresh');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = generateRefreshToken(mockUserId, mockSessionId);
      const decoded = verifyRefreshToken(token);
      
      expect(decoded).not.toBeNull();
      expect(decoded?.sub).toBe(mockUserId);
    });

    it('should return null for an invalid refresh token', () => {
      const decoded = verifyRefreshToken('invalid.refresh.token');
      
      expect(decoded).toBeNull();
    });

    it('should not verify access token as refresh token', () => {
      const accessToken = generateAccessToken(mockUserId, mockEmail);
      const decoded = verifyRefreshToken(accessToken);
      
      // Access token should not validate as refresh token
      // (different secrets are used)
      expect(decoded).toBeNull();
    });
  });

  describe('getAccessTokenExpirySeconds', () => {
    it('should return correct expiry in seconds', () => {
      const expiry = getAccessTokenExpirySeconds();
      
      expect(typeof expiry).toBe('number');
      expect(expiry).toBeGreaterThan(0);
    });

    it('should return 900 seconds for 15m expiry', () => {
      const expiry = getAccessTokenExpirySeconds();
      
      // 15m = 15 * 60 = 900 seconds
      expect(expiry).toBe(900);
    });
  });

  describe('Token Uniqueness', () => {
    it('should generate different tokens for same user', () => {
      const token1 = generateAccessToken(mockUserId, mockEmail);
      const token2 = generateAccessToken(mockUserId, mockEmail);
      
      // Tokens should be different due to jwtid (unique ID)
      expect(token1).not.toBe(token2);
    });

    it('should generate different refresh tokens for same session', () => {
      const token1 = generateRefreshToken(mockUserId, mockSessionId);
      const token2 = generateRefreshToken(mockUserId, mockSessionId);
      
      expect(token1).not.toBe(token2);
    });
  });
});
