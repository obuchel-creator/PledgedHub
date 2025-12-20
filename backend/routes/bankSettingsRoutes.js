const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/authMiddleware');
const bankFeeCalculator = require('../services/bankFeeCalculatorService');

/**
 * GET /api/bank-settings/banks
 * Get all available banks
 */
router.get('/banks', async (req, res) => {
  try {
    const result = await bankFeeCalculator.getBankConfigurations(true);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bank-settings/bank/:code
 * Get single bank configuration
 */
router.get('/bank/:code', async (req, res) => {
  try {
    const result = await bankFeeCalculator.getBankByCode(req.params.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bank-settings/calculate-fees
 * Calculate fees for a payment
 * Body: { donorAmount, paymentMethod, bankCode, platformCommissionPercent }
 */
router.post('/calculate-fees', async (req, res) => {
  try {
    const { donorAmount, paymentMethod = 'airtel', bankCode = 'EXIM', platformCommissionPercent = 10 } = req.body;

    if (!donorAmount || donorAmount < 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const result = await bankFeeCalculator.calculatePaymentFees(
      null,
      donorAmount,
      paymentMethod,
      bankCode,
      platformCommissionPercent
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/bank-settings/compare-banks
 * Compare fees across all banks
 * Body: { donorAmount, paymentMethod, platformCommissionPercent }
 */
router.post('/compare-banks', async (req, res) => {
  try {
    const { donorAmount, paymentMethod = 'airtel', platformCommissionPercent = 10 } = req.body;

    if (!donorAmount || donorAmount < 0) {
      return res.status(400).json({ success: false, error: 'Invalid amount' });
    }

    const result = await bankFeeCalculator.compareBankFees(
      donorAmount,
      paymentMethod,
      platformCommissionPercent
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/bank-settings/my-bank-preference
 * Update user's preferred bank
 * Body: { bankCode, accountNumber, accountName, accountType }
 */
router.put('/my-bank-preference', authenticateToken, async (req, res) => {
  try {
    const { bankCode, accountNumber, accountName, accountType = 'personal' } = req.body;

    if (!bankCode || !accountNumber) {
      return res.status(400).json({ success: false, error: 'Bank code and account number required' });
    }

    const result = await bankFeeCalculator.updateUserBankPreference(
      req.user.id,
      bankCode,
      accountNumber,
      accountName,
      accountType
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/bank-settings/monthly-report/:year/:month
 * Admin: Get monthly fees report
 */
router.get('/monthly-report/:year/:month', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.params;
    const result = await bankFeeCalculator.getMonthlyFeesReport(parseInt(year), parseInt(month));
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
