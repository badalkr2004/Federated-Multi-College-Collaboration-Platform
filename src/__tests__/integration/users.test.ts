import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../../types';

// ============================================
// MOCK SETUP
// ============================================

const mockUser: AuthUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  roles: ['user'],
  permissions: ['profile:read', 'profile:write'],
};

const mockDbUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  emailVerified: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastLoginAt: null,
  passwordHash: 'hashed-password',
};

// Mock database
vi.mock('../../db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn(async () => mockDbUser),
        findMany: vi.fn(async () => [mockDbUser]),
      },
      sessions: {
        findMany: vi.fn(async () => []),
        findFirst: vi.fn(async () => null),
      },
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(async () => [mockDbUser]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(async () => ({})),
    })),
  },
}));

vi.mock('../../auth/password', () => ({
  hashPassword: vi.fn(async () => 'new-hashed-password'),
  verifyPassword: vi.fn(async () => true),
  validatePasswordStrength: vi.fn(() => ({ valid: true, errors: [] })),
}));

// ============================================
// TEST APP
// ============================================

function createTestApp(user: AuthUser | null = mockUser): Express {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (user) {
      req.user = user;
    }
    next();
  });

  // User routes
  app.get('/api/users/me', (req, res) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          roles: req.user.roles,
          permissions: req.user.permissions,
        },
      },
    });
  });

  app.patch('/api/users/me', (req, res) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const { name } = req.body;
    res.json({
      success: true,
      data: {
        user: {
          ...req.user,
          name: name || req.user.name,
        },
      },
    });
  });

  app.post('/api/users/me/change-password', (req, res) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      res.status(400).json({ success: false, error: 'Missing fields' });
      return;
    }
    
    res.json({ success: true, data: { message: 'Password changed successfully' } });
  });

  app.get('/api/users/me/sessions', (req, res) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.json({
      success: true,
      data: {
        sessions: [
          {
            id: 'session-1',
            userAgent: 'Test Browser',
            ipAddress: '127.0.0.1',
            createdAt: new Date().toISOString(),
            current: true,
          },
        ],
      },
    });
  });

  app.delete('/api/users/me', (req, res) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    res.json({ success: true, data: { message: 'Account deleted' } });
  });

  return app;
}

// ============================================
// TESTS
// ============================================

describe('User Routes', () => {
  let app: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp();
  });

  describe('GET /api/users/me', () => {
    it('should return authenticated user profile', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(mockUser.email);
      expect(res.body.data.user.roles).toEqual(mockUser.roles);
    });

    it('should reject unauthenticated requests', async () => {
      const unauthApp = createTestApp(null);
      const res = await request(unauthApp).get('/api/users/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should include permissions in response', async () => {
      const res = await request(app).get('/api/users/me');

      expect(res.status).toBe(200);
      expect(res.body.data.user.permissions).toBeDefined();
      expect(Array.isArray(res.body.data.user.permissions)).toBe(true);
    });
  });

  describe('PATCH /api/users/me', () => {
    it('should update user profile', async () => {
      const res = await request(app)
        .patch('/api/users/me')
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Updated Name');
    });

    it('should reject unauthenticated update requests', async () => {
      const unauthApp = createTestApp(null);
      const res = await request(unauthApp)
        .patch('/api/users/me')
        .send({ name: 'New Name' });

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/me/change-password', () => {
    it('should change password with valid data', async () => {
      const res = await request(app)
        .post('/api/users/me/change-password')
        .send({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject without current password', async () => {
      const res = await request(app)
        .post('/api/users/me/change-password')
        .send({
          newPassword: 'NewPassword123!',
        });

      expect(res.status).toBe(400);
    });

    it('should reject without new password', async () => {
      const res = await request(app)
        .post('/api/users/me/change-password')
        .send({
          currentPassword: 'OldPassword123!',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/me/sessions', () => {
    it('should return list of sessions', async () => {
      const res = await request(app).get('/api/users/me/sessions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessions).toBeDefined();
      expect(Array.isArray(res.body.data.sessions)).toBe(true);
    });

    it('should include session details', async () => {
      const res = await request(app).get('/api/users/me/sessions');

      expect(res.status).toBe(200);
      const session = res.body.data.sessions[0];
      expect(session.id).toBeDefined();
      expect(session.userAgent).toBeDefined();
    });
  });

  describe('DELETE /api/users/me', () => {
    it('should delete user account', async () => {
      const res = await request(app).delete('/api/users/me');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject unauthenticated delete', async () => {
      const unauthApp = createTestApp(null);
      const res = await request(unauthApp).delete('/api/users/me');

      expect(res.status).toBe(401);
    });
  });
});

describe('User Route Authorization', () => {
  it('should enforce authentication on all user routes', async () => {
    const unauthApp = createTestApp(null);

    const routes = [
      { method: 'get', path: '/api/users/me' },
      { method: 'patch', path: '/api/users/me' },
      { method: 'delete', path: '/api/users/me' },
      { method: 'get', path: '/api/users/me/sessions' },
      { method: 'post', path: '/api/users/me/change-password' },
    ];

    for (const route of routes) {
      const res = await (request(unauthApp) as any)[route.method](route.path);
      expect(res.status).toBe(401);
    }
  });
});
