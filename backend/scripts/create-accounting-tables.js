const { pool } = require('../config/db');

/**
 * Migration Script: Create Accounting Tables
 * Creates tables for QuickBooks-style double-entry bookkeeping system
 * Run: node backend/scripts/create-accounting-tables.js
 */

async function createAccountingTables() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Creating accounting tables...\n');

    // 1. Chart of Accounts Table
    console.log('Creating accounts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
        parent_id INT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        balance DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL,
        INDEX idx_type (type),
        INDEX idx_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ accounts table created\n');

    // 2. Journal Entries Table (Header)
    console.log('Creating journal_entries table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_number VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        reference VARCHAR(100),
        created_by INT,
        status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_date (date),
        INDEX idx_status (status),
        INDEX idx_entry_number (entry_number)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ journal_entries table created\n');

    // 3. Journal Entry Lines Table (Detail)
    console.log('Creating journal_entry_lines table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_id INT NOT NULL,
        account_id INT NOT NULL,
        debit DECIMAL(15, 2) DEFAULT 0.00,
        credit DECIMAL(15, 2) DEFAULT 0.00,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        INDEX idx_entry_id (entry_id),
        INDEX idx_account_id (account_id),
        CONSTRAINT chk_debit_or_credit CHECK (
          (debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0)
        )
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ journal_entry_lines table created\n');

    // 4. Create General Ledger View
    console.log('Creating general_ledger view...');
    await connection.execute(`
      CREATE OR REPLACE VIEW general_ledger AS
      SELECT 
        e.date,
        e.entry_number,
        e.description as entry_description,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        l.debit,
        l.credit,
        l.description as line_description,
        e.reference,
        e.status,
        u.username as created_by
      FROM journal_entry_lines l
      JOIN journal_entries e ON l.entry_id = e.id
      JOIN accounts a ON l.account_id = a.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.status = 'posted'
      ORDER BY e.date DESC, e.id, l.id;
    `);
    console.log('✅ general_ledger view created\n');

    // 5. Create Trial Balance View
    console.log('Creating trial_balance view...');
    await connection.execute(`
      CREATE OR REPLACE VIEW trial_balance AS
      SELECT 
        a.code,
        a.name,
        a.type,
        SUM(l.debit) as total_debit,
        SUM(l.credit) as total_credit,
        SUM(l.debit - l.credit) as balance
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id AND e.status = 'posted'
      WHERE a.is_active = TRUE
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code;
    `);
    console.log('✅ trial_balance view created\n');

    console.log('🎉 All accounting tables created successfully!');
    console.log('\nNext steps:');
    console.log('1. Run seed script: node backend/scripts/seed-chart-of-accounts.js');
    console.log('2. Test accounting service');

  } catch (error) {
    console.error('❌ Error creating accounting tables:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run migration
createAccountingTables()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
