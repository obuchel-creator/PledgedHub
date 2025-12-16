const express = require('express');
const router = express.Router();
const paymentSettingsService = require('../services/paymentSettingsService');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// Get all payment settings
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await paymentSettingsService.getPaymentSettings();
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Save settings for a specific provider
router.post('/:provider', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { provider } = req.params;
    const credentials = req.body;

    // Validate provider
    const validProviders = ['mtn', 'airtel', 'paypal'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ success: false, error: 'Invalid payment provider' });
    }

    const result = await paymentSettingsService.savePaymentSettings(provider, credentials);
    
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Test payment gateway connection
router.post('/:provider/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { provider } = req.params;

    const validProviders = ['mtn', 'airtel', 'paypal'];
    if (!validProviders.includes(provider)) {
      return res.status(400).json({ success: false, error: 'Invalid payment provider' });
    }

    const result = await paymentSettingsService.testPaymentGateway(provider);
    
    if (result.success) {
      return res.json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
