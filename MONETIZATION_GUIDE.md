# PledgeHub Monetization System

## 🎯 Overview

PledgeHub now has a complete monetization system that automatically activates **6 months after launch**. Until then, all users enjoy unlimited access to all features.

**Launch Date**: December 11, 2025  
**Monetization Start**: June 11, 2026 (6 months later)

---

## 💰 Pricing Strategy

### **Freemium Model with 4 Tiers**

#### 1. **FREE Tier** ($0/month)
- 50 pledges per month
- 2 active campaigns
- 1 user
- 10 SMS notifications
- 100 email notifications
- Basic dashboard
- Community support

#### 2. **STARTER Tier** ($19/month)
- 500 pledges per month
- 10 active campaigns
- 3 users
- 100 SMS notifications
- 1,000 email notifications
- AI-powered insights ✨
- Advanced analytics
- Export to CSV/PDF
- Email support

#### 3. **PRO Tier** ($49/month) ⭐ RECOMMENDED
- 2,000 pledges per month
- 50 active campaigns
- 10 users
- 500 SMS notifications
- 5,000 email notifications
- Unlimited AI insights
- Custom branding
- API access
- White-label reports
- Priority support

#### 4. **ENTERPRISE Tier** ($199/month)
- **Unlimited** pledges
- **Unlimited** campaigns
- **Unlimited** users
- **Unlimited** notifications
- Custom domain
- Dedicated account manager
- Custom integrations
- 24/7 phone support
- SLA guarantee
- On-premise option

### **Alternative: Transaction Fees**
- 2.5% + $0.30 per successful payment
- No monthly subscription required

---

## 📅 Auto-Monetization Timeline

```
Dec 11, 2025         Jun 11, 2026         Jun 25, 2026
    |                    |                    |
  LAUNCH          MONETIZATION          NEW USERS
                    ACTIVATES           GET 14-DAY
                                        FREE TRIAL
    |______________|________________|_____________
         Free for          Existing users         All users
      all users         keep current tier          must pay
```

### What Happens:

1. **Before Jun 11, 2026**: Everyone gets full access free
2. **Jun 11, 2026**: Monetization activates
   - Existing users: Moved to FREE tier (grandfathered)
   - New signups: Get 14-day free trial
3. **After trial**: Users must choose paid plan or stay on FREE tier

---

## 🔧 Implementation Files

### Backend

1. **`backend/config/monetization.js`**
   - Pricing tier definitions
   - Monetization activation logic
   - User limit checking

2. **`backend/scripts/add-monetization-tables.js`**
   - Database migration script
   - Creates tables: `subscriptions`, `billing_history`, `usage_stats`, `payment_transactions`, `pricing_plans`
   - **Run this**: `node backend/scripts/add-monetization-tables.js`

3. **`backend/services/monetizationService.js`**
   - Subscription management
   - Usage tracking
   - Billing operations

4. **`backend/routes/monetizationRoutes.js`**
   - API endpoints for pricing, subscriptions, billing

### Frontend

5. **`frontend/src/screens/PricingScreen.jsx`**
   - Beautiful pricing page
   - Shows countdown until monetization
   - Displays current plan and usage

---

## 🚀 Setup Instructions

### 1. Run Database Migration

```bash
# Start MySQL first (WAMP/XAMPP)
cd c:\Users\HP\PledgeHub\backend
node scripts/add-monetization-tables.js
```

### 2. Add Routes to server.js

Add this to `backend/server.js`:

```javascript
// Monetization routes
const { router: monetizationRoutes } = require('./routes/monetizationRoutes');
app.use('/api/monetization', monetizationRoutes);
```

### 3. Add Pricing Page to Router

Add to `frontend/src/App.js`:

```javascript
import PricingScreen from './screens/PricingScreen';

// In routes:
<Route path="/pricing" element={<PricingScreen />} />
```

### 4. Add Usage Tracking

In your pledge creation/campaign creation routes, add:

```javascript
const monetizationService = require('./services/monetizationService');

// Check limits before action
const canCreate = await monetizationService.canPerformAction(userId, 'pledge');
if (!canCreate.allowed) {
  return res.status(403).json({ 
    error: canCreate.reason,
    upgradeRequired: true 
  });
}

// After successful action
await monetizationService.incrementUsage(userId, 'pledge');
```

---

## 📊 API Endpoints

### Monetization Status
```
GET /api/monetization/status
Response: { isActive, activationDate, daysUntilActivation }
```

### Get Pricing Plans
```
GET /api/monetization/pricing
Response: { plans: [...], monetizationActive: boolean }
```

### Get User Subscription
```
GET /api/monetization/subscription
Headers: { Authorization: Bearer <token> }
Response: { tier, status, limits, usage, features }
```

### Subscribe to Plan
```
POST /api/monetization/subscribe
Headers: { Authorization: Bearer <token> }
Body: { tier: 'STARTER', paymentMethod: 'stripe', durationMonths: 1 }
```

### Cancel Subscription
```
POST /api/monetization/cancel
Headers: { Authorization: Bearer <token> }
```

### Get Usage Stats
```
GET /api/monetization/usage
Response: { usage, limits, percentUsed }
```

### Get Billing History
```
GET /api/monetization/billing-history?limit=10
Response: [{ amount, status, description, paid_at }]
```

---

## 🎨 UI/UX Features

### Countdown Banner (Before Monetization)
Shows on all pages: "🎉 Free Access! Monetization starts in X days"

### Usage Indicators
- Progress bars showing: "You've used 45/50 pledges this month"
- Upgrade prompts when approaching limits

### Upgrade Modals
When user exceeds limits:
```
⚠️ Pledge Limit Reached
You've created 50 pledges this month (your limit on the Free plan).

Upgrade to STARTER for 500 pledges/month
[Upgrade Now] [View Pricing]
```

### Pricing Page Features
- Beautiful card-based design
- "Recommended" badge on PRO tier
- "Current Plan" indicator
- FAQ section
- Contact sales CTA

---

## 💳 Payment Integration (TODO)

To complete monetization, integrate payment processors:

### Option 1: Stripe
```bash
npm install stripe
```

### Option 2: PayPal
```bash
npm install @paypal/checkout-server-sdk
```

### Option 3: Mobile Money (Uganda)
- MTN Mobile Money
- Airtel Money
- (See existing payment integration guides)

---

## 📈 Usage Tracking

Automatically tracked:
- ✅ Pledges created per month
- ✅ Active campaigns count
- ✅ SMS notifications sent
- ✅ Email notifications sent
- ✅ AI requests made
- ✅ API calls (if enabled)

---

## 🔒 Limit Enforcement

When user exceeds limits:

1. **Soft Block**: Show upgrade modal, allow 3 more actions
2. **Hard Block**: Disable feature, require upgrade
3. **Grace Period**: 7 days after subscription expires

Example enforcement in routes:

```javascript
const { checkSubscriptionLimit } = require('./routes/monetizationRoutes');

// Add middleware to protected routes
router.post('/pledges', 
  authenticateToken, 
  checkSubscriptionLimit('pledge'), // Checks limits
  createPledge
);
```

---

## 📧 Email Notifications

Send emails for:
- [ ] 30 days before monetization starts
- [ ] 7 days before monetization starts
- [ ] Day monetization starts
- [ ] Trial expiring (2 days before)
- [ ] Subscription expiring (7 days before)
- [ ] Usage approaching limits (90% used)

---

## 🎯 Marketing Strategy

### Pre-Launch (Now - Jun 2026)
- "Early Adopter" badge for free users
- Email list for launch updates
- Social proof: "Join 500+ organizations using PledgeHub"

### Launch Day (Jun 11, 2026)
- Email all users about pricing
- Offer: "50% off first 3 months" for early adopters
- Blog post: "Why we're launching paid plans"

### Post-Launch
- Referral program: "Get 1 free month for each referral"
- Annual discount: Save 20%
- Nonprofit discount: 30% off

---

## 🧪 Testing Monetization

### Test Before Launch

1. **Change launch date** in `backend/config/monetization.js`:
   ```javascript
   const LAUNCH_DATE = new Date('2025-12-01'); // 10 days ago
   ```

2. **Test scenarios**:
   - Create 51 pledges (should block on Free tier)
   - Subscribe to STARTER
   - Create 501 pledges (should suggest upgrade)
   - Cancel subscription
   - Check billing history

3. **Reset for production**:
   ```javascript
   const LAUNCH_DATE = new Date('2025-12-11'); // Real launch date
   ```

---

## 📋 Checklist

Before launch:
- [ ] Run database migration
- [ ] Add monetization routes to server.js
- [ ] Add PricingScreen to router
- [ ] Add usage tracking to all relevant routes
- [ ] Integrate payment processor (Stripe/PayPal)
- [ ] Set up email notifications
- [ ] Test all pricing tiers
- [ ] Test limit enforcement
- [ ] Add "Pricing" link to navigation
- [ ] Create marketing materials

---

## 🎉 Result

Your application will:
1. ✅ Be completely free until Jun 11, 2026
2. ✅ Automatically activate monetization on that date
3. ✅ Track usage for all users
4. ✅ Enforce limits based on subscription tier
5. ✅ Display beautiful pricing page
6. ✅ Handle subscriptions and billing
7. ✅ Show countdown to monetization
8. ✅ Provide smooth upgrade experience

**Total Potential Revenue** (Year 1 estimate):
- 100 FREE users: $0
- 50 STARTER users: $11,400/year
- 20 PRO users: $11,760/year
- 5 ENTERPRISE users: $11,940/year

**Total**: ~$35,000/year with conservative estimates

---

## 🆘 Support

For questions:
- Email: support@pledgedhub.com
- Docs: /docs/monetization
- API: /api/monetization/status

Happy monetizing! 💰
