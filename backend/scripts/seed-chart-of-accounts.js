const { pool } = require('../config/db');

/**
 * Seed Script: Default Chart of Accounts
 * Creates standard accounts for pledge management system
 * Run: node backend/scripts/seed-chart-of-accounts.js
 */

const DEFAULT_ACCOUNTS = [
  // ASSETS (1000-1999)
  { code: '1000', name: 'Cash', type: 'ASSET' },
  { code: '1100', name: 'Mobile Money - MTN', type: 'ASSET' },
  { code: '1101', name: 'Mobile Money - Airtel', type: 'ASSET' },
  { code: '1200', name: 'Pledges Receivable', type: 'ASSET' },
  { code: '1300', name: 'Bank Account', type: 'ASSET' },

  // LIABILITIES (2000-2999)
  { code: '2000', name: 'Unearned Revenue', type: 'LIABILITY' },
  { code: '2100', name: 'Accounts Payable', type: 'LIABILITY' },

  // EQUITY (3000-3999)
  { code: '3000', name: 'Retained Earnings', type: 'EQUITY' },
  { code: '3100', name: 'Current Year Earnings', type: 'EQUITY' },

  // REVENUE (4000-4999)
  { code: '4000', name: 'Pledge Income', type: 'REVENUE' },
  { code: '4100', name: 'Campaign Income', type: 'REVENUE' },
  { code: '4200', name: 'Donation Income', type: 'REVENUE' },

  // EXPENSES (5000-5999)
  { code: '5000', name: 'Operating Expenses', type: 'EXPENSE' },
  { code: '5100', name: 'Transaction Fees', type: 'EXPENSE' },
  { code: '5200', name: 'SMS Expenses', type: 'EXPENSE' },
  { code: '5300', name: 'Email Expenses', type: 'EXPENSE' },
  { code: '5400', name: 'Administrative Expenses', type: 'EXPENSE' }
];

async function seedChartOfAccounts() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🌱 Seeding Chart of Accounts...\n');

    // Check if accounts already exist
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM accounts');
    if (existing[0].count > 0) {
      console.log(`⚠️  Found ${existing[0].count} existing accounts.`);
      console.log('Do you want to skip seeding? (Ctrl+C to cancel, or wait 5 seconds to proceed)\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    let inserted = 0;
    let skipped = 0;

    for (const account of DEFAULT_ACCOUNTS) {
      try {
        await connection.execute(
          `INSERT INTO accounts (code, name, type) 
           VALUES (?, ?, ?)`,
          [account.code, account.name, account.type]
        );
        console.log(`✅ ${account.code} - ${account.name}`);
        inserted++;
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  ${account.code} - ${account.name} (already exists)`);
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`\n🎉 Seeding complete!`);
    console.log(`✅ Inserted: ${inserted} accounts`);
    console.log(`⏭️  Skipped: ${skipped} accounts\n`);

    // Display account summary
    const [assets] = await connection.execute(`SELECT COUNT(*) as count FROM accounts WHERE type = 'ASSET'`);
    const [liabilities] = await connection.execute(`SELECT COUNT(*) as count FROM accounts WHERE type = 'LIABILITY'`);
    const [equity] = await connection.execute(`SELECT COUNT(*) as count FROM accounts WHERE type = 'EQUITY'`);
    const [revenue] = await connection.execute(`SELECT COUNT(*) as count FROM accounts WHERE type = 'REVENUE'`);
    const [expenses] = await connection.execute(`SELECT COUNT(*) as count FROM accounts WHERE type = 'EXPENSE'`);

    console.log('📊 Chart of Accounts Summary:');
    console.log(`   Assets:      ${assets[0].count}`);
    console.log(`   Liabilities: ${liabilities[0].count}`);
    console.log(`   Equity:      ${equity[0].count}`);
    console.log(`   Revenue:     ${revenue[0].count}`);
    console.log(`   Expenses:    ${expenses[0].count}`);
    console.log(`   ────────────────────────`);
    console.log(`   Total:       ${assets[0].count + liabilities[0].count + equity[0].count + revenue[0].count + expenses[0].count}`);

  } catch (error) {
    console.error('❌ Error seeding Chart of Accounts:', error.message);
    throw error;
  } finally {
    connection.release();
    await pool.end();
  }
}

// Run seed script
seedChartOfAccounts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
