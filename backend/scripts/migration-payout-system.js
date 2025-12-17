/**
 * Migration: Payout System with Bank Fees & Commission Tracking
 * Date: December 2025
 * 
 * Creates tables for:
 * - payment_fees: Track all fee breakdowns per payment
 * - payouts: Manage creator payouts
 * - payout_details: Link payments to payouts
 * - creator_earnings: Monthly earnings summary
 * - bank_configurations: Bank fee configs
 */

const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();
  
  try {
    console.log('\n📋 Starting Payout System Migration...\n');

    // 1. Create bank_configurations table
    console.log('Creating bank_configurations table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bank_configurations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        country VARCHAR(50) DEFAULT 'Uganda',
        deposit_fee_percentage DECIMAL(5,3) DEFAULT 1.000,
        mobile_money_fee_percentage DECIMAL(5,3) DEFAULT 1.000,
        monthly_account_fee INT DEFAULT 10000,
        cheque_deposit_fee INT DEFAULT 0,
        inter_bank_transfer_fee INT DEFAULT 5000,
        min_deposit_amount INT DEFAULT 5000,
        account_types JSON,
        is_active BOOLEAN DEFAULT TRUE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_active (is_active)
      )
    `);
    console.log('✅ bank_configurations created\n');

    // 2. Add bank-related columns to users table
    console.log('Adding bank columns to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN (
          preferred_bank VARCHAR(50) DEFAULT 'EXIM',
          bank_account_number VARCHAR(50),
          bank_account_name VARCHAR(255),
          bank_account_type ENUM('personal', 'business') DEFAULT 'personal',
          bank_swift_code VARCHAR(20),
          bank_verified BOOLEAN DEFAULT FALSE,
          bank_verification_date TIMESTAMP NULL,
          commission_percentage DECIMAL(5,2) DEFAULT 10.00,
          payout_schedule ENUM('daily', 'weekly', 'monthly') DEFAULT 'monthly',
          auto_payout_enabled BOOLEAN DEFAULT TRUE
        )
      `);
      console.log('✅ Users table updated\n');
    } catch (error) {
      if (error.code !== 'ER_DUP_FIELDNAME') {
        throw error;
      }
      console.log('⚠️  Bank columns already exist in users table\n');
    }

    // 3. Create payment_fees table
    console.log('Creating payment_fees table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payment_fees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payment_id INT NOT NULL,
        pledge_id INT NOT NULL,
        bank_id INT,
        bank_name VARCHAR(50),
        donor_amount DECIMAL(15,2) NOT NULL,
        airtel_fee DECIMAL(15,2) DEFAULT 0,
        mtn_fee DECIMAL(15,2) DEFAULT 0,
        bank_deposit_fee DECIMAL(15,2) DEFAULT 0,
        platform_commission DECIMAL(15,2) DEFAULT 0,
        creator_net_payout DECIMAL(15,2) NOT NULL,
        fee_breakdown JSON,
        calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_payment (payment_id),
        INDEX idx_pledge (pledge_id),
        INDEX idx_bank (bank_id),
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
        FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE,
        FOREIGN KEY (bank_id) REFERENCES bank_configurations(id)
      )
    `);
    console.log('✅ payment_fees table created\n');

    // 4. Create payouts table
    console.log('Creating payouts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payouts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payout_batch_id VARCHAR(50),
        creator_id INT NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'UGX',
        payout_method ENUM('bank_transfer', 'mobile_money', 'wallet') DEFAULT 'bank_transfer',
        bank_id INT,
        status ENUM('pending', 'processing', 'sent', 'completed', 'failed') DEFAULT 'pending',
        scheduled_date DATE,
        processed_date TIMESTAMP NULL,
        completed_date TIMESTAMP NULL,
        reference_number VARCHAR(100),
        bank_reference VARCHAR(100),
        failure_reason TEXT,
        retry_count INT DEFAULT 0,
        max_retries INT DEFAULT 3,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        INDEX idx_creator (creator_id),
        INDEX idx_status (status),
        INDEX idx_batch (payout_batch_id),
        INDEX idx_scheduled (scheduled_date),
        FOREIGN KEY (creator_id) REFERENCES users(id),
        FOREIGN KEY (bank_id) REFERENCES bank_configurations(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    console.log('✅ payouts table created\n');

    // 5. Create payout_details table
    console.log('Creating payout_details table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS payout_details (
        id INT PRIMARY KEY AUTO_INCREMENT,
        payout_id INT NOT NULL,
        pledge_id INT NOT NULL,
        payment_id INT,
        amount DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payout_id) REFERENCES payouts(id) ON DELETE CASCADE,
        FOREIGN KEY (pledge_id) REFERENCES pledges(id),
        FOREIGN KEY (payment_id) REFERENCES payments(id)
      )
    `);
    console.log('✅ payout_details table created\n');

    // 6. Create creator_earnings table
    console.log('Creating creator_earnings table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS creator_earnings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        creator_id INT NOT NULL,
        month_year DATE NOT NULL,
        total_pledges_received DECIMAL(15,2) DEFAULT 0,
        total_fees_deducted DECIMAL(15,2) DEFAULT 0,
        total_commission_deducted DECIMAL(15,2) DEFAULT 0,
        net_earnings DECIMAL(15,2) DEFAULT 0,
        total_paid_out DECIMAL(15,2) DEFAULT 0,
        total_pending DECIMAL(15,2) DEFAULT 0,
        payment_count INT DEFAULT 0,
        status ENUM('calculating', 'calculated', 'pending_payout', 'paid') DEFAULT 'calculating',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_creator_month (creator_id, month_year),
        FOREIGN KEY (creator_id) REFERENCES users(id),
        INDEX idx_month (month_year),
        INDEX idx_status (status)
      )
    `);
    console.log('✅ creator_earnings table created\n');

    // 7. Seed bank configurations
    console.log('Seeding bank configurations...');
    const banks = [
      ['EXIM', 'EXIM Bank Uganda', 'Uganda', 0.010, 0.015, 5000, 0, 2500, 5000],
      ['ABSA', 'ABSA Bank Uganda', 'Uganda', 0.010, 0.010, 7500, 0, 5000, 5000],
      ['STANBIC', 'Stanbic Bank Uganda', 'Uganda', 0.0075, 0.010, 10000, 0, 3000, 5000],
      ['CENTENARY', 'Centenary Bank Uganda', 'Uganda', 0.005, 0.0075, 5000, 0, 2500, 5000],
      ['EQUITY', 'Equity Bank Uganda', 'Uganda', 0.0075, 0.010, 7500, 0, 3500, 5000],
      ['BARCLAYS', 'Barclays Bank Uganda', 'Uganda', 0.010, 0.015, 15000, 0, 5000, 10000]
    ];

    for (const [code, name, country, deposit_fee, mm_fee, monthly_fee, cheque_fee, transfer_fee, min_deposit] of banks) {
      const accountTypes = JSON.stringify({
        basic: { monthly_fee: Math.round(monthly_fee * 0.5) },
        standard: { monthly_fee: monthly_fee },
        premium: { monthly_fee: Math.round(monthly_fee * 1.5) }
      });

      try {
        await connection.execute(
          `INSERT INTO bank_configurations 
           (code, name, country, deposit_fee_percentage, mobile_money_fee_percentage, 
            monthly_account_fee, cheque_deposit_fee, inter_bank_transfer_fee, 
            min_deposit_amount, account_types, is_active)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
          [code, name, country, deposit_fee, mm_fee, monthly_fee, cheque_fee, transfer_fee, min_deposit, accountTypes]
        );
        console.log(`  ✅ ${code}: ${name}`);
      } catch (error) {
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
        console.log(`  ⚠️  ${code} already exists`);
      }
    }
    console.log('✅ Bank configurations seeded\n');

    console.log('🎉 Migration completed successfully!\n');
    console.log('📝 Next steps:');
    console.log('  1. Update your .env with PLATFORM_COMMISSION_PERCENT (default 10)');
    console.log('  2. Set AIRTEL_MERCHANT_ID to YOUR merchant account');
    console.log('  3. Configure bank preferences in admin dashboard');
    console.log('  4. Restart server to load new services');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration().catch(error => {
  console.error(error);
  process.exit(1);
});
