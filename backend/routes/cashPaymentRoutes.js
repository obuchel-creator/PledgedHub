/**
 * Cash Payment Routes
 * Admin endpoints for recording, verifying, and tracking cash payments
 */

const express = require('express');
const router = express.Router();
const cashPaymentService = require('../services/cashPaymentService');
const { authenticateToken, requireAdmin, requireStaff } = require('../middleware/authMiddleware');

/**
 * Record a cash payment
 * POST /api/cash-payments/record
 * Body: { pledgeId, collectedAmount, collectionDate, donorName, donorPhone, ... }
 */
router.post('/record', authenticateToken, requireStaff, async (req, res) => {
  try {
    const {
      pledgeId,
      collectedAmount,
      collectionDate,
      donorName,
      donorPhone,
      donorIdType,
      donorIdNumber,
      collectionLocation,
      notes,
      receiptNumber,
      receiptPhotoUrl
    } = req.body;

    // Validation
    if (!pledgeId || !collectedAmount) {
      return res.status(400).json({
        error: 'pledgeId and collectedAmount are required'
      });
    }

    const result = await cashPaymentService.recordCashPayment({
      pledgeId,
      collectedAmount: parseFloat(collectedAmount),
      collectionDate: collectionDate || new Date(),
      collectorId: req.user.id,
      donorName,
      donorPhone,
      donorIdType,
      donorIdNumber,
      collectionLocation,
      notes,
      receiptNumber,
      receiptPhotoUrl
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Cash payment recorded successfully'
    });
  } catch (error) {
    console.error('Record cash payment error:', error);
    res.status(500).json({ error: 'Failed to record cash payment' });
  }
});

/**
 * Verify a cash payment
 * POST /api/cash-payments/:id/verify
 * Body: { approved: boolean, verificationNotes: string }
 */
router.post('/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { approved = true, verificationNotes } = req.body;

    const result = await cashPaymentService.verifyCashPayment({
      cashDepositId: parseInt(id),
      verifiedBy: req.user.id,
      verificationNotes,
      approved
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: `Cash payment ${approved ? 'verified' : 'rejected'}`
    });
  } catch (error) {
    console.error('Verify cash payment error:', error);
    res.status(500).json({ error: 'Failed to verify cash payment' });
  }
});

/**
 * Mark cash as deposited to bank
 * POST /api/cash-payments/:id/deposit
 * Body: { bankReference, depositDate }
 */
router.post('/:id/deposit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { bankReference, depositDate } = req.body;

    if (!bankReference) {
      return res.status(400).json({
        error: 'bankReference is required'
      });
    }

    const result = await cashPaymentService.markAsDeposited({
      cashDepositId: parseInt(id),
      bankReference,
      depositDate,
      recordedBy: req.user.id
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Cash marked as deposited'
    });
  } catch (error) {
    console.error('Mark as deposited error:', error);
    res.status(500).json({ error: 'Failed to mark as deposited' });
  }
});

/**
 * Get pending cash verifications
 * GET /api/cash-payments/pending/list
 */
router.get('/pending/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await cashPaymentService.getPendingVerification();

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get pending verification error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

/**
 * Get cash deposit detail
 * GET /api/cash-payments/:id/detail
 */
router.get('/:id/detail', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await cashPaymentService.getCashDepositDetail(parseInt(id));

    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get deposit detail error:', error);
    res.status(500).json({ error: 'Failed to get deposit details' });
  }
});

/**
 * Get collector accountability
 * GET /api/cash-payments/accountability
 * Query: year, month, collectorId (optional)
 */
router.get('/accountability', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year, month, collectorId } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: 'year and month query parameters are required'
      });
    }

    const result = await cashPaymentService.getCollectorAccountability(
      collectorId ? parseInt(collectorId) : null,
      parseInt(year),
      parseInt(month)
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get accountability error:', error);
    res.status(500).json({ error: 'Failed to get accountability data' });
  }
});

/**
 * Get accountability dashboard
 * GET /api/cash-payments/dashboard
 * Query: year, month
 */
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        error: 'year and month query parameters are required'
      });
    }

    const result = await cashPaymentService.getAccountabilityDashboard(
      parseInt(year),
      parseInt(month)
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

/**
 * Report a discrepancy
 * POST /api/cash-payments/:id/discrepancy
 * Body: { discrepancyType, expectedAmount, actualAmount, description }
 */
router.post('/:id/discrepancy', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { discrepancyType, expectedAmount, actualAmount, description } = req.body;

    if (!discrepancyType || !expectedAmount || !actualAmount) {
      return res.status(400).json({
        error: 'discrepancyType, expectedAmount, and actualAmount are required'
      });
    }

    const result = await cashPaymentService.reportDiscrepancy({
      cashDepositId: parseInt(id),
      discrepancyType,
      expectedAmount: parseFloat(expectedAmount),
      actualAmount: parseFloat(actualAmount),
      description,
      reportedBy: req.user.id
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Discrepancy reported'
    });
  } catch (error) {
    console.error('Report discrepancy error:', error);
    res.status(500).json({ error: 'Failed to report discrepancy' });
  }
});

module.exports = router;
