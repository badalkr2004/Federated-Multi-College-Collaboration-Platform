import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { db } from '../db';
import { users, roles, userRoles, oauthAccounts } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateSecureToken, generateTokenExpiry, validatePasswordStrength } from '../auth/password';
import { generateAccessToken, getAccessTokenExpirySeconds } from '../auth/jwt';
import { createSession, rotateRefreshToken, deleteSession, deleteAllUserSessions, findSessionByToken } from '../auth/session';
import { validate, schemas } from '../middleware/validation';
import { authLimiter, passwordResetLimiter, oauthLimiter } from '../middleware/rate-limiter';
import { authenticate } from '../auth/middleware';
import { ApiError, ConflictError, NotFoundError, UnauthorizedError, ValidationError } from '../middleware/error-handler';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from '../services/email';
import { ROLES } from '../rbac/roles';
import { OAuthProfile, ApiResponse, AuthTokens, PublicUser } from '../types';
import { env } from '../utils/env';
import { logger } from '../utils/logger';

const router = Router();

// Cookie options for refresh token
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// Helper: Get default user role
async function getDefaultRole() {
  let defaultRole = await db.query.roles.findFirst({
    where: eq(roles.name, ROLES.USER),
  });

  if (!defaultRole) {
    // Create default role if it doesn't exist
    const [newRole] = await db.insert(roles).values({
      name: ROLES.USER,
      description: 'Default user role',
    }).returning();
    defaultRole = newRole;
  }

  return defaultRole;
}

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
// REGISTER
// ============================================
router.post(
  '/register',
  authLimiter,
  validate(schemas.register),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name } = req.body;

      // Validate password strength
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        throw new ValidationError('Password too weak', passwordCheck.errors);
      }

      // Check if email already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (existingUser) {
        throw new ConflictError('Email already registered');
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Generate verification token
      const verificationToken = generateSecureToken();
      const verificationExpires = generateTokenExpiry(24); // 24 hours

      // Create user
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      }).returning();

      // Assign default role
      const defaultRole = await getDefaultRole();
      await db.insert(userRoles).values({
        userId: newUser.id,
        roleId: defaultRole.id,
      });

      // Send verification email
      await sendVerificationEmail(email, name, verificationToken);

      // Create session
      const session = await createSession(newUser.id, req);
      
      // Generate access token
      const accessToken = generateAccessToken(newUser.id, newUser.email);

      // Set refresh token in cookie
      res.cookie('refreshToken', session.refreshToken, COOKIE_OPTIONS);

      const response: ApiResponse<{ user: PublicUser; tokens: AuthTokens }> = {
        success: true,
        data: {
          user: formatUserResponse(newUser),
          tokens: {
            accessToken,
            refreshToken: session.refreshToken,
            expiresIn: getAccessTokenExpirySeconds(),
          },
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// LOGIN
// ============================================
router.post(
  '/login',
  authLimiter,
  validate(schemas.login),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user || !user.passwordHash) {
        throw new UnauthorizedError('Invalid email or password');
      }

      if (!user.isActive) {
        throw new UnauthorizedError('Account is deactivated');
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Update last login
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, user.id));

      // Create session
      const session = await createSession(user.id, req);
      
      // Generate access token
      const accessToken = generateAccessToken(user.id, user.email);

      // Set refresh token in cookie
      res.cookie('refreshToken', session.refreshToken, COOKIE_OPTIONS);

      const response: ApiResponse<{ user: PublicUser; tokens: AuthTokens }> = {
        success: true,
        data: {
          user: formatUserResponse(user),
          tokens: {
            accessToken,
            refreshToken: session.refreshToken,
            expiresIn: getAccessTokenExpirySeconds(),
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
// REFRESH TOKEN
// ============================================
router.post(
  '/refresh',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get refresh token from cookie or body
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      // Rotate refresh token
      const newSession = await rotateRefreshToken(refreshToken, req);
      
      if (!newSession) {
        res.clearCookie('refreshToken');
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, newSession.userId),
      });

      if (!user || !user.isActive) {
        await deleteSession(newSession.id);
        res.clearCookie('refreshToken');
        throw new UnauthorizedError('User not found or inactive');
      }

      // Generate new access token
      const accessToken = generateAccessToken(user.id, user.email);

      // Set new refresh token in cookie
      res.cookie('refreshToken', newSession.refreshToken, COOKIE_OPTIONS);

      const response: ApiResponse<{ tokens: AuthTokens }> = {
        success: true,
        data: {
          tokens: {
            accessToken,
            refreshToken: newSession.refreshToken,
            expiresIn: getAccessTokenExpirySeconds(),
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
// LOGOUT
// ============================================
router.post(
  '/logout',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

      if (refreshToken) {
        const session = await findSessionByToken(refreshToken);
        if (session) {
          await deleteSession(session.id);
        }
      }

      res.clearCookie('refreshToken');

      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out successfully' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// LOGOUT ALL DEVICES
// ============================================
router.post(
  '/logout-all',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteAllUserSessions(req.user!.id);
      res.clearCookie('refreshToken');

      const response: ApiResponse = {
        success: true,
        data: { message: 'Logged out from all devices' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// VERIFY EMAIL
// ============================================
router.post(
  '/verify-email',
  validate(schemas.verifyEmail),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(users.emailVerificationToken, token),
      });

      if (!user) {
        throw new NotFoundError('Invalid verification token');
      }

      if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        throw new ApiError(400, 'TOKEN_EXPIRED', 'Verification token has expired');
      }

      if (user.emailVerified) {
        throw new ApiError(400, 'ALREADY_VERIFIED', 'Email already verified');
      }

      // Mark email as verified
      await db.update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Send welcome email
      await sendWelcomeEmail(user.email, user.name);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Email verified successfully' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// RESEND VERIFICATION EMAIL
// ============================================
router.post(
  '/resend-verification',
  authLimiter,
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user!.id),
      });

      if (!user) {
        throw new NotFoundError('User');
      }

      if (user.emailVerified) {
        throw new ApiError(400, 'ALREADY_VERIFIED', 'Email already verified');
      }

      // Generate new verification token
      const verificationToken = generateSecureToken();
      const verificationExpires = generateTokenExpiry(24);

      await db.update(users)
        .set({
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await sendVerificationEmail(user.email, user.name, verificationToken);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Verification email sent' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// FORGOT PASSWORD
// ============================================
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(schemas.forgotPassword),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      // Always return success to prevent email enumeration
      const response: ApiResponse = {
        success: true,
        data: { message: 'If an account exists, a password reset email has been sent' },
      };

      if (!user) {
        return res.json(response);
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      const resetExpires = generateTokenExpiry(1); // 1 hour

      await db.update(users)
        .set({
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      await sendPasswordResetEmail(user.email, user.name, resetToken);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// RESET PASSWORD
// ============================================
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(schemas.resetPassword),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;

      // Validate password strength
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        throw new ValidationError('Password too weak', passwordCheck.errors);
      }

      const user = await db.query.users.findFirst({
        where: eq(users.passwordResetToken, token),
      });

      if (!user) {
        throw new NotFoundError('Invalid reset token');
      }

      if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
        throw new ApiError(400, 'TOKEN_EXPIRED', 'Reset token has expired');
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update password and clear reset token
      await db.update(users)
        .set({
          passwordHash,
          passwordResetToken: null,
          passwordResetExpires: null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      // Invalidate all sessions (security measure)
      await deleteAllUserSessions(user.id);

      const response: ApiResponse = {
        success: true,
        data: { message: 'Password reset successfully. Please log in with your new password.' },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// GOOGLE OAUTH
// ============================================
router.get(
  '/google',
  oauthLimiter,
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  handleOAuthCallback
);

// ============================================
// GITHUB OAUTH
// ============================================
router.get(
  '/github',
  oauthLimiter,
  passport.authenticate('github', { 
    scope: ['user:email'],
    session: false,
  })
);

router.get(
  '/github/callback',
  passport.authenticate('github', { 
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=github_auth_failed`,
  }),
  handleOAuthCallback
);

// ============================================
// OAUTH CALLBACK HANDLER
// ============================================
async function handleOAuthCallback(req: Request, res: Response, _next: NextFunction) {
  try {
    const profile = req.user as unknown as OAuthProfile;
    
    if (!profile || !profile.email) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_no_email`);
    }

    // Check if OAuth account already linked
    const existingOAuth = await db.query.oauthAccounts.findFirst({
      where: and(
        eq(oauthAccounts.provider, profile.provider),
        eq(oauthAccounts.providerAccountId, profile.id)
      ),
      with: { user: true },
    });

    let user: typeof users.$inferSelect;

    if (existingOAuth) {
      // Update OAuth tokens
      await db.update(oauthAccounts)
        .set({
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
          updatedAt: new Date(),
        })
        .where(eq(oauthAccounts.id, existingOAuth.id));

      user = existingOAuth.user;
    } else {
      // Check if user exists with this email
      const existingUser = await db.query.users.findFirst({
        where: eq(users.email, profile.email.toLowerCase()),
      });

      if (existingUser) {
        // Link OAuth account to existing user
        await db.insert(oauthAccounts).values({
          userId: existingUser.id,
          provider: profile.provider,
          providerAccountId: profile.id,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        });
        user = existingUser;
      } else {
        // Create new user
        const [newUser] = await db.insert(users).values({
          email: profile.email.toLowerCase(),
          name: profile.name,
          avatarUrl: profile.avatarUrl,
          emailVerified: true, // OAuth emails are pre-verified
        }).returning();

        // Assign default role
        const defaultRole = await getDefaultRole();
        await db.insert(userRoles).values({
          userId: newUser.id,
          roleId: defaultRole.id,
        });

        // Link OAuth account
        await db.insert(oauthAccounts).values({
          userId: newUser.id,
          provider: profile.provider,
          providerAccountId: profile.id,
          accessToken: profile.accessToken,
          refreshToken: profile.refreshToken,
        });

        user = newUser;
      }
    }

    // Update last login
    await db.update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    // Create session
    const session = await createSession(user.id, req);
    
    // Generate access token
    const accessToken = generateAccessToken(user.id, user.email);

    // Set refresh token in cookie
    res.cookie('refreshToken', session.refreshToken, COOKIE_OPTIONS);

    // Redirect to frontend with tokens
    const redirectUrl = new URL(`${env.FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('expiresIn', getAccessTokenExpirySeconds().toString());

    res.redirect(redirectUrl.toString());
  } catch (error) {
    logger.error({ error }, 'OAuth callback error');
    res.redirect(`${env.FRONTEND_URL}/login?error=oauth_error`);
  }
}

export default router;
