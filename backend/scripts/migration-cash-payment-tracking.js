/**
 * Cash Payment Tracking Migration
 * Adds accountability system for cash payments
 * Allows admins to record, verify, and track cash deposits
 */

require('dotenv').config();
const { pool } = require('../config/db');

async function migrate() {
  try {
    console.log('🔄 Starting cash payment tracking migration...\n');

    // 1. Add cash tracking columns to payments table if they don't exist
    console.log('📝 Adding cash tracking columns to payments table...');
    try {
      const columns = [
        "payment_method VARCHAR(50) DEFAULT 'airtel'",
        "cash_collected_by INT",
        "cash_collection_date DATETIME",
        "cash_verified_by INT",
        "cash_verified_at DATETIME",
        "verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending'",
        "verification_notes TEXT",
        "receipt_number VARCHAR(100)",
        "receipt_photo_url TEXT"
      ];
      
      for (const col of columns) {
        try {
          const colName = col.split(' ')[0];
          await pool.execute(`ALTER TABLE payments ADD COLUMN ${colName} ${col.substring(colName.length).trim()}`);
        } catch (err) {
          if (!err.message.includes('Duplicate column')) {
            console.log(`  ⚠️  Column ${col.split(' ')[0]} might already exist`);
          }
        }
      }
      console.log('✅ Cash tracking columns added to payments table');
    } catch (err) {
      console.log('ℹ️  Cash columns setup completed (may already exist)');
    }

    // 2. Create cash_deposits table for detailed tracking
    console.log('\n📝 Creating cash_deposits table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS cash_deposits (
          id INT PRIMARY KEY AUTO_INCREMENT,
          pledge_id INT NOT NULL,
          creator_id INT NOT NULL,
          collected_by INT NOT NULL,
          collected_amount DECIMAL(15, 2) NOT NULL,
          collection_date DATETIME NOT NULL,
          collection_location VARCHAR(255),
          donor_name VARCHAR(255),
          donor_phone VARCHAR(20),
          donor_id_type VARCHAR(50),
          donor_id_number VARCHAR(100),
          receipt_number VARCHAR(100) UNIQUE,
          receipt_photo_url TEXT,
          notes TEXT,
          
          -- Verification fields
          verified_by INT,
          verified_at DATETIME,
          verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
          verification_notes TEXT,
          rejection_reason VARCHAR(255),
          
          -- Accountability
          deposited_to_bank BOOLEAN DEFAULT FALSE,
          bank_deposit_date DATETIME,
          bank_reference VARCHAR(100),
          reconciled BOOLEAN DEFAULT FALSE,
          reconciled_at DATETIME,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (pledge_id) REFERENCES pledges(id),
          FOREIGN KEY (creator_id) REFERENCES users(id),
          FOREIGN KEY (collected_by) REFERENCES users(id),
          FOREIGN KEY (verified_by) REFERENCES users(id),
          
          INDEX idx_pledge_id (pledge_id),
          INDEX idx_creator_id (creator_id),
          INDEX idx_collected_by (collected_by),
          INDEX idx_verification_status (verification_status),
          INDEX idx_collection_date (collection_date),
          UNIQUE KEY unique_receipt (receipt_number)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ cash_deposits table created');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('ℹ️  cash_deposits table already exists');
    }

    // 3. Create cash_accountability table for reporting
    console.log('\n📝 Creating cash_accountability table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS cash_accountability (
          id INT PRIMARY KEY AUTO_INCREMENT,
          month_year VARCHAR(7) NOT NULL,
          collector_id INT NOT NULL,
          total_collected DECIMAL(15, 2) DEFAULT 0,
          total_verified DECIMAL(15, 2) DEFAULT 0,
          total_pending DECIMAL(15, 2) DEFAULT 0,
          total_rejected DECIMAL(15, 2) DEFAULT 0,
          total_deposited DECIMAL(15, 2) DEFAULT 0,
          pending_deposits DECIMAL(15, 2) DEFAULT 0,
          verified_not_deposited DECIMAL(15, 2) DEFAULT 0,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (collector_id) REFERENCES users(id),
          INDEX idx_month_year (month_year),
          INDEX idx_collector_id (collector_id),
          UNIQUE KEY unique_monthly_collector (month_year, collector_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ cash_accountability table created');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('ℹ️  cash_accountability table already exists');
    }

    // 4. Create cash_audit_log table for full audit trail
    console.log('\n📝 Creating cash_audit_log table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS cash_audit_log (
          id INT PRIMARY KEY AUTO_INCREMENT,
          cash_deposit_id INT NOT NULL,
          action VARCHAR(100) NOT NULL,
          performed_by INT NOT NULL,
          old_status VARCHAR(50),
          new_status VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (cash_deposit_id) REFERENCES cash_deposits(id),
          FOREIGN KEY (performed_by) REFERENCES users(id),
          INDEX idx_cash_deposit_id (cash_deposit_id),
          INDEX idx_performed_by (performed_by),
          INDEX idx_action (action),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ cash_audit_log table created');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('ℹ️  cash_audit_log table already exists');
    }

    // 5. Create cash_discrepancies table for tracking mismatches
    console.log('\n📝 Creating cash_discrepancies table...');
    try {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS cash_discrepancies (
          id INT PRIMARY KEY AUTO_INCREMENT,
          cash_deposit_id INT,
          discrepancy_type VARCHAR(100) NOT NULL,
          expected_amount DECIMAL(15, 2),
          actual_amount DECIMAL(15, 2),
          variance DECIMAL(15, 2),
          variance_percent DECIMAL(5, 2),
          description TEXT,
          reported_by INT NOT NULL,
          resolved BOOLEAN DEFAULT FALSE,
          resolution_notes TEXT,
          resolved_by INT,
          resolved_at DATETIME,
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          FOREIGN KEY (cash_deposit_id) REFERENCES cash_deposits(id),
          FOREIGN KEY (reported_by) REFERENCES users(id),
          FOREIGN KEY (resolved_by) REFERENCES users(id),
          INDEX idx_discrepancy_type (discrepancy_type),
          INDEX idx_resolved (resolved),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ cash_discrepancies table created');
    } catch (err) {
      if (!err.message.includes('already exists')) {
        throw err;
      }
      console.log('ℹ️  cash_discrepancies table already exists');
    }

    // 6. Create views for accountability reporting
    console.log('\n📝 Creating accountability views...');
    try {
      await pool.execute(`
        CREATE OR REPLACE VIEW cash_pending_verification AS
        SELECT 
          cd.id,
          cd.pledge_id,
          cd.collected_amount,
          cd.collection_date,
          u.name as collector_name,
          u.phone as collector_phone,
          p.donor_name,
          c.name as creator_name,
          cd.verification_status,
          DATEDIFF(NOW(), cd.collection_date) as days_pending
        FROM cash_deposits cd
        JOIN users u ON cd.collected_by = u.id
        JOIN pledges p ON cd.pledge_id = p.id
        JOIN users c ON cd.creator_id = c.id
        WHERE cd.verification_status = 'pending'
        ORDER BY cd.collection_date ASC
      `);
      console.log('✅ cash_pending_verification view created');
    } catch (err) {
      console.log('⚠️  Could not create view:', err.message);
    }

    try {
      await pool.execute(`
        CREATE OR REPLACE VIEW cash_collector_accountability AS
        SELECT 
          u.id,
          u.name,
          u.phone,
          COUNT(cd.id) as total_collections,
          SUM(CASE WHEN cd.verification_status = 'pending' THEN cd.collected_amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN cd.verification_status = 'verified' THEN cd.collected_amount ELSE 0 END) as verified_amount,
          SUM(CASE WHEN cd.verification_status = 'rejected' THEN cd.collected_amount ELSE 0 END) as rejected_amount,
          SUM(CASE WHEN cd.deposited_to_bank THEN cd.collected_amount ELSE 0 END) as deposited_amount,
          SUM(CASE WHEN cd.verification_status = 'verified' AND NOT cd.deposited_to_bank THEN cd.collected_amount ELSE 0 END) as verified_not_deposited,
          MAX(cd.collection_date) as last_collection_date
        FROM users u
        LEFT JOIN cash_deposits cd ON u.id = cd.collected_by
        WHERE u.role = 'staff'
        GROUP BY u.id, u.name, u.phone
      `);
      console.log('✅ cash_collector_accountability view created');
    } catch (err) {
      console.log('⚠️  Could not create view:', err.message);
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📊 New tables created:');
    console.log('   ├─ cash_deposits (main tracking table)');
    console.log('   ├─ cash_accountability (monthly summaries)');
    console.log('   ├─ cash_audit_log (full audit trail)');
    console.log('   └─ cash_discrepancies (variance tracking)');
    console.log('\n📋 Columns added to payments table:');
    console.log('   ├─ payment_method');
    console.log('   ├─ cash_collected_by');
    console.log('   ├─ cash_collection_date');
    console.log('   ├─ cash_verified_by');
    console.log('   ├─ cash_verified_at');
    console.log('   ├─ verification_status');
    console.log('   ├─ verification_notes');
    console.log('   ├─ receipt_number');
    console.log('   └─ receipt_photo_url');
    console.log('\n🔍 Views created:');
    console.log('   ├─ cash_pending_verification');
    console.log('   └─ cash_collector_accountability');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
