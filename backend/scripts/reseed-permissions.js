/**
 * Reseed RBAC permissions with updated version
 */

const { pool } = require('../config/db');

async function reseedPermissions() {
  console.log('🔄 Clearing and reseeding RBAC permissions...\n');

  try {
    // Clear old permissions
    console.log('📝 Clearing old permissions...');
    const [deleteResult] = await pool.execute('DELETE FROM role_permissions');
    console.log(`✅ Deleted ${deleteResult.affectedRows} old permission mappings\n`);

    // Define all permissions (for super_admin)
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

    // Seed new permissions
    console.log('📝 Seeding updated permissions...');
    let seededCount = 0;
    
    for (const [role, perms] of Object.entries(permissions)) {
      for (const permission of perms) {
        const [result] = await pool.execute(
          `INSERT INTO role_permissions (role, permission) VALUES (?, ?)`,
          [role, permission]
        );
        seededCount++;
      }
    }

    console.log(`✅ Seeded ${seededCount} role-permission mappings\n`);

    // Display summary
    const [summary] = await pool.execute(`
      SELECT role, COUNT(*) as perm_count FROM role_permissions GROUP BY role ORDER BY role
    `);

    console.log('📊 Permission Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    summary.forEach(s => {
      console.log(`  ${s.role.padEnd(20)}: ${s.perm_count} permissions`);
    });
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('✨ RBAC permissions successfully reseeded!\n');

  } catch (error) {
    console.error('❌ Error reseeding permissions:', error.message);
    throw error;
  } finally {
    pool.end();
  }
}

reseedPermissions();
