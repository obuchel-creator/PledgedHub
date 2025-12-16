/**
 * Database Migration: Add Monetization Tables
 * Run this script to add subscription and billing tables
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

const SQL_STATEMENTS = `
-- Add subscription columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(50) DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS subscription_starts_at DATETIME,
ADD COLUMN IF NOT EXISTS subscription_ends_at DATETIME,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paypal_customer_id VARCHAR(255);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tier VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  started_at DATETIME NOT NULL,
  ends_at DATETIME NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  external_subscription_id VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_ends_at (ends_at)
);

-- Create billing_history table
CREATE TABLE IF NOT EXISTS billing_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  subscription_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  transaction_id VARCHAR(255),
  invoice_number VARCHAR(100),
  description TEXT,
  metadata JSON,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_paid_at (paid_at)
);

-- Create usage_stats table
CREATE TABLE IF NOT EXISTS usage_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  month VARCHAR(7) NOT NULL,
  pledges_count INT DEFAULT 0,
  campaigns_count INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  ai_requests INT DEFAULT 0,
  api_calls INT DEFAULT 0,
  storage_mb DECIMAL(10, 2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_month (user_id, month),
  INDEX idx_month (month)
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  pledge_id INT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  transaction_fee DECIMAL(10, 2) DEFAULT 0,
  net_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  payment_method VARCHAR(50),
  payment_provider VARCHAR(50),
  external_transaction_id VARCHAR(255),
  metadata JSON,
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_pledge_id (pledge_id),
  INDEX idx_status (status),
  INDEX idx_processed_at (processed_at)
);

-- Create pricing_plans table (for dynamic pricing)
CREATE TABLE IF NOT EXISTS pricing_plans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  tier VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  billing_period VARCHAR(20) DEFAULT 'monthly',
  features JSON,
  limits JSON,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default pricing plans
INSERT INTO pricing_plans (tier, name, description, price, features, limits, display_order) VALUES
('FREE', 'Free', 'Perfect for getting started', 0, 
  '["Up to 50 pledges per month", "Basic dashboard", "2 active campaigns", "Email notifications"]',
  '{"pledgesPerMonth": 50, "campaigns": 2, "users": 1, "smsNotifications": 10}',
  1),
('STARTER', 'Starter', 'For growing organizations', 19, 
  '["Up to 500 pledges per month", "AI-powered insights", "10 active campaigns", "SMS & Email notifications"]',
  '{"pledgesPerMonth": 500, "campaigns": 10, "users": 3, "smsNotifications": 100}',
  2),
('PRO', 'Pro', 'For established organizations', 49, 
  '["Up to 2,000 pledges per month", "Unlimited AI insights", "50 active campaigns", "Custom branding", "API access"]',
  '{"pledgesPerMonth": 2000, "campaigns": 50, "users": 10, "smsNotifications": 500}',
  3),
('ENTERPRISE', 'Enterprise', 'For large organizations', 199, 
  '["Unlimited pledges", "Unlimited campaigns", "Custom domain", "24/7 support", "SLA guarantee"]',
  '{"pledgesPerMonth": -1, "campaigns": -1, "users": -1, "smsNotifications": -1}',
  4)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  description = VALUES(description),
  price = VALUES(price),
  features = VALUES(features),
  limits = VALUES(limits);

-- Create monetization_settings table
CREATE TABLE IF NOT EXISTS monetization_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert monetization launch date
INSERT INTO monetization_settings (setting_key, setting_value, description) VALUES
('launch_date', '2025-12-11', 'Application launch date'),
('monetization_start_date', '2025-06-11', 'Date when monetization becomes active (6 months after launch)'),
('free_trial_days', '14', 'Number of free trial days for new users after monetization starts'),
('transaction_fee_percentage', '2.5', 'Transaction fee percentage'),
('transaction_fee_fixed', '0.30', 'Fixed transaction fee amount')
ON DUPLICATE KEY UPDATE 
  setting_value = VALUES(setting_value),
  description = VALUES(description);
`;

async function runMigration() {
  let connection;
  
  try {
    console.log('🚀 Starting monetization migration...\n');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pledgehub_db',
      multipleStatements: true
    });
    
    console.log('✅ Connected to database\n');
    
    // Execute all SQL statements
    await connection.query(SQL_STATEMENTS);
    
    console.log('✅ Migration completed successfully!\n');
    console.log('📊 Tables created/updated:');
    console.log('   - users (added subscription columns)');
    console.log('   - subscriptions');
    console.log('   - billing_history');
    console.log('   - usage_stats');
    console.log('   - payment_transactions');
    console.log('   - pricing_plans');
    console.log('   - monetization_settings\n');
    
    // Verify tables exist
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('subscriptions', 'billing_history', 'usage_stats', 'payment_transactions', 'pricing_plans', 'monetization_settings')
    `, [process.env.DB_NAME || 'pledgehub_db']);
    
    console.log('✅ Verified tables:', tables.map(t => t.TABLE_NAME).join(', '));
    console.log('\n💰 Monetization system is ready!');
    console.log('📅 Monetization will activate 6 months after launch date');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
