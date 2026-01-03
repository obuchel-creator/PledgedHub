const express = require('express');
const router = express.Router();
const deploymentConfig = require('../config/deploymentConfig');
const monetizationService = require('../services/monetizationService');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Get current monetization phase information
 * Public endpoint - no authentication required
 */
router.get('/phase', (req, res) => {
  try {
    const phaseInfo = deploymentConfig.getCurrentPhase();
    
    res.json({
      success: true,
      phase: phaseInfo
    });
  } catch (error) {
    console.error('Error getting monetization phase:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get monetization phase'
    });
  }
});

/**
 * Get user's current usage and limits
 * Requires authentication
 */
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [users] = await require('../config/db').pool.execute(
      'SELECT subscription_tier FROM users WHERE id = ?',
      [userId]
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = users[0];
    const usage = await monetizationService.getUserUsageStats(userId);
    const phase = deploymentConfig.getCurrentPhase();
    
    // Get tier limits
    const { PRICING_TIERS } = require('../config/monetization');
    const tier = PRICING_TIERS[user.subscription_tier || 'FREE'];
    
    res.json({
      success: true,
      data: {
        currentTier: user.subscription_tier || 'FREE',
        usage: usage,
        limits: tier.limits,
        phase: phase.phase,
        gracePeriod: deploymentConfig.isInGracePeriod(),
        daysUntilEnforcement: phase.daysRemaining
      }
    });
  } catch (error) {
    console.error('Error getting usage stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage stats'
    });
  }
});

/**
 * Check if user can send SMS
 * Requires authentication
 */
router.get('/can-send-sms', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await monetizationService.canSendSMS(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error checking SMS availability:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check SMS availability'
    });
  }
});

/**
 * Get early bird discount eligibility
 * Requires authentication
 */
router.get('/early-bird', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const phase = deploymentConfig.getCurrentPhase();
    
    const [users] = await require('../config/db').pool.execute(
      'SELECT subscription_tier, created_at FROM users WHERE id = ?',
      [userId]
    );
    
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = users[0];
    const daysSinceDeployment = deploymentConfig.getCurrentPhase().daysSinceDeployment;
    
    // Early bird eligible if:
    // 1. Current phase is PRE_MONETIZATION_WARNING or earlier
    // 2. User hasn't subscribed yet (still on FREE)
    // 3. Within 180 days of deployment
    const eligible = 
      daysSinceDeployment < 180 && 
      user.subscription_tier === 'FREE' &&
      phase.phase !== 'MONETIZATION_ACTIVE';
    
    res.json({
      success: true,
      data: {
        eligible,
        discount: eligible ? 0.25 : 0,
        durationMonths: 6,
        daysRemaining: Math.max(0, 180 - daysSinceDeployment),
        message: eligible 
          ? `Subscribe now and save 25% for 6 months! Offer expires in ${180 - daysSinceDeployment} days.`
          : 'Early bird discount is no longer available.'
      }
    });
  } catch (error) {
    console.error('Error checking early bird eligibility:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check early bird eligibility'
    });
  }
});

module.exports = router;
