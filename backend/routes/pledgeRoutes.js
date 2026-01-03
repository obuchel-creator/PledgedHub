const express = require('express');
const router = express.Router();

// Public: Get a pledge by id (safe for sharing)
// GET /public/:id
// No authentication required
router.get('/public/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { pool } = require('../config/db');
    
    // Fetch pledge details
    const [pledges] = await pool.execute(
      `SELECT 
          id,
          donor_name AS title,
          donor_name,
          donor_email,
          donor_phone,
          amount,
          collection_date,
          status,
          purpose,
          notes,
          amount_paid,
          balance,
          last_reminder_sent,
          reminder_count,
          campaign_id,
          user_id,
          payment_method,
          payment_reference,
          created_at,
          updated_at
       FROM pledges WHERE id = ? AND deleted = 0 LIMIT 1`,
      [id]
    );
    
    if (!pledges || !pledges[0]) {
      return res.status(404).json({ success: false, error: 'Pledge not found' });
    }
    
    const pledge = pledges[0];
    
    // Fetch payment history
    const [payments] = await pool.execute(
      `SELECT 
          id, 
          amount, 
          payment_method,
          payment_date,
          reference_number,
          notes,
          verification_status,
          receipt_number,
          receipt_photo_url,
          created_at
       FROM payments WHERE pledge_id = ? AND deleted = 0 ORDER BY payment_date DESC, created_at DESC`,
      [id]
    );
    
    pledge.paymentHistory = payments || [];
    return res.status(200).json({ success: true, data: pledge });
  } catch (err) {
    console.error('getPublicPledge error:', err);
    return res.status(500).json({ success: false, error: 'Server error', details: err.message });
  }
});
const { createPledge, getPledge, listPledges, updatePledge, deletePledge, batchCreatePledges } = require('../controllers/pledgeController');
const { authenticateToken, requireStaff } = require('../middleware/authMiddleware');
const pledgeVerificationService = require('../services/pledgeVerificationService');

// Batch create pledges
// POST /batch
// Protected: Staff/Admin only
router.post('/batch', authenticateToken, requireStaff, batchCreatePledges);

/**
 * Create a new pledge
 * POST /
 * Protected: Public - allow anyone to create a pledge
 */
router.post('/', createPledge);

/**
 * Verify pledge email
 * POST /verify
 * Protected: Public
 */
router.post('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const result = await pledgeVerificationService.verifyPledge(token);
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get all pledges
 * GET /
 * Protected: Authenticated users (Staff/Admin see all, Donors see own)
 */
router.get('/', authenticateToken, listPledges);

/**
 * Get a pledge by id
 * GET /:id
 * Protected: Authenticated users (Staff/Admin see all, Donors see own)
 */
router.get('/:id', authenticateToken, getPledge);

/**
 * Update a pledge
 * PUT /:id
 * Protected: Staff/Admin only
 */
router.put('/:id', authenticateToken, requireStaff, updatePledge);

/**
 * Delete a pledge
 * DELETE /:id
 * Protected: Staff/Admin only
 */
router.delete('/:id', authenticateToken, requireStaff, deletePledge);

module.exports = router;