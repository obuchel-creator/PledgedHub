/**
 * Database Migration: Create Security Tables
 * 
 * Creates:
 * - security_settings: PIN and security feature configuration
 * - ip_whitelist: Allowed IP addresses for access control
 * - pin_lockout: Account lockout tracking
 * - pin_attempts: PIN verification attempt tracking
 * - pin_verification_log: Successful PIN verifications audit trail
 * 
 * Run: node backend/scripts/migrate-security-tables.js
 */

const { pool } = require('../config/db');

async function migrateSecurityTables() {
  const connection = await pool.getConnection();

  try {
    console.log('🔐 Starting security tables migration...\n');

    // Drop existing tables if they exist (for re-migration)
    console.log('Cleaning up existing tables...');
    const tables = [
      'pin_verification_log',
      'pin_attempts',
      'pin_lockout',
      'ip_whitelist',
      'security_settings'
    ];

    for (const table of tables) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`✓ Dropped ${table}`);
      } catch (err) {
        console.log(`⚠ Could not drop ${table} (may not exist)`);
      }
    }

    console.log('\n📝 Creating security_settings table...');
    await connection.execute(`
      CREATE TABLE security_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        setting_type ENUM('pin', 'pin_threshold', '2fa', '2fa_method') NOT NULL,
        setting_value VARCHAR(255),
        enabled BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_setting (user_id, setting_type),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_setting (user_id, setting_type)
      );
    `);
    console.log('✓ Created security_settings table');

    console.log('\n📝 Creating ip_whitelist table...');
    await connection.execute(`
      CREATE TABLE ip_whitelist (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        ip_address VARCHAR(45) NOT NULL,
        description VARCHAR(255),
        active BOOLEAN DEFAULT 1,
        last_used TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user_ip (user_id, ip_address),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_active (user_id, active),
        INDEX idx_ip_address (ip_address)
      );
    `);
    console.log('✓ Created ip_whitelist table');

    console.log('\n📝 Creating pin_lockout table...');
    await connection.execute(`
      CREATE TABLE pin_lockout (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        locked_until TIMESTAMP NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_locked_until (locked_until)
      );
    `);
    console.log('✓ Created pin_lockout table');

    console.log('\n📝 Creating pin_attempts table...');
    await connection.execute(`
      CREATE TABLE pin_attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        attempt_count INT DEFAULT 1,
        created_at DATE DEFAULT (CURDATE()),
        
        UNIQUE KEY unique_user_day (user_id, created_at),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, created_at)
      );
    `);
    console.log('✓ Created pin_attempts table');

    console.log('\n📝 Creating pin_verification_log table...');
    await connection.execute(`
      CREATE TABLE pin_verification_log (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        transaction_id VARCHAR(100),
        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ip_address VARCHAR(45),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_verified (user_id, verified_at),
        INDEX idx_transaction (transaction_id)
      );
    `);
    console.log('✓ Created pin_verification_log table');

    console.log('\n📝 Creating accounts table (for accounting)...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
        description TEXT,
        balance DECIMAL(15, 2) DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        parent_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (parent_id) REFERENCES accounts(id),
        INDEX idx_type (type),
        INDEX idx_code (code)
      );
    `);
    console.log('✓ Created accounts table');

    console.log('\n📝 Creating journal_entries table (for accounting)...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_number INT UNIQUE NOT NULL,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference VARCHAR(100),
        created_by INT,
        status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_date (date),
        INDEX idx_entry_number (entry_number)
      );
    `);
    console.log('✓ Created journal_entries table');

    console.log('\n📝 Creating journal_entry_lines table (for accounting)...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_id INT NOT NULL,
        account_id INT NOT NULL,
        debit DECIMAL(15, 2) DEFAULT 0,
        credit DECIMAL(15, 2) DEFAULT 0,
        description TEXT,
        
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        INDEX idx_entry_id (entry_id),
        INDEX idx_account_id (account_id)
      );
    `);
    console.log('✓ Created journal_entry_lines table');

    console.log('\n📝 Creating commission_payouts table (if not exists)...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS commission_payouts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        campaign_id INT,
        amount DECIMAL(15, 2) NOT NULL,
        status ENUM('pending', 'processing', 'paid', 'failed') DEFAULT 'pending',
        payment_method VARCHAR(50),
        request_type ENUM('immediate', 'batch', 'scheduled') DEFAULT 'immediate',
        reference VARCHAR(100),
        payment_reference VARCHAR(100),
        batch_id INT,
        notes TEXT,
        requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
        INDEX idx_user_status (user_id, status),
        INDEX idx_requested_at (requested_at)
      );
    `);
    console.log('✓ Created commission_payouts table');

    console.log('\n📝 Seeding default chart of accounts...');
    const defaultAccounts = [
      { code: '1000', name: 'Cash', type: 'ASSET' },
      { code: '1100', name: 'Mobile Money', type: 'ASSET' },
      { code: '1200', name: 'Pledges Receivable', type: 'ASSET' },
      { code: '1300', name: 'Bank Account', type: 'ASSET' },
      { code: '2000', name: 'Unearned Revenue', type: 'LIABILITY' },
      { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
      { code: '3000', name: 'Retained Earnings', type: 'EQUITY' },
      { code: '3100', name: 'Owner Equity', type: 'EQUITY' },
      { code: '4000', name: 'Pledge Income', type: 'REVENUE' },
      { code: '4100', name: 'Donation Income', type: 'REVENUE' },
      { code: '4200', name: 'Commission Income', type: 'REVENUE' },
      { code: '5000', name: 'Operating Expenses', type: 'EXPENSE' },
      { code: '5100', name: 'Payment Processing Fees', type: 'EXPENSE' },
      { code: '5200', name: 'Administrative Expenses', type: 'EXPENSE' }
    ];

    for (const account of defaultAccounts) {
      try {
        await connection.execute(
          `INSERT INTO accounts (code, name, type, is_active)
           VALUES (?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE name = VALUES(name), type = VALUES(type)`,
          [account.code, account.name, account.type]
        );
      } catch (err) {
        console.log(`⚠ Could not insert account ${account.code}: ${err.message}`);
      }
    }
    console.log('✓ Seeded default chart of accounts');

    console.log('\n✅ Security tables migration completed successfully!\n');
    console.log('📚 Created tables:');
    console.log('  ✓ security_settings - PIN and 2FA configuration');
    console.log('  ✓ ip_whitelist - Allowed IP addresses');
    console.log('  ✓ pin_lockout - Account lockout tracking');
    console.log('  ✓ pin_attempts - PIN attempt tracking');
    console.log('  ✓ pin_verification_log - Audit trail');
    console.log('  ✓ accounts - Chart of accounts');
    console.log('  ✓ journal_entries - Journal entry headers');
    console.log('  ✓ journal_entry_lines - Journal entry details');
    console.log('  ✓ commission_payouts - Commission payout tracking\n');

    return { success: true, message: 'Migration completed' };
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration
migrateSecurityTables()
  .then(() => {
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  });
