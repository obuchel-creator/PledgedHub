/**
 * Financial Analytics Service - QuickBooks-Style Analytics
 * Provides Profit & Loss, Cash Flow, Financial Health metrics
 */

const { pool } = require('../config/db');

/**
 * Get Profit & Loss Statement
 * Similar to QuickBooks P&L report
 */
async function getProfitAndLoss(startDate, endDate, userId = null) {
  try {
    let userFilter = '';
    let params = [startDate, endDate];
    
    if (userId) {
      userFilter = ' AND user_id = ?';
      params.push(userId);
    }

    // INCOME: All collected payments
    const [income] = await pool.execute(`
      SELECT 
        COALESCE(SUM(amount), 0) as totalIncome,
        COUNT(*) as incomeTransactions,
        SUM(CASE WHEN payment_method = 'mtn' THEN amount ELSE 0 END) as mtnIncome,
        SUM(CASE WHEN payment_method = 'airtel' THEN amount ELSE 0 END) as airtelIncome,
        SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cashIncome,
        SUM(CASE WHEN payment_method = 'bank' THEN amount ELSE 0 END) as bankIncome
      FROM pledges
      WHERE deleted = 0 
        AND status IN ('paid', 'completed')
        AND collection_date BETWEEN ? AND ?
        ${userFilter}
    `, params);

    // EXPENSES: Commission fees, processing fees, operational costs
    const [expenses] = await pool.execute(`
      SELECT 
        COALESCE(SUM(fee_amount), 0) as totalExpenses,
        COUNT(*) as expenseTransactions,
        SUM(CASE WHEN fee_type = 'platform' THEN fee_amount ELSE 0 END) as platformFees,
        SUM(CASE WHEN fee_type = 'payment' THEN fee_amount ELSE 0 END) as paymentProcessingFees,
        SUM(CASE WHEN fee_type = 'sms' THEN fee_amount ELSE 0 END) as smsFees,
        SUM(CASE WHEN fee_type = 'email' THEN fee_amount ELSE 0 END) as emailFees
      FROM cash_processing_fees
      WHERE created_at BETWEEN ? AND ?
      ${userFilter.replace('user_id', 'collector_user_id')}
    `, params);

    const totalIncome = parseFloat(income[0].totalIncome);
    const totalExpenses = parseFloat(expenses[0].totalExpenses);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0;

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        income: {
          total: totalIncome,
          transactions: income[0].incomeTransactions,
          breakdown: {
            mtn: parseFloat(income[0].mtnIncome),
            airtel: parseFloat(income[0].airtelIncome),
            cash: parseFloat(income[0].cashIncome),
            bank: parseFloat(income[0].bankIncome)
          }
        },
        expenses: {
          total: totalExpenses,
          transactions: expenses[0].expenseTransactions,
          breakdown: {
            platformFees: parseFloat(expenses[0].platformFees),
            paymentProcessing: parseFloat(expenses[0].paymentProcessingFees),
            sms: parseFloat(expenses[0].smsFees),
            email: parseFloat(expenses[0].emailFees)
          }
        },
        netProfit: netProfit,
        profitMargin: parseFloat(profitMargin)
      }
    };
  } catch (error) {
    console.error('Error in getProfitAndLoss:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Cash Flow Analysis
 * Tracks money in vs money out over time
 */
async function getCashFlow(startDate, endDate, userId = null, groupBy = 'day') {
  try {
    let userFilter = '';
    let params = [startDate, endDate];
    
    if (userId) {
      userFilter = ' AND user_id = ?';
      params.push(userId);
    }

    let dateFormat;
    switch(groupBy) {
      case 'week':
        dateFormat = 'YEARWEEK(collection_date)';
        break;
      case 'month':
        dateFormat = 'DATE_FORMAT(collection_date, "%Y-%m")';
        break;
      case 'day':
      default:
        dateFormat = 'DATE(collection_date)';
    }

    // Cash inflows (collected payments)
    const [inflows] = await pool.execute(`
      SELECT 
        ${dateFormat} as period,
        SUM(amount) as cashIn,
        COUNT(*) as transactions
      FROM pledges
      WHERE deleted = 0 
        AND status IN ('paid', 'completed')
        AND collection_date BETWEEN ? AND ?
        ${userFilter}
      GROUP BY period
      ORDER BY period ASC
    `, params);

    // Cash outflows (fees and payouts)
    const [outflows] = await pool.execute(`
      SELECT 
        ${dateFormat.replace('collection_date', 'created_at')} as period,
        SUM(fee_amount) as cashOut
      FROM cash_processing_fees
      WHERE created_at BETWEEN ? AND ?
        ${userFilter.replace('user_id', 'collector_user_id')}
      GROUP BY period
      ORDER BY period ASC
    `, params);

    // Merge and calculate net cash flow
    const flowMap = new Map();
    
    inflows.forEach(row => {
      flowMap.set(row.period, {
        period: row.period,
        cashIn: parseFloat(row.cashIn),
        cashOut: 0,
        netFlow: parseFloat(row.cashIn),
        transactions: row.transactions
      });
    });

    outflows.forEach(row => {
      if (flowMap.has(row.period)) {
        const existing = flowMap.get(row.period);
        existing.cashOut = parseFloat(row.cashOut);
        existing.netFlow = existing.cashIn - existing.cashOut;
      } else {
        flowMap.set(row.period, {
          period: row.period,
          cashIn: 0,
          cashOut: parseFloat(row.cashOut),
          netFlow: -parseFloat(row.cashOut),
          transactions: 0
        });
      }
    });

    const cashFlowData = Array.from(flowMap.values()).sort((a, b) => 
      a.period.localeCompare(b.period)
    );

    // Calculate cumulative cash flow
    let cumulativeFlow = 0;
    cashFlowData.forEach(item => {
      cumulativeFlow += item.netFlow;
      item.cumulativeFlow = cumulativeFlow;
    });

    return {
      success: true,
      data: {
        period: { start: startDate, end: endDate },
        groupBy,
        flows: cashFlowData,
        summary: {
          totalCashIn: cashFlowData.reduce((sum, item) => sum + item.cashIn, 0),
          totalCashOut: cashFlowData.reduce((sum, item) => sum + item.cashOut, 0),
          netCashFlow: cumulativeFlow
        }
      }
    };
  } catch (error) {
    console.error('Error in getCashFlow:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Financial Health Metrics
 * Key performance indicators for financial status
 */
async function getFinancialHealth(userId = null) {
  try {
    let userFilter = '';
    let params = [];
    
    if (userId) {
      userFilter = ' AND user_id = ?';
      params.push(userId);
    }

    // Current Period (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const [currentMetrics] = await pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('paid', 'completed') THEN amount ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN status NOT IN ('paid', 'completed', 'cancelled') THEN amount ELSE 0 END), 0) as outstanding,
        COUNT(CASE WHEN status IN ('paid', 'completed') THEN 1 END) as paidCount,
        COUNT(CASE WHEN status NOT IN ('paid', 'completed', 'cancelled') THEN 1 END) as pendingCount,
        COUNT(*) as totalCount,
        AVG(CASE WHEN status IN ('paid', 'completed') THEN amount END) as avgTransactionValue
      FROM pledges
      WHERE deleted = 0 
        AND created_at BETWEEN ? AND ?
        ${userFilter}
    `, [thirtyDaysAgo, today, ...params]);

    // Previous Period (60-30 days ago)
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const [previousMetrics] = await pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN status IN ('paid', 'completed') THEN amount ELSE 0 END), 0) as revenue
      FROM pledges
      WHERE deleted = 0 
        AND created_at BETWEEN ? AND ?
        ${userFilter}
    `, [sixtyDaysAgo, thirtyDaysAgo, ...params]);

    const currentRevenue = parseFloat(currentMetrics[0].revenue);
    const previousRevenue = parseFloat(previousMetrics[0].revenue);
    const revenueGrowth = previousRevenue > 0 
      ? (((currentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(2)
      : 0;

    const collectionRate = currentMetrics[0].totalCount > 0
      ? ((currentMetrics[0].paidCount / currentMetrics[0].totalCount) * 100).toFixed(2)
      : 0;

    // Calculate Days Sales Outstanding (DSO)
    const [dsoData] = await pool.execute(`
      SELECT 
        AVG(DATEDIFF(
          COALESCE(last_payment_date, CURDATE()),
          created_at
        )) as avgDaysToPayment
      FROM pledges
      WHERE deleted = 0 
        AND status IN ('paid', 'completed')
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
        ${userFilter}
    `, params);

    return {
      success: true,
      data: {
        currentPeriod: {
          revenue: currentRevenue,
          outstanding: parseFloat(currentMetrics[0].outstanding),
          paidCount: currentMetrics[0].paidCount,
          pendingCount: currentMetrics[0].pendingCount,
          totalCount: currentMetrics[0].totalCount,
          avgTransactionValue: parseFloat(currentMetrics[0].avgTransactionValue || 0).toFixed(2),
          collectionRate: parseFloat(collectionRate)
        },
        comparison: {
          previousRevenue: previousRevenue,
          revenueGrowth: parseFloat(revenueGrowth),
          trend: revenueGrowth > 0 ? 'up' : revenueGrowth < 0 ? 'down' : 'flat'
        },
        efficiency: {
          daysToPayment: parseFloat(dsoData[0].avgDaysToPayment || 0).toFixed(1),
          collectionRate: parseFloat(collectionRate)
        }
      }
    };
  } catch (error) {
    console.error('Error in getFinancialHealth:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Expense Breakdown (for donut chart)
 */
async function getExpenseBreakdown(startDate, endDate, userId = null) {
  try {
    let userFilter = '';
    let params = [startDate, endDate];
    
    if (userId) {
      userFilter = ' AND collector_user_id = ?';
      params.push(userId);
    }

    const [expenses] = await pool.execute(`
      SELECT 
        fee_type as category,
        SUM(fee_amount) as amount,
        COUNT(*) as count
      FROM cash_processing_fees
      WHERE created_at BETWEEN ? AND ?
        ${userFilter}
      GROUP BY fee_type
      ORDER BY amount DESC
    `, params);

    const total = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    return {
      success: true,
      data: expenses.map(item => ({
        category: item.category,
        amount: parseFloat(item.amount),
        count: item.count,
        percentage: total > 0 ? ((parseFloat(item.amount) / total) * 100).toFixed(1) : 0
      }))
    };
  } catch (error) {
    console.error('Error in getExpenseBreakdown:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get Revenue Breakdown by Payment Method (for donut chart)
 */
async function getRevenueBreakdown(startDate, endDate, userId = null) {
  try {
    let userFilter = '';
    let params = [startDate, endDate];
    
    if (userId) {
      userFilter = ' AND user_id = ?';
      params.push(userId);
    }

    const [revenue] = await pool.execute(`
      SELECT 
        COALESCE(payment_method, 'other') as method,
        SUM(amount) as amount,
        COUNT(*) as count
      FROM pledges
      WHERE deleted = 0 
        AND status IN ('paid', 'completed')
        AND collection_date BETWEEN ? AND ?
        ${userFilter}
      GROUP BY method
      ORDER BY amount DESC
    `, params);

    const total = revenue.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    return {
      success: true,
      data: revenue.map(item => ({
        method: item.method,
        amount: parseFloat(item.amount),
        count: item.count,
        percentage: total > 0 ? ((parseFloat(item.amount) / total) * 100).toFixed(1) : 0
      }))
    };
  } catch (error) {
    console.error('Error in getRevenueBreakdown:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getProfitAndLoss,
  getCashFlow,
  getFinancialHealth,
  getExpenseBreakdown,
  getRevenueBreakdown
};
