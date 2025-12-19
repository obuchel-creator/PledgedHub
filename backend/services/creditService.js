/**
 * Credit & Pay-As-You-Go Service
 * Manages user credit balances, deductions, and billing for Uganda market
 * 
 * Flow:
 * 1. User loads credits via MTN/Airtel (monetization-uganda.js)
 * 2. Credits stored in user_credits table
 * 3. When SMS/email sent, credits automatically deducted
 * 4. Insufficient credits = action blocked
 */

const { pool } = require('../config/db');
const { TRANSACTION_COSTS, CREDIT_SYSTEM } = require('../config/monetization-uganda');

// ============================================
// Credit Loading & Balance Management
// ============================================

/**
 * Get user's current credit balance
 * @param {number} userId - User ID
 * @returns {Promise<Object>} { balance, currency, lastLoaded, expiresAt }
 */
async function getCreditBalance(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        COALESCE(SUM(amount), 0) as balance,
        MAX(created_at) as last_loaded,
        MAX(DATE_ADD(created_at, INTERVAL ${CREDIT_SYSTEM.expiry_days} DAY)) as expires_at
       FROM user_credits 
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    const balance = parseFloat(rows[0]?.balance || 0);
    return {
      balance,
      currency: CREDIT_SYSTEM.currency,
      lastLoaded: rows[0]?.last_loaded || null,
      expiresAt: rows[0]?.expires_at || null,
      sufficient: true,
    };
  } catch (error) {
    console.error('❌ [CREDIT] getCreditBalance error:', error.message);
    throw error;
  }
}

/**
 * Load credits into user account via mobile money
 * @param {Object} data - { userId, amount, paymentMethod, reference, mobileNumber }
 * @returns {Promise<Object>} { success, transactionId, balance, message }
 */
async function loadCredits(data) {
  const { userId, amount, paymentMethod, reference, mobileNumber } = data;

  const connection = await pool.getConnection();

  try {
    if (amount < CREDIT_SYSTEM.minimum_load || amount > CREDIT_SYSTEM.maximum_load) {
      return {
        success: false,
        error: `Amount must be between ${CREDIT_SYSTEM.minimum_load} and ${CREDIT_SYSTEM.maximum_load} UGX`,
      };
    }

    await connection.beginTransaction();

    // 1. Record payment transaction
    const [paymentResult] = await connection.execute(
      `INSERT INTO credit_transactions 
       (user_id, type, amount, method, reference, mobile_number, status) 
       VALUES (?, 'load', ?, ?, ?, ?, 'pending')`,
      [userId, amount, paymentMethod, reference, mobileNumber]
    );

    const transactionId = paymentResult.insertId;

    // 2. Create credit entry (not yet active until payment confirmed)
    const [creditResult] = await connection.execute(
      `INSERT INTO user_credits 
       (user_id, amount, source, transaction_id, status, expires_at) 
       VALUES (?, ?, 'payment', ?, 'pending', DATE_ADD(NOW(), INTERVAL ${CREDIT_SYSTEM.expiry_days} DAY))`,
      [userId, amount, transactionId]
    );

    await connection.commit();

    // 3. Initiate mobile money payment (would trigger webhook)
    console.log(`💳 [CREDIT] Load request: User ${userId}, Amount: ${amount} UGX, Method: ${paymentMethod}`);

    return {
      success: true,
      transactionId,
      creditId: creditResult.insertId,
      amount,
      message: `Credit load initiated. Confirm payment on your phone.`,
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ [CREDIT] loadCredits error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Confirm credit load after successful mobile money payment
 * @param {number} transactionId - Transaction ID from payment gateway
 * @returns {Promise<Object>} { success, balance }
 */
async function confirmCreditLoad(transactionId) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Verify transaction exists
    const [transactions] = await connection.execute(
      'SELECT * FROM credit_transactions WHERE id = ? AND status = "pending"',
      [transactionId]
    );

    if (transactions.length === 0) {
      return { success: false, error: 'Transaction not found or already processed' };
    }

    const transaction = transactions[0];

    // 2. Update transaction status
    await connection.execute(
      'UPDATE credit_transactions SET status = ?, completed_at = NOW() WHERE id = ?',
      ['completed', transactionId]
    );

    // 3. Activate credits
    await connection.execute(
      'UPDATE user_credits SET status = ? WHERE transaction_id = ?',
      ['active', transactionId]
    );

    await connection.commit();

    // 4. Get new balance
    const balance = await getCreditBalance(transaction.user_id);

    console.log(`✅ [CREDIT] Confirmed: User ${transaction.user_id} loaded ${transaction.amount} UGX`);

    return {
      success: true,
      balance: balance.balance,
      message: `Credits added! Your balance: ${balance.balance.toLocaleString()} UGX`,
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ [CREDIT] confirmCreditLoad error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// ============================================
// Credit Deduction & Usage
// ============================================

/**
 * Check if user has sufficient credits for an action
 * @param {number} userId - User ID
 * @param {string} action - 'send_sms', 'send_email', 'ai_request'
 * @param {number} quantity - How many (default 1)
 * @returns {Promise<Object>} { hasCredits: boolean, balance, required, shortfall }
 */
async function checkCreditSufficiency(userId, action, quantity = 1) {
  try {
    const balance = await getCreditBalance(userId);
    const costPerUnit = TRANSACTION_COSTS[action.split('_')[1]]?.base_cost || 0;
    const requiredCredits = costPerUnit * quantity;

    return {
      hasCredits: balance.balance >= requiredCredits,
      balance: balance.balance,
      required: requiredCredits,
      shortfall: Math.max(0, requiredCredits - balance.balance),
      costPerUnit,
    };
  } catch (error) {
    console.error('❌ [CREDIT] checkCreditSufficiency error:', error.message);
    throw error;
  }
}

/**
 * Deduct credits from user account
 * @param {number} userId - User ID
 * @param {string} action - 'send_sms', 'send_email', 'ai_request'
 * @param {number} quantity - How many (default 1)
 * @param {Object} metadata - { pledgeId, campaignId, reference }
 * @returns {Promise<Object>} { success, balance, deducted, message }
 */
async function deductCredits(userId, action, quantity = 1, metadata = {}) {
  const connection = await pool.getConnection();

  try {
    // 1. Check sufficiency
    const sufficiency = await checkCreditSufficiency(userId, action, quantity);
    if (!sufficiency.hasCredits) {
      return {
        success: false,
        error: `Insufficient credits. Required: ${sufficiency.required} UGX, Balance: ${sufficiency.balance} UGX`,
        balance: sufficiency.balance,
        required: sufficiency.required,
      };
    }

    await connection.beginTransaction();

    // 2. Deduct from active credits (oldest first - FIFO)
    const costPerUnit = sufficiency.costPerUnit;
    const totalDeduction = costPerUnit * quantity;

    const [creditRows] = await connection.execute(
      `SELECT id, amount FROM user_credits 
       WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
       ORDER BY created_at ASC`,
      [userId]
    );

    let remainingDeduction = totalDeduction;
    const deductions = [];

    for (const credit of creditRows) {
      if (remainingDeduction <= 0) break;

      const deductionAmount = Math.min(credit.amount, remainingDeduction);
      remainingDeduction -= deductionAmount;

      deductions.push({
        creditId: credit.id,
        amount: deductionAmount,
      });

      await connection.execute(
        'UPDATE user_credits SET amount = amount - ? WHERE id = ?',
        [deductionAmount, credit.id]
      );
    }

    // 3. Record usage transaction
    await connection.execute(
      `INSERT INTO credit_transactions 
       (user_id, type, amount, method, reference, metadata, status)
       VALUES (?, 'deduction', ?, ?, ?, ?, 'completed')`,
      [
        userId,
        totalDeduction,
        action,
        metadata.pledgeId || metadata.reference || null,
        JSON.stringify(metadata),
      ]
    );

    await connection.commit();

    // 4. Get new balance
    const balance = await getCreditBalance(userId);

    console.log(`💰 [CREDIT] Deducted ${totalDeduction} UGX for ${action} from User ${userId}`);

    return {
      success: true,
      balance: balance.balance,
      deducted: totalDeduction,
      quantity,
      message: `${quantity}x ${action} deducted. Balance: ${balance.balance.toLocaleString()} UGX`,
    };
  } catch (error) {
    await connection.rollback();
    console.error('❌ [CREDIT] deductCredits error:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Refund credits (e.g., failed SMS, user cancellation)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to refund
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} { success, balance }
 */
async function refundCredits(userId, amount, reason = 'manual_refund') {
  try {
    await pool.execute(
      `INSERT INTO user_credits 
       (user_id, amount, source, status)
       VALUES (?, ?, 'refund', 'active')`,
      [userId, amount]
    );

    const balance = await getCreditBalance(userId);

    console.log(`🔄 [CREDIT] Refunded ${amount} UGX to User ${userId}: ${reason}`);

    return {
      success: true,
      balance: balance.balance,
      message: `Refund processed. New balance: ${balance.balance.toLocaleString()} UGX`,
    };
  } catch (error) {
    console.error('❌ [CREDIT] refundCredits error:', error.message);
    throw error;
  }
}

// ============================================
// Credit History & Analytics
// ============================================

/**
 * Get user's credit transaction history
 * @param {number} userId - User ID
 * @param {Object} options - { limit, offset, type }
 * @returns {Promise<Array>}
 */
async function getCreditHistory(userId, options = {}) {
  try {
    const { limit = 50, offset = 0, type = null } = options;
    let sql = 'SELECT * FROM credit_transactions WHERE user_id = ?';
    const params = [userId];

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('❌ [CREDIT] getCreditHistory error:', error.message);
    throw error;
  }
}

/**
 * Get credit usage statistics
 * @param {number} userId - User ID
 * @param {string} period - 'month', 'quarter', 'year'
 * @returns {Promise<Object>}
 */
async function getCreditUsageStats(userId, period = 'month') {
  try {
    const dateFilter = {
      month: 'DATE_SUB(NOW(), INTERVAL 30 DAY)',
      quarter: 'DATE_SUB(NOW(), INTERVAL 90 DAY)',
      year: 'DATE_SUB(NOW(), INTERVAL 365 DAY)',
    };

    const [stats] = await pool.execute(
      `SELECT 
        type,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as avg_amount
       FROM credit_transactions
       WHERE user_id = ? AND created_at >= ${dateFilter[period]}
       GROUP BY type`,
      [userId]
    );

    return {
      period,
      transactions: stats,
      totalSpent: stats.reduce((sum, s) => sum + (s.type === 'deduction' ? s.total : 0), 0),
      totalLoaded: stats.reduce((sum, s) => sum + (s.type === 'load' ? s.total : 0), 0),
    };
  } catch (error) {
    console.error('❌ [CREDIT] getCreditUsageStats error:', error.message);
    throw error;
  }
}

module.exports = {
  getCreditBalance,
  loadCredits,
  confirmCreditLoad,
  checkCreditSufficiency,
  deductCredits,
  refundCredits,
  getCreditHistory,
  getCreditUsageStats,
};
