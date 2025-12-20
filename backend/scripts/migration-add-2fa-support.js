/**
 * 2FA Support Migration
 * Adds two-factor authentication columns to users table
 * 
 * Run with: node backend/scripts/migration-add-2fa-support.js
 */

const { pool } = require('../config/db');

async function migrate2FASupport() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔐 ADDING 2FA SUPPORT TO DATABASE');
  console.log('═══════════════════════════════════════════════════════════\n');

  const connection = await pool.getConnection();

  try {
    // Step 1: Add 2FA columns to users table
    console.log('📝 Step 1: Adding 2FA columns to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN two_fa_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN twoFactorSecret VARCHAR(32) NULL,
        ADD COLUMN twoFactorMethod VARCHAR(20) DEFAULT 'totp',
        ADD COLUMN last_2fa_verify TIMESTAMP NULL,
        ADD INDEX idx_two_fa_enabled (two_fa_enabled)
      `);
      console.log('✅ 2FA columns added successfully\n');
    } catch (error) {
      if (error.message.includes('Duplicate column')) {
        console.log('✅ 2FA columns already exist\n');
      } else {
        throw error;
      }
    }

    // Step 2: Create 2FA recovery codes table
    console.log('📝 Step 2: Creating 2FA recovery codes table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS two_fa_recovery_codes (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          code VARCHAR(20) NOT NULL UNIQUE,
          used BOOLEAN DEFAULT FALSE,
          used_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Backup codes for 2FA'
      `);
      console.log('✅ 2FA recovery codes table created\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ 2FA recovery codes table already exists\n');
      } else {
        throw error;
      }
    }

    // Step 3: Create 2FA audit log table
    console.log('📝 Step 3: Creating 2FA audit log table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS two_fa_audit_log (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          action VARCHAR(50) NOT NULL,
          ip_address VARCHAR(45),
          user_agent VARCHAR(255),
          success BOOLEAN DEFAULT TRUE,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_action (action),
          INDEX idx_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Audit trail for 2FA activities'
      `);
      console.log('✅ 2FA audit log table created\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ 2FA audit log table already exists\n');
      } else {
        throw error;
      }
    }

    // Step 4: Create 2FA enforcement policy table
    console.log('📝 Step 4: Creating 2FA enforcement policy table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS two_fa_policy (
          id INT PRIMARY KEY AUTO_INCREMENT,
          role VARCHAR(50) NOT NULL UNIQUE,
          is_required BOOLEAN DEFAULT FALSE,
          grace_period_days INT DEFAULT 0,
          enforcement_date TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        COMMENT='2FA enforcement policies per role'
      `);
      console.log('✅ 2FA enforcement policy table created\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ 2FA enforcement policy table already exists\n');
      } else {
        throw error;
      }
    }

    // Step 5: Seed 2FA policies for high-privilege roles
    console.log('📝 Step 5: Setting 2FA policies...');
    try {
      // Delete existing policies first
      await connection.execute('DELETE FROM two_fa_policy');

      // Insert policies
      const policies = [
        ['donor', false, 0],
        ['creator', false, 0],
        ['support_staff', false, 0],
        ['finance_admin', true, 7],  // Required, 7 day grace period
        ['super_admin', true, 7]      // Required, 7 day grace period
      ];

      for (const [role, required, gracePeriod] of policies) {
        await connection.execute(
          `INSERT INTO two_fa_policy (role, is_required, grace_period_days) VALUES (?, ?, ?)`,
          [role, required, gracePeriod]
        );
      }

      console.log('✅ 2FA policies configured:\n');
      console.log('   • finance_admin: 2FA REQUIRED (7 day grace period)');
      console.log('   • super_admin: 2FA REQUIRED (7 day grace period)');
      console.log('   • Others: 2FA optional\n');
    } catch (error) {
      if (error.message.includes('Duplicate')) {
        console.log('✅ 2FA policies already configured\n');
      } else {
        throw error;
      }
    }

    // Summary
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ 2FA MIGRATION COMPLETED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('📋 Changes applied:');
    console.log('  ✓ Added 2FA columns to users table');
    console.log('  ✓ Created two_fa_recovery_codes table');
    console.log('  ✓ Created two_fa_audit_log table');
    console.log('  ✓ Created two_fa_policy table');
    console.log('  ✓ Configured policies for high-privilege roles\n');

    console.log('📊 New Tables:');
    console.log('  • two_fa_recovery_codes - Backup codes for account recovery');
    console.log('  • two_fa_audit_log - Audit trail for 2FA activities');
    console.log('  • two_fa_policy - Enforcement policies per role\n');

    console.log('🔐 2FA Requirements:');
    console.log('  • finance_admin: MANDATORY (7 day grace period)');
    console.log('  • super_admin: MANDATORY (7 day grace period)');
    console.log('  • Others: Optional\n');

    console.log('⚠️  Next steps:');
    console.log('  1. Implement 2FA setup UI endpoints');
    console.log('  2. Add 2FA verification to login flow');
    console.log('  3. Generate QR codes for authenticator apps');
    console.log('  4. Notify high-privilege users of requirement');
    console.log('  5. Monitor 2FA adoption via audit logs\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    pool.end();
  }
}

// Run migration
migrate2FASupport().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
