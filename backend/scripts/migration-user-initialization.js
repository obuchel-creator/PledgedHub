/**
 * Migration: User Initialization & Safety Tables
 * Purpose: Ensure all required tables exist and are properly structured
 * for user creation, authentication, and access control
 * 
 * Created: Feb 4, 2026
 */

const { pool } = require('../config/db');

async function runMigrations() {
  let migrationsRun = 0;

  try {
    console.log('🔧 Starting User Initialization Migration...\n');

    // ============================================
    // 1. USERS TABLE - Add missing columns
    // ============================================
    console.log('1️⃣ Updating users table structure...');
    try {
      await pool.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE');
      console.log('✅ Added deleted column');
      migrationsRun++;
    } catch (e) {
      if (!e.message.includes('Duplicate')) console.error('❌ deleted column:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE');
      console.log('✅ Added email_verified column');
      migrationsRun++;
    } catch (e) {
      if (!e.message.includes('Duplicate')) console.error('❌ email_verified column:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT "user"');
      console.log('✅ Added role column');
      migrationsRun++;
    } catch (e) {
      if (!e.message.includes('Duplicate')) console.error('❌ role column:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL');
      console.log('✅ Added last_login column');
      migrationsRun++;
    } catch (e) {
      if (!e.message.includes('Duplicate')) console.error('❌ last_login column:', e.message);
    }

    try {
      await pool.execute('ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
      console.log('✅ Added created_at column');
      migrationsRun++;
    } catch (e) {
      if (!e.message.includes('Duplicate')) console.error('❌ created_at column:', e.message);
    }

    // ============================================
    // 2. USER_USAGE_STATS - Monetization tracking
    // ============================================
    console.log('\n2️⃣ Creating user_usage_stats table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_usage_stats (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL UNIQUE,
          tier VARCHAR(50) DEFAULT 'free',
          pledges_count INT DEFAULT 0,
          campaigns_count INT DEFAULT 0,
          sms_sent INT DEFAULT 0,
          emails_sent INT DEFAULT 0,
          ai_requests INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_tier (user_id, tier)
        )
      `);
      console.log('✅ user_usage_stats table created/verified');
      migrationsRun++;
    } catch (e) {
      console.error('❌ user_usage_stats:', e.message);
    }

    // ============================================
    // 3. AUDIT_LOG - User action tracking
    // ============================================
    console.log('\n3️⃣ Creating audit_log table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id INT PRIMARY KEY AUTO_INCREMENT,
          action VARCHAR(100) NOT NULL,
          user_id INT,
          resource_type VARCHAR(50),
          resource_id INT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          details JSON,
          ip_address VARCHAR(45),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
          INDEX idx_user_action (user_id, action),
          INDEX idx_timestamp (timestamp)
        )
      `);
      console.log('✅ audit_log table created/verified');
      migrationsRun++;
    } catch (e) {
      console.error('❌ audit_log:', e.message);
    }

    // ============================================
    // 4. LOGIN_HISTORY - Track login attempts
    // ============================================
    console.log('\n4️⃣ Creating login_history table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS login_history (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          success BOOLEAN DEFAULT TRUE,
          failure_reason VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent VARCHAR(255),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_login (user_id, login_time),
          INDEX idx_success (success, login_time)
        )
      `);
      console.log('✅ login_history table created/verified');
      migrationsRun++;
    } catch (e) {
      console.error('❌ login_history:', e.message);
    }

    // ============================================
    // 5. USER_PERMISSIONS - Role-based access
    // ============================================
    console.log('\n5️⃣ Creating user_permissions table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          permission_key VARCHAR(100) NOT NULL,
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          granted_by INT,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE KEY unique_user_permission (user_id, permission_key),
          INDEX idx_permission (permission_key)
        )
      `);
      console.log('✅ user_permissions table created/verified');
      migrationsRun++;
    } catch (e) {
      console.error('❌ user_permissions:', e.message);
    }

    // ============================================
    // 6. SESSION_TOKENS - JWT token tracking
    // ============================================
    console.log('\n6️⃣ Creating session_tokens table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS session_tokens (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          token_hash VARCHAR(255) NOT NULL UNIQUE,
          issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          revoked BOOLEAN DEFAULT FALSE,
          revoked_at TIMESTAMP NULL,
          ip_address VARCHAR(45),
          user_agent VARCHAR(255),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_active (user_id, revoked),
          INDEX idx_expires (expires_at)
        )
      `);
      console.log('✅ session_tokens table created/verified');
      migrationsRun++;
    } catch (e) {
      console.error('❌ session_tokens:', e.message);
    }

    // ============================================
    // 7. USER_VALIDATION - Pre-login checks
    // ============================================
    console.log('\n7️⃣ Creating user_validation table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_validation_status (
          user_id INT PRIMARY KEY,
          email_verified BOOLEAN DEFAULT FALSE,
          phone_verified BOOLEAN DEFAULT FALSE,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          account_locked BOOLEAN DEFAULT FALSE,
          locked_until TIMESTAMP NULL,
          failed_login_attempts INT DEFAULT 0,
          last_failed_attempt TIMESTAMP NULL,
          verified_at TIMESTAMP NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_locked (account_locked, locked_until)
        )
      `);
      console.log('✅ user_validation_status table created/verified');
      migrationsRun++;
    } catch (e) {
      console.error('❌ user_validation_status:', e.message);
    }

    // ============================================
    // 8. Add indexes for performance
    // ============================================
    console.log('\n8️⃣ Adding performance indexes...');
    try {
      const indexes = [
        { table: 'users', columns: '(email)', name: 'idx_users_email' },
        { table: 'users', columns: '(username)', name: 'idx_users_username' },
        { table: 'users', columns: '(phone)', name: 'idx_users_phone' },
        { table: 'users', columns: '(role)', name: 'idx_users_role' },
        { table: 'users', columns: '(deleted, created_at)', name: 'idx_users_active' }
      ];

      for (const idx of indexes) {
        try {
          await pool.execute(`CREATE INDEX IF NOT EXISTS ${idx.name} ON ${idx.table} ${idx.columns}`);
          console.log(`✅ Index ${idx.name} created`);
        } catch (e) {
          if (!e.message.includes('Duplicate key')) console.error(`❌ Index ${idx.name}:`, e.message);
        }
      }
    } catch (e) {
      console.error('❌ Indexes:', e.message);
    }

    // ============================================
    // Summary
    // ============================================
    console.log(`\n✨ Migration Complete!`);
    console.log(`📊 Migrations run: ${migrationsRun}`);
    console.log('\n📋 Verification: Run this to confirm all tables exist:');
    console.log('SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE();');

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };
