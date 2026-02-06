/**
 * SaaS Pricing Plans Configuration
 * 
 * Defines plan limits, features, and pricing for the multi-tenant system
 */

const SAAS_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'UGX',
    interval: 'month',
    trial_days: 14,
    limits: {
      pledges: 50,
      campaigns: 2,
      users: 1,
      sms: 0,
      emails: 100,
      ai_requests: 10,
      storage_mb: 100
    },
    features: [
      'Basic pledge management',
      'Email reminders',
      'Basic analytics',
      '1 user account',
      'Community support'
    ],
    restrictions: {
      custom_branding: false,
      api_access: false,
      whatsapp: false,
      mobile_money: false,
      advanced_analytics: false,
      export_data: false
    }
  },

  starter: {
    name: 'Starter',
    price: 37000,
    currency: 'UGX',
    interval: 'month',
    trial_days: 14,
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID,
    limits: {
      pledges: 500,
      campaigns: 10,
      users: 3,
      sms: 100,
      emails: 1000,
      ai_requests: 100,
      storage_mb: 500
    },
    features: [
      'Everything in Free',
      'SMS reminders (100/month)',
      'AI-powered insights',
      'Mobile money integration',
      'Up to 3 team members',
      'Email support',
      'Data export'
    ],
    restrictions: {
      custom_branding: false,
      api_access: false,
      whatsapp: false,
      advanced_analytics: false
    }
  },

  professional: {
    name: 'Professional',
    price: 110000,
    currency: 'UGX',
    interval: 'month',
    trial_days: 14,
    stripe_price_id: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    limits: {
      pledges: 5000,
      campaigns: 50,
      users: 10,
      sms: 1000,
      emails: 10000,
      ai_requests: 1000,
      storage_mb: 2000
    },
    features: [
      'Everything in Starter',
      'SMS reminders (1,000/month)',
      'WhatsApp integration',
      'Advanced analytics',
      'Custom branding',
      'API access',
      'Up to 10 team members',
      'Priority support',
      'Automated workflows'
    ],
    restrictions: {
      dedicated_support: false,
      sso: false,
      custom_integrations: false
    }
  },

  enterprise: {
    name: 'Enterprise',
    price: 370000,
    currency: 'UGX',
    interval: 'month',
    trial_days: 30,
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    limits: {
      pledges: -1,        // Unlimited
      campaigns: -1,      // Unlimited
      users: -1,          // Unlimited
      sms: -1,            // Unlimited
      emails: -1,         // Unlimited
      ai_requests: -1,    // Unlimited
      storage_mb: -1      // Unlimited
    },
    features: [
      'Everything in Professional',
      'Unlimited everything',
      'Dedicated account manager',
      'Custom integrations',
      'SSO (Single Sign-On)',
      'Advanced security features',
      'White-label option',
      'SLA guarantee',
      '24/7 phone support',
      'Custom training',
      'Dedicated server option'
    ],
    restrictions: {}
  }
};

/**
 * Check if tenant can perform action based on plan limits
 */
function canPerformAction(plan, actionType, currentUsage) {
  const planConfig = SAAS_PLANS[plan];
  if (!planConfig) return false;

  const limit = planConfig.limits[actionType];
  
  // -1 means unlimited
  if (limit === -1) return true;
  
  // Check if under limit
  return currentUsage < limit;
}

/**
 * Get suggested upgrade plan when limit reached
 */
function getSuggestedUpgrade(currentPlan, exceededLimit) {
  const plans = ['free', 'starter', 'professional', 'enterprise'];
  const currentIndex = plans.indexOf(currentPlan);
  
  // Find next plan that has higher limit
  for (let i = currentIndex + 1; i < plans.length; i++) {
    const nextPlan = SAAS_PLANS[plans[i]];
    if (nextPlan.limits[exceededLimit] === -1 || 
        nextPlan.limits[exceededLimit] > SAAS_PLANS[currentPlan].limits[exceededLimit]) {
      return {
        plan: plans[i],
        name: nextPlan.name,
        price: nextPlan.price,
        limit: nextPlan.limits[exceededLimit]
      };
    }
  }
  
  return null;
}

/**
 * Calculate prorated charge for mid-cycle upgrade
 */
function calculateProratedCharge(currentPlan, newPlan, daysRemaining, billingCycleDays = 30) {
  const currentPrice = SAAS_PLANS[currentPlan]?.price || 0;
  const newPrice = SAAS_PLANS[newPlan]?.price || 0;
  
  const priceDifference = newPrice - currentPrice;
  const proratedCharge = (priceDifference / billingCycleDays) * daysRemaining;
  
  return Math.max(0, proratedCharge).toFixed(2);
}

/**
 * Get plan comparison matrix (for pricing page)
 */
function getPlanComparison() {
  return {
    plans: Object.keys(SAAS_PLANS).map(key => ({
      id: key,
      ...SAAS_PLANS[key]
    })),
    features: [
      { name: 'Pledge Management', free: true, starter: true, professional: true, enterprise: true },
      { name: 'Email Reminders', free: true, starter: true, professional: true, enterprise: true },
      { name: 'SMS Reminders', free: false, starter: '100/mo', professional: '1,000/mo', enterprise: 'Unlimited' },
      { name: 'AI Insights', free: 'Limited', starter: true, professional: true, enterprise: true },
      { name: 'Mobile Money', free: false, starter: true, professional: true, enterprise: true },
      { name: 'WhatsApp Integration', free: false, starter: false, professional: true, enterprise: true },
      { name: 'Team Members', free: '1', starter: '3', professional: '10', enterprise: 'Unlimited' },
      { name: 'Custom Branding', free: false, starter: false, professional: true, enterprise: true },
      { name: 'API Access', free: false, starter: false, professional: true, enterprise: true },
      { name: 'Advanced Analytics', free: false, starter: false, professional: true, enterprise: true },
      { name: 'Priority Support', free: false, starter: false, professional: true, enterprise: true },
      { name: 'SSO', free: false, starter: false, professional: false, enterprise: true },
      { name: 'Dedicated Support', free: false, starter: false, professional: false, enterprise: true }
    ]
  };
}

/**
 * Usage-based pricing addons (for overages)
 */
const USAGE_ADDONS = {
  extra_sms: {
    name: 'Additional SMS',
    price: 0.05,  // $0.05 per SMS
    unit: 'sms'
  },
  extra_storage: {
    name: 'Additional Storage',
    price: 0.10,  // $0.10 per GB
    unit: 'gb'
  },
  extra_ai_requests: {
    name: 'Additional AI Requests',
    price: 0.01,  // $0.01 per request
    unit: 'request'
  }
};

module.exports = {
  SAAS_PLANS,
  USAGE_ADDONS,
  canPerformAction,
  getSuggestedUpgrade,
  calculateProratedCharge,
  getPlanComparison
};
