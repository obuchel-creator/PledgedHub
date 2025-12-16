/**
 * Accounting Schema Migration
 * Creates tables for double-entry bookkeeping system
 * - accounts: Chart of Accounts
 * - journal_entries: Journal entry headers
 * - journal_entry_lines: Journal entry details (debits/credits)
 * 
 * Run: node backend/scripts/migration-20251216-accounting-schema.js
 */

const { pool } = require('../config/db');

const MIGRATION_QUERIES = [
  // Chart of Accounts table
  `CREATE TABLE IF NOT EXISTS accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
    parent_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL,
    INDEX idx_code (code),
    INDEX idx_type (type),
    INDEX idx_active (is_active)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Journal Entries (header) table
  `CREATE TABLE IF NOT EXISTS journal_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    reference VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_entry_number (entry_number),
    INDEX idx_date (date),
    INDEX idx_status (status),
    INDEX idx_reference (reference)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // Journal Entry Lines (detail) table
  `CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entry_id INT NOT NULL,
    account_id INT NOT NULL,
    debit DECIMAL(15, 2) DEFAULT 0.00,
    credit DECIMAL(15, 2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
    INDEX idx_entry_id (entry_id),
    INDEX idx_account_id (account_id),
    INDEX idx_debit_credit (debit, credit)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  // General Ledger View
  `CREATE OR REPLACE VIEW general_ledger AS
  SELECT 
    e.date,
    e.entry_number,
    e.reference,
    e.description as entry_description,
    a.code as account_code,
    a.name as account_name,
    a.type as account_type,
    l.debit,
    l.credit,
    l.description as line_description,
    e.status,
    e.created_by,
    e.created_at
  FROM journal_entry_lines l
  JOIN journal_entries e ON l.entry_id = e.id
  JOIN accounts a ON l.account_id = a.id
  ORDER BY e.date DESC, e.id DESC, l.id`,

  // Account Balances View
  `CREATE OR REPLACE VIEW account_balances AS
  SELECT 
    a.id,
    a.code,
    a.name,
    a.type,
    COALESCE(SUM(l.debit), 0) as total_debit,
    COALESCE(SUM(l.credit), 0) as total_credit,
    CASE 
      WHEN a.type IN ('ASSET', 'EXPENSE') THEN COALESCE(SUM(l.debit - l.credit), 0)
      ELSE COALESCE(SUM(l.credit - l.debit), 0)
    END as balance
  FROM accounts a
  LEFT JOIN journal_entry_lines l ON a.id = l.account_id
  LEFT JOIN journal_entries e ON l.entry_id = e.id AND e.status = 'posted'
  WHERE a.is_active = TRUE
  GROUP BY a.id, a.code, a.name, a.type
  ORDER BY a.code`
];

async function runMigration() {
  console.log('🚀 Starting Accounting Schema Migration...\n');
  
  try {
    for (let i = 0; i < MIGRATION_QUERIES.length; i++) {
      const query = MIGRATION_QUERIES[i];
      const tableName = query.match(/CREATE (?:TABLE|VIEW|OR REPLACE VIEW) (?:IF NOT EXISTS )?([a-z_]+)/i)?.[1];
      
      console.log(`⏳ [${i + 1}/${MIGRATION_QUERIES.length}] Creating ${tableName}...`);
      await pool.execute(query);
      console.log(`✅ ${tableName} created successfully\n`);
    }
    
    console.log('🎉 Accounting schema migration completed successfully!\n');
    console.log('📋 Created:');
    console.log('  - accounts (Chart of Accounts)');
    console.log('  - journal_entries (Transaction headers)');
    console.log('  - journal_entry_lines (Debits/Credits)');
    console.log('  - general_ledger (View)');
    console.log('  - account_balances (View)\n');
    console.log('💡 Next step: Run seed script to populate default accounts');
    console.log('   node backend/scripts/seed-default-accounts.js\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
