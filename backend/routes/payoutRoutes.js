const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const payoutService = require('../services/payoutService');

/**
 * GET /api/payouts/my-earnings
 * Get creator's earnings for current month
 */
router.get('/my-earnings', authenticateToken, async (req, res) => {
  try {
    const result = await payoutService.getCreatorEarnings(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payouts/my-dashboard
 * Get creator's complete dashboard
 */
router.get('/my-dashboard', authenticateToken, async (req, res) => {
  try {
    const result = await payoutService.getCreatorDashboard(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payouts/pending
 * Get creator's pending payouts
 */
router.get('/pending', authenticateToken, async (req, res) => {
  try {
    const result = await payoutService.getPendingPayouts(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payouts/history
 * Get creator's payout history
 */
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit || 12;
    const offset = req.query.offset || 0;
    const result = await payoutService.getPayoutHistory(req.user.id, limit, offset);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payouts/earnings/:year/:month
 * Get earnings for specific month
 */
router.get('/earnings/:year/:month', authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await payoutService.getCreatorEarnings(
      req.user.id,
      parseInt(month),
      parseInt(year)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payouts/admin/calculate-monthly
 * Admin: Calculate earnings for a creator for specific month
 */
router.post('/admin/calculate-monthly', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { creatorId, year, month } = req.body;

    if (!creatorId || !year || !month) {
      return res.status(400).json({ success: false, error: 'creatorId, year, and month required' });
    }

    const result = await payoutService.calculateMonthlyEarnings(creatorId, year, month);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/payouts/admin/create
 * Admin: Create new payout for creator
 */
router.post('/admin/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { creatorId, amount, bankCode, payoutMethod } = req.body;

    if (!creatorId || !amount) {
      return res.status(400).json({ success: false, error: 'creatorId and amount required' });
    }

    const result = await payoutService.createPayout(creatorId, amount, bankCode, payoutMethod);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payouts/admin/pending
 * Admin: Get all pending payouts
 */
router.get('/admin/pending', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || 'processing';
    const result = await payoutService.getPendingAdminPayouts(status);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/payouts/admin/all-creators
 * Admin: Get all creators with earnings
 */
router.get('/admin/all-creators', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await payoutService.getAllCreatorEarnings();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/payouts/admin/:id/complete
 * Admin: Mark payout as completed
 */
router.put('/admin/:id/complete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
      return res.status(400).json({ success: false, error: 'referenceNumber required' });
    }

    const result = await payoutService.completePayout(req.params.id, referenceNumber);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
