/**
 * Financial Reports Service - QuickBooks-Style Reports
 * Generates Balance Sheet, Income Statement, Cash Flow, and Trial Balance
 */

const { pool } = require('../config/db');
const Account = require('../models/Account');

/**
 * Generate Balance Sheet as of a specific date
 * @param {Date} asOfDate - Report date
 * @returns {Promise<Object>} Balance sheet data
 */
async function generateBalanceSheet(asOfDate = new Date()) {
  try {
    // Get all accounts with balances
    const assets = await Account.getAllWithBalances('ASSET', asOfDate);
    const liabilities = await Account.getAllWithBalances('LIABILITY', asOfDate);
    const equity = await Account.getAllWithBalances('EQUITY', asOfDate);
    
    // Calculate totals
    const totalAssets = assets.reduce((sum, a) => sum + parseFloat(a.balance || 0), 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + parseFloat(l.balance || 0), 0);
    const totalEquity = equity.reduce((sum, e) => sum + parseFloat(e.balance || 0), 0);
    
    // Get net income from income statement (adds to equity)
    const incomeResult = await generateIncomeStatement(
      new Date(new Date().getFullYear(), 0, 1), // Year start
      asOfDate
    );
    
    const netIncome = incomeResult.success ? incomeResult.data.netIncome : 0;
    const totalEquityWithIncome = totalEquity + netIncome;
    
    return {
      success: true,
      data: {
        asOfDate,
        assets: {
          accounts: assets.map(a => ({
            code: a.code,
            name: a.name,
            balance: parseFloat(a.balance || 0)
          })),
          total: parseFloat(totalAssets.toFixed(2))
        },
        liabilities: {
          accounts: liabilities.map(l => ({
            code: l.code,
            name: l.name,
            balance: parseFloat(l.balance || 0)
          })),
          total: parseFloat(totalLiabilities.toFixed(2))
        },
        equity: {
          accounts: equity.map(e => ({
            code: e.code,
            name: e.name,
            balance: parseFloat(e.balance || 0)
          })),
          netIncome: parseFloat(netIncome.toFixed(2)),
          total: parseFloat(totalEquityWithIncome.toFixed(2))
        },
        totalLiabilitiesAndEquity: parseFloat((totalLiabilities + totalEquityWithIncome).toFixed(2)),
        balanced: Math.abs(totalAssets - (totalLiabilities + totalEquityWithIncome)) < 0.01
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating balance sheet:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate Income Statement (Profit & Loss) for date range
 * @param {Date} startDate - Period start
 * @param {Date} endDate - Period end
 * @returns {Promise<Object>} Income statement data
 */
async function generateIncomeStatement(startDate, endDate = new Date()) {
  try {
    // Get revenue accounts
    const [revenues] = await pool.execute(`
      SELECT 
        a.code,
        a.name,
        COALESCE(SUM(l.credit - l.debit), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id
      WHERE a.type = 'REVENUE'
        AND a.is_active = TRUE
        AND e.status = 'posted'
        AND e.date BETWEEN ? AND ?
      GROUP BY a.id, a.code, a.name
      ORDER BY a.code
    `, [startDate, endDate]);
    
    // Get expense accounts
    const [expenses] = await pool.execute(`
      SELECT 
        a.code,
        a.name,
        COALESCE(SUM(l.debit - l.credit), 0) as amount
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id
      WHERE a.type = 'EXPENSE'
        AND a.is_active = TRUE
        AND e.status = 'posted'
        AND e.date BETWEEN ? AND ?
      GROUP BY a.id, a.code, a.name
      ORDER BY a.code
    `, [startDate, endDate]);
    
    // Calculate totals
    const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    
    return {
      success: true,
      data: {
        startDate,
        endDate,
        revenue: {
          accounts: revenues.map(r => ({
            code: r.code,
            name: r.name,
            amount: parseFloat(r.amount || 0)
          })),
          total: parseFloat(totalRevenue.toFixed(2))
        },
        expenses: {
          accounts: expenses.map(e => ({
            code: e.code,
            name: e.name,
            amount: parseFloat(e.amount || 0)
          })),
          total: parseFloat(totalExpenses.toFixed(2))
        },
        netIncome: parseFloat(netIncome.toFixed(2)),
        profitMargin: totalRevenue > 0 ? parseFloat(((netIncome / totalRevenue) * 100).toFixed(2)) : 0
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating income statement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate Trial Balance
 * @param {Date} asOfDate - Report date
 * @returns {Promise<Object>} Trial balance data
 */
async function generateTrialBalance(asOfDate = new Date()) {
  try {
    const [accounts] = await pool.execute(`
      SELECT 
        a.code,
        a.name,
        a.type,
        COALESCE(SUM(l.debit), 0) as total_debit,
        COALESCE(SUM(l.credit), 0) as total_credit
      FROM accounts a
      LEFT JOIN journal_entry_lines l ON a.id = l.account_id
      LEFT JOIN journal_entries e ON l.entry_id = e.id
      WHERE a.is_active = TRUE
        AND (e.status = 'posted' OR e.status IS NULL)
        AND (e.date <= ? OR e.date IS NULL)
      GROUP BY a.id, a.code, a.name, a.type
      HAVING total_debit > 0 OR total_credit > 0
      ORDER BY a.code
    `, [asOfDate]);
    
    let totalDebits = 0;
    let totalCredits = 0;
    
    const accountsData = accounts.map(a => {
      const debit = parseFloat(a.total_debit || 0);
      const credit = parseFloat(a.total_credit || 0);
      
      totalDebits += debit;
      totalCredits += credit;
      
      return {
        code: a.code,
        name: a.name,
        type: a.type,
        debit: parseFloat(debit.toFixed(2)),
        credit: parseFloat(credit.toFixed(2))
      };
    });
    
    return {
      success: true,
      data: {
        asOfDate,
        accounts: accountsData,
        totalDebits: parseFloat(totalDebits.toFixed(2)),
        totalCredits: parseFloat(totalCredits.toFixed(2)),
        balanced: Math.abs(totalDebits - totalCredits) < 0.01,
        difference: parseFloat((totalDebits - totalCredits).toFixed(2))
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating trial balance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate Cash Flow Statement
 * @param {Date} startDate - Period start
 * @param {Date} endDate - Period end
 * @returns {Promise<Object>} Cash flow data
 */
async function generateCashFlowStatement(startDate, endDate = new Date()) {
  try {
    // Get cash accounts (1000-1099 range)
    const [cashAccounts] = await pool.execute(`
      SELECT id, code, name FROM accounts 
      WHERE type = 'ASSET' 
        AND code LIKE '10%' 
        AND is_active = TRUE
      ORDER BY code
    `);
    
    if (cashAccounts.length === 0) {
      return { success: false, error: 'No cash accounts found' };
    }
    
    const cashAccountIds = cashAccounts.map(a => a.id);
    
    // Get all cash movements
    const [transactions] = await pool.execute(`
      SELECT 
        e.date,
        e.entry_number,
        e.description,
        a.code as account_code,
        a.name as account_name,
        l.debit,
        l.credit
      FROM journal_entry_lines l
      JOIN journal_entries e ON l.entry_id = e.id
      JOIN accounts a ON l.account_id = a.id
      WHERE l.account_id IN (?)
        AND e.status = 'posted'
        AND e.date BETWEEN ? AND ?
      ORDER BY e.date, e.id
    `, [cashAccountIds, startDate, endDate]);
    
    let cashInflows = 0;
    let cashOutflows = 0;
    
    const movements = transactions.map(t => {
      const debit = parseFloat(t.debit || 0);
      const credit = parseFloat(t.credit || 0);
      const netChange = debit - credit;
      
      if (netChange > 0) {
        cashInflows += netChange;
      } else {
        cashOutflows += Math.abs(netChange);
      }
      
      return {
        date: t.date,
        entryNumber: t.entry_number,
        description: t.description,
        account: `${t.account_code} - ${t.account_name}`,
        inflow: debit > 0 ? parseFloat(debit.toFixed(2)) : 0,
        outflow: credit > 0 ? parseFloat(credit.toFixed(2)) : 0
      };
    });
    
    // Calculate beginning and ending balance
    const [beginningBalance] = await pool.execute(`
      SELECT COALESCE(SUM(l.debit - l.credit), 0) as balance
      FROM journal_entry_lines l
      JOIN journal_entries e ON l.entry_id = e.id
      WHERE l.account_id IN (?)
        AND e.status = 'posted'
        AND e.date < ?
    `, [cashAccountIds, startDate]);
    
    const beginBalance = parseFloat(beginningBalance[0].balance || 0);
    const netChange = cashInflows - cashOutflows;
    const endBalance = beginBalance + netChange;
    
    return {
      success: true,
      data: {
        startDate,
        endDate,
        beginningBalance: parseFloat(beginBalance.toFixed(2)),
        cashInflows: parseFloat(cashInflows.toFixed(2)),
        cashOutflows: parseFloat(cashOutflows.toFixed(2)),
        netChange: parseFloat(netChange.toFixed(2)),
        endingBalance: parseFloat(endBalance.toFixed(2)),
        movements
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating cash flow statement:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate Accounts Receivable Aging Report
 * @param {Date} asOfDate - Report date
 * @returns {Promise<Object>} Aging report data
 */
async function generateARAgingReport(asOfDate = new Date()) {
  try {
    // Get pledges receivable account
    const receivableAccount = await Account.getByCode('1200');
    if (!receivableAccount) {
      return { success: false, error: 'Pledges Receivable account (1200) not found' };
    }
    
    // Get all unpaid pledges
    const [pledges] = await pool.execute(`
      SELECT 
        id,
        donor_name,
        donor_phone,
        amount,
        amount_paid,
        (amount - COALESCE(amount_paid, 0)) as balance,
        collection_date,
        DATEDIFF(?, collection_date) as days_overdue
      FROM pledges
      WHERE deleted = 0
        AND (amount - COALESCE(amount_paid, 0)) > 0
        AND collection_date <= ?
      ORDER BY collection_date
    `, [asOfDate, asOfDate]);
    
    // Categorize by age
    const aging = {
      current: { pledges: [], total: 0 },      // Not yet due
      days_1_30: { pledges: [], total: 0 },    // 1-30 days overdue
      days_31_60: { pledges: [], total: 0 },   // 31-60 days overdue
      days_61_90: { pledges: [], total: 0 },   // 61-90 days overdue
      days_90_plus: { pledges: [], total: 0 }  // 90+ days overdue
    };
    
    pledges.forEach(pledge => {
      const balance = parseFloat(pledge.balance);
      const daysOverdue = pledge.days_overdue;
      
      const pledgeData = {
        id: pledge.id,
        donor: pledge.donor_name,
        phone: pledge.donor_phone,
        amount: parseFloat(pledge.amount),
        paid: parseFloat(pledge.amount_paid || 0),
        balance: parseFloat(balance.toFixed(2)),
        dueDate: pledge.collection_date,
        daysOverdue
      };
      
      if (daysOverdue < 0) {
        aging.current.pledges.push(pledgeData);
        aging.current.total += balance;
      } else if (daysOverdue <= 30) {
        aging.days_1_30.pledges.push(pledgeData);
        aging.days_1_30.total += balance;
      } else if (daysOverdue <= 60) {
        aging.days_31_60.pledges.push(pledgeData);
        aging.days_31_60.total += balance;
      } else if (daysOverdue <= 90) {
        aging.days_61_90.pledges.push(pledgeData);
        aging.days_61_90.total += balance;
      } else {
        aging.days_90_plus.pledges.push(pledgeData);
        aging.days_90_plus.total += balance;
      }
    });
    
    // Round totals
    Object.keys(aging).forEach(key => {
      aging[key].total = parseFloat(aging[key].total.toFixed(2));
    });
    
    const grandTotal = Object.values(aging).reduce((sum, bucket) => sum + bucket.total, 0);
    
    return {
      success: true,
      data: {
        asOfDate,
        aging,
        summary: {
          totalReceivable: parseFloat(grandTotal.toFixed(2)),
          totalPledges: pledges.length,
          currentCount: aging.current.pledges.length,
          overdueCount: pledges.length - aging.current.pledges.length
        }
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating AR aging report:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate financial dashboard summary
 * @returns {Promise<Object>} Dashboard data
 */
async function generateDashboard() {
  try {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Get key metrics
    const [balanceSheet, incomeYTD, incomeMonth, arAging] = await Promise.all([
      generateBalanceSheet(today),
      generateIncomeStatement(yearStart, today),
      generateIncomeStatement(monthStart, today),
      generateARAgingReport(today)
    ]);
    
    return {
      success: true,
      data: {
        balanceSheet: balanceSheet.success ? balanceSheet.data : null,
        incomeYTD: incomeYTD.success ? incomeYTD.data : null,
        incomeMonth: incomeMonth.success ? incomeMonth.data : null,
        arAging: arAging.success ? arAging.data : null,
        generatedAt: new Date()
      }
    };
    
  } catch (error) {
    console.error('❌ Error generating dashboard:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  generateBalanceSheet,
  generateIncomeStatement,
  generateTrialBalance,
  generateCashFlowStatement,
  generateARAgingReport,
  generateDashboard
};
