/**
 * Commission Distribution Service
 * 
 * Handles:
 * 1. Calculating commission when payment is received
 * 2. Splitting payment between organization and platform
 * 3. Automatically sending commission to your MTN/Airtel accounts
 * 4. Batch processing commission payouts
 * 5. Tracking commission payment status
 * 
 * Payment Flow:
 * Payment Received → Split to Org + Commission → Send Commission to You
 */

const { pool } = require('../config/db');
const mtnService = require('./mtnService');
const airtelService = require('./airtelService');
const messageGenerator = require('./messageGenerator');

// Commission rates by organization tier
const COMMISSION_RATES = {
  free: 5.0,        // 5% commission
  basic: 2.5,       // 2.5% commission
  pro: 1.5,         // 1.5% commission
  enterprise: 0.5   // 0.5% commission
};

/**
 * Calculate commission when payment is received
 * 
 * @param {number} pledgeId - ID of pledge being paid
 * @param {number} organizationId - Organization collecting pledge
 * @param {number} amount - Payment amount in UGX
 * @returns {Promise} { success, data: { orgPayout, commission, rate } }
 */
async function calculateAndSplitPayment(pledgeId, organizationId, amount) {
  try {
    // Get organization and their tier
    const [orgs] = await pool.execute(
      'SELECT id, tier FROM organizations WHERE id = ? AND is_active = 1',
      [organizationId]
    );
    
    if (orgs.length === 0) {
      return { success: false, error: 'Organization not found or inactive' };
    }
    
    const org = orgs[0];
    const commissionRate = COMMISSION_RATES[org.tier] || COMMISSION_RATES.free;
    
    // Calculate split
    const commissionAmount = Math.round(amount * (commissionRate / 100) * 100) / 100;
    const orgPayout = amount - commissionAmount;
    
    // Create payment split record
    const [result] = await pool.execute(`
      INSERT INTO payment_splits (
        pledge_id, organization_id, payment_amount, 
        commission_rate, commission_amount, organization_payout,
        payment_status, org_payout_status, commission_status
      ) VALUES (?, ?, ?, ?, ?, ?, 'received', 'pending', 'accrued')
    `, [pledgeId, organizationId, amount, commissionRate, commissionAmount, orgPayout]);
    
    // Create commission record
    await pool.execute(`
      INSERT INTO commissions (
        payment_split_id, organization_id, pledge_id, amount, status
      ) VALUES (?, ?, ?, ?, 'accrued')
    `, [result.insertId, organizationId, pledgeId, commissionAmount]);
    
    console.log(`💰 Payment split for pledge #${pledgeId}:`);
    console.log(`   Payment received: ${amount} UGX`);
    console.log(`   Org gets: ${orgPayout} UGX (${org.tier} tier)`);
    console.log(`   Your commission: ${commissionAmount} UGX (${commissionRate}%)`);
    
    return {
      success: true,
      data: {
        paymentSplitId: result.insertId,
        organizationPayout: orgPayout,
        commissionAmount: commissionAmount,
        commissionRate: commissionRate,
        organizationTier: org.tier
      }
    };
    
  } catch (error) {
    console.error('❌ Error splitting payment:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get your available commissions (not yet paid out)
 * 
 * @returns {Promise} { success, data: { total, count } }
 */
async function getAvailableCommissions() {
  try {
    const [commissions] = await pool.execute(`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM commissions
      WHERE status = 'accrued'
    `);
    
    return {
      success: true,
      data: {
        totalAmount: commissions[0].total,
        commissionCount: commissions[0].count
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send commission to you via MTN or Airtel
 * 
 * Options:
 * - Immediate: Send as soon as payment received (default)
 * - Batch: Collect for day and send once daily at 5PM
 * 
 * @param {string} method - 'mtn' or 'airtel'
 * @param {string} timing - 'immediate' or 'batch'
 * @returns {Promise} { success, data: { batchId, amount, status } }
 */
async function distributeCommission(method = 'mtn', timing = 'immediate') {
  try {
    // Get available commissions
    const [commissions] = await pool.execute(`
      SELECT id, amount, payment_split_id, pledge_id
      FROM commissions
      WHERE status = 'accrued'
      ORDER BY created_at ASC
    `);
    
    if (commissions.length === 0) {
      return { success: true, data: { message: 'No commissions to distribute' } };
    }
    
    // Get your platform account
    const [accounts] = await pool.execute(
      'SELECT phone_number FROM platform_accounts WHERE account_type = ? AND is_active = 1 AND is_primary = 1',
      [method]
    );
    
    if (accounts.length === 0) {
      return { success: false, error: `No ${method.toUpperCase()} account configured for commission payouts` };
    }
    
    const yourPhone = accounts[0].phone_number;
    const totalAmount = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    
    // Create batch payout
    const batchId = `COMM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    let payoutResult;
    
    if (timing === 'immediate') {
      // Send immediately via MTN or Airtel
      payoutResult = await sendCommissionPayment(
        method,
        yourPhone,
        totalAmount,
        batchId
      );
    } else if (timing === 'batch') {
      // Mark as pending, will be sent later
      payoutResult = {
        success: true,
        status: 'pending',
        transactionId: batchId
      };
    }
    
    if (!payoutResult.success) {
      return {
        success: false,
        error: payoutResult.error || 'Failed to send commission'
      };
    }
    
    // Record payout in database
    const [payoutRecord] = await pool.execute(`
      INSERT INTO commission_payouts (
        batch_id, payout_method, payout_phone, total_amount,
        commission_count, transaction_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      batchId,
      method,
      yourPhone,
      totalAmount,
      commissions.length,
      payoutResult.transactionId || batchId,
      payoutResult.status || 'processing'
    ]);
    
    // Mark commissions as pending_payout
    const commissionIds = commissions.map(c => c.id).join(',');
    await pool.execute(`
      UPDATE commissions 
      SET status = 'pending_payout', payout_batch_id = ?
      WHERE id IN (${commissionIds})
    `, [payoutRecord.insertId]);
    
    console.log(`\n✅ Commission distribution initiated:`);
    console.log(`   Method: ${method.toUpperCase()}`);
    console.log(`   Your phone: ${yourPhone}`);
    console.log(`   Total: ${totalAmount} UGX`);
    console.log(`   Commissions: ${commissions.length}`);
    console.log(`   Batch ID: ${batchId}`);
    console.log(`   Status: ${payoutResult.status || 'processing'}\n`);
    
    return {
      success: true,
      data: {
        batchId,
        method,
        amount: totalAmount,
        commissionCount: commissions.length,
        status: payoutResult.status || 'processing',
        transactionId: payoutResult.transactionId
      }
    };
    
  } catch (error) {
    console.error('❌ Error distributing commission:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Actually send money to your account via MTN/Airtel
 * 
 * @private
 */
async function sendCommissionPayment(method, phone, amount, batchId) {
  try {
    let result;
    
    if (method === 'mtn') {
      // Use MTN service to send money to you
      result = await mtnService.requestPayment(
        phone,
        Math.round(amount),
        batchId,
        `Commission Payout ${batchId}`,
        'PledgeHub Commission Distribution'
      );
    } else if (method === 'airtel') {
      // Use Airtel service to send money to you
      result = await airtelService.requestPayment(
        phone,
        Math.round(amount),
        batchId,
        `Commission Payout - ${batchId}`
      );
    } else {
      return { success: false, error: 'Unsupported payment method' };
    }
    
    return {
      success: result.success !== false,
      status: result.status || 'pending',
      transactionId: result.transactionId || result.reference_id
    };
    
  } catch (error) {
    console.error(`❌ Error sending ${method.toUpperCase()} payment:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch process commissions (send at scheduled times)
 * Called by cron job daily at 5PM
 */
async function processDailyCommissionBatch() {
  try {
    console.log('\n⏰ Processing daily commission batch...');
    
    // Get pending commissions
    const [pendingCommissions] = await pool.execute(`
      SELECT COUNT(*) as count, SUM(amount) as total
      FROM commissions
      WHERE status = 'accrued'
    `);
    
    if (pendingCommissions[0].count === 0) {
      console.log('ℹ️  No commissions to process today');
      return { success: true, message: 'No commissions' };
    }
    
    console.log(`📊 Found ${pendingCommissions[0].count} commissions totaling ${pendingCommissions[0].total} UGX`);
    
    // Try MTN first, then Airtel
    const mtnResult = await distributeCommission('mtn', 'batch');
    if (!mtnResult.success) {
      const airtelResult = await distributeCommission('airtel', 'batch');
      if (!airtelResult.success) {
        console.log('⚠️  Could not process commissions via MTN or Airtel');
        return { success: false, error: 'No payment method available' };
      }
      return airtelResult;
    }
    
    return mtnResult;
    
  } catch (error) {
    console.error('❌ Error processing daily batch:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Mark commission as paid out (called when webhook confirms payment)
 */
async function markCommissionAsPaidOut(batchId, transactionId) {
  try {
    const [payouts] = await pool.execute(
      'SELECT id FROM commission_payouts WHERE batch_id = ? OR transaction_id = ?',
      [batchId, transactionId]
    );
    
    if (payouts.length === 0) {
      return { success: false, error: 'Payout not found' };
    }
    
    const payoutId = payouts[0].id;
    
    // Update payout status
    await pool.execute(
      'UPDATE commission_payouts SET status = ?, completed_at = NOW() WHERE id = ?',
      ['successful', payoutId]
    );
    
    // Update commissions status
    await pool.execute(
      'UPDATE commissions SET status = ?, paid_out_at = NOW() WHERE payout_batch_id = ?',
      ['paid_out', payoutId]
    );
    
    console.log(`✅ Commission payout ${batchId} marked as successful`);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get your commission payment history
 */
async function getCommissionHistory(limit = 50) {
  try {
    const [payouts] = await pool.execute(`
      SELECT 
        cp.id,
        cp.batch_id,
        cp.payout_method,
        cp.payout_phone,
        cp.total_amount,
        cp.commission_count,
        cp.status,
        cp.created_at,
        cp.completed_at
      FROM commission_payouts cp
      ORDER BY cp.created_at DESC
      LIMIT ?
    `, [limit]);
    
    return {
      success: true,
      data: payouts
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get commission summary statistics
 */
async function getCommissionStats() {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COALESCE(SUM(CASE WHEN status = 'accrued' THEN amount ELSE 0 END), 0) as accrued_amount,
        COALESCE(SUM(CASE WHEN status = 'accrued' THEN 1 ELSE 0 END), 0) as accrued_count,
        COALESCE(SUM(CASE WHEN status = 'pending_payout' THEN amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN status = 'pending_payout' THEN 1 ELSE 0 END), 0) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'paid_out' THEN amount ELSE 0 END), 0) as paid_out_total,
        COALESCE(COUNT(DISTINCT DATE(paid_out_at)), 0) as days_with_payouts
      FROM commissions
    `);
    
    return {
      success: true,
      data: {
        accrued: {
          amount: parseFloat(stats[0].accrued_amount),
          count: stats[0].accrued_count
        },
        pending: {
          amount: parseFloat(stats[0].pending_amount),
          count: stats[0].pending_count
        },
        paidOut: {
          total: parseFloat(stats[0].paid_out_total),
          days: stats[0].days_with_payouts
        }
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  COMMISSION_RATES,
  calculateAndSplitPayment,
  getAvailableCommissions,
  distributeCommission,
  sendCommissionPayment,
  processDailyCommissionBatch,
  markCommissionAsPaidOut,
  getCommissionHistory,
  getCommissionStats
};
