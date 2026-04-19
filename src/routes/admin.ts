import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/index.js';
import { users, roles, userRoles } from '../db/schema/index.js';
import { eq, desc, sql } from 'drizzle-orm';
import { authenticate } from '../auth/middleware.js';
import { requirePermission, PERMISSIONS, ROLES } from '../rbac/index.js';
import { validate, schemas } from '../middleware/validation.js';
import { NotFoundError, ApiError } from '../middleware/error-handler.js';
import { ApiResponse } from '../types/index.js';

const router = Router();

// All admin routes require authentication and admin access
router.use(authenticate);
router.use(requirePermission(PERMISSIONS.ADMIN_ACCESS));

// ============================================
// GET ALL USERS (paginated)
// ============================================
router.get(
  '/users',
  requirePermission(PERMISSIONS.ADMIN_USERS),
  validate(schemas.pagination, 'query'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = _req.query as unknown as { page: number; limit: number };
      const offset = (page - 1) * limit;

      // Get users with their roles
      const usersList = await db.query.users.findMany({
        limit,
        offset,
        orderBy: [desc(users.createdAt)],
        with: {
          roles: {
            with: {
              role: true,
            },
          },
        },
      });

      // Count total users
      const [{ count }] = await db.select({
        count: sql<number>`count(*)::int`,
      }).from(users);

      const formattedUsers = usersList.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
        emailVerified: u.emailVerified,
        isActive: u.isActive,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
        roles: u.roles.map((r: { role: { name: string } }) => r.role.name),
      }));

      const response: ApiResponse = {
        success: true,
        data: {
          users: formattedUsers,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET SINGLE USER
// ============================================
router.get(
  '/users/:id',
  requirePermission(PERMISSIONS.ADMIN_USERS),
  validate(schemas.uuidParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;

      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          roles: {
            with: {
              role: true,
            },
          },
          oauthAccounts: {
            columns: {
              provider: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      const response: ApiResponse = {
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            lastLoginAt: user.lastLoginAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            roles: user.roles.map((r: { role: { name: string } }) => r.role.name),
            oauthProviders: user.oauthAccounts.map((o: { provider: string }) => o.provider),
          },
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE USER ROLE
// ============================================
router.patch(
  '/users/:id/roles',
  requirePermission(PERMISSIONS.ADMIN_ROLES),
  validate(schemas.uuidParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { roles: roleNames } = req.body as { roles: string[] };

      if (!Array.isArray(roleNames) || roleNames.length === 0) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'At least one role is required');
      }

      // Verify user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // Prevent demoting yourself
      if (id === req.user!.id && !roleNames.includes(ROLES.ADMIN)) {
        throw new ApiError(400, 'CANNOT_SELF_DEMOTE', 'Cannot remove admin role from yourself');
      }

      // Verify all roles exist
      const existingRoles = await db.query.roles.findMany({
        where: sql`${roles.name} = ANY(${roleNames})`,
      });

      if (existingRoles.length !== roleNames.length) {
        throw new NotFoundError('One or more roles');
      }

      // Remove existing roles
      await db.delete(userRoles)
        .where(eq(userRoles.userId, id));

      // Assign new roles
      await db.insert(userRoles).values(
        existingRoles.map(role => ({
          userId: id,
          roleId: role.id,
          assignedBy: req.user!.id,
        }))
      );

      const response: ApiResponse = {
        success: true,
        data: { 
          message: 'Roles updated successfully',
          roles: roleNames,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ACTIVATE/DEACTIVATE USER
// ============================================
router.patch(
  '/users/:id/status',
  requirePermission(PERMISSIONS.ADMIN_USERS),
  validate(schemas.uuidParam, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { isActive } = req.body as { isActive: boolean };

      if (typeof isActive !== 'boolean') {
        throw new ApiError(400, 'VALIDATION_ERROR', 'isActive must be a boolean');
      }

      // Prevent deactivating yourself
      if (id === req.user!.id && !isActive) {
        throw new ApiError(400, 'CANNOT_SELF_DEACTIVATE', 'Cannot deactivate yourself');
      }

      const [updatedUser] = await db.update(users)
        .set({
          isActive,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundError('User');
      }

      const response: ApiResponse = {
        success: true,
        data: { 
          message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
          isActive: updatedUser.isActive,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET ALL ROLES
// ============================================
router.get(
  '/roles',
  requirePermission(PERMISSIONS.ADMIN_ROLES),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rolesList = await db.query.roles.findMany({
        with: {
          permissions: {
            with: {
              permission: true,
            },
          },
        },
      });

      const formattedRoles = rolesList.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        permissions: r.permissions.map((p: { permission: { name: string } }) => p.permission.name),
        createdAt: r.createdAt,
      }));

      const response: ApiResponse = {
        success: true,
        data: { roles: formattedRoles },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET ALL PERMISSIONS
// ============================================
router.get(
  '/permissions',
  requirePermission(PERMISSIONS.ADMIN_ROLES),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const permissionsList = await db.query.permissions.findMany();

      const response: ApiResponse = {
        success: true,
        data: { permissions: permissionsList },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// ADMIN STATISTICS
// ============================================
router.get(
  '/stats',
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const [userStats] = await db.select({
        totalUsers: sql<number>`count(*)::int`,
        activeUsers: sql<number>`count(*) filter (where ${users.isActive} = true)::int`,
        verifiedUsers: sql<number>`count(*) filter (where ${users.emailVerified} = true)::int`,
        newUsersToday: sql<number>`count(*) filter (where ${users.createdAt} >= current_date)::int`,
        newUsersThisWeek: sql<number>`count(*) filter (where ${users.createdAt} >= current_date - interval '7 days')::int`,
      }).from(users);

      const response: ApiResponse = {
        success: true,
        data: { stats: userStats },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
