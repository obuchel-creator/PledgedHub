const { pool } = require('../config/db');

// Create accounts table
async function createAccountsTable() {
  console.log('📊 Creating accounts table...');
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(20) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
      parent_id INT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES accounts(id),
      INDEX idx_type (type),
      INDEX idx_code (code)
    )
  `);
  console.log('✅ Accounts table created');
}

// Create journal entries header table
async function createJournalEntriesTable() {
  console.log('📔 Creating journal_entries table...');
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
      INDEX idx_date (date),
      INDEX idx_status (status),
      INDEX idx_reference (reference)
    )
  `);
  console.log('✅ Journal entries table created');
}

// Create journal entry lines table
async function createJournalEntryLinesTable() {
  console.log('📝 Creating journal_entry_lines table...');
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
      FOREIGN KEY (account_id) REFERENCES accounts(id),
      INDEX idx_entry (entry_id),
      INDEX idx_account (account_id)
    )
  `);
  console.log('✅ Journal entry lines table created');
}

// Seed default chart of accounts
async function seedDefaultAccounts() {
  console.log('🌱 Seeding chart of accounts...');

  const DEFAULT_ACCOUNTS = [
    // ASSETS (1000-1999)
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Mobile Money (MTN)', type: 'ASSET' },
    { code: '1110', name: 'Mobile Money (Airtel)', type: 'ASSET' },
    { code: '1200', name: 'Pledges Receivable', type: 'ASSET' },
    { code: '1300', name: 'Bank Account', type: 'ASSET' },

    // LIABILITIES (2000-2999)
    { code: '2000', name: 'Unearned Revenue (Pledges)', type: 'LIABILITY' },
    { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '2200', name: 'Taxes Payable', type: 'LIABILITY' },

    // EQUITY (3000-3999)
    { code: '3000', name: 'Retained Earnings', type: 'EQUITY' },
    { code: '3100', name: 'Opening Balance', type: 'EQUITY' },

    // REVENUE (4000-4999)
    { code: '4000', name: 'Pledge Income', type: 'REVENUE' },
    { code: '4100', name: 'Campaign Collections', type: 'REVENUE' },
    { code: '4200', name: 'Donor Contributions', type: 'REVENUE' },

    // EXPENSES (5000-5999)
    { code: '5000', name: 'Operating Expenses', type: 'EXPENSE' },
    { code: '5100', name: 'Campaign Expenses', type: 'EXPENSE' },
    { code: '5200', name: 'Payment Processing Fees', type: 'EXPENSE' },
    { code: '5300', name: 'Administrative Expenses', type: 'EXPENSE' },
  ];

  for (const account of DEFAULT_ACCOUNTS) {
    try {
      await pool.execute(
        'INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)',
        [account.code, account.name, account.type]
      );
      console.log(`  ✓ ${account.code} - ${account.name}`);
    } catch (error) {
      if (error.code !== 'ER_DUP_ENTRY') {
        throw error;
      }
    }
  }
  console.log('✅ Chart of accounts seeded');
}

// Main migration function
async function runMigration() {
  try {
    console.log('🚀 Starting accounting system migration...\n');

    await createAccountsTable();
    await createJournalEntriesTable();
    await createJournalEntryLinesTable();
    await seedDefaultAccounts();

    console.log('\n✨ Accounting system migration completed successfully!');
    console.log('📊 Summary:');
    console.log('  ✓ accounts table created');
    console.log('  ✓ journal_entries table created');
    console.log('  ✓ journal_entry_lines table created');
    console.log('  ✓ 16 chart of accounts records seeded');

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
