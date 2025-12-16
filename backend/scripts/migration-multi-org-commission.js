/**
 * Migration: Add Multi-Organization & Commission System
 * 
 * Creates tables for:
 * - organizations (who collects pledges)
 * - organization_accounts (MTN/Airtel accounts for receiving payouts)
 * - payment_splits (tracks how each payment is split: org vs commission)
 * - commissions (your income)
 * - commission_payouts (track your commission payments)
 * 
 * Usage: node backend/scripts/migration-multi-org-commission.js
 */

const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n📦 Starting Multi-Organization & Commission System Migration...\n');
    
    // TABLE 1: Organizations
    console.log('1️⃣  Creating organizations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS organizations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        description TEXT,
        logo_url VARCHAR(255),
        tier ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
        commission_rate DECIMAL(5,2) DEFAULT 2.5,
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        UNIQUE KEY (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ organizations table created\n');
    
    // TABLE 2: Organization Accounts (for receiving payouts)
    console.log('2️⃣  Creating organization_accounts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS organization_accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        organization_id INT NOT NULL,
        account_type ENUM('mtn', 'airtel', 'bank', 'paypal') DEFAULT 'mtn',
        phone_number VARCHAR(20),
        bank_name VARCHAR(255),
        bank_account_number VARCHAR(50),
        account_holder_name VARCHAR(255),
        is_primary BOOLEAN DEFAULT FALSE,
        is_verified BOOLEAN DEFAULT FALSE,
        verification_date TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
        UNIQUE KEY (organization_id, account_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ organization_accounts table created\n');
    
    // TABLE 3: Payment Splits (tracks org money vs commission)
    console.log('3️⃣  Creating payment_splits table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_splits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pledge_id INT NOT NULL,
        organization_id INT NOT NULL,
        payment_amount DECIMAL(15,2) NOT NULL,
        commission_rate DECIMAL(5,2) NOT NULL,
        commission_amount DECIMAL(15,2) NOT NULL,
        organization_payout DECIMAL(15,2) NOT NULL,
        payment_status ENUM('pending', 'received', 'distributed') DEFAULT 'pending',
        org_payout_status ENUM('pending', 'paid_out', 'failed') DEFAULT 'pending',
        commission_status ENUM('pending', 'accrued', 'paid_out', 'failed') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        org_paid_at TIMESTAMP NULL,
        commission_paid_at TIMESTAMP NULL,
        FOREIGN KEY (pledge_id) REFERENCES pledges(id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        KEY (payment_status),
        KEY (commission_status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ payment_splits table created\n');
    
    // TABLE 4: Commissions (your income)
    console.log('4️⃣  Creating commissions table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS commissions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payment_split_id INT NOT NULL,
        organization_id INT,
        pledge_id INT,
        amount DECIMAL(15,2) NOT NULL,
        status ENUM('accrued', 'pending_payout', 'paid_out', 'failed') DEFAULT 'accrued',
        payout_batch_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        accrued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_out_at TIMESTAMP NULL,
        FOREIGN KEY (payment_split_id) REFERENCES payment_splits(id),
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (pledge_id) REFERENCES pledges(id),
        KEY (status),
        KEY (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ commissions table created\n');
    
    // TABLE 5: Commission Payouts (your payment history)
    console.log('5️⃣  Creating commission_payouts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS commission_payouts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        batch_id VARCHAR(50) UNIQUE,
        payout_method ENUM('mtn', 'airtel', 'bank', 'manual') DEFAULT 'mtn',
        payout_phone VARCHAR(20),
        total_amount DECIMAL(15,2) NOT NULL,
        commission_count INT DEFAULT 0,
        transaction_id VARCHAR(100),
        reference_number VARCHAR(100),
        status ENUM('pending', 'processing', 'successful', 'failed') DEFAULT 'pending',
        failure_reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        completed_at TIMESTAMP NULL,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id),
        KEY (status),
        KEY (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ commission_payouts table created\n');
    
    // TABLE 6: Your Platform Accounts (where commissions are sent to)
    console.log('6️⃣  Creating platform_accounts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS platform_accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        account_type ENUM('mtn', 'airtel', 'bank', 'paypal') DEFAULT 'mtn',
        phone_number VARCHAR(20),
        bank_name VARCHAR(255),
        bank_account_number VARCHAR(50),
        account_holder_name VARCHAR(255),
        account_label VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        is_primary BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY (account_type, phone_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('   ✅ platform_accounts table created\n');
    
    // SEED: Create default organization (for backward compatibility)
    console.log('7️⃣  Seeding default organization...');
    const [existingOrg] = await connection.execute(
      'SELECT id FROM organizations WHERE email = ?',
      ['system@pledgehub.local']
    );
    
    if (existingOrg.length === 0) {
      await connection.execute(`
        INSERT INTO organizations (name, email, tier, created_by, created_at)
        VALUES (?, ?, ?, ?, NOW())
      `, ['PledgeHub Default', 'system@pledgehub.local', 'enterprise', 1]);
      console.log('   ✅ Default organization created\n');
    } else {
      console.log('   ⏭️  Default organization already exists\n');
    }
    
    // VIEWS: Useful for reporting
    console.log('8️⃣  Creating useful views...');
    
    // Commission Summary View
    await connection.execute(`
      CREATE OR REPLACE VIEW commission_summary AS
      SELECT 
        c.id,
        c.amount,
        c.status,
        o.name as organization_name,
        COALESCE(p.purpose, CONCAT('Pledge from ', p.donor_name, ' - ', p.amount, ' UGX')) as pledge_title,
        c.created_at,
        c.paid_out_at
      FROM commissions c
      LEFT JOIN organizations o ON c.organization_id = o.id
      LEFT JOIN pledges p ON c.pledge_id = p.id
      ORDER BY c.created_at DESC;
    `);
    
    // Organization Earnings View
    await connection.execute(`
      CREATE OR REPLACE VIEW organization_earnings AS
      SELECT 
        o.id,
        o.name,
        COUNT(ps.id) as total_pledges,
        SUM(ps.organization_payout) as total_payout,
        SUM(ps.payment_amount) as total_collected,
        COUNT(CASE WHEN ps.org_payout_status = 'paid_out' THEN 1 END) as paid_out_count
      FROM organizations o
      LEFT JOIN payment_splits ps ON o.id = ps.organization_id
      GROUP BY o.id;
    `);
    
    // Your Commission Summary View
    await connection.execute(`
      CREATE OR REPLACE VIEW my_commission_summary AS
      SELECT 
        'accrued' as status,
        COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE status = 'accrued'
      UNION ALL
      SELECT 
        'paid_out' as status,
        COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE status = 'paid_out'
      UNION ALL
      SELECT 
        'pending_payout' as status,
        COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE status = 'pending_payout';
    `);
    
    console.log('   ✅ Views created\n');
    
    console.log('✨ Migration completed successfully!\n');
    console.log('📊 Tables created:');
    console.log('   ✅ organizations');
    console.log('   ✅ organization_accounts');
    console.log('   ✅ payment_splits');
    console.log('   ✅ commissions');
    console.log('   ✅ commission_payouts');
    console.log('   ✅ platform_accounts');
    console.log('   ✅ Views (commission_summary, organization_earnings, my_commission_summary)\n');
    console.log('🔧 Next steps:');
    console.log('   1. Set your platform MTN/Airtel accounts in platform_accounts table');
    console.log('   2. Add organizations that will collect pledges');
    console.log('   3. Commission system will auto-pay you when pledges are fulfilled\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('✅ All done! Exiting...\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
