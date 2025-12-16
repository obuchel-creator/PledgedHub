const express = require('express');
const router = express.Router();
const { saveFeedback } = require('../services/feedbackService');

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: 'Message is required.' });
  }
  const userAgent = req.headers['user-agent'] || '';
  const date = new Date().toISOString();
  try {
    const result = await saveFeedback({ message, userAgent, date });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to save feedback.' });
  }
});

module.exports = router;
