const { pool } = require('../config/db');

async function runMigration() {
  console.log('🔄 Starting Accounting System Migration...\n');

  try {
    // 1. Create accounts table
    console.log('1️⃣  Creating accounts table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
        parent_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL,
        INDEX idx_code (code),
        INDEX idx_type (type),
        INDEX idx_parent_id (parent_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Accounts table created\n');

    // 2. Create journal_entries table
    console.log('2️⃣  Creating journal_entries table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_number VARCHAR(50) UNIQUE NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        reference VARCHAR(100),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_date (date),
        INDEX idx_entry_number (entry_number),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Journal entries table created\n');

    // 3. Create journal_entry_lines table
    console.log('3️⃣  Creating journal_entry_lines table...');
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_id INT NOT NULL,
        account_id INT NOT NULL,
        debit DECIMAL(15, 2) DEFAULT 0,
        credit DECIMAL(15, 2) DEFAULT 0,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
        INDEX idx_entry_id (entry_id),
        INDEX idx_account_id (account_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ Journal entry lines table created\n');

    // 4. Create general_ledger view
    console.log('4️⃣  Creating general_ledger view...');
    await pool.execute(`
      CREATE OR REPLACE VIEW general_ledger AS
      SELECT 
        e.id as entry_id,
        e.entry_number,
        e.date,
        e.description,
        e.reference,
        e.created_by,
        e.created_at,
        a.id as account_id,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        l.debit,
        l.credit,
        l.description as line_description
      FROM journal_entry_lines l
      JOIN journal_entries e ON l.entry_id = e.id
      JOIN accounts a ON l.account_id = a.id
      WHERE e.status = 'posted'
      ORDER BY e.date DESC, e.id DESC, l.id
    `);
    console.log('   ✅ General ledger view created\n');

    // 5. Seed default chart of accounts
    console.log('5️⃣  Seeding default chart of accounts...');
    const defaultAccounts = [
      { code: '1000', name: 'Cash', type: 'ASSET' },
      { code: '1100', name: 'Mobile Money', type: 'ASSET' },
      { code: '1200', name: 'Pledges Receivable', type: 'ASSET' },
      { code: '1050', name: 'Bank Account', type: 'ASSET' },
      { code: '2000', name: 'Unearned Revenue', type: 'LIABILITY' },
      { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
      { code: '3000', name: 'Retained Earnings', type: 'EQUITY' },
      { code: '4000', name: 'Pledge Income', type: 'REVENUE' },
      { code: '4100', name: 'Donation Income', type: 'REVENUE' },
      { code: '5000', name: 'Operating Expenses', type: 'EXPENSE' },
      { code: '5100', name: 'Transaction Fees', type: 'EXPENSE' },
      { code: '5200', name: 'Payment Processing Fees', type: 'EXPENSE' }
    ];

    for (const account of defaultAccounts) {
      const [existing] = await pool.execute(
        `SELECT id FROM accounts WHERE code = ?`,
        [account.code]
      );

      if (!existing || existing.length === 0) {
        await pool.execute(
          `INSERT INTO accounts (code, name, type, is_active) VALUES (?, ?, ?, TRUE)`,
          [account.code, account.name, account.type]
        );
        console.log(`   ✅ Added account: ${account.code} - ${account.name}`);
      }
    }
    console.log('');

    // 6. Add accounting columns to pledges table if needed
    console.log('6️⃣  Checking pledge accounting columns...');
    const [pledgeColumns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'pledges'
    `);

    const columnNames = pledgeColumns.map(c => c.COLUMN_NAME);

    if (!columnNames.includes('accounting_entry_id')) {
      await pool.execute(`
        ALTER TABLE pledges 
        ADD COLUMN accounting_entry_id INT NULL AFTER id,
        ADD FOREIGN KEY (accounting_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL
      `);
      console.log('   ✅ Added accounting_entry_id to pledges\n');
    } else {
      console.log('   ℹ️  Accounting columns already exist\n');
    }

    // 7. Add accounting columns to payments table if needed
    console.log('7️⃣  Checking payment accounting columns...');
    const [paymentColumns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'payments'
    `);

    const paymentColumnNames = paymentColumns.map(c => c.COLUMN_NAME);

    if (!paymentColumnNames.includes('accounting_entry_id')) {
      await pool.execute(`
        ALTER TABLE payments 
        ADD COLUMN accounting_entry_id INT NULL AFTER id,
        ADD FOREIGN KEY (accounting_entry_id) REFERENCES journal_entries(id) ON DELETE SET NULL
      `);
      console.log('   ✅ Added accounting_entry_id to payments\n');
    } else {
      console.log('   ℹ️  Payment accounting columns already exist\n');
    }

    console.log('✅ Accounting system migration completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   ✓ Accounts table created');
    console.log('   ✓ Journal entries table created');
    console.log('   ✓ Journal entry lines table created');
    console.log('   ✓ General ledger view created');
    console.log('   ✓ 12 default accounts seeded');
    console.log('   ✓ Pledge and payment accounting links established\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
