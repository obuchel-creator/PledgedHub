/**
 * Monetization Routes
 * API endpoints for subscription management and billing
 */

const express = require('express');
const router = express.Router();
const monetizationService = require('../services/monetizationService');
const { isMonetizationActive, getMonetizationStartDate } = require('../config/monetization');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

/**
 * GET /api/monetization/status
 * Check if monetization is active and get activation date
 */
router.get('/status', (req, res) => {
  try {
    const isActive = isMonetizationActive();
    const startDate = getMonetizationStartDate();
    
    res.json({
      success: true,
      data: {
        isActive,
        activationDate: startDate,
        daysUntilActivation: isActive ? 0 : Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24)),
        message: isActive 
          ? 'Monetization is active' 
          : `Monetization will activate on ${startDate.toLocaleDateString()}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/monetization/pricing
 * Get all available pricing tiers
 */
router.get('/pricing', async (req, res) => {
  try {
    const plans = await monetizationService.getPricingTiers();
    
    res.json({
      success: true,
      data: {
        plans,
        monetizationActive: monetizationService.isActive()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/monetization/subscription
 * Get user's current subscription details
 */
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const subscription = await monetizationService.getUserSubscription(req.user.id);
    
    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found' });
    }
    
    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/monetization/subscribe
 * Subscribe to a pricing tier
 * Body: { tier: 'STARTER', paymentMethod: 'stripe', durationMonths: 1 }
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { tier, paymentMethod, durationMonths = 1 } = req.body;
    
    if (!tier) {
      return res.status(400).json({ success: false, error: 'Tier is required' });
    }
    
    // TODO: Integrate with actual payment processor (Stripe, PayPal, etc.)
    // This is a placeholder - in production, verify payment first
    
    const subscription = await monetizationService.updateSubscription(
      req.user.id,
      tier,
      paymentMethod,
      durationMonths
    );
    
    // Record payment
    const tierInfo = require('../config/monetization').PRICING_TIERS[tier];
    await monetizationService.recordPayment(
      req.user.id,
      tierInfo.price * durationMonths,
      `Subscription: ${tier} - ${durationMonths} month(s)`,
      paymentMethod,
      'completed'
    );
    
    res.json({
      success: true,
      data: subscription,
      message: `Successfully subscribed to ${tier} plan`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/monetization/cancel
 * Cancel current subscription
 */
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const result = await monetizationService.cancelSubscription(req.user.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/monetization/usage
 * Get current usage statistics
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const usage = await monetizationService.getUserUsageStats(req.user.id);
    const subscription = await monetizationService.getUserSubscription(req.user.id);
    
    res.json({
      success: true,
      data: {
        usage,
        limits: subscription.limits,
        percentUsed: {
          pledges: subscription.limits.pledgesPerMonth > 0 
            ? Math.round((usage.pledgesThisMonth / subscription.limits.pledgesPerMonth) * 100) 
            : 0,
          campaigns: subscription.limits.campaigns > 0 
            ? Math.round((usage.activeCampaigns / subscription.limits.campaigns) * 100) 
            : 0,
          sms: subscription.limits.smsNotifications > 0 
            ? Math.round((usage.smsThisMonth / subscription.limits.smsNotifications) * 100) 
            : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/monetization/billing-history
 * Get billing history for user
 */
router.get('/billing-history', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await monetizationService.getBillingHistory(req.user.id, limit);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/monetization/calculate-fee
 * Calculate transaction fee for a given amount
 * Body: { amount: 1000 }
 */
router.post('/calculate-fee', authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }
    
    const feeCalculation = monetizationService.calculateTransactionFee(amount);
    
    res.json({
      success: true,
      data: feeCalculation
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Middleware to check subscription limits before action
 * Use this in other routes that need limit checking
 */
const checkSubscriptionLimit = (actionType) => {
  return async (req, res, next) => {
    try {
      const canPerform = await monetizationService.canPerformAction(req.user.id, actionType);
      
      if (!canPerform.allowed) {
        return res.status(403).json({
          success: false,
          error: canPerform.reason,
          upgradeRequired: true,
          suggestedTier: canPerform.suggestedTier,
          currentTier: canPerform.currentTier
        });
      }
      
      next();
    } catch (error) {
      console.error('Error checking subscription limit:', error);
      next(); // Allow action on error
    }
  };
};

/**
 * POST /api/monetization/notify
 * Save email for billing launch notification
 */
router.post('/notify', async (req, res) => {
  try {
    const { email, activationDate } = req.body;
    
    if (!email || !email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: 'Valid email required' });
    }
    
    // Store in database (optional: can also send confirmation email)
    const { pool } = require('../config/db');
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if already subscribed
    const [existing] = await pool.execute(
      'SELECT id FROM billing_notifications WHERE email = ?',
      [normalizedEmail]
    );
    
    if (existing && existing.length > 0) {
      return res.json({ 
        success: true, 
        message: 'Email already registered for notifications' 
      });
    }
    
    // Insert new notification subscription
    await pool.execute(
      'INSERT INTO billing_notifications (email, activation_date, created_at) VALUES (?, ?, NOW())',
      [normalizedEmail, activationDate || new Date(Date.now() + 1000 * 60 * 60 * 24 * 30 * 6)]
    );
    
    res.json({
      success: true,
      message: 'Email registered. We will notify you before billing starts.'
    });
  } catch (error) {
    console.error('Notify error:', error);
    res.status(500).json({ success: false, error: 'Could not save notification' });
  }
});

module.exports = {
  router,
  checkSubscriptionLimit
};
