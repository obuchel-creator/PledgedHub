/**
 * Database Migration: Expanded Role-Based Access Control
 * 
 * Adds granular role hierarchy:
 * - donor: Standard user who creates pledges
 * - creator: Campaign owner who receives pledges
 * - support_staff: Customer support team
 * - finance_admin: Handles payouts and financial operations
 * - super_admin: Platform owner with all permissions
 */

const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();

  try {
    console.log('🔄 Starting expanded role migration...\n');

    // 1. Add role column to users if not exists
    console.log('📝 Step 1: Adding role column to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(50) DEFAULT 'donor' 
        COMMENT 'User role: donor, creator, support_staff, finance_admin, super_admin'
      `);
      console.log('✅ Role column added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('✅ Role column already exists\n');
      } else {
        throw err;
      }
    }

    // 2. Add permissions JSON column for fine-grained control
    console.log('📝 Step 2: Adding permissions column to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN permissions JSON DEFAULT NULL 
        COMMENT 'Granular permission overrides as JSON object'
      `);
      console.log('✅ Permissions column added\n');
    } catch (err) {
      if (err.message.includes('Duplicate column')) {
        console.log('✅ Permissions column already exists\n');
      } else {
        throw err;
      }
    }

    // 3. Create role_audit_log table
    console.log('📝 Step 3: Creating role_audit_log table for compliance...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_audit_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        action VARCHAR(100) NOT NULL COMMENT 'role_change, permission_grant, etc',
        role_changed_from VARCHAR(50),
        role_changed_to VARCHAR(50),
        changed_by INT COMMENT 'User ID of who made the change',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason VARCHAR(255),
        ip_address VARCHAR(45),
        user_agent VARCHAR(255),
        INDEX idx_user_id (user_id),
        INDEX idx_timestamp (timestamp),
        INDEX idx_changed_by (changed_by),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Audit trail for role and permission changes'
    `);
    console.log('✅ Role audit log table created (or already exists)\n');

    // 4. Create role_permissions table for flexible permission management
    console.log('📝 Step 4: Creating role_permissions mapping table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role VARCHAR(50) NOT NULL,
        permission VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_role_permission (role, permission),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      COMMENT='Maps roles to permissions for flexible RBAC'
    `);
    console.log('✅ Role permissions table created (or already exists)\n');

    // 5. Seed default role permissions
    console.log('📝 Step 5: Seeding default role permissions...');
    
    // Get all permission names to assign to super_admin
    const allPermissions = [
      'view_own_pledges',
      'create_pledge',
      'view_own_payments',
      'view_own_profile',
      'create_campaign',
      'view_own_campaigns',
      'view_own_earnings',
      'request_payout',
      'view_disputes',
      'verify_pledges',
      'issue_small_refunds',
      'view_user_profiles',
      'create_support_ticket',
      'approve_payouts',
      'view_all_transactions',
      'audit_commissions',
      'generate_financial_reports',
      'view_ledger',
      'export_financial_data',
      'manage_users',
      'manage_roles',
      'system_configuration',
      'view_system_logs',
      'view_analytics',
      'all_permissions'
    ];
    
    const permissions = {
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
      super_admin: allPermissions // Super admin gets ALL permissions
    };

    let seededCount = 0;
    for (const [role, perms] of Object.entries(permissions)) {
      for (const permission of perms) {
        try {
          await connection.execute(
            `INSERT IGNORE INTO role_permissions (role, permission) VALUES (?, ?)`,
            [role, permission]
          );
          seededCount++;
        } catch (err) {
          if (!err.message.includes('Duplicate')) throw err;
        }
      }
    }
    console.log(`✅ Seeded ${seededCount} role-permission mappings\n`);

    // 6. Add indexes for performance
    console.log('📝 Step 6: Adding indexes for performance...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD INDEX idx_role (role)
      `);
      console.log('✅ Indexes created\n');
    } catch (err) {
      if (err.message.includes('Duplicate key name') || err.message.includes('key already exists')) {
        console.log('✅ Indexes already exist\n');
      } else {
        throw err;
      }
    }

    // 7. Display summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 Changes applied:');
    console.log('  ✓ users.role column added (default: donor)');
    console.log('  ✓ users.permissions column added (JSON for overrides)');
    console.log('  ✓ role_audit_log table created (compliance tracking)');
    console.log('  ✓ role_permissions table created (flexible RBAC)');
    console.log('  ✓ Default permissions seeded for all 5 roles');
    console.log('  ✓ Performance indexes added\n');

    console.log('🎯 Role Hierarchy:');
    console.log('  1. donor - Regular users who create pledges');
    console.log('  2. creator - Campaign owners who collect pledges');
    console.log('  3. support_staff - Customer support team');
    console.log('  4. finance_admin - Financial operations & payouts');
    console.log('  5. super_admin - Platform owner (all permissions)\n');

    console.log('⚠️  Next steps:');
    console.log('  1. Restart backend server to apply new middleware');
    console.log('  2. Test role-based access on protected routes');
    console.log('  3. Verify audit logging on role changes');
    console.log('  4. Configure 2FA for finance_admin and super_admin users\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✨ Migration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed!\n', error);
    process.exit(1);
  });
