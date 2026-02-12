/**
 * Database Migration: Add QR Code Tracking Tables
 * Run: node backend/scripts/migration-qr-code-tracking.js
 * 
 * Creates tables to track:
 * - QR code generation history
 * - QR code scan/payment correlation
 * - Payment audit trail linked to QR codes
 */

const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();

  try {
    console.log('🔄 Starting QR Code Tracking Migration...\n');

    // 1. Create qr_codes table
    console.log('📋 Creating qr_codes table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS qr_codes (
        id INT PRIMARY KEY AUTO_INCREMENT,
        pledge_id INT NOT NULL,
        provider VARCHAR(20) NOT NULL COMMENT 'mtn or airtel',
        qr_reference VARCHAR(100) UNIQUE NOT NULL COMMENT 'Unique QR reference',
        qr_data LONGTEXT NOT NULL COMMENT 'Base64 encoded QR code image',
        qr_data_json JSON NOT NULL COMMENT 'Decoded QR payment data',
        amount INT NOT NULL COMMENT 'Payment amount in UGX',
        donor_phone VARCHAR(20) COMMENT 'Donor phone number (formatted)',
        donor_name VARCHAR(255) COMMENT 'Donor name',
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        scan_count INT DEFAULT 0 COMMENT 'Number of times QR was scanned',
        last_scanned_at TIMESTAMP NULL,
        payment_initiated BOOLEAN DEFAULT FALSE COMMENT 'Payment initiated from this QR',
        is_used BOOLEAN DEFAULT FALSE COMMENT 'Whether QR resulted in payment',
        status ENUM('generated', 'scanned', 'paid', 'expired') DEFAULT 'generated',
        expires_at TIMESTAMP NULL COMMENT 'QR code expiration time (optional)',
        deleted_at TIMESTAMP NULL,
        
        KEY idx_pledge_id (pledge_id),
        KEY idx_provider (provider),
        KEY idx_status (status),
        KEY idx_generated_at (generated_at),
        FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✓ qr_codes table created\n');

    // 2. Create qr_code_scans table (audit log)
    console.log('📋 Creating qr_code_scans table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS qr_code_scans (
        id INT PRIMARY KEY AUTO_INCREMENT,
        qr_code_id INT NOT NULL,
        pledge_id INT NOT NULL,
        phone_number VARCHAR(20) COMMENT 'Phone number used for payment',
        scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        payment_initiated BOOLEAN DEFAULT FALSE,
        payment_status VARCHAR(50) COMMENT 'pending, successful, failed',
        transaction_reference VARCHAR(255) COMMENT 'Payment gateway reference',
        ip_address VARCHAR(45) COMMENT 'Client IP address',
        user_agent VARCHAR(255) COMMENT 'Browser/client info',
        
        KEY idx_qr_code_id (qr_code_id),
        KEY idx_pledge_id (pledge_id),
        KEY idx_scanned_at (scanned_at),
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
        FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✓ qr_code_scans table created\n');

    // 3. Create qr_code_payments table (link QR to payments)
    console.log('📋 Creating qr_code_payments table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS qr_code_payments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        qr_code_id INT NOT NULL,
        payment_id INT NOT NULL,
        pledge_id INT NOT NULL,
        amount INT NOT NULL,
        provider VARCHAR(20) NOT NULL COMMENT 'mtn or airtel',
        status VARCHAR(50) DEFAULT 'pending' COMMENT 'pending, successful, failed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        
        KEY idx_qr_code_id (qr_code_id),
        KEY idx_payment_id (payment_id),
        KEY idx_pledge_id (pledge_id),
        KEY idx_status (status),
        UNIQUE KEY uk_payment_qr (payment_id, qr_code_id),
        FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE,
        FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE
      )
    `);
    console.log('   ✓ qr_code_payments table created\n');

    // 4. Add qr_code_id column to payments table if not exists
    console.log('📋 Updating payments table...');
    try {
      await connection.execute(`
        ALTER TABLE payments 
        ADD COLUMN qr_code_id INT NULL,
        ADD FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE SET NULL
      `);
      console.log('   ✓ payments table updated\n');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('   ℹ qr_code_id already exists in payments table\n');
      } else {
        throw error;
      }
    }

    // 5. Create view for QR code payment report
    console.log('📋 Creating qr_payment_report view...');
    await connection.execute(`
      CREATE OR REPLACE VIEW qr_payment_report AS
      SELECT 
        qr.id AS qr_code_id,
        qr.pledge_id,
        qr.provider,
        qr.qr_reference,
        qr.amount,
        qr.donor_phone,
        qr.status,
        qr.generated_at,
        qr.scan_count,
        qr.last_scanned_at,
        COUNT(DISTINCT scans.id) AS total_scans,
        COUNT(DISTINCT payments.id) AS total_payments,
        MAX(payments.payment_date) AS last_payment_date,
        SUM(payments.amount) AS total_paid,
        p.donor_name,
        p.amount AS pledge_amount,
        p.balance AS pledge_balance
      FROM qr_codes qr
      LEFT JOIN qr_code_scans scans ON scans.qr_code_id = qr.id
      LEFT JOIN qr_code_payments qrp ON qrp.qr_code_id = qr.id
      LEFT JOIN payments ON payments.id = qrp.payment_id
      LEFT JOIN pledges p ON p.id = qr.pledge_id
      WHERE qr.deleted_at IS NULL
      GROUP BY qr.id
    `);
    console.log('   ✓ qr_payment_report view created\n');

    console.log('✅ QR Code Tracking Migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   • qr_codes table - Stores generated QR codes');
    console.log('   • qr_code_scans table - Audit log of QR scans');
    console.log('   • qr_code_payments table - Links QR codes to payments');
    console.log('   • payments.qr_code_id column - Foreign key added');
    console.log('   • qr_payment_report view - For analytics\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await connection.release();
  }
}

// Run the migration
runMigration()
  .then(() => {
    console.log('🎉 Migration complete!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('🚨 Fatal error:', error);
    process.exit(1);
  });
