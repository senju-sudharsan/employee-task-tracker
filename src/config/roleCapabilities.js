export const roleCapabilities = {
  employee: {
    canViewOwnTasks: true,
    canAcknowledge: true,
    canComplete: true,
    canMarkDelayed: true,
    canCreateTask: false,
    canViewOrgTasks: false
  },

  admin: {
    canViewOwnTasks: false,
    canAcknowledge: false,
    canComplete: false,
    canMarkDelayed: false,
    canCreateTask: true,
    canViewOrgTasks: true
  },

  superAdmin: {
    canViewOwnTasks: false,
    canAcknowledge: false,
    canComplete: false,
    canMarkDelayed: false,
    canCreateTask: true,
    canViewOrgTasks: true,
    canManageAdmins: true
  }
};
