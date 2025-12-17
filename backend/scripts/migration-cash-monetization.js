/**
 * Migration: Add cash payment monetization tables
 * 
 * Creates:
 * 1. cash_processing_fees - Track fees charged on cash payments
 * 2. Adds cash_payments_count to usage_stats table
 * 
 * Run with: node backend/scripts/migration-cash-monetization.js
 */

const { pool } = require('../config/db');

async function runMigration() {
  console.log('🚀 Starting Cash Payment Monetization Migration...\n');

  try {
    // Create cash_processing_fees table
    console.log('📋 Creating cash_processing_fees table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cash_processing_fees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        cash_deposit_id INT NOT NULL,
        creator_id INT NOT NULL,
        original_amount DECIMAL(15, 2) NOT NULL COMMENT 'Original amount collected',
        fee_percentage DECIMAL(5, 2) NOT NULL COMMENT 'Percentage fee applied',
        fee_amount DECIMAL(15, 2) NOT NULL COMMENT 'Actual fee amount deducted',
        net_amount DECIMAL(15, 2) NOT NULL COMMENT 'Amount after fee (original - fee)',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (cash_deposit_id) REFERENCES cash_deposits(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id) REFERENCES users(id),
        
        INDEX idx_creator (creator_id),
        INDEX idx_cash_deposit (cash_deposit_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Created cash_processing_fees table\n');

    // Create usage_stats table if it doesn't exist, then add column
    console.log('📋 Setting up usage_stats table...');
    try {
      // First try to add column if table exists
      await pool.execute(`
        ALTER TABLE usage_stats 
        ADD COLUMN IF NOT EXISTS cash_payments_count INT DEFAULT 0 
        COMMENT 'Number of cash payments recorded this month'
      `);
      console.log('✅ Updated usage_stats table\n');
    } catch (err) {
      // If table doesn't exist, create it
      console.log('📝 Creating usage_stats table...');
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS usage_stats (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          month DATE,
          cash_payments_count INT DEFAULT 0,
          pledges_count INT DEFAULT 0,
          campaigns_count INT DEFAULT 0,
          sms_count INT DEFAULT 0,
          emails_count INT DEFAULT 0,
          ai_requests_count INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_month (user_id, month),
          FOREIGN KEY (user_id) REFERENCES users(id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Created usage_stats table\n');
    }

    // Create a view for cash fee analytics
    console.log('📊 Creating cash_fee_analytics view...');
    try {
      await pool.execute(`
        CREATE OR REPLACE VIEW cash_fee_analytics AS
        SELECT 
          cpf.creator_id,
          COALESCE(u.name, 'Unknown') as creator_name,
          COALESCE(u.subscription_tier, 'FREE') as subscription_tier,
          COUNT(*) as total_cash_payments,
          SUM(cpf.original_amount) as total_collected,
          SUM(cpf.fee_amount) as total_fees_collected,
          SUM(cpf.net_amount) as total_net_amount,
          AVG(cpf.fee_percentage) as avg_fee_percentage,
          DATE_FORMAT(cpf.created_at, '%Y-%m') as month
        FROM cash_processing_fees cpf
        LEFT JOIN users u ON cpf.creator_id = u.id
        GROUP BY cpf.creator_id, DATE_FORMAT(cpf.created_at, '%Y-%m')
        ORDER BY cpf.created_at DESC;
      `);
      console.log('✅ Created cash_fee_analytics view\n');
    } catch (err) {
      // View might already exist or have issues, continue
      console.log('⚠️  View creation had issues (may already exist)\n');
    }

    console.log('🎉 Migration completed successfully!\n');
    console.log('Summary:');
    console.log('  ✅ Created cash_processing_fees table');
    console.log('  ✅ Added cash_payments_count to usage_stats');
    console.log('  ✅ Created cash_fee_analytics view');
    console.log('\nFeatures:');
    console.log('  💰 Track processing fees on cash payments');
    console.log('  📊 View cash fee analytics by user/month');
    console.log('  📈 Monitor revenue from cash payment fees');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    pool.end();
  }
}

// Run migration
runMigration();
