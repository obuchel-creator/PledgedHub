const express = require('express');
const router = express.Router();
const { getFeedbacks } = require('../controllers/feedbackController');
const { requireAdmin } = require('../middleware/authMiddleware');

// GET /api/feedback (admin only)
router.get('/', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  try {
    const feedbacks = await getFeedbacks({ page, pageSize });
    res.json({ success: true, data: feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
