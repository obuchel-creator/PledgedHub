
const express = require('express');
const router = express.Router();
const { createPledge, getPledge, listPledges, updatePledge, deletePledge, batchCreatePledges } = require('../controllers/pledgeController');
const { authenticateToken, requireStaff } = require('../middleware/authMiddleware');

// Batch create pledges
// POST /batch
// Protected: Staff/Admin only
router.post('/batch', authenticateToken, requireStaff, batchCreatePledges);

/**
 * Create a new pledge
 * POST /
 * Protected: Staff/Admin only
 */
router.post('/', authenticateToken, requireStaff, createPledge);

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