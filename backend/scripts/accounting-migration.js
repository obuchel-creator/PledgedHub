/**
 * Accounting System Migration
 * Creates tables for double-entry bookkeeping
 * Phase 1: Foundation (Chart of Accounts, Journal Entries, General Ledger)
 * 
 * Run: node backend/scripts/accounting-migration.js
 */

const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();
  
  try {
    console.log('📊 [ACCOUNTING] Starting migration...\n');

    // ============================================
    // 1. Chart of Accounts Table
    // ============================================
    console.log('📝 [MIGRATION] Creating accounts table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        code VARCHAR(20) UNIQUE NOT NULL COMMENT 'Account code (e.g., 1000, 2000)',
        name VARCHAR(255) NOT NULL COMMENT 'Account name',
        type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL COMMENT 'Account type for financial reporting',
        normal_balance ENUM('DEBIT', 'CREDIT') NOT NULL COMMENT 'Which side increases the account',
        parent_id INT NULL COMMENT 'Parent account for hierarchy',
        description TEXT COMMENT 'Account description',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES accounts(id) ON DELETE SET NULL,
        INDEX idx_type (type),
        INDEX idx_code (code),
        INDEX idx_active (is_active)
      ) COMMENT='Chart of Accounts for double-entry bookkeeping'
    `);
    console.log('✅ [MIGRATION] accounts table created\n');

    // ============================================
    // 2. Journal Entries Table (Header)
    // ============================================
    console.log('📝 [MIGRATION] Creating journal_entries table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_number VARCHAR(50) UNIQUE NOT NULL COMMENT 'Entry identifier (e.g., JE-2025-001)',
        date DATE NOT NULL COMMENT 'Entry date',
        description TEXT COMMENT 'Entry description',
        reference VARCHAR(100) COMMENT 'External reference (pledge ID, payment ref, etc.)',
        category VARCHAR(50) COMMENT 'Category: pledge_payment, manual, system, etc.',
        created_by INT COMMENT 'User who created the entry',
        status ENUM('draft', 'posted', 'void') DEFAULT 'posted' COMMENT 'Entry status',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_date (date),
        INDEX idx_status (status),
        INDEX idx_reference (reference),
        INDEX idx_category (category)
      ) COMMENT='Journal entry headers for financial transactions'
    `);
    console.log('✅ [MIGRATION] journal_entries table created\n');

    // ============================================
    // 3. Journal Entry Lines Table (Detail)
    // ============================================
    console.log('📝 [MIGRATION] Creating journal_entry_lines table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS journal_entry_lines (
        id INT PRIMARY KEY AUTO_INCREMENT,
        entry_id INT NOT NULL COMMENT 'Reference to journal entry',
        account_id INT NOT NULL COMMENT 'Account being debited/credited',
        debit DECIMAL(15, 2) DEFAULT 0 COMMENT 'Debit amount',
        credit DECIMAL(15, 2) DEFAULT 0 COMMENT 'Credit amount',
        description TEXT COMMENT 'Line item description',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
        INDEX idx_entry (entry_id),
        INDEX idx_account (account_id)
      ) COMMENT='Detailed lines for each journal entry'
    `);
    console.log('✅ [MIGRATION] journal_entry_lines table created\n');

    // ============================================
    // 4. General Ledger View
    // ============================================
    console.log('📝 [MIGRATION] Creating general_ledger view...');
    await connection.execute(`
      CREATE OR REPLACE VIEW general_ledger AS
      SELECT 
        e.id as entry_id,
        e.entry_number,
        e.date,
        a.code as account_code,
        a.name as account_name,
        a.type as account_type,
        a.normal_balance,
        l.debit,
        l.credit,
        l.description,
        e.description as entry_description,
        e.reference,
        e.category,
        e.status,
        e.created_by,
        u.name as created_by_name
      FROM journal_entry_lines l
      JOIN journal_entries e ON l.entry_id = e.id
      JOIN accounts a ON l.account_id = a.id
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.status = 'posted'
      ORDER BY e.date DESC, e.id DESC
    `);
    console.log('✅ [MIGRATION] general_ledger view created\n');

    // ============================================
    // 5. Seed Default Chart of Accounts
    // ============================================
    console.log('📝 [MIGRATION] Seeding Chart of Accounts...');
    
    const defaultAccounts = [
      // ASSETS (Debit Normal Balance)
      { code: '1000', name: 'Cash on Hand', type: 'ASSET', normal_balance: 'DEBIT', description: 'Physical currency' },
      { code: '1010', name: 'Bank Account', type: 'ASSET', normal_balance: 'DEBIT', description: 'Primary business bank account' },
      { code: '1100', name: 'Mobile Money', type: 'ASSET', normal_balance: 'DEBIT', description: 'MTN Mobile Money & Airtel Money' },
      { code: '1200', name: 'Pledges Receivable', type: 'ASSET', normal_balance: 'DEBIT', description: 'Outstanding pledge commitments' },
      { code: '1300', name: 'Accounts Receivable', type: 'ASSET', normal_balance: 'DEBIT', description: 'Outstanding invoices' },
      { code: '1400', name: 'Loan Receivable', type: 'ASSET', normal_balance: 'DEBIT', description: 'Loans given to others' },

      // LIABILITIES (Credit Normal Balance)
      { code: '2000', name: 'Unearned Revenue', type: 'LIABILITY', normal_balance: 'CREDIT', description: 'Pledges not yet collected' },
      { code: '2100', name: 'Accounts Payable', type: 'LIABILITY', normal_balance: 'CREDIT', description: 'Outstanding vendor invoices' },
      { code: '2200', name: 'Short-term Loan', type: 'LIABILITY', normal_balance: 'CREDIT', description: 'Loans to be repaid within 1 year' },
      { code: '2300', name: 'Commission Payable', type: 'LIABILITY', normal_balance: 'CREDIT', description: 'Outstanding commission payments' },

      // EQUITY (Credit Normal Balance)
      { code: '3000', name: 'Retained Earnings', type: 'EQUITY', normal_balance: 'CREDIT', description: 'Accumulated profits/losses' },
      { code: '3100', name: 'Capital Contribution', type: 'EQUITY', normal_balance: 'CREDIT', description: 'Founder/owner contributions' },
      { code: '3200', name: 'Donations Received', type: 'EQUITY', normal_balance: 'CREDIT', description: 'Unrestricted donations' },

      // REVENUE (Credit Normal Balance)
      { code: '4000', name: 'Pledge Income', type: 'REVENUE', normal_balance: 'CREDIT', description: 'Income from pledges' },
      { code: '4100', name: 'Campaign Income', type: 'REVENUE', normal_balance: 'CREDIT', description: 'Income from campaigns' },
      { code: '4200', name: 'Donation Income', type: 'REVENUE', normal_balance: 'CREDIT', description: 'General donations' },
      { code: '4300', name: 'Subscription Revenue', type: 'REVENUE', normal_balance: 'CREDIT', description: 'Subscription and membership fees' },
      { code: '4400', name: 'Service Fees', type: 'REVENUE', normal_balance: 'CREDIT', description: 'Service and facilitation fees' },
      { code: '4500', name: 'Interest Income', type: 'REVENUE', normal_balance: 'CREDIT', description: 'Interest earned on accounts' },

      // EXPENSES (Debit Normal Balance)
      { code: '5000', name: 'Salary Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Employee salaries' },
      { code: '5100', name: 'Commission Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Commissions paid to agents' },
      { code: '5200', name: 'Operating Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'General operating expenses' },
      { code: '5300', name: 'Marketing Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Advertising and marketing' },
      { code: '5400', name: 'Technology Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Software, hosting, tech costs' },
      { code: '5500', name: 'Payment Processing Fee', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Card/mobile money processing fees' },
      { code: '5600', name: 'Administrative Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Office supplies, utilities, etc.' },
      { code: '5700', name: 'Professional Services', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Legal, accounting, consulting' },
      { code: '5800', name: 'Bad Debt Expense', type: 'EXPENSE', normal_balance: 'DEBIT', description: 'Uncollectible pledges' },
    ];

    for (const account of defaultAccounts) {
      try {
        await connection.execute(
          'INSERT INTO accounts (code, name, type, normal_balance, description) VALUES (?, ?, ?, ?, ?)',
          [account.code, account.name, account.type, account.normal_balance, account.description]
        );
      } catch (err) {
        if (err.code !== 'ER_DUP_ENTRY') {
          throw err;
        }
        // Account already exists, skip
      }
    }
    console.log(`✅ [MIGRATION] Seeded ${defaultAccounts.length} default accounts\n`);

    // ============================================
    // 6. Add accounting_enabled column to organizations (if multi-tenant)
    // ============================================
    try {
      console.log('📝 [MIGRATION] Adding accounting_enabled column to users table...');
      await connection.execute(`
        ALTER TABLE users ADD COLUMN accounting_enabled BOOLEAN DEFAULT TRUE
      `);
      console.log('✅ [MIGRATION] accounting_enabled column added\n');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  [MIGRATION] accounting_enabled column already exists\n');
      } else {
        throw err;
      }
    }

    console.log('🎉 [ACCOUNTING] Migration completed successfully!');
    console.log('\n📊 Accounting system is ready:');
    console.log('   ✅ Chart of Accounts created (22 default accounts)');
    console.log('   ✅ Journal Entries system active');
    console.log('   ✅ Double-entry bookkeeping enabled');
    console.log('   ✅ General Ledger view available');
    console.log('\n💡 Next: Run backend/models/Account.js and accountingService.js');

  } catch (error) {
    console.error('❌ [ACCOUNTING] Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run migration
runMigration()
  .then(() => {
    console.log('\n✅ Done');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
