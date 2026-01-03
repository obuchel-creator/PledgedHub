# 🚀 Automated Monetization Deployment Guide

## Overview
PledgeHub features **fully automated monetization activation** that begins enforcement 6 months after deployment. Set the deployment date once, and the system handles everything automatically.

---

## 🎯 Quick Start (Deploy in 3 Steps)

### Step 1: Set Deployment Date
```bash
# In backend/.env
DEPLOYMENT_DATE=2025-01-15  # Your actual deployment date (YYYY-MM-DD)
GRACE_PERIOD_DAYS=180       # 6 months (default)
```

### Step 2: Restart Server
```bash
cd backend
npm start
```

### Step 3: Done! 🎉
The system now automatically:
- ✅ Allows unlimited features during grace period (180 days)
- ✅ Shows pricing info at Day 30 (soft monetization)
- ✅ Warns users at Day 150 (30-day notice + early bird discount)
- ✅ Enforces tier limits at Day 180 (monetization active)

---

## 📅 Automated Timeline (180-Day Grace Period)

### **Phase 1: LAUNCH** (Day 0 - Day 30)
**Status**: Everything FREE, no restrictions

**What happens automatically:**
- Unlimited pledges, campaigns, SMS, emails, AI requests
- No tier enforcement
- Usage tracking enabled (for future billing)
- Users see "Grace Period Active" badge

**Backend behavior:**
```javascript
// Example: SMS enforcement check
if (deploymentConfig.isInGracePeriod()) {
  return { allowed: true, remaining: 'unlimited' };
}
```

**Frontend notification:**
> 🎉 **Welcome!** All features are free during our launch period. Enjoy unlimited access for the next 6 months!

---

### **Phase 2: SOFT MONETIZATION** (Day 30 - Day 150)
**Status**: Features still FREE, pricing visible

**What happens automatically:**
- All features remain unlimited
- Pricing page shows tier options
- Dashboard displays usage stats
- "Upgrade Now" banners appear (non-blocking)
- System suggests tier based on usage

**Frontend notification:**
> ℹ️ **Heads Up!** We'll begin billing in 5 months. Check out our pricing plans and see what fits your needs.

**Example usage stats shown:**
```
Your Usage This Month:
📨 SMS Sent: 45 (Pro tier: 500/month)
📧 Emails: 120 (Pro tier: 10,000/month)
💰 Pledges: 156 (Pro tier: 5,000/month)

Recommended: Pro Tier ($20/month)
```

---

### **Phase 3: PRE-MONETIZATION WARNING** (Day 150 - Day 180)
**Status**: 30-day warning, early bird discount available

**What happens automatically:**
- All features STILL FREE (30 more days)
- Dashboard shows countdown timer
- Email reminders sent at Day 150, 165, 175, 179
- **Early Bird Discount**: 25% off for first 6 months if subscribe before Day 180
- Usage projections displayed
- One-click upgrade with discount

**Frontend notification:**
> ⚠️ **30 Days Left!** Our grace period ends on [DATE]. Subscribe now and get **25% off for 6 months** as an early supporter!

**Email sequence:**
- **Day 150**: "30 Days Until Billing Starts - Early Bird Discount Available"
- **Day 165**: "Only 15 Days Left - Claim Your 25% Discount"
- **Day 175**: "Final Week - Your Early Bird Discount Expires Soon"
- **Day 179**: "Last Day for Early Bird Discount - Subscribe Tonight"

---

### **Phase 4: MONETIZATION ACTIVE** (Day 180+)
**Status**: Tier limits enforced, billing begins

**What happens automatically:**
- Users on Free tier: Limited to 50 pledges, 2 campaigns, 0 SMS, 100 emails
- SMS blocked if limit exceeded → Routes to email automatically
- "Upgrade" prompt appears when limits reached
- Prepaid SMS credit marketplace available
- Monthly subscription billing begins

**Frontend notification:**
> 💳 **Subscription Active** - You're on the Free tier. Upgrade anytime to unlock more features!

**SMS enforcement example:**
```javascript
// User hits SMS limit
{
  allowed: false,
  reason: 'SMS limit exceeded',
  limit: 50,
  used: 50,
  suggestedTier: 'BASIC',
  upgradeUrl: '/pricing'
}

// System automatically routes to email as fallback
console.log('⚠️ SMS blocked. Routing reminder to email...');
```

---

## 🛠️ Technical Implementation

### Backend Integration

#### 1. Deployment Config (Already Created)
```javascript
// backend/config/deploymentConfig.js
const DEPLOYMENT_DATE = process.env.DEPLOYMENT_DATE 
  ? new Date(process.env.DEPLOYMENT_DATE) 
  : null;

const GRACE_PERIOD_DAYS = parseInt(process.env.GRACE_PERIOD_DAYS || '180');

function isInGracePeriod() {
  if (!DEPLOYMENT_DATE) return true; // Dev mode
  const daysSince = Math.floor((Date.now() - DEPLOYMENT_DATE) / (1000 * 60 * 60 * 24));
  return daysSince < GRACE_PERIOD_DAYS;
}
```

#### 2. Monetization Service (Updated)
```javascript
// backend/services/monetizationService.js
async canPerformAction(userId, actionType) {
  // GRACE PERIOD: Allow everything
  if (deploymentConfig.isInGracePeriod()) {
    return { 
      allowed: true, 
      gracePeriod: true,
      daysRemaining: deploymentConfig.getCurrentPhase().daysRemaining
    };
  }

  // MONETIZATION ACTIVE: Check tier limits
  // ... existing limit enforcement code
}
```

#### 3. Reminder Service (Updated)
```javascript
// backend/services/reminderService.js
async sendReminder(pledge, type) {
  const phase = deploymentConfig.getCurrentPhase();
  
  // GRACE PERIOD: Unlimited SMS
  if (deploymentConfig.isInGracePeriod()) {
    await smsService.sendSMS(phoneNumber, message);
    console.log('✓ SMS sent [GRACE PERIOD - FREE]');
    return;
  }

  // MONETIZATION ACTIVE: Check limits
  const canSend = await monetizationService.canSendSMS(pledge.user_id);
  
  if (canSend.allowed) {
    await smsService.sendSMS(phoneNumber, message);
  } else {
    // Route to email as fallback
    await emailService.sendEmail(emailAddress, message);
    console.log('⚠️ SMS blocked. Routed to email.');
  }
}
```

---

## 📊 Pricing Tiers (Enforced After Day 180)

| Feature | FREE | BASIC ($15k/mo) | PRO ($50k/mo) | ENTERPRISE ($200k/mo) |
|---------|------|-----------------|---------------|-----------------------|
| **Pledges** | 50/month | 500/month | 5,000/month | Unlimited |
| **Campaigns** | 2 active | 10 active | 50 active | Unlimited |
| **SMS** | 0 | 50/month | 500/month | 2,000/month |
| **Emails** | 100/month | 1,000/month | 10,000/month | Unlimited |
| **AI Requests** | 10/month | 100/month | 1,000/month | Unlimited |
| **Support** | Community | Email | Priority Email | Phone + Dedicated |

**SMS Overage Billing** (Pro/Enterprise tiers):
- UGX 150 per SMS beyond monthly allocation
- Billed automatically at month-end
- No interruption of service

**Prepaid SMS Credits** (All tiers):
- Purchase SMS bundles anytime
- No expiry, rolls over monthly
- Packages: 50 (UGX 10k), 100 (UGX 18k), 500 (UGX 80k)

---

## 🎁 Early Bird Discount Program

### Eligibility
Subscribe **before Day 180** to receive 25% off for 6 months.

### Discount Details
- **Discount Code**: Auto-generated per user (e.g., `EARLYBIRD-USER123`)
- **Duration**: 6 months from subscription start
- **Applies To**: Basic, Pro, Enterprise tiers
- **Example Savings**:
  - Basic: UGX 15,000/mo → **UGX 11,250/mo** (Save UGX 22,500 over 6 months)
  - Pro: UGX 50,000/mo → **UGX 37,500/mo** (Save UGX 75,000 over 6 months)
  - Enterprise: UGX 200,000/mo → **UGX 150,000/mo** (Save UGX 300,000 over 6 months)

### Implementation
```javascript
// Automatically applied at checkout if subscribed before Day 180
if (daysSinceDeployment < 180 && !user.has_subscribed) {
  discount = 0.25; // 25%
  discountDuration = 6; // months
}
```

---

## 🔄 User Migration Strategy

### Existing Users (Pre-Deployment)
If you have users before setting DEPLOYMENT_DATE:

1. **Set deployment date to past** (e.g., 6 months ago):
   ```bash
   DEPLOYMENT_DATE=2024-07-15  # 6 months ago
   ```
   This immediately activates monetization for existing users.

2. **Or grant legacy status**:
   ```sql
   -- Give existing users permanent free tier
   UPDATE users 
   SET subscription_tier = 'LEGACY_FREE', 
       subscription_status = 'active'
   WHERE created_at < '2025-01-15';
   ```

3. **Or grandfather existing usage**:
   ```javascript
   // Allow legacy users higher limits
   if (user.created_at < DEPLOYMENT_DATE) {
     return LEGACY_LIMITS; // Custom higher limits
   }
   ```

---

## ⚙️ Configuration Options

### Environment Variables

```bash
# Required for production
DEPLOYMENT_DATE=2025-01-15  # Your launch date

# Optional (defaults shown)
GRACE_PERIOD_DAYS=180       # 6 months
SOFT_MONETIZATION_DAY=30    # Show pricing at Day 30
WARNING_PERIOD_DAY=150      # Start warnings at Day 150
EARLY_BIRD_DISCOUNT=0.25    # 25% discount
EARLY_BIRD_DURATION=6       # 6 months

# Development mode (no enforcement)
# Leave DEPLOYMENT_DATE empty or unset
```

### Testing Phases Locally

```bash
# Test Launch Phase (Day 0)
DEPLOYMENT_DATE=2025-01-15  # Today

# Test Soft Monetization (Day 30)
DEPLOYMENT_DATE=2024-12-16  # 30 days ago

# Test Warning Phase (Day 150)
DEPLOYMENT_DATE=2024-08-18  # 150 days ago

# Test Active Monetization (Day 180)
DEPLOYMENT_DATE=2024-07-19  # 180 days ago
```

---

## 📱 Frontend Implementation (Next Steps)

### 1. Phase Notification Banner
```jsx
// frontend/src/components/PhaseNotificationBanner.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function PhaseNotificationBanner() {
  const [phase, setPhase] = useState(null);

  useEffect(() => {
    axios.get('/api/monetization/phase')
      .then(res => setPhase(res.data));
  }, []);

  if (!phase) return null;

  const bannerStyles = {
    LAUNCH: { bg: 'green', icon: '🎉' },
    SOFT_MONETIZATION: { bg: 'blue', icon: 'ℹ️' },
    PRE_MONETIZATION_WARNING: { bg: 'orange', icon: '⚠️' },
    MONETIZATION_ACTIVE: { bg: 'purple', icon: '💳' }
  };

  const style = bannerStyles[phase.phase];

  return (
    <div className={`banner banner-${style.bg}`}>
      {style.icon} {phase.message}
      {phase.daysRemaining && (
        <span className="countdown">{phase.daysRemaining} days left</span>
      )}
      {phase.earlyBirdAvailable && (
        <a href="/pricing" className="btn-early-bird">
          Get 25% Off - Subscribe Now
        </a>
      )}
    </div>
  );
}
```

### 2. Usage Stats Dashboard Widget
```jsx
// frontend/src/components/UsageStatsWidget.jsx
export default function UsageStatsWidget({ usage, limits, tier }) {
  return (
    <div className="usage-widget">
      <h3>Your Usage This Month</h3>
      
      <div className="stat">
        <span>📨 SMS Sent:</span>
        <span>{usage.sms} / {limits.sms === -1 ? '∞' : limits.sms}</span>
        <ProgressBar value={usage.sms} max={limits.sms} />
      </div>

      <div className="stat">
        <span>📧 Emails:</span>
        <span>{usage.emails} / {limits.emails === -1 ? '∞' : limits.emails}</span>
        <ProgressBar value={usage.emails} max={limits.emails} />
      </div>

      {usage.sms >= limits.sms * 0.8 && (
        <div className="warning">
          ⚠️ You've used 80% of your SMS allocation. 
          <a href="/pricing">Upgrade to Pro</a>
        </div>
      )}
    </div>
  );
}
```

### 3. Early Bird Discount Badge
```jsx
// frontend/src/components/PricingCard.jsx
{phase.phase === 'PRE_MONETIZATION_WARNING' && (
  <div className="early-bird-badge">
    🎁 EARLY BIRD: Save 25% for 6 months!
    <div className="countdown">
      Offer expires in {phase.daysRemaining} days
    </div>
  </div>
)}
```

---

## 🧪 Testing Checklist

### Phase Testing
- [ ] **Launch Phase**: All features unlimited, no restrictions
- [ ] **Soft Monetization**: Pricing visible, features still free
- [ ] **Warning Phase**: Countdown shown, early bird discount displayed
- [ ] **Active Monetization**: Tier limits enforced, SMS blocked when exceeded

### SMS Enforcement
- [ ] Grace period: Unlimited SMS sent successfully
- [ ] Free tier (Day 180+): SMS blocked after 0 sends
- [ ] Basic tier: SMS blocked after 50 sends
- [ ] Pro tier: SMS blocked after 500 sends
- [ ] Email fallback: Triggers automatically when SMS blocked

### User Experience
- [ ] Phase banner displays correctly on dashboard
- [ ] Usage stats update in real-time
- [ ] Early bird discount code generated
- [ ] Upgrade flow works end-to-end
- [ ] SMS credit purchase functional

---

## 🚨 Troubleshooting

### Monetization Not Activating After 180 Days
**Check:**
1. `DEPLOYMENT_DATE` set correctly in .env
2. Server restarted after .env change
3. Date format is `YYYY-MM-DD`

```bash
# Test in Node.js console
node
> const deploymentConfig = require('./backend/config/deploymentConfig');
> console.log(deploymentConfig.getCurrentPhase());
```

### SMS Still Sending After Limit Exceeded
**Check:**
1. `canSendSMS()` is called before sending
2. `incrementUsage()` is called after sending
3. Grace period hasn't been extended

```javascript
// Verify in reminderService.js
const canSend = await monetizationService.canSendSMS(userId);
if (!canSend.allowed) {
  // Should route to email
}
```

### Users Not Seeing Phase Notifications
**Check:**
1. Frontend API endpoint `/api/monetization/phase` exists
2. CORS allows frontend requests
3. Component mounted in App.jsx

---

## 📈 Revenue Projections

### Scenario: 1,000 Active Users After Grace Period

**Tier Distribution (Estimated):**
- 60% Free: 600 users × UGX 0 = **UGX 0**
- 25% Basic: 250 users × UGX 15,000 = **UGX 3,750,000**
- 12% Pro: 120 users × UGX 50,000 = **UGX 6,000,000**
- 3% Enterprise: 30 users × UGX 200,000 = **UGX 6,000,000**

**Monthly Recurring Revenue**: **UGX 15,750,000** (~$4,200 USD)

**SMS Overage Revenue** (10% of Pro/Enterprise users):
- 15 users × UGX 20,000 overage = **UGX 300,000**

**Prepaid SMS Credits** (30% of Free users):
- 180 users × UGX 10,000 = **UGX 1,800,000**

**Total Monthly Revenue**: **UGX 17,850,000** (~$4,750 USD)

**Annual Revenue**: **UGX 214,200,000** (~$57,000 USD)

---

## 🎓 Key Learnings

### Why Automated Monetization?
1. **Removes friction**: Set date once, never think about it again
2. **Gradual transition**: Users aren't shocked by sudden billing
3. **Early bird incentive**: Encourages pre-monetization signups
4. **Cost control**: SMS enforcement prevents unexpected bills
5. **User trust**: Transparent timeline builds confidence

### Best Practices
- ✅ Communicate grace period length clearly at signup
- ✅ Show usage stats throughout grace period
- ✅ Send email reminders before enforcement starts
- ✅ Offer discounts for early adopters
- ✅ Route to cheaper channels (email) when SMS blocked
- ✅ Provide prepaid options for occasional users
- ✅ Allow legacy users grandfathered rates

---

## 📞 Support & Documentation

- **Deployment Issues**: Check [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **API Reference**: See [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md)
- **Monetization Config**: Review [backend/config/monetization.js](./backend/config/monetization.js)
- **Deployment Config**: Check [backend/config/deploymentConfig.js](./backend/config/deploymentConfig.js)

---

## 🎉 You're Ready to Deploy!

1. Set `DEPLOYMENT_DATE` in backend/.env
2. Restart server
3. Monitor phase transitions
4. Watch revenue grow automatically! 📈

**Questions?** The system is fully autonomous. Just set the date and let it run! 🚀
