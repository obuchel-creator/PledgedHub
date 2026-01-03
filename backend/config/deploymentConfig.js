/**
 * Deployment Configuration & Monetization Timeline
 * 
 * This file controls when monetization features activate automatically.
 * Set DEPLOYMENT_DATE to your production launch date.
 */

const DEPLOYMENT_DATE = process.env.DEPLOYMENT_DATE || new Date().toISOString();

// Grace period before monetization kicks in (in days)
const GRACE_PERIOD_DAYS = parseInt(process.env.GRACE_PERIOD_DAYS || '180'); // 6 months default

// Calculate monetization start date
const monetizationStartDate = new Date(DEPLOYMENT_DATE);
monetizationStartDate.setDate(monetizationStartDate.getDate() + GRACE_PERIOD_DAYS);

// Feature activation timeline (days after deployment)
const FEATURE_TIMELINE = {
  // Phase 1: Launch (Day 0) - Everything FREE
  LAUNCH: {
    daysAfter: 0,
    features: {
      unlimited_pledges: true,
      unlimited_campaigns: true,
      unlimited_sms: true,
      unlimited_emails: true,
      unlimited_ai: true,
      all_features: true
    },
    message: '🎉 Welcome! All features are FREE during our launch period.'
  },

  // Phase 2: Soft Launch (30 days) - Show future pricing, no enforcement
  SOFT_MONETIZATION: {
    daysAfter: 30,
    features: {
      show_pricing_info: true,
      show_usage_stats: true,
      suggest_tiers: true,
      still_free: true
    },
    message: '💡 Monetization starts in ${daysRemaining} days. Choose your plan early for bonuses!'
  },

  // Phase 3: Pre-Monetization (150 days) - 30-day warning
  PRE_MONETIZATION_WARNING: {
    daysAfter: 150,
    features: {
      show_migration_banner: true,
      send_email_notifications: true,
      offer_early_bird_discount: true,
      still_free: true
    },
    message: '⚠️ Monetization starts in 30 days. Subscribe now for 25% early bird discount!',
    early_bird_discount: 0.25
  },

  // Phase 4: Monetization Active (180 days) - Enforcement begins
  MONETIZATION_ACTIVE: {
    daysAfter: GRACE_PERIOD_DAYS,
    features: {
      enforce_tier_limits: true,
      block_overage: true,
      require_payment: true,
      sms_credits_required: true
    },
    message: '💳 Monetization is now active. Please choose a plan to continue.'
  }
};

// Check current deployment phase
function getCurrentPhase() {
  const now = new Date();
  const deployDate = new Date(DEPLOYMENT_DATE);
  const daysSinceDeployment = Math.floor((now - deployDate) / (1000 * 60 * 60 * 24));

  if (daysSinceDeployment < 0) {
    return { phase: 'NOT_DEPLOYED', daysUntil: Math.abs(daysSinceDeployment) };
  }

  // Determine current phase
  let currentPhase = 'LAUNCH';
  let daysInPhase = daysSinceDeployment;

  for (const [phaseName, phaseConfig] of Object.entries(FEATURE_TIMELINE)) {
    if (daysSinceDeployment >= phaseConfig.daysAfter) {
      currentPhase = phaseName;
      daysInPhase = daysSinceDeployment - phaseConfig.daysAfter;
    }
  }

  // Calculate days until next phase
  let nextPhase = null;
  let daysUntilNextPhase = null;

  const phases = Object.keys(FEATURE_TIMELINE);
  const currentIndex = phases.indexOf(currentPhase);
  if (currentIndex < phases.length - 1) {
    nextPhase = phases[currentIndex + 1];
    daysUntilNextPhase = FEATURE_TIMELINE[nextPhase].daysAfter - daysSinceDeployment;
  }

  return {
    phase: currentPhase,
    daysInPhase,
    daysSinceDeployment,
    nextPhase,
    daysUntilNextPhase,
    features: FEATURE_TIMELINE[currentPhase].features,
    message: FEATURE_TIMELINE[currentPhase].message.replace(
      '${daysRemaining}',
      daysUntilNextPhase || 0
    )
  };
}

// Check if monetization is active
function isMonetizationActive() {
  const phase = getCurrentPhase();
  return phase.phase === 'MONETIZATION_ACTIVE';
}

// Check if still in grace period
function isInGracePeriod() {
  const phase = getCurrentPhase();
  return ['LAUNCH', 'SOFT_MONETIZATION', 'PRE_MONETIZATION_WARNING'].includes(phase.phase);
}

// Get feature availability based on current phase
function getFeatureStatus(featureName) {
  const phase = getCurrentPhase();
  
  // During grace period, all features are free
  if (isInGracePeriod() && featureName !== 'show_pricing_info') {
    return { available: true, reason: 'grace_period', paid: false };
  }

  // After monetization active, check tier limits
  return { available: false, reason: 'monetization_active', paid: true };
}

module.exports = {
  DEPLOYMENT_DATE,
  GRACE_PERIOD_DAYS,
  FEATURE_TIMELINE,
  getCurrentPhase,
  isMonetizationActive,
  isInGracePeriod,
  getFeatureStatus,
  monetizationStartDate
};
