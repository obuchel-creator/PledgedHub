// Admin routes for restoring and permanently deleting pledges
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { requireAdmin } = require('../middleware/authMiddleware');

// Restore a soft-deleted pledge
router.post('/restore/:pledgeId', requireAdmin, async (req, res) => {
  const { pledgeId } = req.params;
  try {
    const [result] = await pool.execute(
      'UPDATE pledges SET deleted = 0 WHERE id = ? AND deleted = 1',
      [pledgeId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Pledge not found or not deleted' });
    }
    res.json({ success: true, message: 'Pledge restored' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Permanently delete a pledge
router.delete('/delete/:pledgeId', requireAdmin, async (req, res) => {
  const { pledgeId } = req.params;
  try {
    // Optionally cascade delete payments, feedback, etc.
    await pool.execute('DELETE FROM payments WHERE pledge_id = ?', [pledgeId]);
    await pool.execute('DELETE FROM feedback WHERE pledge_id = ?', [pledgeId]);
    const [result] = await pool.execute('DELETE FROM pledges WHERE id = ? AND deleted = 1', [pledgeId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Pledge not found or not deleted' });
    }
    res.json({ success: true, message: 'Pledge permanently deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
