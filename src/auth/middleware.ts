import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/jwt';
import { db } from '../db';
import { users, userRoles, roles } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthUser } from '../types';
import { getPermissionsForRoles, RoleName } from '../rbac';
import { UnauthorizedError } from "../middleware/error-handler";

// Extract token from Authorization header
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) return null;
  
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer' || !token) return null;
  
  return token;
}

// Authenticate user from JWT token
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    const payload = verifyAccessToken(token);
    
    if (!payload) {
      throw new UnauthorizedError('Invalid or expired token');
    }

    // Fetch user with roles
    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Build auth user object
    const userRoleNames = user.roles.map(ur => ur.role.name) as RoleName[];
    const userPermissions = getPermissionsForRoles(userRoleNames);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: userRoleNames,
      permissions: userPermissions,
    };

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }

    const payload = verifyAccessToken(token);
    
    if (!payload) {
      return next();
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.sub),
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    if (user && user.isActive) {
      const userRoleNames = user.roles.map(ur => ur.role.name) as RoleName[];
      const userPermissions = getPermissionsForRoles(userRoleNames);

      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: userRoleNames,
        permissions: userPermissions,
      };
    }

    next();
  } catch {
    // Ignore errors and continue without auth
    next();
  }
}
