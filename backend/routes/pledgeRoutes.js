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
const {
  validateEmail,
  validatePhone,
  validateAmount,
  validateRequired,
  sendError
} = require('../utils/requestValidator');


// Batch create pledges
// POST /batch
// Protected: Staff/Admin only
router.post('/batch', authenticateToken, requireStaff, batchCreatePledges);


/**
 * Create a new pledge
 * POST /
 * Protected: Public - allow anyone to create a pledge
 * Adds validation middleware
 */
router.post('/', (req, res, next) => {
  const { donor_name, donor_email, donor_phone, amount } = req.body;
  // Validate required fields
  const requiredFields = [
    { value: donor_name, name: 'Donor name' },
    { value: donor_phone, name: 'Donor phone' },
    { value: amount, name: 'Amount' }
  ];
  for (const field of requiredFields) {
    const check = validateRequired(field.value, field.name);
    if (!check.valid) return sendError(res, 400, check.error);
  }
  if (donor_email && !validateEmail(donor_email)) return sendError(res, 400, 'Invalid email format');
  if (!validatePhone(donor_phone)) return sendError(res, 400, 'Invalid phone format');
  if (!validateAmount(amount)) return sendError(res, 400, 'Invalid amount');
  next();
}, createPledge);

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
 * Get all pledges (paginated)
 * GET /
 * Query: ?page=1&limit=20
 * Protected: Authenticated users (Staff/Admin see all, Donors see own)
 */
router.get('/', authenticateToken, (req, res, next) => {
  req.query.page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  req.query.limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 20;
  next();
}, listPledges);

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
 * Adds validation middleware
 */
router.put('/:id', authenticateToken, requireStaff, (req, res, next) => {
  const { donor_name, donor_email, donor_phone, amount } = req.body;
  if (donor_email && !validateEmail(donor_email)) return sendError(res, 400, 'Invalid email format');
  if (donor_phone && !validatePhone(donor_phone)) return sendError(res, 400, 'Invalid phone format');
  if (amount && !validateAmount(amount)) return sendError(res, 400, 'Invalid amount');
  next();
}, updatePledge);

/**
 * Delete a pledge
 * DELETE /:id
 * Protected: Staff/Admin only
 */
router.delete('/:id', authenticateToken, requireStaff, deletePledge);

module.exports = router;