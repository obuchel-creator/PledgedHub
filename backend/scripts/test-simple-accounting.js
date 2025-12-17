const { pool } = require('../config/db');

async function testSimpleJournalEntry() {
  try {
    console.log('🎯 Testing Simple Journal Entry\n');

    // Get accounts
    const [cashAccounts] = await pool.execute('SELECT * FROM accounts WHERE code = ?', ['1000']);
    const [pledgesAccounts] = await pool.execute('SELECT * FROM accounts WHERE code = ?', ['4000']);

    if (cashAccounts.length === 0 || pledgesAccounts.length === 0) {
      throw new Error('Required accounts not found');
    }

    const cashAccountId = cashAccounts[0].id;
    const pledgeIncomeId = pledgesAccounts[0].id;

    console.log(`✓ Cash Account ID: ${cashAccountId}`);
    console.log(`✓ Pledge Income ID: ${pledgeIncomeId}`);

    // Create journal entry
    const [entryResult] = await pool.execute(
      'INSERT INTO journal_entries (entry_number, date, description, reference, status) VALUES (?, ?, ?, ?, ?)',
      [
        `JE-${new Date().toISOString().split('T')[0].replace(/-/g, '')}-0001`,
        new Date().toISOString().split('T')[0],
        'Sample: Pledge payment received - 5,000,000 UGX',
        'SAMPLE-001',
        'posted'
      ]
    );

    const entryId = entryResult.insertId;
    console.log(`\n✅ Journal Entry Created: ID ${entryId}`);

    // Create debit line (Cash DR)
    const [debitLine] = await pool.execute(
      'INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
      [entryId, cashAccountId, 5000000, 0, 'Cash received from pledge']
    );

    console.log(`✓ Debit Line Created: Cash 5,000,000 UGX`);

    // Create credit line (Pledge Income CR)
    const [creditLine] = await pool.execute(
      'INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
      [entryId, pledgeIncomeId, 0, 5000000, 'Pledge income recorded']
    );

    console.log(`✓ Credit Line Created: Pledge Income 5,000,000 UGX`);

    // Verify entry
    const [verification] = await pool.execute(
      'SELECT SUM(debit) as total_debit, SUM(credit) as total_credit FROM journal_entry_lines WHERE entry_id = ?',
      [entryId]
    );

    console.log(`\n💰 Entry Verification:`);
    console.log(`  Total Debits: ${verification[0].total_debit.toLocaleString('en-UG')} UGX`);
    console.log(`  Total Credits: ${verification[0].total_credit.toLocaleString('en-UG')} UGX`);
    console.log(`  Status: ${verification[0].total_debit === verification[0].total_credit ? '✅ BALANCED' : '❌ UNBALANCED'}`);

    // Get account balances
    const [cashBalance] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN account_id = ? THEN debit ELSE 0 END) as cash_debit,
        SUM(CASE WHEN account_id = ? THEN credit ELSE 0 END) as income_credit
      FROM journal_entry_lines jel
      JOIN journal_entries je ON jel.entry_id = je.id
      WHERE je.status = 'posted'
    `, [cashAccountId, pledgeIncomeId]);

    console.log(`\n📊 Account Balances After Entry:`);
    console.log(`  Cash (1000): ${(cashBalance[0].cash_debit || 0).toLocaleString('en-UG')} UGX`);
    console.log(`  Pledge Income (4000): ${(cashBalance[0].income_credit || 0).toLocaleString('en-UG')} UGX`);

    console.log(`\n✨ Accounting system test successful!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testSimpleJournalEntry();
