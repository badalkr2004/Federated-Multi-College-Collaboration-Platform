import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSecureToken,
  validatePasswordStrength,
  generateTokenExpiry,
} from '../../auth/password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
    });

    it('should create unique hashes for the same password', async () => {
      const password = 'SamePassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      // Argon2 uses random salt, so hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('should create different hashes for different passwords', async () => {
      const hash1 = await hashPassword('Password1!');
      const hash2 = await hashPassword('Password2!');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'CorrectPassword123!';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword('WrongPassword123!', hash);
      
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const hash = await hashPassword('SomePassword123!');
      
      const isValid = await verifyPassword('', hash);
      
      expect(isValid).toBe(false);
    });

    it('should handle special characters in password', async () => {
      const password = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });

    it('should handle unicode characters in password', async () => {
      const password = 'Pässwörd123!日本語';
      const hash = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hash);
      
      expect(isValid).toBe(true);
    });
  });

  describe('generateSecureToken', () => {
    it('should generate a token of correct length', () => {
      const token = generateSecureToken();
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      // 32 bytes hex = 64 characters
      expect(token.length).toBe(64);
    });

    it('should generate unique tokens', () => {
      const tokens = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        tokens.add(generateSecureToken());
      }
      
      // All 100 tokens should be unique
      expect(tokens.size).toBe(100);
    });

    it('should only contain hex characters', () => {
      const token = generateSecureToken();
      
      expect(token).toMatch(/^[a-f0-9]+$/);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('StrongP@ssw0rd!');
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject password that is too short', () => {
      const result = validatePasswordStrength('Sh0rt!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('lowercaseonly123!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASEONLY123!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumbersHere!');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecialChar123');
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return all errors for very weak password', () => {
      const result = validatePasswordStrength('a');
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should accept password with minimum requirements', () => {
      const result = validatePasswordStrength('Abcdefg1!');
      
      expect(result.valid).toBe(true);
    });
  });

  describe('generateTokenExpiry', () => {
    it('should return future date for positive hours', () => {
      const expiry = generateTokenExpiry(1);
      const now = new Date();
      
      expect(expiry.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should return correct time offset', () => {
      const hours = 24;
      const expiry = generateTokenExpiry(hours);
      const now = new Date();
      const expectedMs = hours * 60 * 60 * 1000;
      
      // Allow 1 second tolerance for test execution time
      const diff = expiry.getTime() - now.getTime();
      expect(diff).toBeGreaterThan(expectedMs - 1000);
      expect(diff).toBeLessThan(expectedMs + 1000);
    });

    it('should handle fractional hours', () => {
      const expiry = generateTokenExpiry(0.5); // 30 minutes
      const now = new Date();
      const expectedMs = 30 * 60 * 1000;
      
      const diff = expiry.getTime() - now.getTime();
      expect(diff).toBeGreaterThan(expectedMs - 1000);
      expect(diff).toBeLessThan(expectedMs + 1000);
    });
  });
});
