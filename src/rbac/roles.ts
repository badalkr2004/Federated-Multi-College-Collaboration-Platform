// Default roles
export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

// Role hierarchy (higher index = more privileges)
export const ROLE_HIERARCHY: Record<RoleName, number> = {
  [ROLES.USER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3,
};

// Check if role A has higher or equal privileges than role B
export function hasHigherOrEqualRole(roleA: RoleName, roleB: RoleName): boolean {
  return ROLE_HIERARCHY[roleA] >= ROLE_HIERARCHY[roleB];
}

// Get highest role from an array of roles
export function getHighestRole(roles: RoleName[]): RoleName | null {
  if (roles.length === 0) return null;
  
  return roles.reduce((highest, current) => 
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest
  );
}

// Default role descriptions
export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  [ROLES.USER]: 'Basic user with standard access',
  [ROLES.MODERATOR]: 'Can moderate content and manage users',
  [ROLES.ADMIN]: 'Full administrative access',
};
