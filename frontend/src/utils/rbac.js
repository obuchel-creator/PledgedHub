/**
 * Role-Based Access Control (RBAC) Utilities for Frontend
 * 
 * Provides helper functions to check user role and permissions
 * Works with AuthContext to manage role-based UI rendering
 */

// Role hierarchy and permissions
export const ROLE_HIERARCHY = {
  donor: 1,
  creator: 2,
  support_staff: 3,
  finance_admin: 4,
  super_admin: 5,
};

export const PERMISSIONS = {
  donor: [
    'view_own_pledges',
    'create_pledge',
    'view_own_payments',
    'view_own_profile'
  ],
  creator: [
    'view_own_pledges',
    'create_pledge',
    'create_campaign',
    'view_own_campaigns',
    'view_own_earnings',
    'request_payout',
    'view_own_payments'
  ],
  support_staff: [
    'view_disputes',
    'verify_pledges',
    'issue_small_refunds',
    'view_user_profiles',
    'create_support_ticket'
  ],
  finance_admin: [
    'approve_payouts',
    'view_all_transactions',
    'audit_commissions',
    'generate_financial_reports',
    'view_ledger',
    'export_financial_data'
  ],
  super_admin: [
    'manage_users',
    'manage_roles',
    'system_configuration',
    'view_system_logs',
    'all_permissions'
  ]
};

/**
 * Check if user has a specific role
 * @param {string} userRole - Current user's role
 * @param {string|string[]} requiredRole - Required role(s)
 * @returns {boolean}
 */
export function hasRole(userRole, requiredRole) {
  if (!userRole) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole);
  }
  
  return userRole === requiredRole;
}

/**
 * Check if user has specific permission
 * @param {string} userRole - Current user's role
 * @param {string} permission - Required permission
 * @returns {boolean}
 */
export function hasPermission(userRole, permission) {
  if (!userRole) return false;
  if (userRole === 'super_admin') return true; // Super admin has all permissions
  
  const rolePermissions = PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
}

/**
 * Check if user role is at least the required level
 * Useful for hierarchical checks (e.g., finance_admin or higher)
 * @param {string} userRole - Current user's role
 * @param {string} minimumRole - Minimum required role level
 * @returns {boolean}
 */
export function hasRoleLevel(userRole, minimumRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minimumLevel = ROLE_HIERARCHY[minimumRole] || 0;
  return userLevel >= minimumLevel;
}

/**
 * Get list of accessible routes for a role
 * @param {string} userRole - User's role
 * @returns {string[]} Array of accessible route paths
 */
export function getAccessibleRoutes(userRole) {
  const routes = {
    donor: [
      '/dashboard',
      '/pledges',
      '/profile',
      '/settings',
      '/help'
    ],
    creator: [
      '/dashboard',
      '/pledges',
      '/campaigns',
      '/creator-earnings',
      '/profile',
      '/settings',
      '/help'
    ],
    support_staff: [
      '/dashboard',
      '/support',
      '/disputes',
      '/verify-pledges',
      '/profile',
      '/help'
    ],
    finance_admin: [
      '/dashboard',
      '/payout-approvals',
      '/financial-reports',
      '/transactions',
      '/ledger',
      '/profile',
      '/settings'
    ],
    super_admin: [
      '/*' // Access to all routes
    ]
  };

  return routes[userRole] || routes.donor;
}

/**
 * Get list of accessible menu items for a role
 * Used for NavBar/Sidebar rendering
 * @param {string} userRole - User's role
 * @returns {Object[]} Array of menu item objects
 */
export function getMenuItems(userRole) {
  const items = {
    donor: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'My Pledges', path: '/pledges', icon: '❤️' },
      { label: 'Profile', path: '/profile', icon: '👤' },
      { label: 'Settings', path: '/settings', icon: '⚙️' },
    ],
    creator: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Campaigns', path: '/campaigns', icon: '🎯' },
      { label: 'Pledges', path: '/pledges', icon: '❤️' },
      { label: 'Earnings', path: '/creator-earnings', icon: '💰' },
      { label: 'Profile', path: '/profile', icon: '👤' },
      { label: 'Settings', path: '/settings', icon: '⚙️' },
    ],
    support_staff: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Support Tickets', path: '/support', icon: '🎫' },
      { label: 'Disputes', path: '/disputes', icon: '⚖️' },
      { label: 'Verify Pledges', path: '/verify-pledges', icon: '✓' },
      { label: 'Profile', path: '/profile', icon: '👤' },
    ],
    finance_admin: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Payout Approvals', path: '/payout-approvals', icon: '✅' },
      { label: 'Financial Reports', path: '/financial-reports', icon: '📈' },
      { label: 'Transactions', path: '/transactions', icon: '💳' },
      { label: 'Ledger', path: '/ledger', icon: '📋' },
      { label: 'Profile', path: '/profile', icon: '👤' },
    ],
    super_admin: [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Admin Panel', path: '/admin', icon: '🛠️' },
      { label: 'User Management', path: '/admin/users', icon: '👥' },
      { label: 'Role Management', path: '/admin/roles', icon: '🔐' },
      { label: 'System Config', path: '/admin/config', icon: '⚙️' },
      { label: 'Audit Logs', path: '/admin/audit', icon: '📋' },
      { label: 'Profile', path: '/profile', icon: '👤' },
    ]
  };

  return items[userRole] || items.donor;
}

/**
 * Get role display name for UI
 * @param {string} role - Role code
 * @returns {string} Human-readable role name
 */
export function getRoleDisplayName(role) {
  const names = {
    donor: 'Supporter',
    creator: 'Campaign Creator',
    support_staff: 'Support Staff',
    finance_admin: 'Finance Admin',
    super_admin: 'System Administrator'
  };
  return names[role] || 'User';
}

/**
 * Get role description for tooltips/help
 * @param {string} role - Role code
 * @returns {string} Role description
 */
export function getRoleDescription(role) {
  const descriptions = {
    donor: 'Create pledges and support campaigns',
    creator: 'Create and manage campaigns, track earnings',
    support_staff: 'Help users with disputes and ticket resolution',
    finance_admin: 'Manage payouts, view financial data, audit reports',
    super_admin: 'Full system access and configuration'
  };
  return descriptions[role] || 'Standard user';
}

export default {
  hasRole,
  hasPermission,
  hasRoleLevel,
  getAccessibleRoutes,
  getMenuItems,
  getRoleDisplayName,
  getRoleDescription,
  PERMISSIONS,
  ROLE_HIERARCHY
};
