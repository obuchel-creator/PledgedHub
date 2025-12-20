/**
 * Commission Routes
 * 
 * Endpoints to:
 * - View available commissions
 * - Request commission payout
 * - View commission history
 * - Get commission stats
 * - Setup your payment accounts
 * 
 * All endpoints require admin role
 */

const express = require('express');
const router = express.Router();
const commissionDistributionService = require('../services/commissionDistributionService');
const { pool } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

/**
 * GET /api/commissions/summary
 * Get your commission summary (accrued, pending, paid out)
 */
router.get('/summary', async (req, res) => {
  try {
    const result = await commissionDistributionService.getCommissionStats();
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error getting commission summary:', error);
    res.status(500).json({ success: false, error: 'Failed to get commission summary' });
  }
});

/**
 * POST /api/commissions/payout
 * Request commission payout to your account
 * 
 * Body: { method: 'mtn' | 'airtel', timing: 'immediate' | 'batch' }
 */
router.post('/payout', async (req, res) => {
  try {
    const { method = 'mtn', timing = 'immediate' } = req.body;
    
    // Validate method
    if (!['mtn', 'airtel'].includes(method)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment method. Use: mtn or airtel'
      });
    }
    
    // Check if you have a primary account for this method
    const [accounts] = await pool.execute(
      'SELECT * FROM platform_accounts WHERE account_type = ? AND is_primary = 1 AND is_active = 1',
      [method]
    );
    
    if (accounts.length === 0) {
      return res.status(400).json({
        success: false,
        error: `No primary ${method.toUpperCase()} account configured. Set up your account first.`,
        needsSetup: true
      });
    }
    
    // Check if there are available commissions
    const available = await commissionDistributionService.getAvailableCommissions();
    if (!available.success || available.data.totalAmount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No commissions available for payout'
      });
    }
    
    // Process payout
    const result = await commissionDistributionService.distributeCommission(method, timing);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      message: `Commission payout initiated`,
      data: result.data
    });
    
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ success: false, error: 'Failed to process payout' });
  }
});

/**
 * GET /api/commissions/history
 * Get your commission payment history
 * 
 * Query: ?limit=50&status=successful
 */
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, status } = req.query;
    
    let query = `
      SELECT 
        cp.id,
        cp.batch_id,
        cp.payout_method,
        cp.payout_phone,
        cp.total_amount,
        cp.commission_count,
        cp.status,
        cp.transaction_id,
        cp.failure_reason,
        cp.created_at,
        cp.completed_at
      FROM commission_payouts cp
    `;
    
    const params = [];
    
    if (status) {
      query += ` WHERE cp.status = ?`;
      params.push(status);
    }
    
    query += ` ORDER BY cp.created_at DESC LIMIT ?`;
    params.push(parseInt(limit));
    
    const [payouts] = await pool.execute(query, params);
    
    res.json({
      success: true,
      data: {
        count: payouts.length,
        payouts: payouts
      }
    });
  } catch (error) {
    console.error('Error getting commission history:', error);
    res.status(500).json({ success: false, error: 'Failed to get history' });
  }
});

/**
 * GET /api/commissions/details
 * Get detailed list of individual commissions
 * 
 * Query: ?status=accrued&limit=50
 */
router.get('/details', async (req, res) => {
  try {
    const { status = 'accrued', limit = 50 } = req.query;
    
    const [commissions] = await pool.execute(`
      SELECT 
        c.id,
        c.pledge_id,
        c.amount,
        c.status,
        c.created_at,
        c.paid_out_at,
        o.name as organization_name,
        p.title as pledge_title,
        p.amount as pledge_amount
      FROM commissions c
      LEFT JOIN organizations o ON c.organization_id = o.id
      LEFT JOIN pledges p ON c.pledge_id = p.id
      WHERE c.status = ?
      ORDER BY c.created_at DESC
      LIMIT ?
    `, [status, parseInt(limit)]);
    
    res.json({
      success: true,
      data: {
        status,
        count: commissions.length,
        totalAmount: commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0),
        commissions
      }
    });
  } catch (error) {
    console.error('Error getting commission details:', error);
    res.status(500).json({ success: false, error: 'Failed to get details' });
  }
});

/**
 * GET /api/commissions/accounts
 * Get your configured platform accounts
 */
router.get('/accounts', async (req, res) => {
  try {
    const [accounts] = await pool.execute(`
      SELECT 
        id,
        account_type,
        phone_number,
        account_label,
        is_active,
        is_primary,
        created_at
      FROM platform_accounts
      ORDER BY is_primary DESC, created_at DESC
    `);
    
    res.json({
      success: true,
      data: {
        accounts
      }
    });
  } catch (error) {
    console.error('Error getting accounts:', error);
    res.status(500).json({ success: false, error: 'Failed to get accounts' });
  }
});

/**
 * POST /api/commissions/accounts
 * Add a new platform account for commission payouts
 * 
 * Body: {
 *   account_type: 'mtn' | 'airtel' | 'bank' | 'paypal',
 *   phone_number?: string,        // For MTN/Airtel
 *   bank_name?: string,           // For Bank
 *   bank_account_number?: string, // For Bank (will be encrypted)
 *   account_holder_name: string,
 *   account_label: string,
 *   is_primary: boolean
 * }
 */
router.post('/accounts', async (req, res) => {
  try {
    const {
      account_type,
      phone_number,
      bank_name,
      bank_account_number,
      account_holder_name,
      account_label,
      is_primary = false
    } = req.body;
    
    // Validate
    if (!['mtn', 'airtel', 'bank', 'paypal'].includes(account_type)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid account type'
      });
    }
    
    if (!account_holder_name) {
      return res.status(400).json({
        success: false,
        error: 'Account holder name is required'
      });
    }
    
    if (account_type === 'mtn' || account_type === 'airtel') {
      if (!phone_number) {
        return res.status(400).json({
          success: false,
          error: `Phone number required for ${account_type.toUpperCase()}`
        });
      }
    }
    
    // If setting as primary, unset others
    if (is_primary) {
      await pool.execute(
        'UPDATE platform_accounts SET is_primary = 0 WHERE account_type = ?',
        [account_type]
      );
    }
    
    // Insert account
    const [result] = await pool.execute(`
      INSERT INTO platform_accounts (
        account_type, phone_number, bank_name, bank_account_number,
        account_holder_name, account_label, is_active, is_primary
      ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `, [
      account_type,
      phone_number || null,
      bank_name || null,
      bank_account_number || null,
      account_holder_name,
      account_label || `${account_type.toUpperCase()} Account`,
      is_primary ? 1 : 0
    ]);
    
    console.log(`✅ Platform account added: ${account_label || account_type}`);
    
    res.status(201).json({
      success: true,
      message: 'Account configured successfully',
      data: {
        id: result.insertId,
        account_type,
        account_label,
        is_primary
      }
    });
  } catch (error) {
    console.error('Error adding account:', error);
    res.status(500).json({ success: false, error: 'Failed to add account' });
  }
});

/**
 * PUT /api/commissions/accounts/:id
 * Update platform account
 */
router.put('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { account_label, is_active, is_primary } = req.body;
    
    const [account] = await pool.execute(
      'SELECT account_type FROM platform_accounts WHERE id = ?',
      [id]
    );
    
    if (account.length === 0) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    // If setting as primary, unset others
    if (is_primary) {
      await pool.execute(
        'UPDATE platform_accounts SET is_primary = 0 WHERE account_type = ? AND id != ?',
        [account[0].account_type, id]
      );
    }
    
    const updates = [];
    const values = [];
    
    if (account_label !== undefined) {
      updates.push('account_label = ?');
      values.push(account_label);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    if (is_primary !== undefined) {
      updates.push('is_primary = ?');
      values.push(is_primary ? 1 : 0);
    }
    
    if (updates.length > 0) {
      values.push(id);
      await pool.execute(
        `UPDATE platform_accounts SET ${updates.join(', ')} WHERE id = ?`,
        values
      );
    }
    
    res.json({
      success: true,
      message: 'Account updated successfully'
    });
  } catch (error) {
    console.error('Error updating account:', error);
    res.status(500).json({ success: false, error: 'Failed to update account' });
  }
});

/**
 * DELETE /api/commissions/accounts/:id
 * Delete platform account
 */
router.delete('/accounts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [account] = await pool.execute(
      'SELECT is_primary FROM platform_accounts WHERE id = ?',
      [id]
    );
    
    if (account.length === 0) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    
    if (account[0].is_primary) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete primary account. Set another account as primary first.'
      });
    }
    
    await pool.execute('DELETE FROM platform_accounts WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ success: false, error: 'Failed to delete account' });
  }
});

/**
 * POST /api/commissions/payout/batch
 * Request batch commission payout for multiple campaigns
 */
router.post('/payout/batch', async (req, res) => {
  try {
    const { campaigns, method, pin } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!campaigns || !Array.isArray(campaigns) || campaigns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Campaign IDs required'
      });
    }

    // Calculate total payout amount
    const [total] = await pool.execute(`
      SELECT COALESCE(SUM(commission_amount), 0) as total
      FROM pledges
      WHERE user_id = ?
      AND campaign_id IN (${campaigns.map(() => '?').join(',')})
      AND status = 'collected'
      AND commission_payout_date IS NULL
    `, [userId, ...campaigns]);

    const totalAmount = total[0].total;

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'No pending commissions for selected campaigns'
      });
    }

    // Create batch payout
    const batchRef = `BATCH-${Date.now()}`;
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      const [result] = await connection.execute(`
        INSERT INTO commission_payouts 
        (user_id, amount, status, payment_method, request_type, reference, requested_at)
        VALUES (?, ?, 'pending', ?, 'batch', ?, NOW())
      `, [userId, totalAmount, method || 'mtn', batchRef]);

      // Mark pledges as payout requested
      await connection.execute(`
        UPDATE pledges 
        SET commission_payout_date = NOW()
        WHERE user_id = ?
        AND campaign_id IN (${campaigns.map(() => '?').join(',')})
        AND status = 'collected'
        AND commission_payout_date IS NULL
      `, [userId, ...campaigns]);

      await connection.commit();

      return res.json({
        success: true,
        data: {
          message: 'Batch payout request created',
          batchId: result.insertId,
          reference: batchRef,
          totalAmount: totalAmount,
          campaignCount: campaigns.length
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating batch payout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create batch payout'
    });
  }
});

/**
 * GET /api/commissions/stats
 * Get detailed commission statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user?.id;
    const period = req.query.period || 'month'; // day, week, month, year

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    let dateFilter = '';
    if (period === 'day') {
      dateFilter = 'DATE(created_at) = CURDATE()';
    } else if (period === 'week') {
      dateFilter = 'YEARWEEK(created_at) = YEARWEEK(NOW())';
    } else if (period === 'month') {
      dateFilter = 'MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())';
    } else if (period === 'year') {
      dateFilter = 'YEAR(created_at) = YEAR(NOW())';
    }

    // Fetch statistics
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(id) as total_pledges,
        SUM(amount) as total_pledged,
        SUM(commission_amount) as total_commission,
        AVG(commission_amount) as avg_commission,
        COUNT(DISTINCT campaign_id) as campaign_count
      FROM pledges
      WHERE user_id = ?
      AND ${dateFilter}
    `, [userId]);

    return res.json({
      success: true,
      data: {
        period: period,
        statistics: stats[0] || {
          total_pledges: 0,
          total_pledged: 0,
          total_commission: 0,
          avg_commission: 0,
          campaign_count: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching commission stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch commission statistics'
    });
  }
});

module.exports = router;
