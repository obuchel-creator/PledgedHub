
const express = require('express');
const router = express.Router();
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