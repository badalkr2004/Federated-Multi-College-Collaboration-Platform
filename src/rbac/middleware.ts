import { Request, Response, NextFunction } from 'express';
import { RoleName, hasHigherOrEqualRole, ROLES } from './roles';
import { PermissionName, hasPermission, hasAllPermissions, hasAnyPermission } from './permissions';
import { ApiError } from '../middleware/error-handler';

// Middleware: Require specific role
export function requireRole(requiredRole: RoleName) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    const userRoles = user.roles as RoleName[];
    const hasRole = userRoles.some(role => hasHigherOrEqualRole(role, requiredRole));

    if (!hasRole) {
      return next(new ApiError(403, 'FORBIDDEN', `Role '${requiredRole}' or higher required`));
    }

    next();
  };
}

// Middleware: Require specific permission
export function requirePermission(permission: PermissionName) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!hasPermission(user.permissions, permission)) {
      return next(new ApiError(403, 'FORBIDDEN', `Permission '${permission}' required`));
    }

    next();
  };
}

// Middleware: Require all of the specified permissions
export function requireAllPermissions(permissions: PermissionName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!hasAllPermissions(user.permissions, permissions)) {
      return next(new ApiError(403, 'FORBIDDEN', `All permissions required: ${permissions.join(', ')}`));
    }

    next();
  };
}

// Middleware: Require any of the specified permissions
export function requireAnyPermission(permissions: PermissionName[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!hasAnyPermission(user.permissions, permissions)) {
      return next(new ApiError(403, 'FORBIDDEN', `One of these permissions required: ${permissions.join(', ')}`));
    }

    next();
  };
}

// Middleware: Require admin role (shorthand)
export const requireAdmin = requireRole(ROLES.ADMIN);

// Middleware: Require moderator or higher role (shorthand)
export const requireModerator = requireRole(ROLES.MODERATOR);
