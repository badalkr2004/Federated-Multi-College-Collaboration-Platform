import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getPermissionsForRoles,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  ROLE_HIERARCHY,
  hasHigherOrEqualRole,
  RoleName,
} from '../../rbac';

describe('RBAC System', () => {
  describe('Role Constants', () => {
    it('should define all expected roles', () => {
      expect(ROLES.USER).toBe('user');
      expect(ROLES.MODERATOR).toBe('moderator');
      expect(ROLES.ADMIN).toBe('admin');
    });

    it('should have permissions for each role', () => {
      expect(ROLE_PERMISSIONS.user).toBeDefined();
      expect(ROLE_PERMISSIONS.moderator).toBeDefined();
      expect(ROLE_PERMISSIONS.admin).toBeDefined();
    });
  });

  describe('Permission Constants', () => {
    it('should define expected permission format', () => {
      expect(PERMISSIONS.USERS_READ).toBe('users:read');
      expect(PERMISSIONS.ADMIN_ACCESS).toBe('admin:access');
    });

    it('should have all permissions in resource:action format', () => {
      Object.values(PERMISSIONS).forEach(permission => {
        expect(permission).toMatch(/^[a-z]+:[a-z]+$/);
      });
    });
  });

  describe('getPermissionsForRoles', () => {
    it('should return correct permissions for user role', () => {
      const permissions = getPermissionsForRoles(['user']);
      
      expect(permissions).toContain(PERMISSIONS.PROFILE_READ);
      expect(permissions).toContain(PERMISSIONS.PROFILE_WRITE);
      expect(permissions).not.toContain(PERMISSIONS.ADMIN_ACCESS);
    });

    it('should return all permissions for admin role', () => {
      const permissions = getPermissionsForRoles(['admin']);
      
      expect(permissions).toContain(PERMISSIONS.ADMIN_ACCESS);
      expect(permissions).toContain(PERMISSIONS.ADMIN_USERS);
      expect(permissions).toContain(PERMISSIONS.USERS_DELETE);
    });

    it('should combine permissions from multiple roles', () => {
      const permissions = getPermissionsForRoles(['user', 'moderator']);
      
      // Should have user permissions
      expect(permissions).toContain(PERMISSIONS.PROFILE_READ);
      // Should have moderator permissions
      expect(permissions).toContain(PERMISSIONS.CONTENT_MODERATE);
    });

    it('should remove duplicate permissions', () => {
      const permissions = getPermissionsForRoles(['user', 'admin']);
      
      // Both roles have profile:read, but it should only appear once
      const readCount = permissions.filter(p => p === PERMISSIONS.PROFILE_READ).length;
      expect(readCount).toBe(1);
    });

    it('should return empty array for empty roles', () => {
      const permissions = getPermissionsForRoles([]);
      
      expect(permissions).toEqual([]);
    });
  });

  describe('hasPermission', () => {
    const userPermissions = [PERMISSIONS.USERS_READ, PERMISSIONS.PROFILE_WRITE];

    it('should return true for included permission', () => {
      const result = hasPermission(userPermissions, PERMISSIONS.USERS_READ);
      
      expect(result).toBe(true);
    });

    it('should return false for missing permission', () => {
      const result = hasPermission(userPermissions, PERMISSIONS.ADMIN_ACCESS);
      
      expect(result).toBe(false);
    });

    it('should return false for empty permissions array', () => {
      const result = hasPermission([], PERMISSIONS.USERS_READ);
      
      expect(result).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    const userPermissions = [PERMISSIONS.USERS_READ, PERMISSIONS.PROFILE_WRITE, PERMISSIONS.CONTENT_READ];

    it('should return true when all permissions are present', () => {
      const result = hasAllPermissions(userPermissions, [PERMISSIONS.USERS_READ, PERMISSIONS.PROFILE_WRITE]);
      
      expect(result).toBe(true);
    });

    it('should return false when some permissions are missing', () => {
      const result = hasAllPermissions(userPermissions, [PERMISSIONS.USERS_READ, PERMISSIONS.ADMIN_ACCESS]);
      
      expect(result).toBe(false);
    });

    it('should return true for empty required permissions', () => {
      const result = hasAllPermissions(userPermissions, []);
      
      expect(result).toBe(true);
    });

    it('should return false for empty user permissions', () => {
      const result = hasAllPermissions([], [PERMISSIONS.USERS_READ]);
      
      expect(result).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    const userPermissions = [PERMISSIONS.USERS_READ, PERMISSIONS.PROFILE_WRITE];

    it('should return true when at least one permission is present', () => {
      const result = hasAnyPermission(userPermissions, [PERMISSIONS.USERS_READ, PERMISSIONS.ADMIN_ACCESS]);
      
      expect(result).toBe(true);
    });

    it('should return false when no permissions are present', () => {
      const result = hasAnyPermission(userPermissions, [PERMISSIONS.ADMIN_ACCESS, PERMISSIONS.ADMIN_USERS]);
      
      expect(result).toBe(false);
    });

    it('should return false for empty required permissions', () => {
      const result = hasAnyPermission(userPermissions, []);
      
      expect(result).toBe(false);
    });
  });

  describe('Role Hierarchy', () => {
    it('should define correct hierarchy levels', () => {
      expect(ROLE_HIERARCHY.user).toBeLessThan(ROLE_HIERARCHY.moderator);
      expect(ROLE_HIERARCHY.moderator).toBeLessThan(ROLE_HIERARCHY.admin);
    });
  });

  describe('hasHigherOrEqualRole', () => {
    it('should return true for same role', () => {
      expect(hasHigherOrEqualRole('user', 'user')).toBe(true);
      expect(hasHigherOrEqualRole('admin', 'admin')).toBe(true);
    });

    it('should return true for higher role', () => {
      expect(hasHigherOrEqualRole('admin', 'user')).toBe(true);
      expect(hasHigherOrEqualRole('moderator', 'user')).toBe(true);
    });

    it('should return false for lower role', () => {
      expect(hasHigherOrEqualRole('user', 'admin')).toBe(false);
      expect(hasHigherOrEqualRole('user', 'moderator')).toBe(false);
    });
  });
});
