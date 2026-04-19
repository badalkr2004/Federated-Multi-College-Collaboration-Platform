import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { users, sessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../auth/middleware';
import { validate, schemas } from '../middleware/validation';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../auth/password';
import { getUserSessions, deleteSession, deleteAllUserSessions } from '../auth/session';
import { NotFoundError, UnauthorizedError, ValidationError } from '../middleware/error-handler';
import { ApiResponse, PublicUser } from '../types';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Helper: Format user response
function formatUserResponse(user: typeof users.$inferSelect): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
  };
}

// ============================================
// GET CURRENT USER PROFILE
// ============================================
router.get(
  '/me',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id),
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      const response: ApiResponse<{ user: PublicUser; roles: string[]; permissions: string[] }> = {
        success: true,
        data: {
          user: formatUserResponse(user),
          roles: req.user!.roles,
          permissions: req.user!.permissions,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// UPDATE PROFILE
// ============================================
router.patch(
  '/me',
  validate(schemas.updateProfile),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, avatarUrl } = req.body;

      const updateData: Partial<typeof users.$inferInsert> = {
        updatedAt: new Date(),
      };

      if (name !== undefined) updateData.name = name;
      if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

      const [updatedUser] = await db.update(users)
        .set(updateData)
        .where(eq(users.id, req.user!.id))
        .returning();

      if (!updatedUser) {
        throw new NotFoundError('User');
      }

      const response: ApiResponse<{ user: PublicUser }> = {
        success: true,
        data: {
          user: formatUserResponse(updatedUser),
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// CHANGE PASSWORD
// ============================================
router.post(
  '/me/change-password',
  validate(schemas.changePassword),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Get user with password
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id),
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      // User might have signed up via OAuth and not have a password
      if (!user.passwordHash) {
        throw new ValidationError('Cannot change password for OAuth-only accounts. Please set a password first.');
      }

      // Verify current password
      const isValid = await verifyPassword(currentPassword, user.passwordHash);
      if (!isValid) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Validate new password strength
      const passwordCheck = validatePasswordStrength(newPassword);
      if (!passwordCheck.valid) {
        throw new ValidationError('New password too weak', passwordCheck.errors);
      }

      // Hash and update password
      const passwordHash = await hashPassword(newPassword);

      await db.update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      const response: ApiResponse = {
        success: true,
        data: { message: 'Password changed successfully' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GET ACTIVE SESSIONS
// ============================================
router.get(
  '/me/sessions',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeSessions = await getUserSessions(req.user!.id);

      // Don't expose refresh tokens
      const safeSessions = activeSessions.map(s => ({
        id: s.id,
        userAgent: s.userAgent,
        ipAddress: s.ipAddress,
        expiresAt: s.expiresAt,
      }));

      const response: ApiResponse<{ sessions: typeof safeSessions }> = {
        success: true,
        data: { sessions: safeSessions },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// REVOKE SPECIFIC SESSION
// ============================================
router.delete(
  '/me/sessions/:sessionId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sessionId = req.params.sessionId as string;

      // Verify session belongs to user
      const session = await db.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });

      if (!session || session.userId !== req.user!.id) {
        throw new NotFoundError('Session');
      }

      await deleteSession(sessionId);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Session revoked' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// DELETE ACCOUNT
// ============================================
router.delete(
  '/me',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Soft delete - deactivate account
      await db.update(users)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id));

      // Invalidate all sessions
      await deleteAllUserSessions(req.user!.id);

      res.clearCookie('refreshToken');

      const response: ApiResponse = {
        success: true,
        data: { message: 'Account deleted successfully' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
