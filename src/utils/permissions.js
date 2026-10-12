export const ROLES = {
  OWNER: 'owner',
  MANAGER: 'manager',
  SUPERVISOR: 'supervisor'
};

// Hierarchy levels (higher rank = more access)
const ROLE_HIERARCHY = {
  [ROLES.OWNER]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.SUPERVISOR]: 1
};

export const permissions = {
  /**
   * Check if current user meets or exceeds required role level
   */
  hasPermission(userRole, requiredRole) {
    if (!userRole) return false;
    const currentRank = ROLE_HIERARCHY[userRole.toLowerCase()] || 0;
    const requiredRank = ROLE_HIERARCHY[requiredRole.toLowerCase()] || 99;
    return currentRank >= requiredRank;
  },

  canAddFarm(userRole) {
    return this.hasPermission(userRole, ROLES.OWNER);
  },

  canAddBlock(userRole) {
    return this.hasPermission(userRole, ROLES.MANAGER);
  },

  canAddIPMLog(userRole) {
    return this.hasPermission(userRole, ROLES.SUPERVISOR);
  }
};