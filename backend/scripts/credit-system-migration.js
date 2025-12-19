/**
 * Credit System Migration
 * Creates tables for UGX-based, pay-as-you-go credit system
 * 
 * Run: node backend/scripts/credit-system-migration.js
 */

const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();

  try {
    console.log('💳 [CREDIT MIGRATION] Starting...\n');

    // ============================================
    // 1. User Credits Table
    // ============================================
    console.log('📝 [MIGRATION] Creating user_credits table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_credits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT 'User who owns the credits',
        amount DECIMAL(15, 2) NOT NULL COMMENT 'Credit amount in UGX',
        source ENUM('payment', 'refund', 'promotional', 'admin') DEFAULT 'payment' COMMENT 'How credits were obtained',
        transaction_id INT COMMENT 'Reference to credit_transactions table',
        status ENUM('pending', 'active', 'expired', 'used') DEFAULT 'pending' COMMENT 'Credit status',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL COMMENT 'When credits expire (365 days)',
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_status (status),
        INDEX idx_expires (expires_at)
      ) COMMENT='User credit balance ledger for pay-as-you-go SMS/email'
    `);
    console.log('✅ [MIGRATION] user_credits table created\n');

    // ============================================
    // 2. Credit Transactions Table
    // ============================================
    console.log('📝 [MIGRATION] Creating credit_transactions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS credit_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL COMMENT 'User involved',
        type ENUM('load', 'deduction', 'refund', 'expiry') NOT NULL COMMENT 'Transaction type',
        amount DECIMAL(15, 2) NOT NULL COMMENT 'Amount in UGX',
        method VARCHAR(50) COMMENT 'Payment method: mtn_mobile_money, airtel_money, admin',
        reference VARCHAR(100) COMMENT 'External reference: SMS ID, payment ref, etc.',
        metadata JSON COMMENT 'Additional data: pledgeId, campaignId, etc.',
        mobile_number VARCHAR(20) COMMENT 'Mobile number for payment transactions',
        status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_type (type),
        INDEX idx_status (status),
        INDEX idx_reference (reference)
      ) COMMENT='Audit trail for all credit movements'
    `);
    console.log('✅ [MIGRATION] credit_transactions table created\n');

    // ============================================
    // 3. User Tier History (Track tier upgrades)
    // ============================================
    console.log('📝 [MIGRATION] Creating user_tier_history table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_tier_history (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        old_tier VARCHAR(50) COMMENT 'Previous tier (free, sms_paygo, campaign, premium, enterprise)',
        new_tier VARCHAR(50) COMMENT 'New tier',
        billing_cycle_start DATE,
        billing_cycle_end DATE,
        monthly_price DECIMAL(15, 2) COMMENT 'Price paid in UGX',
        status ENUM('active', 'canceled', 'expired') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        canceled_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (user_id),
        INDEX idx_tier (new_tier)
      ) COMMENT='Track user tier subscriptions and changes'
    `);
    console.log('✅ [MIGRATION] user_tier_history table created\n');

    // ============================================
    // 4. User Usage Tracking (Monthly counters)
    // ============================================
    console.log('📝 [MIGRATION] Creating user_usage_stats table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_usage_stats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        period_month DATE COMMENT 'First day of month for tracking',
        pledges_created INT DEFAULT 0,
        campaigns_created INT DEFAULT 0,
        sms_sent INT DEFAULT 0,
        emails_sent INT DEFAULT 0,
        ai_requests INT DEFAULT 0,
        total_credits_deducted DECIMAL(15, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_period (user_id, period_month),
        INDEX idx_user (user_id)
      ) COMMENT='Track monthly usage for limits and analytics'
    `);
    console.log('✅ [MIGRATION] user_usage_stats table created\n');

    // ============================================
    // 5. Add tier columns to users table
    // ============================================
    console.log('📝 [MIGRATION] Adding tier columns to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN current_tier VARCHAR(50) DEFAULT 'free' COMMENT 'Current subscription tier',
        ADD COLUMN tier_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✅ [MIGRATION] Added tier columns to users\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  [MIGRATION] Tier columns already exist\n');
      } else {
        throw err;
      }
    }

    // ============================================
    // 6. Create Promotional Codes Table
    // ============================================
    console.log('📝 [MIGRATION] Creating promo_codes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_percent INT COMMENT '% discount (0-100)',
        discount_amount DECIMAL(15, 2) COMMENT 'Fixed discount in UGX',
        valid_tiers VARCHAR(255) COMMENT 'JSON array of applicable tiers',
        max_uses INT COMMENT 'Max redemptions (-1 = unlimited)',
        uses_count INT DEFAULT 0,
        valid_from DATE,
        valid_until DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_valid (valid_until)
      ) COMMENT='Promotional codes for discounts'
    `);
    console.log('✅ [MIGRATION] promo_codes table created\n');

    // ============================================
    // 7. Create Promo Code Redemptions
    // ============================================
    console.log('📝 [MIGRATION] Creating promo_redemptions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS promo_redemptions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        promo_id INT NOT NULL,
        discount_applied DECIMAL(15, 2) COMMENT 'Actual discount in UGX',
        tier_applied_to VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (promo_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
        INDEX idx_user (user_id)
      ) COMMENT='Audit trail for promo code usage'
    `);
    console.log('✅ [MIGRATION] promo_redemptions table created\n');

    console.log('🎉 [CREDIT MIGRATION] Completed successfully!\n');
    console.log('📊 Credit System Ready:');
    console.log('   ✅ user_credits table (credit balance ledger)');
    console.log('   ✅ credit_transactions table (audit trail)');
    console.log('   ✅ user_tier_history table (subscription tracking)');
    console.log('   ✅ user_usage_stats table (monthly limits)');
    console.log('   ✅ promo_codes table (discount management)');
    console.log('\n💡 Next: Use creditService.js to manage credits\n');
  } catch (error) {
    console.error('❌ [CREDIT MIGRATION] Failed:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ Migration complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
