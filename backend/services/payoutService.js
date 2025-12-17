const { pool } = require('../config/db');

/**
 * Payout Service
 * Manages creator earnings, payouts, and payment tracking
 */

class PayoutService {
  /**
   * Get creator's earnings summary
   */
  async getCreatorEarnings(creatorId, month = null, year = null) {
    try {
      // Default to current month if not specified
      if (!month || !year) {
        const now = new Date();
        month = now.getMonth() + 1;
        year = now.getFullYear();
      }

      const monthYear = `${year}-${String(month).padStart(2, '0')}-01`;

      const [earnings] = await pool.execute(
        `SELECT 
          id,
          creator_id,
          month_year,
          total_pledges_received,
          total_fees_deducted,
          total_commission_deducted,
          net_earnings,
          total_paid_out,
          total_pending,
          payment_count,
          status,
          created_at,
          updated_at
        FROM creator_earnings
        WHERE creator_id = ? AND DATE_FORMAT(month_year, '%Y-%m') = DATE_FORMAT(?, '%Y-%m')`,
        [creatorId, monthYear]
      );

      if (!earnings.length) {
        return { success: true, data: null, message: 'No earnings for this period' };
      }

      return { success: true, data: earnings[0] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate and update creator earnings for a month
   */
  async calculateMonthlyEarnings(creatorId, year, month) {
    try {
      const monthYear = `${year}-${String(month).padStart(2, '0')}-01`;
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      // Get all payments for creator this month
      const [payments] = await pool.execute(
        `SELECT 
          pf.donor_amount,
          pf.airtel_fee,
          pf.mtn_fee,
          pf.bank_deposit_fee,
          pf.platform_commission,
          pf.creator_net_payout,
          p.id as payment_id
        FROM payment_fees pf
        JOIN payments p ON pf.payment_id = p.id
        JOIN pledges pl ON pf.pledge_id = pl.id
        WHERE pl.created_by = ? 
          AND p.status = 'completed'
          AND p.created_at BETWEEN ? AND ?`,
        [creatorId, startDate, endDate]
      );

      if (payments.length === 0) {
        return { success: true, data: null, message: 'No payments this period' };
      }

      // Calculate totals
      const totals = {
        pledgesReceived: payments.reduce((sum, p) => sum + parseFloat(p.donor_amount || 0), 0),
        feesDeducted: payments.reduce((sum, p) => sum + parseFloat(p.airtel_fee || 0) + parseFloat(p.bank_deposit_fee || 0), 0),
        commissionDeducted: payments.reduce((sum, p) => sum + parseFloat(p.platform_commission || 0), 0),
        netEarnings: payments.reduce((sum, p) => sum + parseFloat(p.creator_net_payout || 0), 0),
        paymentCount: payments.length
      };

      // Check if earnings record exists
      const [existing] = await pool.execute(
        'SELECT id FROM creator_earnings WHERE creator_id = ? AND month_year = ?',
        [creatorId, monthYear]
      );

      if (existing.length) {
        // Update existing
        await pool.execute(
          `UPDATE creator_earnings 
           SET total_pledges_received = ?, total_fees_deducted = ?, 
               total_commission_deducted = ?, net_earnings = ?,
               payment_count = ?, status = 'calculated',
               updated_at = NOW()
           WHERE id = ?`,
          [
            totals.pledgesReceived,
            totals.feesDeducted,
            totals.commissionDeducted,
            totals.netEarnings,
            totals.paymentCount,
            existing[0].id
          ]
        );
      } else {
        // Create new
        await pool.execute(
          `INSERT INTO creator_earnings 
           (creator_id, month_year, total_pledges_received, total_fees_deducted,
            total_commission_deducted, net_earnings, payment_count, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'calculated')`,
          [
            creatorId,
            monthYear,
            totals.pledgesReceived,
            totals.feesDeducted,
            totals.commissionDeducted,
            totals.netEarnings,
            totals.paymentCount
          ]
        );
      }

      return {
        success: true,
        data: {
          creatorId,
          period: `${year}-${String(month).padStart(2, '0')}`,
          ...totals
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending payouts for a creator
   */
  async getPendingPayouts(creatorId) {
    try {
      const [payouts] = await pool.execute(
        `SELECT 
          p.id,
          p.payout_batch_id,
          p.total_amount,
          p.status,
          p.scheduled_date,
          p.processed_date,
          p.completed_date,
          u.name as creator_name,
          b.name as bank_name,
          (SELECT COUNT(*) FROM payout_details WHERE payout_id = p.id) as pledge_count
        FROM payouts p
        JOIN users u ON p.creator_id = u.id
        LEFT JOIN bank_configurations b ON p.bank_id = b.id
        WHERE p.creator_id = ? AND p.status IN ('pending', 'processing', 'sent')
        ORDER BY p.scheduled_date ASC`,
        [creatorId]
      );

      return { success: true, data: payouts };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create payout for creator
   */
  async createPayout(creatorId, amount, bankCode = null, payoutMethod = 'bank_transfer') {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get creator details
      const [creators] = await connection.execute(
        'SELECT preferred_bank, bank_account_number FROM users WHERE id = ?',
        [creatorId]
      );

      if (!creators.length) {
        return { success: false, error: 'Creator not found' };
      }

      const creator = creators[0];
      const bank = bankCode || creator.preferred_bank || 'EXIM';

      // Get bank ID
      const [banks] = await connection.execute(
        'SELECT id FROM bank_configurations WHERE code = ?',
        [bank]
      );

      if (!banks.length) {
        return { success: false, error: 'Bank not found' };
      }

      const bankId = banks[0].id;

      // Generate batch ID
      const batchId = `PAYOUT-${Date.now()}-${creatorId}`;

      // Insert payout
      const [result] = await connection.execute(
        `INSERT INTO payouts 
         (payout_batch_id, creator_id, total_amount, currency, payout_method, bank_id, status, created_by)
         VALUES (?, ?, ?, 'UGX', ?, ?, 'pending', ?)`,
        [batchId, creatorId, amount, payoutMethod, bankId, 1]
      );

      const payoutId = result.insertId;

      await connection.commit();

      return {
        success: true,
        data: {
          payoutId,
          batchId,
          creatorId,
          amount,
          status: 'pending',
          bank
        }
      };
    } catch (error) {
      await connection.rollback();
      return { success: false, error: error.message };
    } finally {
      connection.release();
    }
  }

  /**
   * Add payment(s) to payout
   */
  async addPaymentsToPayout(payoutId, paymentIds) {
    try {
      for (const paymentId of paymentIds) {
        // Verify payment exists and get amount
        const [payments] = await pool.execute(
          `SELECT pf.creator_net_payout, p.pledge_id
           FROM payments p
           JOIN payment_fees pf ON p.id = pf.payment_id
           WHERE p.id = ?`,
          [paymentId]
        );

        if (payments.length) {
          await pool.execute(
            `INSERT INTO payout_details (payout_id, pledge_id, payment_id, amount)
             VALUES (?, ?, ?, ?)`,
            [payoutId, payments[0].pledge_id, paymentId, payments[0].creator_net_payout]
          );
        }
      }

      return { success: true, data: { payoutId, paymentsAdded: paymentIds.length } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Process pending payouts (schedule for sending)
   */
  async processPendingPayouts(creatorId = null, scheduledDate = null) {
    try {
      scheduledDate = scheduledDate || new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow

      let query = 'SELECT id FROM payouts WHERE status = ? ';
      let params = ['pending'];

      if (creatorId) {
        query += 'AND creator_id = ? ';
        params.push(creatorId);
      }

      const [payouts] = await pool.execute(query, params);

      for (const payout of payouts) {
        await pool.execute(
          `UPDATE payouts 
           SET status = 'processing', scheduled_date = ?, updated_at = NOW()
           WHERE id = ?`,
          [scheduledDate, payout.id]
        );
      }

      return {
        success: true,
        data: {
          processed: payouts.length,
          scheduledDate: scheduledDate.toISOString().split('T')[0]
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mark payout as completed
   */
  async completePayout(payoutId, referenceNumber) {
    try {
      await pool.execute(
        `UPDATE payouts 
         SET status = 'completed', completed_date = NOW(), 
             reference_number = ?, updated_at = NOW()
         WHERE id = ?`,
        [referenceNumber, payoutId]
      );

      return { success: true, data: { payoutId, status: 'completed' } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get payout history for creator
   */
  async getPayoutHistory(creatorId, limit = 12, offset = 0) {
    try {
      const [payouts] = await pool.execute(
        `SELECT 
          p.id,
          p.payout_batch_id,
          p.total_amount,
          p.status,
          p.created_at,
          p.completed_date,
          p.reference_number,
          b.name as bank_name,
          (SELECT COUNT(*) FROM payout_details WHERE payout_id = p.id) as pledge_count
        FROM payouts p
        LEFT JOIN bank_configurations b ON p.bank_id = b.id
        WHERE p.creator_id = ?
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?`,
        [creatorId, limit, offset]
      );

      const [total] = await pool.execute(
        'SELECT COUNT(*) as count FROM payouts WHERE creator_id = ?',
        [creatorId]
      );

      return {
        success: true,
        data: {
          payouts,
          pagination: {
            total: total[0].count,
            limit,
            offset,
            pages: Math.ceil(total[0].count / limit)
          }
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all payouts awaiting completion (for admin)
   */
  async getPendingAdminPayouts(status = 'processing') {
    try {
      const [payouts] = await pool.execute(
        `SELECT 
          p.id,
          p.payout_batch_id,
          p.creator_id,
          u.name as creator_name,
          u.phone as creator_phone,
          p.total_amount,
          p.status,
          p.payout_method,
          p.scheduled_date,
          b.name as bank_name,
          (SELECT COUNT(*) FROM payout_details WHERE payout_id = p.id) as pledge_count,
          p.created_at
        FROM payouts p
        JOIN users u ON p.creator_id = u.id
        LEFT JOIN bank_configurations b ON p.bank_id = b.id
        WHERE p.status = ?
        ORDER BY p.scheduled_date ASC`,
        [status]
      );

      return {
        success: true,
        data: {
          payouts,
          count: payouts.length
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get creator summary dashboard
   */
  async getCreatorDashboard(creatorId) {
    try {
      // Current month earnings
      const now = new Date();
      const earningsResult = await this.getCreatorEarnings(
        creatorId,
        now.getMonth() + 1,
        now.getFullYear()
      );

      // Pending payouts
      const pendingResult = await this.getPendingPayouts(creatorId);

      // All-time stats
      const [stats] = await pool.execute(
        `SELECT 
          COUNT(DISTINCT pl.id) as total_pledges_created,
          SUM(ce.total_pledges_received) as total_pledges_received,
          SUM(ce.total_paid_out) as total_paid_out,
          SUM(ce.net_earnings) as lifetime_earnings
        FROM users u
        LEFT JOIN pledges pl ON u.id = pl.created_by
        LEFT JOIN creator_earnings ce ON u.id = ce.creator_id
        WHERE u.id = ?`,
        [creatorId]
      );

      return {
        success: true,
        data: {
          currentMonth: earningsResult.data,
          pendingPayouts: pendingResult.data || [],
          allTimeStats: stats[0],
          lastUpdated: new Date().toISOString()
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all creators with earnings summary
   */
  async getAllCreatorEarnings() {
    try {
      const [creators] = await pool.execute(
        `SELECT 
          u.id,
          u.name,
          u.email,
          u.phone,
          SUM(ce.total_pledges_received) as total_collected,
          SUM(ce.net_earnings) as lifetime_earnings,
          SUM(ce.total_paid_out) as total_paid_out,
          COUNT(ce.id) as months_active,
          MAX(ce.updated_at) as last_updated
        FROM users u
        LEFT JOIN creator_earnings ce ON u.id = ce.creator_id
        WHERE u.role = 'user'
        GROUP BY u.id
        ORDER BY lifetime_earnings DESC`
      );

      return { success: true, data: creators };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PayoutService();
