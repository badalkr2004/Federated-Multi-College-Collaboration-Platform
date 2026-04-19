import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import type { AuthUser } from '../../types';

// ============================================
// MOCK USERS
// ============================================

const mockAdminUser: AuthUser = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  name: 'Admin User',
  roles: ['admin'],
  permissions: ['admin:access', 'admin:users', 'admin:roles', 'users:read', 'users:write', 'users:delete'],
};

const mockRegularUser: AuthUser = {
  id: 'regular-user-id',
  email: 'user@example.com',
  name: 'Regular User',
  roles: ['user'],
  permissions: ['profile:read', 'profile:write'],
};

// ============================================
// TEST APP FACTORY
// ============================================

function createAdminTestApp(user: AuthUser | null = mockAdminUser): Express {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    if (user) {
      req.user = user;
    }
    next();
  });

  // Mock authorization middleware
  const checkPermission = (permission: string) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }
    if (!req.user.permissions.includes(permission)) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }
    next();
  };

  // Admin routes
  app.get('/api/admin/users', checkPermission('admin:users'), (_req, res) => {
    res.json({
      success: true,
      data: {
        users: [
          { id: '1', email: 'user1@example.com', name: 'User 1', roles: ['user'] },
          { id: '2', email: 'user2@example.com', name: 'User 2', roles: ['moderator'] },
        ],
        pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
      },
    });
  });

  app.get('/api/admin/users/:id', checkPermission('admin:users'), (req, res) => {
    const { id } = req.params;
    if (id === 'not-found') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    res.json({
      success: true,
      data: {
        user: { id, email: `${id}@example.com`, name: `User ${id}`, roles: ['user'] },
      },
    });
  });

  app.patch('/api/admin/users/:id/roles', checkPermission('admin:roles'), (req, res) => {
    const { id } = req.params;
    const { roles } = req.body;

    if (!Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({ success: false, error: 'Roles required' });
      return;
    }

    if (id === req.user?.id) {
      res.status(400).json({ success: false, error: 'Cannot modify own roles' });
      return;
    }

    res.json({
      success: true,
      data: { message: 'Roles updated', roles },
    });
  });

  app.patch('/api/admin/users/:id/status', checkPermission('admin:users'), (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      res.status(400).json({ success: false, error: 'isActive required' });
      return;
    }

    if (id === req.user?.id && !isActive) {
      res.status(400).json({ success: false, error: 'Cannot deactivate self' });
      return;
    }

    res.json({
      success: true,
      data: { message: `User ${isActive ? 'activated' : 'deactivated'}`, isActive },
    });
  });

  app.get('/api/admin/roles', checkPermission('admin:roles'), (_req, res) => {
    res.json({
      success: true,
      data: {
        roles: [
          { id: '1', name: 'user', permissions: ['profile:read', 'profile:write'] },
          { id: '2', name: 'moderator', permissions: ['profile:read', 'profile:write', 'content:moderate'] },
          { id: '3', name: 'admin', permissions: ['admin:access', 'admin:users', 'admin:roles'] },
        ],
      },
    });
  });

  app.get('/api/admin/permissions', checkPermission('admin:roles'), (_req, res) => {
    res.json({
      success: true,
      data: {
        permissions: [
          { name: 'users:read', description: 'Read users' },
          { name: 'users:write', description: 'Update users' },
          { name: 'admin:access', description: 'Access admin panel' },
        ],
      },
    });
  });

  app.get('/api/admin/stats', checkPermission('admin:access'), (_req, res) => {
    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: 100,
          activeUsers: 85,
          verifiedUsers: 90,
          newUsersToday: 5,
          newUsersThisWeek: 25,
        },
      },
    });
  });

  return app;
}

// ============================================
// TESTS
// ============================================

describe('Admin Routes', () => {
  let adminApp: Express;
  let userApp: Express;
  let unauthApp: Express;

  beforeEach(() => {
    vi.clearAllMocks();
    adminApp = createAdminTestApp(mockAdminUser);
    userApp = createAdminTestApp(mockRegularUser);
    unauthApp = createAdminTestApp(null);
  });

  describe('Authorization', () => {
    it('should reject unauthenticated requests', async () => {
      const res = await request(unauthApp).get('/api/admin/users');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      const res = await request(userApp).get('/api/admin/users');
      expect(res.status).toBe(403);
    });

    it('should allow admin users', async () => {
      const res = await request(adminApp).get('/api/admin/users');
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return paginated users list', async () => {
      const res = await request(adminApp).get('/api/admin/users');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should include user roles in response', async () => {
      const res = await request(adminApp).get('/api/admin/users');

      expect(res.status).toBe(200);
      const user = res.body.data.users[0];
      expect(user.roles).toBeDefined();
      expect(Array.isArray(user.roles)).toBe(true);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return single user details', async () => {
      const res = await request(adminApp).get('/api/admin/users/user-123');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.id).toBe('user-123');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(adminApp).get('/api/admin/users/not-found');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/admin/users/:id/roles', () => {
    it('should update user roles', async () => {
      const res = await request(adminApp)
        .patch('/api/admin/users/other-user/roles')
        .send({ roles: ['user', 'moderator'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toEqual(['user', 'moderator']);
    });

    it('should reject empty roles array', async () => {
      const res = await request(adminApp)
        .patch('/api/admin/users/other-user/roles')
        .send({ roles: [] });

      expect(res.status).toBe(400);
    });

    it('should prevent modifying own roles', async () => {
      const res = await request(adminApp)
        .patch(`/api/admin/users/${mockAdminUser.id}/roles`)
        .send({ roles: ['user'] });

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/admin/users/:id/status', () => {
    it('should activate user', async () => {
      const res = await request(adminApp)
        .patch('/api/admin/users/other-user/status')
        .send({ isActive: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(true);
    });

    it('should deactivate user', async () => {
      const res = await request(adminApp)
        .patch('/api/admin/users/other-user/status')
        .send({ isActive: false });

      expect(res.status).toBe(200);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should prevent self-deactivation', async () => {
      const res = await request(adminApp)
        .patch(`/api/admin/users/${mockAdminUser.id}/status`)
        .send({ isActive: false });

      expect(res.status).toBe(400);
    });

    it('should reject invalid isActive value', async () => {
      const res = await request(adminApp)
        .patch('/api/admin/users/other-user/status')
        .send({ isActive: 'yes' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/admin/roles', () => {
    it('should return all roles with permissions', async () => {
      const res = await request(adminApp).get('/api/admin/roles');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.roles).toBeDefined();
      expect(Array.isArray(res.body.data.roles)).toBe(true);
      
      const role = res.body.data.roles[0];
      expect(role.name).toBeDefined();
      expect(role.permissions).toBeDefined();
    });
  });

  describe('GET /api/admin/permissions', () => {
    it('should return all permissions', async () => {
      const res = await request(adminApp).get('/api/admin/permissions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.permissions).toBeDefined();
      expect(Array.isArray(res.body.data.permissions)).toBe(true);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should return admin statistics', async () => {
      const res = await request(adminApp).get('/api/admin/stats');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.stats.totalUsers).toBeDefined();
      expect(res.body.data.stats.activeUsers).toBeDefined();
    });
  });
});

describe('Admin Permission Matrix', () => {
  it('should enforce correct permissions for each route', async () => {
    const adminApp = createAdminTestApp(mockAdminUser);
    const userApp = createAdminTestApp(mockRegularUser);

    // Define routes and expected permissions
    const routes = [
      { method: 'get', path: '/api/admin/users', permission: 'admin:users' },
      { method: 'get', path: '/api/admin/users/123', permission: 'admin:users' },
      { method: 'patch', path: '/api/admin/users/123/roles', permission: 'admin:roles' },
      { method: 'patch', path: '/api/admin/users/123/status', permission: 'admin:users' },
      { method: 'get', path: '/api/admin/roles', permission: 'admin:roles' },
      { method: 'get', path: '/api/admin/permissions', permission: 'admin:roles' },
      { method: 'get', path: '/api/admin/stats', permission: 'admin:access' },
    ];

    for (const route of routes) {
      // Admin should have access (200 or 400 for some routes needing body)
      const adminRes = await (request(adminApp) as any)[route.method](route.path)
        .send(route.method === 'patch' ? { roles: ['user'], isActive: true } : undefined);
      expect([200, 400]).toContain(adminRes.status);

      // Regular user should be forbidden
      const userRes = await (request(userApp) as any)[route.method](route.path);
      expect(userRes.status).toBe(403);
    }
  });
});
