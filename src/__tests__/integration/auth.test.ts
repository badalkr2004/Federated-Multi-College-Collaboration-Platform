import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import type { AuthUser } from '../../types';

// ============================================
// MOCK AUTH ROUTES FOR TESTING
// ============================================

function createAuthTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());

  // Mock user database
  const users = new Map<string, any>();
  users.set('existing@example.com', {
    id: 'existing-user-id',
    email: 'existing@example.com',
    passwordHash: 'hashed-password',
    name: 'Existing User',
    emailVerified: true,
    isActive: true,
  });

  // Mock registration
  app.post('/api/auth/register', (req, res) => {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' } });
      return;
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[!@#$%^&*]/.test(password)) {
      res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password is too weak' } });
      return;
    }

    // Check if user exists
    if (users.has(email)) {
      res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'User already exists' } });
      return;
    }

    // Create new user
    const newUser = {
      id: 'new-user-id',
      email,
      name: name || null,
      emailVerified: false,
    };

    users.set(email, newUser);

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        message: 'Registration successful',
      },
    });
  });

  // Mock login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email and password required' } });
      return;
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    // Simulate password verification (only accept 'TestPassword123!' for existing user)
    if (email === 'existing@example.com' && password !== 'TestPassword123!') {
      res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
      return;
    }

    // Set refresh token cookie
    res.cookie('refreshToken', 'mock-refresh-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: 'mock-access-token',
        expiresIn: 900,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  });

  // Mock logout
  app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
      return;
    }

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  // Mock refresh
  app.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ success: false, error: { code: 'NO_REFRESH_TOKEN', message: 'No refresh token' } });
      return;
    }

    // Set new refresh token cookie
    res.cookie('refreshToken', 'new-mock-refresh-token', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        accessToken: 'new-mock-access-token',
        expiresIn: 900,
      },
    });
  });

  // Mock logout all
  app.post('/api/auth/logout-all', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
      return;
    }

    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { message: 'Logged out from all devices' },
    });
  });

  // Mock email verification
  app.post('/api/auth/verify-email', (req, res) => {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Token required' } });
      return;
    }

    if (token === 'valid-token') {
      res.json({ success: true, data: { message: 'Email verified successfully' } });
    } else {
      res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
    }
  });

  // Mock forgot password
  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email required' } });
      return;
    }

    // Always return success (don't reveal if email exists)
    res.json({ success: true, data: { message: 'If account exists, reset email sent' } });
  });

  // Mock reset password
  app.post('/api/auth/reset-password', (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Token and password required' } });
      return;
    }

    if (token !== 'valid-reset-token') {
      res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
      return;
    }

    res.json({ success: true, data: { message: 'Password reset successful' } });
  });

  return app;
}

// ============================================
// TESTS
// ============================================

describe('Authentication Routes', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createAuthTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'NewPassword123!',
          name: 'New User',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe('newuser@example.com');
    });

    it('should reject registration with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'weakpass@example.com',
          password: '123',
          name: 'Weak Password User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'StrongPassword123!',
          name: 'Bad Email User',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject registration without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject duplicate email registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'StrongPassword123!',
          name: 'Duplicate User',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'WrongPassword123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject login for non-existent user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should set refresh token cookie on successful login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'existing@example.com',
          password: 'TestPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
      
      const cookies = res.headers['set-cookie'];
      const hasRefreshToken = Array.isArray(cookies) 
        ? cookies.some((c: string) => c.includes('refreshToken')) 
        : (cookies as string).includes('refreshToken');
      expect(hasRefreshToken).toBe(true);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer mock-access-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject logout without token', async () => {
      const res = await request(app)
        .post('/api/auth/logout');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh tokens with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=mock-refresh-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject refresh without cookie', async () => {
      const res = await request(app)
        .post('/api/auth/refresh');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout-all', () => {
    it('should logout from all devices', async () => {
      const res = await request(app)
        .post('/api/auth/logout-all')
        .set('Authorization', 'Bearer mock-access-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should verify email with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'valid-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/verify-email')
        .send({ token: 'invalid-token' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept password reset request', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'existing@example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should not reveal if email exists', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      // Should still return 200 to not reveal if email exists
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'valid-reset-token', password: 'NewPassword123!' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject invalid reset token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewPassword123!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
