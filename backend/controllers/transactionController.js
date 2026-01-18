const { pool } = require('../config/db');

/**
 * List all transactions/payments for the current user
 * GET /api/payments/history
 */
async function getTransactionHistory(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    // Join payments and pledges for richer info
    const [rows] = await pool.execute(`
      SELECT p.id, p.created_at as date, p.amount, p.status, p.payment_method as type
      FROM payments p
      JOIN pledges pl ON p.pledge_id = pl.id
      WHERE pl.user_id = ? OR p.user_id = ?
      ORDER BY p.created_at DESC
      LIMIT 100
    `, [userId, userId]);
    return res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getTransactionHistory error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
}

module.exports = { getTransactionHistory };
