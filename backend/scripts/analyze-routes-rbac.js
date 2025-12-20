/**
 * RBAC Route Analyzer - Identifies which routes need RBAC protection
 * Shows current state and provides recommendations
 */

const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, '../routes');

// Define RBAC requirements per route file
const ROUTE_RBAC_MAP = {
  'accountingRoutes.js': {
    admin: ['finance_admin', 'super_admin'],
    note: 'All accounting routes - sensitive financial data'
  },
  'adminFeedbackRoutes.js': {
    admin: ['super_admin'],
    note: 'Admin feedback management'
  },
  'advancedAnalyticsRoutes.js': {
    admin: ['finance_admin', 'super_admin'],
    note: 'Advanced financial analytics'
  },
  'aiRoutes.js': {
    protected: ['authenticated'],
    note: 'AI features - available to all authenticated users'
  },
  'analyticsRoutes.js': {
    protected: ['authenticated'],
    note: 'Basic analytics'
  },
  'auth.js': {
    public: true,
    note: 'Authentication endpoints - public'
  },
  'bankSettingsRoutes.js': {
    admin: ['finance_admin', 'super_admin'],
    note: 'Bank account settings'
  },
  'campaignRoutes.js': {
    protected: ['creator', 'super_admin'],
    note: 'Campaign management'
  },
  'campaigns.js': {
    public: true,
    note: 'Duplicate - campaigns.js (public listing)'
  },
  'cashPaymentRoutes.js': {
    protected: ['authenticated'],
    note: 'Cash payment handling'
  },
  'commissionRoutes.js': {
    admin: ['finance_admin', 'super_admin'],
    note: 'Commission tracking and management'
  },
  'feedbackRoutes.js': {
    protected: ['authenticated'],
    note: 'User feedback'
  },
  'messageRoutes.js': {
    protected: ['authenticated'],
    note: 'Message management'
  },
  'monetizationRoutes.js': {
    admin: ['super_admin'],
    note: 'Subscription and monetization management'
  },
  'notificationRoutes.js': {
    protected: ['authenticated'],
    note: 'Notification management'
  },
  'oauthRoutes.js': {
    public: true,
    note: 'OAuth authentication - public'
  },
  'passwordRoutes.js': {
    protected: ['authenticated'],
    note: 'Password change/reset'
  },
  'paymentRoutes.js': {
    protected: ['authenticated'],
    note: 'Payment processing'
  },
  'paymentSettingsRoutes.js': {
    protected: ['authenticated'],
    note: 'User payment settings'
  },
  'payoutRoutes.js': {
    admin: ['finance_admin', 'super_admin'],
    note: '✅ ALREADY UPDATED WITH RBAC'
  },
  'pledgeRoutes.js': {
    protected: ['authenticated'],
    note: 'Pledge management'
  },
  'publicRoutes.js': {
    public: true,
    note: 'Public endpoints'
  },
  'register.js': {
    public: true,
    note: 'User registration - public'
  },
  'reminderRoutes.js': {
    protected: ['authenticated'],
    note: 'Reminder management'
  },
  'securityRoutes.js': {
    protected: ['authenticated'],
    admin: ['super_admin'],
    note: 'Security settings - mixed protection'
  },
  'simplePaymentRoutes.js': {
    protected: ['authenticated'],
    note: 'Simple payment interface'
  },
  'twoFactorRoutes.js': {
    protected: ['authenticated'],
    note: '2FA setup and management'
  },
  'userRoutes.js': {
    protected: ['authenticated'],
    admin: ['super_admin'],
    note: 'User management - mixed'
  },
  'whatsappRoutes.js': {
    protected: ['authenticated'],
    note: 'WhatsApp integration'
  }
};

function analyzeRoutes() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 RBAC ROUTE AUDIT REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  let publicCount = 0;
  let protectedCount = 0;
  let adminCount = 0;
  let mixedCount = 0;
  let needsUpdateCount = 0;

  const routes = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

  console.log('Route Classification:\n');

  routes.forEach(file => {
    const config = ROUTE_RBAC_MAP[file] || { protected: ['authenticated'] };
    let category = '❌ NEEDS RBAC';
    
    if (config.public) {
      category = '✅ PUBLIC';
      publicCount++;
    } else if (config.admin && !config.protected) {
      category = '🔐 ADMIN ONLY';
      adminCount++;
    } else if (config.protected && !config.admin) {
      category = '🔒 PROTECTED';
      protectedCount++;
    } else if (config.admin && config.protected) {
      category = '⚠️  MIXED';
      mixedCount++;
    } else {
      needsUpdateCount++;
    }

    if (file === 'payoutRoutes.js') {
      category = '✅ RBAC DONE';
    }

    console.log(`${category.padEnd(20)} ${file.padEnd(30)} ${config.note || ''}`);
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  console.log(`Total route files: ${routes.length}`);
  console.log(`  ✅ Public: ${publicCount}`);
  console.log(`  🔒 Protected: ${protectedCount}`);
  console.log(`  🔐 Admin: ${adminCount}`);
  console.log(`  ⚠️  Mixed: ${mixedCount}`);
  console.log(`  ❌ Needs Update: ${needsUpdateCount}\n`);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('🎯 PRIORITY UPDATES');
  console.log('═══════════════════════════════════════════════════════════\n');

  const priority = [
    'accountingRoutes.js - Finance data (HIGH)',
    'advancedAnalyticsRoutes.js - Analytics (HIGH)',
    'adminFeedbackRoutes.js - Admin panel (HIGH)',
    'commissionRoutes.js - Financial (HIGH)',
    'monetizationRoutes.js - Monetization (HIGH)',
    'bankSettingsRoutes.js - Banking (MEDIUM)',
    'campaignRoutes.js - User campaigns (MEDIUM)',
    'securityRoutes.js - Security (MEDIUM)',
    'userRoutes.js - User management (MEDIUM)',
    'Others - Standard protection (LOW)'
  ];

  priority.forEach((p, i) => console.log(`${(i + 1).toString().padStart(2)}. ${p}`));

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('💡 RECOMMENDED PATTERN');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('For ADMIN routes (finance, accounting):');
  console.log('  router.get(\'/admin/endpoint\',');
  console.log('    authenticateToken,');
  console.log('    requireRole([\'finance_admin\', \'super_admin\']),');
  console.log('    handler');
  console.log('  );\n');

  console.log('For PROTECTED routes (user-owned data):');
  console.log('  router.get(\'/my-data\',');
  console.log('    authenticateToken,');
  console.log('    handler');
  console.log('  );\n');

  console.log('For PUBLIC routes (no auth needed):');
  console.log('  router.get(\'/public-data\',');
  console.log('    handler');
  console.log('  );\n');
}

analyzeRoutes();
