/**
 * PledgeHub Monetization Configuration
 * Automatically activates 6 months after launch date
 */

const LAUNCH_DATE = new Date('2025-12-11'); // Set your actual launch date
const MONETIZATION_DELAY_MONTHS = 6;
const FREE_TRIAL_DAYS = 14; // Days of free trial for new users after monetization starts

// Calculate monetization start date (6 months from launch)
const getMonetizationStartDate = () => {
  const startDate = new Date(LAUNCH_DATE);
  startDate.setMonth(startDate.getMonth() + MONETIZATION_DELAY_MONTHS);
  return startDate;
};

// Check if monetization is active
const isMonetizationActive = () => {
  const now = new Date();
  const monetizationStart = getMonetizationStartDate();
  return now >= monetizationStart;
};

// Pricing tiers
const PRICING_TIERS = {
  FREE: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    limits: {
      pledgesPerMonth: 50,
      campaigns: 2,
      users: 1,
      smsNotifications: 10,
      emailNotifications: 100,
      aiInsights: false,
      exportData: true,
      customBranding: false,
      apiAccess: false,
      support: 'community'
    },
    features: [
      'Up to 50 pledges per month',
      'Basic dashboard',
      '2 active campaigns',
      'Email notifications',
      'Standard templates',
      'Community support'
    ]
  },
  
  STARTER: {
    name: 'Starter',
    price: 19,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      pledgesPerMonth: 500,
      campaigns: 10,
      users: 3,
      smsNotifications: 100,
      emailNotifications: 1000,
      aiInsights: true,
      exportData: true,
      customBranding: false,
      apiAccess: false,
      support: 'email'
    },
    features: [
      'Up to 500 pledges per month',
      'AI-powered insights',
      '10 active campaigns',
      'SMS & Email notifications',
      'Advanced analytics',
      'Export to CSV/PDF',
      'Email support'
    ]
  },
  
  PRO: {
    name: 'Pro',
    price: 49,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      pledgesPerMonth: 2000,
      campaigns: 50,
      users: 10,
      smsNotifications: 500,
      emailNotifications: 5000,
      aiInsights: true,
      exportData: true,
      customBranding: true,
      apiAccess: true,
      support: 'priority'
    },
    features: [
      'Up to 2,000 pledges per month',
      'Unlimited AI insights',
      '50 active campaigns',
      'Unlimited notifications',
      'Custom branding',
      'API access',
      'Priority support',
      'White-label reports'
    ]
  },
  
  ENTERPRISE: {
    name: 'Enterprise',
    price: 199,
    currency: 'USD',
    billingPeriod: 'monthly',
    limits: {
      pledgesPerMonth: -1, // unlimited
      campaigns: -1,
      users: -1,
      smsNotifications: -1,
      emailNotifications: -1,
      aiInsights: true,
      exportData: true,
      customBranding: true,
      apiAccess: true,
      support: '24/7'
    },
    features: [
      'Unlimited pledges',
      'Unlimited campaigns',
      'Unlimited users',
      'Custom domain',
      'Dedicated account manager',
      'Custom integrations',
      '24/7 phone support',
      'SLA guarantee',
      'On-premise option'
    ]
  }
};

// Transaction fees (alternative to subscription)
const TRANSACTION_FEE = {
  percentage: 2.5, // 2.5%
  fixedFee: 0.30, // $0.30 per transaction
  currency: 'USD'
};

// Calculate if user needs to upgrade
const checkUserLimits = (user, usageStats) => {
  if (!isMonetizationActive()) {
    return { needsUpgrade: false, message: 'Monetization not active yet' };
  }

  const tier = PRICING_TIERS[user.subscriptionTier] || PRICING_TIERS.FREE;
  const violations = [];

  // Check pledge limit
  if (tier.limits.pledgesPerMonth !== -1 && usageStats.pledgesThisMonth > tier.limits.pledgesPerMonth) {
    violations.push(`Exceeded pledge limit (${usageStats.pledgesThisMonth}/${tier.limits.pledgesPerMonth})`);
  }

  // Check campaign limit
  if (tier.limits.campaigns !== -1 && usageStats.activeCampaigns > tier.limits.campaigns) {
    violations.push(`Exceeded campaign limit (${usageStats.activeCampaigns}/${tier.limits.campaigns})`);
  }

  // Check SMS notifications
  if (tier.limits.smsNotifications !== -1 && usageStats.smsThisMonth > tier.limits.smsNotifications) {
    violations.push(`Exceeded SMS limit (${usageStats.smsThisMonth}/${tier.limits.smsNotifications})`);
  }

  return {
    needsUpgrade: violations.length > 0,
    currentTier: tier.name,
    violations,
    suggestedTier: violations.length > 0 ? getSuggestedTier(usageStats) : null
  };
};

// Suggest appropriate tier based on usage
const getSuggestedTier = (usageStats) => {
  if (usageStats.pledgesThisMonth > 500 || usageStats.activeCampaigns > 10) {
    return 'PRO';
  }
  return 'STARTER';
};

// Check if user is in grace period after monetization starts
const isInGracePeriod = (userCreatedAt) => {
  if (!isMonetizationActive()) return true;
  
  const monetizationStart = getMonetizationStartDate();
  const gracePeriodEnd = new Date(userCreatedAt);
  gracePeriodEnd.setDate(gracePeriodEnd.getDate() + FREE_TRIAL_DAYS);
  
  const now = new Date();
  return now <= gracePeriodEnd && userCreatedAt >= monetizationStart;
};

// Get user's subscription status
const getSubscriptionStatus = (user) => {
  const now = new Date();
  const monetizationStart = getMonetizationStartDate();
  
  // Before monetization: everyone is free
  if (now < monetizationStart) {
    return {
      status: 'pre_monetization',
      tier: 'FREE',
      daysUntilMonetization: Math.ceil((monetizationStart - now) / (1000 * 60 * 60 * 24)),
      message: `PledgeHub will start charging in ${Math.ceil((monetizationStart - now) / (1000 * 60 * 60 * 24))} days. Enjoy unlimited access until then!`
    };
  }
  
  // After monetization: check subscription
  if (!user.subscriptionTier || user.subscriptionTier === 'FREE') {
    const inGrace = isInGracePeriod(user.createdAt);
    if (inGrace) {
      const gracePeriodEnd = new Date(user.createdAt);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + FREE_TRIAL_DAYS);
      const daysLeft = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60 * 24));
      
      return {
        status: 'trial',
        tier: 'FREE',
        daysLeft,
        message: `You have ${daysLeft} days left in your free trial. Upgrade to continue using PledgeHub.`
      };
    }
    
    return {
      status: 'free',
      tier: 'FREE',
      message: 'You are on the Free plan. Upgrade for more features and higher limits.'
    };
  }
  
  // Check if subscription is active
  const subscriptionEnd = new Date(user.subscriptionEndsAt);
  if (now > subscriptionEnd) {
    return {
      status: 'expired',
      tier: user.subscriptionTier,
      message: 'Your subscription has expired. Please renew to continue using premium features.'
    };
  }
  
  const daysLeft = Math.ceil((subscriptionEnd - now) / (1000 * 60 * 60 * 24));
  return {
    status: 'active',
    tier: user.subscriptionTier,
    daysLeft,
    renewalDate: subscriptionEnd,
    message: `Your ${user.subscriptionTier} subscription is active. Renews in ${daysLeft} days.`
  };
};

module.exports = {
  LAUNCH_DATE,
  MONETIZATION_DELAY_MONTHS,
  FREE_TRIAL_DAYS,
  PRICING_TIERS,
  TRANSACTION_FEE,
  getMonetizationStartDate,
  isMonetizationActive,
  checkUserLimits,
  getSuggestedTier,
  isInGracePeriod,
  getSubscriptionStatus
};
