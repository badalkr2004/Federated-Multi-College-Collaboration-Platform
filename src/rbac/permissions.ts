import { ROLES, RoleName } from './roles';

// Permission format: 'resource:action'
export const PERMISSIONS = {
  // User permissions
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',
  
  // Profile permissions (self)
  PROFILE_READ: 'profile:read',
  PROFILE_WRITE: 'profile:write',
  
  // Admin permissions
  ADMIN_ACCESS: 'admin:access',
  ADMIN_USERS: 'admin:users',
  ADMIN_ROLES: 'admin:roles',
  ADMIN_SETTINGS: 'admin:settings',
  
  // Content permissions 
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_MODERATE: 'content:moderate',
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<RoleName, PermissionName[]> = {
  [ROLES.USER]: [
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
  ],
  [ROLES.MODERATOR]: [
    // Inherit user permissions
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    // Moderator-specific
    PERMISSIONS.USERS_READ,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_MODERATE,
  ],
  [ROLES.ADMIN]: [
    // All permissions
    PERMISSIONS.PROFILE_READ,
    PERMISSIONS.PROFILE_WRITE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.ADMIN_ACCESS,
    PERMISSIONS.ADMIN_USERS,
    PERMISSIONS.ADMIN_ROLES,
    PERMISSIONS.ADMIN_SETTINGS,
    PERMISSIONS.CONTENT_CREATE,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.CONTENT_UPDATE,
    PERMISSIONS.CONTENT_DELETE,
    PERMISSIONS.CONTENT_MODERATE,
  ],
};

// Get permissions for a set of roles
export function getPermissionsForRoles(roles: RoleName[]): PermissionName[] {
  const permissionSet = new Set<PermissionName>();
  
  for (const role of roles) {
    const rolePerms = ROLE_PERMISSIONS[role] || [];
    for (const perm of rolePerms) {
      permissionSet.add(perm);
    }
  }
  
  return Array.from(permissionSet);
}

// Check if a set of permissions includes a required permission
export function hasPermission(
  userPermissions: string[],
  requiredPermission: PermissionName
): boolean {
  return userPermissions.includes(requiredPermission);
}

// Check if a set of permissions includes all required permissions
export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: PermissionName[]
): boolean {
  return requiredPermissions.every(perm => userPermissions.includes(perm));
}

// Check if a set of permissions includes any of the required permissions
export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: PermissionName[]
): boolean {
  return requiredPermissions.some(perm => userPermissions.includes(perm));
}
