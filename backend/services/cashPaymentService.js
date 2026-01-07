/**
 * Cash Payment Service
 * Handles cash payment recording, verification, and accountability tracking
 * Includes monetization (fees and usage limits)
 */

const { pool } = require('../config/db');
const monetizationService = require('./monetizationService');
const { PRICING_TIERS, isMonetizationActive } = require('../config/monetization');

class CashPaymentService {
  /**
   * Record a cash payment from a donor
   * Only staff/collectors can record cash
   * Applies monetization fees and checks usage limits
   */
  async recordCashPayment({
    pledgeId,
    collectedAmount,
    collectionDate,
    collectorId,
    donorName,
    donorPhone,
    donorIdType,
    donorIdNumber,
    collectionLocation,
    notes,
    receiptNumber,
    receiptPhotoUrl
  }) {
    try {
      // Verify pledge exists
      const [pledges] = await pool.execute(
        'SELECT * FROM pledges WHERE id = ? AND deleted = 0',
        [pledgeId]
      );
      if (pledges.length === 0) {
        return { success: false, error: 'Pledge not found' };
      }

      const pledge = pledges[0];
      const creatorId = pledge.creator_id;

      // CHECK MONETIZATION LIMITS
      if (isMonetizationActive()) {
        // Check if user can record more cash payments
        const [users] = await pool.execute('SELECT subscription_tier FROM users WHERE id = ?', [creatorId]);
        if (users.length > 0) {
          const userTier = users[0].subscription_tier || 'FREE';
          const tierLimits = PRICING_TIERS[userTier]?.limits || {};
          
          // Check cash payment amount limit
          if (tierLimits.cashPaymentMaxAmount && tierLimits.cashPaymentMaxAmount > 0) {
            if (collectedAmount > tierLimits.cashPaymentMaxAmount) {
              return {
                success: false,
                error: `Cash payment exceeds limit of ${tierLimits.cashPaymentMaxAmount} UGX for ${userTier} tier`,
                tier: userTier,
                limit: tierLimits.cashPaymentMaxAmount
              };
            }
          }

          // Check monthly cash payment count limit
          const canRecord = await monetizationService.canPerformAction(creatorId, 'cash_payment');
          if (!canRecord.allowed) {
            return {
              success: false,
              error: canRecord.reason,
              tier: userTier,
              suggestedUpgrade: canRecord.suggestedTier
            };
          }
        }
      }

      // Record cash deposit
      const [result] = await pool.execute(
        `INSERT INTO cash_deposits (
          pledge_id, creator_id, collected_by, collected_amount,
          collection_date, collection_location, donor_name, donor_phone,
          donor_id_type, donor_id_number, receipt_number, receipt_photo_url,
          notes, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          pledgeId, creatorId, collectorId, collectedAmount,
          collectionDate, collectionLocation, donorName, donorPhone,
          donorIdType, donorIdNumber, receiptNumber, receiptPhotoUrl,
          notes
        ]
      );

      const cashDepositId = result.insertId;

      // CALCULATE CASH PAYMENT FEE (Monetization)
      let processingFee = 0;
      let netAmount = collectedAmount;
      
      if (isMonetizationActive()) {
        const [users] = await pool.execute('SELECT subscription_tier FROM users WHERE id = ?', [creatorId]);
        if (users.length > 0) {
          const userTier = users[0].subscription_tier || 'FREE';
          const cashFeePercentage = PRICING_TIERS[userTier]?.limits?.cashPaymentFeePercentage || 5.0;
          processingFee = Math.round(collectedAmount * (cashFeePercentage / 100));
          netAmount = collectedAmount - processingFee;
          
          console.log(`💰 Cash fee applied: ${cashFeePercentage}% = ${processingFee} UGX (${userTier} tier)`);
        }
      }

      // Store fee information in a fee tracking record
      if (processingFee > 0) {
        await pool.execute(
          `INSERT INTO cash_processing_fees 
           (cash_deposit_id, creator_id, original_amount, fee_percentage, fee_amount, net_amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [cashDepositId, creatorId, collectedAmount, (processingFee / collectedAmount * 100), processingFee, netAmount]
        );
      }

      // Log audit trail
      await this._logAuditTrail(
        cashDepositId,
        'RECORDED',
        collectorId,
        null,
        'pending',
        `Cash payment recorded: ${collectedAmount} UGX from ${donorName}${processingFee > 0 ? ` (Fee: ${processingFee} UGX)` : ''}`
      );

      // Update pledge with cash flag
      await pool.execute(
        'UPDATE pledges SET payment_method = ?, collection_date = ? WHERE id = ?',
        ['cash', collectionDate, pledgeId]
      );

      // FLAG OFF REMINDERS - Mark pledge reminders as completed/flagged off
      // This prevents future reminders from being sent since payment is made
      await pool.execute(
        'UPDATE pledges SET last_reminder_sent = NOW(), status = ? WHERE id = ?',
        ['paid', pledgeId]
      );
      
      console.log(`🚫 Reminders flagged off for pledge #${pledgeId} - Cash payment recorded`);

      // INCREMENT USAGE (Monetization)
      if (isMonetizationActive()) {
        await monetizationService.incrementUsage(creatorId, 'cash_payments', 1);
      }

      return {
        success: true,
        data: {
          cashDepositId,
          pledgeId,
          amount: collectedAmount,
          processingFee: processingFee,
          netAmount: netAmount,
          status: 'pending',
          message: `Cash payment recorded. Awaiting verification.${processingFee > 0 ? ` (Processing fee: ${processingFee} UGX)` : ''}`
        }
      };
    } catch (error) {
      console.error('Cash payment recording error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify a recorded cash payment
   * Only staff/admin can verify
   */
  async verifyCashPayment({
    cashDepositId,
    verifiedBy,
    verificationNotes,
    approved = true
  }) {
    try {
      // Get cash deposit
      const [deposits] = await pool.execute(
        'SELECT * FROM cash_deposits WHERE id = ?',
        [cashDepositId]
      );
      if (deposits.length === 0) {
        return { success: false, error: 'Cash deposit not found' };
      }

      const deposit = deposits[0];
      const newStatus = approved ? 'verified' : 'rejected';

      // Update verification
      await pool.execute(
        `UPDATE cash_deposits 
         SET verification_status = ?, verified_by = ?, verified_at = NOW(), verification_notes = ?
         WHERE id = ?`,
        [newStatus, verifiedBy, verificationNotes, cashDepositId]
      );

      // Log audit trail
      await this._logAuditTrail(
        cashDepositId,
        approved ? 'VERIFIED' : 'REJECTED',
        verifiedBy,
        'pending',
        newStatus,
        verificationNotes || `Cash payment ${approved ? 'verified' : 'rejected'}`
      );

      // If verified, update payment status in payments table
      if (approved) {
        await pool.execute(
          `UPDATE payments 
           SET status = 'completed', payment_method = 'cash',
               cash_verified_by = ?, cash_verified_at = NOW()
           WHERE pledge_id = ? AND status != 'completed'
           LIMIT 1`,
          [verifiedBy, deposit.pledge_id]
        );

        // KEEP REMINDERS FLAGGED OFF - Payment verified, reminders should stay off
        await pool.execute(
          'UPDATE pledges SET status = ?, last_reminder_sent = NOW() WHERE id = ?',
          ['paid', deposit.pledge_id]
        );

        console.log(`✅ Cash payment verified for pledge #${deposit.pledge_id} - Reminders confirmed off`);
      } else {
        // RESTORE REMINDERS IF REJECTED - Payment rejected, restore reminders for donor
        await pool.execute(
          'UPDATE pledges SET status = ?, last_reminder_sent = NULL WHERE id = ?',
          ['pending', deposit.pledge_id]
        );

        console.log(`⚠️ Cash payment rejected for pledge #${deposit.pledge_id} - Reminders restored`);
      }

      return {
        success: true,
        data: {
          cashDepositId,
          status: newStatus,
          amount: deposit.collected_amount,
          message: `Cash payment ${approved ? 'verified - reminders turned off' : 'rejected - reminders will resume'}`
        }
      };
    } catch (error) {
      console.error('Cash verification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark cash as deposited to bank
   */
  async markAsDeposited({
    cashDepositId,
    bankReference,
    depositDate,
    recordedBy
  }) {
    try {
      const [deposits] = await pool.execute(
        'SELECT * FROM cash_deposits WHERE id = ?',
        [cashDepositId]
      );
      if (deposits.length === 0) {
        return { success: false, error: 'Cash deposit not found' };
      }

      await pool.execute(
        `UPDATE cash_deposits 
         SET deposited_to_bank = TRUE, bank_deposit_date = ?, bank_reference = ?
         WHERE id = ?`,
        [depositDate || new Date(), bankReference, cashDepositId]
      );

      // MAINTAIN REMINDER FLAGS - Keep reminders off through deposit phase
      const [pledges] = await pool.execute(
        'SELECT id FROM pledges WHERE id = (SELECT pledge_id FROM cash_deposits WHERE id = ?)',
        [cashDepositId]
      );
      
      if (pledges.length > 0) {
        await pool.execute(
          'UPDATE pledges SET status = ?, last_reminder_sent = NOW() WHERE id = ?',
          ['paid', pledges[0].id]
        );
        console.log(`🏦 Cash deposited to bank for pledge #${pledges[0].id} - Reminders remain off`);
      }

      await this._logAuditTrail(
        cashDepositId,
        'DEPOSITED_TO_BANK',
        recordedBy,
        'verified',
        'verified',
        `Deposited to bank with reference: ${bankReference}`
      );

      return {
        success: true,
        data: {
          cashDepositId,
          bankReference,
          message: 'Cash marked as deposited to bank'
        }
      };
    } catch (error) {
      console.error('Bank deposit marking error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending cash verification list
   */
  async getPendingVerification() {
    try {
      const [pending] = await pool.execute(`
        SELECT 
          cd.*,
          u.name as collector_name,
          u.phone as collector_phone,
          p.donor_name,
          p.amount as pledge_amount,
          c.title as creator_name,
          DATEDIFF(NOW(), cd.collection_date) as days_pending
        FROM cash_deposits cd
        JOIN users u ON cd.collected_by = u.id
        JOIN pledges p ON cd.pledge_id = p.id
        JOIN users c ON cd.creator_id = c.id
        WHERE cd.verification_status = 'pending'
        ORDER BY cd.collection_date ASC
      `);

      return {
        success: true,
        data: {
          count: pending.length,
          total_pending_amount: pending.reduce((sum, d) => sum + parseFloat(d.collected_amount), 0),
          deposits: pending
        }
      };
    } catch (error) {
      console.error('Get pending verification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cash accountability by collector
   */
  async getCollectorAccountability(collectorId = null, year, month) {
    try {
      let query = `
        SELECT 
          cd.collected_by,
          u.name as collector_name,
          u.phone as collector_phone,
          COUNT(cd.id) as total_collections,
          SUM(CASE WHEN cd.verification_status = 'pending' THEN cd.collected_amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN cd.verification_status = 'verified' THEN cd.collected_amount ELSE 0 END) as verified_amount,
          SUM(CASE WHEN cd.verification_status = 'rejected' THEN cd.collected_amount ELSE 0 END) as rejected_amount,
          SUM(CASE WHEN cd.deposited_to_bank THEN cd.collected_amount ELSE 0 END) as deposited_amount,
          SUM(CASE WHEN cd.verification_status = 'verified' AND NOT cd.deposited_to_bank THEN cd.collected_amount ELSE 0 END) as verified_not_deposited,
          MAX(cd.collection_date) as last_collection_date
        FROM cash_deposits cd
        JOIN users u ON cd.collected_by = u.id
        WHERE YEAR(cd.collection_date) = ? AND MONTH(cd.collection_date) = ?
      `;

      const params = [year, month];

      if (collectorId) {
        query += ' AND cd.collected_by = ?';
        params.push(collectorId);
      }

      query += ' GROUP BY cd.collected_by, u.name, u.phone ORDER BY verified_not_deposited DESC';

      const [accountability] = await pool.execute(query, params);

      return {
        success: true,
        data: {
          month: `${year}-${String(month).padStart(2, '0')}`,
          collectors: accountability,
          summary: {
            total_collectors: accountability.length,
            total_collected: accountability.reduce((sum, a) => sum + parseFloat(a.pending_amount || 0) + parseFloat(a.verified_amount || 0), 0),
            total_verified: accountability.reduce((sum, a) => sum + parseFloat(a.verified_amount || 0), 0),
            total_pending: accountability.reduce((sum, a) => sum + parseFloat(a.pending_amount || 0), 0),
            total_deposited: accountability.reduce((sum, a) => sum + parseFloat(a.deposited_amount || 0), 0),
            awaiting_deposit: accountability.reduce((sum, a) => sum + parseFloat(a.verified_not_deposited || 0), 0)
          }
        }
      };
    } catch (error) {
      console.error('Get accountability error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get cash deposit details
   */
  async getCashDepositDetail(cashDepositId) {
    try {
      const [deposits] = await pool.execute(`
        SELECT 
          cd.*,
          u_collector.name as collector_name,
          u_collector.phone as collector_phone,
          u_verified.name as verified_by_name,
          p.donor_name as pledge_donor_name,
          p.amount as pledge_amount,
          c.title as creator_name
        FROM cash_deposits cd
        LEFT JOIN users u_collector ON cd.collected_by = u_collector.id
        LEFT JOIN users u_verified ON cd.verified_by = u_verified.id
        LEFT JOIN pledges p ON cd.pledge_id = p.id
        LEFT JOIN users c ON cd.creator_id = c.id
        WHERE cd.id = ?
      `, [cashDepositId]);

      if (deposits.length === 0) {
        return { success: false, error: 'Cash deposit not found' };
      }

      // Get audit log
      const [audit] = await pool.execute(`
        SELECT 
          cal.*,
          u.name as performed_by_name
        FROM cash_audit_log cal
        JOIN users u ON cal.performed_by = u.id
        WHERE cal.cash_deposit_id = ?
        ORDER BY cal.created_at DESC
      `, [cashDepositId]);

      return {
        success: true,
        data: {
          deposit: deposits[0],
          audit_trail: audit
        }
      };
    } catch (error) {
      console.error('Get deposit detail error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Report discrepancy
   */
  async reportDiscrepancy({
    cashDepositId,
    discrepancyType,
    expectedAmount,
    actualAmount,
    description,
    reportedBy
  }) {
    try {
      const variance = expectedAmount - actualAmount;
      const variancePercent = (variance / expectedAmount * 100).toFixed(2);

      const [result] = await pool.execute(
        `INSERT INTO cash_discrepancies (
          cash_deposit_id, discrepancy_type, expected_amount, actual_amount,
          variance, variance_percent, description, reported_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cashDepositId, discrepancyType, expectedAmount, actualAmount,
          variance, variancePercent, description, reportedBy
        ]
      );

      // Log to audit trail
      await this._logAuditTrail(
        cashDepositId,
        'DISCREPANCY_REPORTED',
        reportedBy,
        null,
        null,
        `Discrepancy: Expected ${expectedAmount}, got ${actualAmount} (${variancePercent}%)`
      );

      return {
        success: true,
        data: {
          discrepancyId: result.insertId,
          variance,
          variancePercent
        }
      };
    } catch (error) {
      console.error('Report discrepancy error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get accountability dashboard data
   */
  async getAccountabilityDashboard(year, month) {
    try {
      // Get monthly summary
      const [monthly] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT cd.collected_by) as active_collectors,
          COUNT(cd.id) as total_deposits,
          SUM(cd.collected_amount) as total_collected,
          SUM(CASE WHEN cd.verification_status = 'pending' THEN cd.collected_amount ELSE 0 END) as pending_amount,
          SUM(CASE WHEN cd.verification_status = 'verified' THEN cd.collected_amount ELSE 0 END) as verified_amount,
          SUM(CASE WHEN cd.verification_status = 'rejected' THEN cd.collected_amount ELSE 0 END) as rejected_amount,
          SUM(CASE WHEN cd.deposited_to_bank THEN cd.collected_amount ELSE 0 END) as deposited_amount,
          SUM(CASE WHEN cd.verification_status = 'verified' AND NOT cd.deposited_to_bank THEN cd.collected_amount ELSE 0 END) as verified_not_deposited,
          AVG(DATEDIFF(cd.verified_at, cd.collection_date)) as avg_verification_days
        FROM cash_deposits cd
        WHERE YEAR(cd.collection_date) = ? AND MONTH(cd.collection_date) = ?
      `, [year, month]);

      // Get top collectors
      const [topCollectors] = await pool.execute(`
        SELECT 
          u.id,
          u.name,
          COUNT(cd.id) as collections,
          SUM(cd.collected_amount) as collected_amount,
          SUM(CASE WHEN cd.verification_status = 'pending' THEN cd.collected_amount ELSE 0 END) as pending
        FROM cash_deposits cd
        JOIN users u ON cd.collected_by = u.id
        WHERE YEAR(cd.collection_date) = ? AND MONTH(cd.collection_date) = ?
        GROUP BY u.id, u.name
        ORDER BY SUM(cd.collected_amount) DESC
        LIMIT 5
      `, [year, month]);

      // Get discrepancies
      const [discrepancies] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT cash_deposit_id) as discrepancy_count,
          SUM(variance) as total_variance,
          COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_count
        FROM cash_discrepancies
        WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
      `, [year, month]);

      return {
        success: true,
        data: {
          month: `${year}-${String(month).padStart(2, '0')}`,
          summary: monthly[0] || {},
          top_collectors: topCollectors,
          discrepancies: discrepancies[0] || {}
        }
      };
    } catch (error) {
      console.error('Get dashboard error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Private: Log audit trail
   */
  async _logAuditTrail(cashDepositId, action, performedBy, oldStatus, newStatus, notes) {
    try {
      await pool.execute(
        `INSERT INTO cash_audit_log (
          cash_deposit_id, action, performed_by, old_status, new_status, notes
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [cashDepositId, action, performedBy, oldStatus, newStatus, notes]
      );
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }
}

module.exports = new CashPaymentService();
