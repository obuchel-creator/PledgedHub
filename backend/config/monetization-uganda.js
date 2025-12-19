/**
 * Uganda Market Monetization Configuration
 * Optimized for East African pricing, mobile money, and pay-as-you-go model
 * 
 * All prices in UGX (Uganda Shilling)
 * Focus: Free tier trust-building → Pay-as-you-go → Monthly subscriptions
 */

// ============================================
// Currency Configuration
// ============================================
const CURRENCY = {
  code: 'UGX',
  symbol: 'UGX',
  name: 'Uganda Shilling',
  decimals: 0, // UGX doesn't use decimal places
  conversionRate: 1, // 1 UGX = 1 UGX (primary market)
  usdRate: 0.00027, // Approximate: 1 UGX ≈ $0.00027 USD (for reference only)
};

// ============================================
// Pricing Tiers - Uganda Market
// ============================================
const PRICING_TIERS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'For small groups and testing',
    price: 0,
    currency: 'UGX',
    billingPeriod: 'forever',
    features: {
      pledges: 30, // Hard limit to drive upgrade
      campaigns: 1,
      sms: 0, // Must use pay-as-you-go
      emails: 'unlimited',
      ai: false,
      accounting: false,
      analytics: 'basic', // View-only, no charts
      campaigns_limit: 1,
      support: 'community',
    },
    description_long:
      'Perfect for churches, small groups, and organizations just starting with pledges. Test all features, then upgrade when you need automation.',
  },

  sms_paygo: {
    id: 'sms_paygo',
    name: 'Pay-As-You-Go',
    description: 'Send reminders when you need them',
    price: null, // Credit-based, user loads money
    currency: 'UGX',
    billingPeriod: 'credit-based',
    features: {
      pledges: 100,
      campaigns: 2,
      sms: 'pay_per_sms', // 500 UGX per SMS
      emails: 'unlimited',
      ai: false,
      accounting: false,
      analytics: 'basic',
      support: 'email',
    },
    credit_packages: [
      { credits: 10000, price: 10000, sms_count: 20, name: '20 SMS' },
      { credits: 50000, price: 50000, sms_count: 100, name: '100 SMS' },
      { credits: 100000, price: 100000, sms_count: 200, name: '200 SMS', popular: true },
      { credits: 500000, price: 500000, sms_count: 1000, name: '1,000 SMS' },
    ],
    description_long:
      'Load credits via MTN/Airtel and pay only for what you use. Send SMS reminders (500 UGX each) and emails (100 UGX each). Perfect if you send reminders occasionally.',
  },

  campaign: {
    id: 'campaign',
    name: 'Campaign',
    description: 'Active fundraising with automation',
    price: 15000, // 15,000 UGX per month
    currency: 'UGX',
    billingPeriod: 'monthly',
    features: {
      pledges: 'unlimited',
      campaigns: 5,
      sms: 100, // 100 SMS per month included
      emails: 500,
      ai: true, // AI-generated reminders
      accounting: false,
      analytics: true, // Full analytics with charts
      support: 'email',
      sms_cost: 300, // After limit, 300 UGX per SMS
    },
    description_long:
      'Everything for active fundraisers. Run multiple campaigns, send automated SMS reminders, get AI insights. 15,000 UGX per month is less than hiring someone part-time.',
    suggested_for: 'churches_active_campaigns',
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Fundraising + Accounting + Team',
    price: 35000, // 35,000 UGX per month
    currency: 'UGX',
    billingPeriod: 'monthly',
    features: {
      pledges: 'unlimited',
      campaigns: 'unlimited',
      sms: 500,
      emails: 2000,
      ai: true,
      accounting: true, // Full accounting + reports
      analytics: true,
      reports: ['balance_sheet', 'income_statement', 'donor_receipts'],
      support: 'whatsapp', // WhatsApp support included
      sms_cost: 300,
      team_seats: 3,
    },
    description_long:
      'For established NGOs. Unlimited everything, accounting, financial reports, and WhatsApp support. Track pledges AND accounts professionally.',
    suggested_for: 'established_ngos',
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solution for large organizations',
    price: 150000, // 150,000 UGX per month
    currency: 'UGX',
    billingPeriod: 'monthly',
    contact_sales: true,
    features: {
      pledges: 'unlimited',
      campaigns: 'unlimited',
      sms: 'unlimited', // Bulk SMS at 300 UGX each
      emails: 'unlimited',
      ai: true,
      accounting: true,
      analytics: true,
      reports: 'all',
      support: 'priority_whatsapp', // Priority support
      white_label: true, // Custom branding
      api_access: true,
      custom_sms_sender: true, // Show org name in SMS
      team_seats: 'unlimited',
      training: 'included',
    },
    description_long:
      'Built for OXFAM, Red Cross, and large NGOs. White-label platform, API access, custom branding, bulk SMS, and dedicated WhatsApp support.',
    suggested_for: 'large_ngos_kampala',
  },
};

// ============================================
// SMS & Email Pricing (Pay-As-You-Go)
// ============================================
const TRANSACTION_COSTS = {
  sms: {
    base_cost: 500, // 500 UGX per SMS (standard)
    premium_cost: 700, // 700 UGX if AI-generated
    bulk_discount_threshold: 1000, // After 1000 SMS/month in subscription
    bulk_cost: 300, // 300 UGX per SMS when bundled in tier
  },
  email: {
    base_cost: 100, // 100 UGX per email
    ai_generated_cost: 150, // 150 UGX if AI-generated
  },
  mobile_money: {
    transaction_fee: 0.029, // 2.9% processing fee (standard in Africa)
    mtn_fee: 0.03, // 3% for MTN specific
    airtel_fee: 0.025, // 2.5% for Airtel
  },
};

// ============================================
// Credit System Configuration
// ============================================
const CREDIT_SYSTEM = {
  enabled: true,
  currency: 'UGX',
  minimum_load: 5000, // Minimum 5,000 UGX to load
  maximum_load: 1000000, // Maximum 1M UGX per transaction
  expiry_days: 365, // Credits expire after 1 year
  payment_methods: ['mtn_mobile_money', 'airtel_money'], // UGX only, mobile money
  admin_fee_percent: 0.05, // 5% admin fee for credit purchases (covers payment processing)
};

// ============================================
// Feature Availability by Tier
// ============================================
const FEATURE_AVAILABILITY = {
  ai_message_generation: {
    free: false,
    sms_paygo: false,
    campaign: true,
    premium: true,
    enterprise: true,
  },
  accounting_module: {
    free: false,
    sms_paygo: false,
    campaign: false,
    premium: true,
    enterprise: true,
  },
  financial_reports: {
    free: false,
    sms_paygo: false,
    campaign: false,
    premium: ['balance_sheet', 'income_statement'],
    enterprise: ['balance_sheet', 'income_statement', 'cash_flow', 'donor_receipts'],
  },
  white_label: {
    free: false,
    sms_paygo: false,
    campaign: false,
    premium: false,
    enterprise: true,
  },
  api_access: {
    free: false,
    sms_paygo: false,
    campaign: false,
    premium: false,
    enterprise: true,
  },
  team_management: {
    free: false,
    sms_paygo: false,
    campaign: false,
    premium: 3,
    enterprise: 'unlimited',
  },
};

// ============================================
// Monthly Usage Tracking
// ============================================
const USAGE_LIMITS = {
  free: {
    pledges_count: { limit: 30, reset: 'never' },
    campaigns_count: { limit: 1, reset: 'never' },
    sms_sent: { limit: 0, reset: 'monthly' },
    emails_sent: { limit: -1, reset: 'monthly' }, // -1 = unlimited
    ai_requests: { limit: 0, reset: 'monthly' },
  },
  sms_paygo: {
    pledges_count: { limit: 100, reset: 'never' },
    campaigns_count: { limit: 2, reset: 'never' },
    sms_sent: { limit: -1, reset: 'monthly', billing: 'pay_per_sms' }, // Pay per SMS
    emails_sent: { limit: -1, reset: 'monthly' },
    ai_requests: { limit: 0, reset: 'monthly' },
  },
  campaign: {
    pledges_count: { limit: -1, reset: 'never' },
    campaigns_count: { limit: 5, reset: 'never' },
    sms_sent: { limit: 100, reset: 'monthly', overage_cost: 300 },
    emails_sent: { limit: 500, reset: 'monthly', overage_cost: 100 },
    ai_requests: { limit: 50, reset: 'monthly', overage_cost: 200 },
  },
  premium: {
    pledges_count: { limit: -1, reset: 'never' },
    campaigns_count: { limit: -1, reset: 'never' },
    sms_sent: { limit: 500, reset: 'monthly', overage_cost: 300 },
    emails_sent: { limit: 2000, reset: 'monthly', overage_cost: 100 },
    ai_requests: { limit: 200, reset: 'monthly', overage_cost: 200 },
  },
  enterprise: {
    pledges_count: { limit: -1, reset: 'never' },
    campaigns_count: { limit: -1, reset: 'never' },
    sms_sent: { limit: -1, reset: 'monthly', cost: 300 }, // Unlimited but charged
    emails_sent: { limit: -1, reset: 'monthly' },
    ai_requests: { limit: -1, reset: 'monthly' },
  },
};

// ============================================
// Promotional Codes / Discounts
// ============================================
const PROMOTIONS = {
  nonprofit_discount: {
    code: 'NONPROFIT2025',
    discount_percent: 20,
    valid_tiers: ['campaign', 'premium', 'enterprise'],
    description: 'Verified NGOs get 20% off',
    valid_until: '2025-12-31',
  },
  early_adopter: {
    code: 'LAUNCH50',
    discount_percent: 50,
    valid_tiers: ['campaign', 'premium'],
    max_uses: 100,
    description: '50% off for first 3 months',
    valid_until: '2025-12-31',
  },
};

// ============================================
// Conversion Metrics
// ============================================
const CONVERSION_TARGETS = {
  free_to_paygo: 0.15, // Target: 15% of free users → pay-as-you-go
  free_to_campaign: 0.05, // Target: 5% of free users → campaign tier
  paygo_to_campaign: 0.20, // Target: 20% of SMS users → upgrade to subscription
  campaign_to_premium: 0.10, // Target: 10% of campaign users → premium tier
};

// ============================================
// Support Tiers
// ============================================
const SUPPORT_LEVELS = {
  community: {
    channels: ['email'],
    response_time: '48 hours',
    availability: 'business_hours',
  },
  email: {
    channels: ['email'],
    response_time: '24 hours',
    availability: 'business_hours',
  },
  whatsapp: {
    channels: ['whatsapp', 'email'],
    response_time: '4 hours',
    availability: 'business_hours',
    included_in: ['premium', 'enterprise'],
  },
  priority_whatsapp: {
    channels: ['whatsapp', 'email', 'phone'],
    response_time: '1 hour',
    availability: '24/7',
    included_in: ['enterprise'],
  },
};

module.exports = {
  CURRENCY,
  PRICING_TIERS,
  TRANSACTION_COSTS,
  CREDIT_SYSTEM,
  FEATURE_AVAILABILITY,
  USAGE_LIMITS,
  PROMOTIONS,
  CONVERSION_TARGETS,
  SUPPORT_LEVELS,
};
