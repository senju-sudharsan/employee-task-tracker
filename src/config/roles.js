// src/config/roles.js

export const ROLES = {
  EMPLOYEE: "employee",
  ADMIN: "admin",
  SUPERADMIN: "super_admin"
};

export const roleCapabilities = {
  [ROLES.EMPLOYEE]: {
    canManageUsers: false,
    canCreateTask: false,
    canViewOrgTasks: false
  },

  [ROLES.ADMIN]: {
    canManageUsers: true,
    canCreateTask: true,
    canViewOrgTasks: true
  },

  [ROLES.SUPERADMIN]: {
    canManageUsers: true,
    canCreateTask: true,
    canViewOrgTasks: true,
    canManageAdmins: true
  }
};
