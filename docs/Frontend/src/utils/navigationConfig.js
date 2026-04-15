/**
 * Frontend RBAC Navigation Helper
 * Configure menu items based on user role
 * Import this in your navigation/sidebar component
 */

const MENU_CONFIG = {
  donor: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'My Pledges', path: '/pledges', icon: 'card' },
    { label: 'Create Pledge', path: '/pledges/new', icon: 'plus' },
    { label: 'Payments', path: '/payments', icon: 'payment' },
    { label: 'Profile', path: '/profile', icon: 'user' }
  ],
  
  creator: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'My Pledges', path: '/pledges', icon: 'card' },
    { label: 'Create Pledge', path: '/pledges/new', icon: 'plus' },
    { label: 'My Campaigns', path: '/campaigns', icon: 'flag' },
    { label: 'Create Campaign', path: '/campaigns/new', icon: 'plus' },
    { label: 'Earnings', path: '/earnings', icon: 'trending-up' },
    { label: 'Payouts', path: '/payouts', icon: 'send' },
    { label: 'Profile', path: '/profile', icon: 'user' }
  ],
  
  support_staff: [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Disputes', path: '/admin/disputes', icon: 'alert-circle' },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Pledges', path: '/admin/pledges', icon: 'card' },
    { label: 'Verification', path: '/admin/verify', icon: 'check' },
    { label: 'Support Tickets', path: '/admin/tickets', icon: 'mail' },
    { label: 'Profile', path: '/profile', icon: 'user' }
  ],
  
  finance_admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Payouts', path: '/admin/payouts', icon: 'send' },
    { label: 'Transactions', path: '/admin/transactions', icon: 'activity' },
    { label: 'Financial Reports', path: '/admin/reports', icon: 'bar-chart-2' },
    { label: 'Commissions', path: '/admin/commissions', icon: 'percent' },
    { label: 'Bank Settings', path: '/admin/bank-settings', icon: 'bank' },
    { label: 'Accounting', path: '/admin/accounting', icon: 'book' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'pie-chart' },
    { label: 'Profile', path: '/profile', icon: 'user' }
  ],
  
  super_admin: [
    { label: 'Dashboard', path: '/admin/dashboard', icon: 'dashboard' },
    { label: 'Users', path: '/admin/users', icon: 'users' },
    { label: 'Roles & Permissions', path: '/admin/roles', icon: 'lock' },
    { label: 'Payouts', path: '/admin/payouts', icon: 'send' },
    { label: 'Transactions', path: '/admin/transactions', icon: 'activity' },
    { label: 'Financial Reports', path: '/admin/reports', icon: 'bar-chart-2' },
    { label: 'Commissions', path: '/admin/commissions', icon: 'percent' },
    { label: 'Bank Settings', path: '/admin/bank-settings', icon: 'bank' },
    { label: 'Accounting', path: '/admin/accounting', icon: 'book' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'pie-chart' },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: 'log' },
    { label: 'Settings', path: '/admin/settings', icon: 'settings' },
    { label: 'Campaigns', path: '/admin/campaigns', icon: 'flag' },
    { label: 'System Config', path: '/admin/system', icon: 'sliders' },
    { label: 'Profile', path: '/profile', icon: 'user' }
  ]
};

/**
 * Get menu items for a specific role
 * @param {string} userRole - User's role (donor, creator, support_staff, finance_admin, super_admin)
 * @returns {Array} Menu items for the role
 */
export function getNavigationMenu(userRole) {
  return MENU_CONFIG[userRole] || MENU_CONFIG.donor;
}

/**
 * Check if user can access a specific menu item
 * @param {string} userRole - User's role
 * @param {string} path - Route path to check
 * @returns {boolean} True if accessible
 */
export function canAccessMenu(userRole, path) {
  const menu = getNavigationMenu(userRole);
  return menu.some(item => item.path === path);
}

/**
 * Get menu items grouped by category
 */
export function getGroupedMenu(userRole) {
  const menu = getNavigationMenu(userRole);
  const grouped = {
    main: [],
    admin: [],
    account: []
  };

  menu.forEach(item => {
    if (item.path.startsWith('/admin')) {
      grouped.admin.push(item);
    } else if (item.path === '/profile') {
      grouped.account.push(item);
    } else {
      grouped.main.push(item);
    }
  });

  return grouped;
}

export default MENU_CONFIG;
