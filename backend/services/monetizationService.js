/**
 * Monetization Service
 * Handles subscription management, billing, and usage tracking
 */

const { pool } = require('../config/db');
const db = { query: pool.query.bind(pool), execute: pool.execute.bind(pool) };
const billingNotificationService = require('./billingNotificationService');
const {
  isMonetizationActive,
  getSubscriptionStatus,
  checkUserLimits,
  PRICING_TIERS,
  TRANSACTION_FEE
} = require('../config/monetization');
const deploymentConfig = require('../config/deploymentConfig');

class MonetizationService {
  
  /**
   * Check if user can perform action based on their subscription limits
   */
  async canPerformAction(userId, actionType) {
    try {
      // DEPLOYMENT-AWARE: Check if we're in grace period
      if (deploymentConfig.isInGracePeriod()) {
        return { 
          allowed: true, 
          reason: 'Grace period active - all features free',
          gracePeriod: true,
          daysRemaining: deploymentConfig.getCurrentPhase().daysRemaining
        };
      }

      // Legacy check for monetization status
      if (!isMonetizationActive()) {
        return { allowed: true, reason: 'Monetization not active yet' };
      }

      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (!users || users.length === 0) {
        return { allowed: false, reason: 'User not found' };
      }

      const user = users[0];
      const usageStats = await this.getUserUsageStats(userId);
      const limitCheck = checkUserLimits(user, usageStats);

      if (limitCheck.needsUpgrade) {
        return {
          allowed: false,
          reason: `Limit exceeded: ${limitCheck.violations.join(', ')}`,
          suggestedTier: limitCheck.suggestedTier,
          currentTier: limitCheck.currentTier
        };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Error checking user limits:', error);
      return { allowed: true, reason: 'Error checking limits, allowing action' };
    }
  }

  /**
   * Get user's current usage statistics
   */
  async getUserUsageStats(userId) {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

    // Get or create usage stats for current month
    let [stats] = await db.query(
      'SELECT * FROM usage_stats WHERE user_id = ? AND month = ?',
      [userId, currentMonth]
    );

    if (!stats || stats.length === 0) {
      await db.query(
        'INSERT INTO usage_stats (user_id, month) VALUES (?, ?)',
        [userId, currentMonth]
      );
      stats = [{ 
        pledges_count: 0, 
        campaigns_count: 0, 
        sms_sent: 0, 
        emails_sent: 0,
        ai_requests: 0,
        cash_payments_count: 0  // Add cash payments tracking
      }];
    }

    const usage = stats[0];

    // Get active campaigns count
    const [campaignsResult] = await db.query(
      'SELECT COUNT(*) as count FROM campaigns WHERE ownerId = ? AND status = "active"',
      [userId]
    );

    return {
      pledgesThisMonth: usage.pledges_count || 0,
      activeCampaigns: campaignsResult[0].count || 0,
      smsThisMonth: usage.sms_sent || 0,
      emailsThisMonth: usage.emails_sent || 0,
      aiRequestsThisMonth: usage.ai_requests || 0,
      cashPaymentsThisMonth: usage.cash_payments_count || 0  // Track cash payments
    };
  }

  /**
   * Increment usage counter
   */
  async incrementUsage(userId, usageType, amount = 1) {
    const currentMonth = new Date().toISOString().substring(0, 7);

    const columnMap = {
      pledge: 'pledges_count',
      campaign: 'campaigns_count',
      sms: 'sms_sent',
      email: 'emails_sent',
      ai: 'ai_requests',
      api: 'api_calls',
      cash_payment: 'cash_payments_count'  // For cash payment tracking
    };

    const column = columnMap[usageType];
    if (!column) {
      console.error('Invalid usage type:', usageType);
      return;
    }

    await db.query(
      `INSERT INTO usage_stats (user_id, month, ${column}) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE ${column} = ${column} + ?`,
      [userId, currentMonth, amount, amount]
    );
  }

  /**
   * Get user's subscription information
   */
  async getUserSubscription(userId) {
    const [users] = await db.query(
      `SELECT id, email, createdAt, subscription_tier, subscription_status, 
              subscription_starts_at, subscription_ends_at, payment_method 
       FROM users WHERE id = ?`,
      [userId]
    );

    if (!users || users.length === 0) {
      return null;
    }

    const user = users[0];
    const status = getSubscriptionStatus({
      subscriptionTier: user.subscription_tier,
      subscriptionEndsAt: user.subscription_ends_at,
      createdAt: user.createdAt
    });

    const usageStats = await this.getUserUsageStats(userId);
    const tier = PRICING_TIERS[user.subscription_tier || 'FREE'];

    return {
      userId: user.id,
      email: user.email,
      tier: user.subscription_tier || 'FREE',
      status: status.status,
      statusMessage: status.message,
      daysLeft: status.daysLeft,
      renewalDate: user.subscription_ends_at,
      paymentMethod: user.payment_method,
      limits: tier.limits,
      usage: usageStats,
      features: tier.features
    };
  }

  /**
   * Create or update subscription
   */
  async updateSubscription(userId, tierName, paymentMethod, durationMonths = 1) {
    const tier = PRICING_TIERS[tierName];
    if (!tier) {
      throw new Error(`Invalid tier: ${tierName}`);
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + durationMonths);

    // Get current tier and email for tracking changes
    const [existingUsers] = await db.query(
      'SELECT subscription_tier, email FROM users WHERE id = ?',
      [userId]
    );
    const previousTier = existingUsers?.[0]?.subscription_tier || 'FREE';
    const userEmail = existingUsers?.[0]?.email || null;

    // Update user's subscription
    await db.query(
      `UPDATE users 
       SET subscription_tier = ?, 
           subscription_status = 'active',
           subscription_starts_at = ?,
           subscription_ends_at = ?,
           payment_method = ?
       WHERE id = ?`,
      [tierName, now, endDate, paymentMethod, userId]
    );

    // Create subscription record
    const [result] = await db.query(
      `INSERT INTO subscriptions 
       (user_id, tier, status, amount, currency, billing_period, started_at, ends_at, payment_method) 
       VALUES (?, ?, 'active', ?, ?, 'monthly', ?, ?, ?)`,
      [userId, tierName, tier.price, tier.currency, now, endDate, paymentMethod]
    );

    // Track upgrade/downgrade to suppress duplicate notifications
    await billingNotificationService.recordSubscriptionChange({
      userId,
      email: userEmail,
      fromTier: previousTier,
      toTier: tierName
    });

    return {
      subscriptionId: result.insertId,
      tier: tierName,
      startsAt: now,
      endsAt: endDate,
      amount: tier.price
    };
  }

  /**
   * Record a payment transaction
   */
  async recordPayment(userId, amount, description, paymentMethod, status = 'completed') {
    const [result] = await db.query(
      `INSERT INTO billing_history 
       (user_id, amount, currency, status, payment_method, description, paid_at) 
       VALUES (?, ?, 'USD', ?, ?, ?, ?)`,
      [userId, amount, status, paymentMethod, description, new Date()]
    );

    return { transactionId: result.insertId };
  }

  /**
   * Calculate transaction fee
   */
  calculateTransactionFee(amount) {
    const percentageFee = (amount * TRANSACTION_FEE.percentage) / 100;
    const totalFee = percentageFee + TRANSACTION_FEE.fixedFee;
    const netAmount = amount - totalFee;

    return {
      grossAmount: amount,
      fee: totalFee,
      percentageFee,
      fixedFee: TRANSACTION_FEE.fixedFee,
      netAmount,
      currency: TRANSACTION_FEE.currency
    };
  }

  /**
   * Get all available pricing tiers
   */
  async getPricingTiers() {
    const [plans] = await db.query(
      'SELECT * FROM pricing_plans WHERE is_active = TRUE ORDER BY display_order'
    );

    return plans.length > 0 ? plans : Object.values(PRICING_TIERS);
  }

  /**
   * Check if monetization is active
   */
  isActive() {
    // DEPLOYMENT-AWARE: Use deployment config instead of hardcoded value
    return deploymentConfig.isMonetizationActive();
  }

  /**
   * Get current deployment phase information
   */
  getDeploymentPhase() {
    return deploymentConfig.getCurrentPhase();
  }

  /**
   * Check if a feature is available in the current phase
   */
  isFeatureAvailable(feature) {
    return deploymentConfig.getFeatureStatus(feature);
  }

  /**
   * SMS enforcement with grace period awareness
   */
  async canSendSMS(userId) {
    try {
      // GRACE PERIOD: Allow unlimited SMS during grace period
      if (deploymentConfig.isInGracePeriod()) {
        return { 
          allowed: true, 
          reason: 'Grace period active - unlimited SMS',
          gracePeriod: true,
          remaining: 'unlimited',
          daysUntilEnforcement: deploymentConfig.getCurrentPhase().daysRemaining
        };
      }

      // MONETIZATION ACTIVE: Check tier limits
      const [users] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
      if (!users || users.length === 0) {
        return { allowed: false, reason: 'User not found' };
      }

      const user = users[0];
      const tier = PRICING_TIERS[user.subscription_tier || 'FREE'];
      const usageStats = await this.getUserUsageStats(userId);

      // Check SMS limit (-1 means unlimited)
      if (tier.limits.sms === -1) {
        return { allowed: true, remaining: 'unlimited' };
      }

      const remaining = tier.limits.sms - usageStats.smsThisMonth;
      
      if (remaining <= 0) {
        return {
          allowed: false,
          reason: 'SMS limit exceeded',
          limit: tier.limits.sms,
          used: usageStats.smsThisMonth,
          suggestedTier: this._suggestUpgradeTier(user.subscription_tier, 'sms')
        };
      }

      // Warning if close to limit
      if (remaining <= 10) {
        return {
          allowed: true,
          remaining,
          warning: `Only ${remaining} SMS remaining this month`,
          suggestUpgrade: remaining <= 5
        };
      }

      return { allowed: true, remaining };
    } catch (error) {
      console.error('Error checking SMS limit:', error);
      return { allowed: true, reason: 'Error checking limits, allowing SMS' };
    }
  }

  /**
   * Helper: Suggest upgrade tier based on exceeded resource
   */
  _suggestUpgradeTier(currentTier, exceededResource) {
    const tierOrder = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];
    const currentIndex = tierOrder.indexOf(currentTier || 'FREE');
    
    if (currentIndex < tierOrder.length - 1) {
      return tierOrder[currentIndex + 1];
    }
    
    return 'ENTERPRISE';
  }

  /**
   * Get billing history for user
   */
  async getBillingHistory(userId, limit = 10) {
    const [history] = await db.query(
      `SELECT id, amount, currency, status, payment_method, description, paid_at, created_at
       FROM billing_history 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, limit]
    );

    return history;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId) {
    const [existing] = await db.query(
      'SELECT subscription_tier, email FROM users WHERE id = ?',
      [userId]
    );
    const previousTier = existing?.[0]?.subscription_tier || 'FREE';
    const userEmail = existing?.[0]?.email || null;

    await db.query(
      `UPDATE users 
       SET subscription_status = 'cancelled',
           subscription_tier = 'FREE'
       WHERE id = ?`,
      [userId]
    );

    await db.query(
      `UPDATE subscriptions 
       SET status = 'cancelled', auto_renew = FALSE 
       WHERE user_id = ? AND status = 'active'`,
      [userId]
    );

    await billingNotificationService.recordSubscriptionChange({
      userId,
      email: userEmail,
      fromTier: previousTier,
      toTier: 'FREE'
    });

    return { success: true, message: 'Subscription cancelled' };
  }
}

module.exports = new MonetizationService();
