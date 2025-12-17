const { pool } = require('../config/db');
const financialReportsService = require('../services/financialReportsService');

async function generateFinancialReports() {
  try {
    console.log('📊 PLEDGEHUB FINANCIAL REPORTS\n');
    console.log('=' .repeat(60));

    // 1. Get Trial Balance
    console.log('\n1️⃣  TRIAL BALANCE');
    console.log('-'.repeat(60));
    const [trialBalance] = await pool.execute(`
      SELECT 
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(l.debit), 0) as total_debit,
        COALESCE(SUM(l.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id
      WHERE (e.status = 'posted' OR e.status IS NULL)
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.code
    `);

    const totalDebits = trialBalance.reduce((sum, a) => sum + (a.total_debit || 0), 0);
    const totalCredits = trialBalance.reduce((sum, a) => sum + (a.total_credit || 0), 0);

    console.log(`✅ Generated as of: ${new Date().toDateString()}`);
    console.log(`\nAccounts (showing only non-zero balances):`);
    trialBalance.forEach(acc => {
      if ((acc.total_debit || 0) !== 0 || (acc.total_credit || 0) !== 0) {
        console.log(`  ${acc.code.padEnd(6)} ${(acc.name || '').padEnd(30)} | DR: ${String(acc.total_debit || 0).padStart(12)} | CR: ${String(acc.total_credit || 0).padStart(12)}`);
      }
    });
    console.log(`\nTotals:`);
    console.log(`  Total Debits:  ${totalDebits.toLocaleString('en-UG')}`);
    console.log(`  Total Credits: ${totalCredits.toLocaleString('en-UG')}`);
    console.log(`  Difference:    ${Math.abs(totalDebits - totalCredits).toFixed(2)}`);
    console.log(`  Status:        ${Math.abs(totalDebits - totalCredits) < 0.01 ? '✅ BALANCED' : '❌ UNBALANCED'}`)

    // 2. Get Balance Sheet
    console.log('\n\n2️⃣  BALANCE SHEET');
    console.log('-'.repeat(60));
    
    const [balanceSheetAccounts] = await pool.execute(`
      SELECT 
        a.id,
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(l.debit), 0) as total_debit,
        COALESCE(SUM(l.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id
      WHERE a.type IN ('ASSET', 'LIABILITY', 'EQUITY')
        AND (e.status = 'posted' OR e.status IS NULL)
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `);

    console.log(`✅ Generated as of: ${new Date().toDateString()}`);
    
    const assets = balanceSheetAccounts.filter(a => a.type === 'ASSET');
    const liabilities = balanceSheetAccounts.filter(a => a.type === 'LIABILITY');
    const equity = balanceSheetAccounts.filter(a => a.type === 'EQUITY');

    const calcBalance = (a) => a.type === 'ASSET' ? (a.total_debit - a.total_credit) : (a.total_credit - a.total_debit);

    const assetTotal = assets.reduce((sum, a) => sum + calcBalance(a), 0);
    const liabilityTotal = liabilities.reduce((sum, l) => sum + calcBalance(l), 0);
    const equityTotal = equity.reduce((sum, e) => sum + calcBalance(e), 0);

    console.log(`\nASSETS:`);
    assets.forEach(a => {
      const balance = calcBalance(a);
      if (balance !== 0) console.log(`  ${a.code} ${(a.name || '').padEnd(40)} ${balance.toLocaleString('en-UG')}`);
    });
    console.log(`  ${'TOTAL ASSETS'.padEnd(46)} ${assetTotal.toLocaleString('en-UG')}`);

    console.log(`\nLIABILITIES:`);
    liabilities.forEach(l => {
      const balance = calcBalance(l);
      if (balance !== 0) console.log(`  ${l.code} ${(l.name || '').padEnd(40)} ${balance.toLocaleString('en-UG')}`);
    });
    console.log(`  ${'TOTAL LIABILITIES'.padEnd(46)} ${liabilityTotal.toLocaleString('en-UG')}`);

    console.log(`\nEQUITY:`);
    equity.forEach(e => {
      const balance = calcBalance(e);
      if (balance !== 0) console.log(`  ${e.code} ${(e.name || '').padEnd(40)} ${balance.toLocaleString('en-UG')}`);
    });
    console.log(`  ${'TOTAL EQUITY'.padEnd(46)} ${equityTotal.toLocaleString('en-UG')}`);

    console.log(`\n${'TOTAL LIABILITIES + EQUITY'.padEnd(46)} ${(liabilityTotal + equityTotal).toLocaleString('en-UG')}`);
    console.log(`  Status: ${Math.abs(assetTotal - (liabilityTotal + equityTotal)) < 0.01 ? '✅ BALANCED' : '❌ UNBALANCED'}`)

    // 3. Get Income Statement
    console.log('\n\n3️⃣  INCOME STATEMENT (Monthly)');
    console.log('-'.repeat(60));
    
    const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nextMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);

    const [incomeAccounts] = await pool.execute(`
      SELECT 
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(l.debit), 0) as total_debit,
        COALESCE(SUM(l.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id
      WHERE a.type IN ('REVENUE', 'EXPENSE')
        AND e.date BETWEEN ? AND ?
        AND e.status = 'posted'
      GROUP BY a.id, a.code, a.name, a.type
      ORDER BY a.type, a.code
    `, [currentMonth, nextMonth]);

    console.log(`✅ Period: ${currentMonth.toISOString().split('T')[0]} to ${nextMonth.toISOString().split('T')[0]}`);
    
    const revenues = incomeAccounts.filter(a => a.type === 'REVENUE');
    const expenses = incomeAccounts.filter(a => a.type === 'EXPENSE');

    const revenueTotal = revenues.reduce((sum, r) => sum + (r.total_credit - r.total_debit), 0);
    const expenseTotal = expenses.reduce((sum, e) => sum + (e.total_debit - e.total_credit), 0);
    const netIncome = revenueTotal - expenseTotal;

    console.log(`\nREVENUES:`);
    revenues.forEach(r => {
      const balance = r.total_credit - r.total_debit;
      if (balance !== 0) console.log(`  ${r.code} ${(r.name || '').padEnd(40)} ${balance.toLocaleString('en-UG')}`);
    });
    console.log(`  ${'TOTAL REVENUES'.padEnd(46)} ${revenueTotal.toLocaleString('en-UG')}`);

    console.log(`\nEXPENSES:`);
    expenses.forEach(e => {
      const balance = e.total_debit - e.total_credit;
      if (balance !== 0) console.log(`  ${e.code} ${(e.name || '').padEnd(40)} ${balance.toLocaleString('en-UG')}`);
    });
    console.log(`  ${'TOTAL EXPENSES'.padEnd(46)} ${expenseTotal.toLocaleString('en-UG')}`);

    console.log(`\n${'NET INCOME'.padEnd(46)} ${netIncome.toLocaleString('en-UG')}`);
    const margin = revenueTotal > 0 ? (netIncome / revenueTotal * 100).toFixed(2) : 'N/A';
    console.log(`  Profit Margin: ${margin}%`)

    // 4. Get Journal Entry Count
    const [entryStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_entries,
        SUM(COALESCE(l.debit, 0)) as total_debits,
        SUM(COALESCE(l.credit, 0)) as total_credits
      FROM journal_entries e
      LEFT JOIN journal_entry_lines l ON e.id = l.entry_id
      WHERE e.status = 'posted'
    `);

    console.log('\n\n4️⃣  ACCOUNTING SYSTEM SUMMARY');
    console.log('-'.repeat(60));
    console.log(`✅ Total Journal Entries: ${entryStats[0].total_entries}`);
    console.log(`✅ Total Debits Posted: ${entryStats[0].total_debits.toLocaleString('en-UG')} UGX`);
    console.log(`✅ Total Credits Posted: ${entryStats[0].total_credits.toLocaleString('en-UG')} UGX`);

    // Get Chart of Accounts summary
    const [coaSummary] = await pool.execute(`
      SELECT type, COUNT(*) as count FROM accounts GROUP BY type
    `);

    console.log(`\n📊 Chart of Accounts:`);
    coaSummary.forEach(row => {
      console.log(`  ${row.type.padEnd(15)} ${row.count} accounts`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✨ Financial Reports Generated Successfully!');
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

generateFinancialReports();
