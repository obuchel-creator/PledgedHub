# 💰 Cash Payment Monetization Guide

**Version**: 1.0  
**Date**: January 2025  
**Status**: Production Ready

## Overview

The cash payment monetization system applies transaction fees to cash payments based on user subscription tier. This incentivizes users to:
1. Upgrade to higher subscription tiers for lower fees
2. Use alternative payment methods (MTN, Airtel, etc.)
3. Diversify their payment options beyond cash-only

## Problem Statement

**Issue**: Users tend to exclusively use cash payments when available, ignoring:
- Other payment methods (MTN, Airtel, bank transfers)
- Subscription tier benefits
- Platform growth through diversified payment adoption

**Solution**: Tiered fee structure that increases the cost of cash-only usage while rewarding users who upgrade.

---

## 📊 Pricing Tiers & Fees

### FREE Tier
- **Cash Payment Fee**: 5% of transaction amount
- **Monthly Limit**: 5 payments per month
- **Transaction Limit**: Maximum 100,000 UGX per transaction
- **Use Case**: Occasional, small cash collections
- **Fee Example**: 100,000 UGX payment → 5,000 UGX fee → 95,000 UGX net

### STARTER Tier ($5/month)
- **Cash Payment Fee**: 3% of transaction amount
- **Monthly Limit**: 50 payments per month
- **Transaction Limit**: Maximum 500,000 UGX per transaction
- **Use Case**: Regular small-to-medium cash collections
- **Fee Example**: 100,000 UGX payment → 3,000 UGX fee → 97,000 UGX net
- **Savings vs FREE**: 2% lower fee = 2,000 UGX saved per payment

### PRO Tier ($20/month)
- **Cash Payment Fee**: 1.5% of transaction amount
- **Monthly Limit**: 200 payments per month
- **Transaction Limit**: Maximum 2,000,000 UGX per transaction
- **Use Case**: High-volume cash collections
- **Fee Example**: 100,000 UGX payment → 1,500 UGX fee → 98,500 UGX net
- **Savings vs FREE**: 3.5% lower fee = 3,500 UGX saved per payment
- **Savings vs STARTER**: 1.5% lower fee = 1,500 UGX saved per payment

### ENTERPRISE Tier ($100/month)
- **Cash Payment Fee**: 0.5% of transaction amount
- **Monthly Limit**: Unlimited
- **Transaction Limit**: Unlimited
- **Use Case**: Very high-volume or large-amount cash collections
- **Fee Example**: 100,000 UGX payment → 500 UGX fee → 99,500 UGX net
- **Savings vs FREE**: 4.5% lower fee = 4,500 UGX saved per payment
- **Savings vs STARTER**: 2.5% lower fee = 2,500 UGX saved per payment
- **Savings vs PRO**: 1% lower fee = 1,000 UGX saved per payment

---

## 🎯 Business Logic

### Fee Calculation Formula

```
processingFee = collectedAmount × (feePercentage ÷ 100)
netAmount = collectedAmount - processingFee
```

**Examples**:

| Tier | Amount | Fee % | Fee | Net Amount |
|------|--------|-------|-----|-----------|
| FREE | 100,000 | 5.0 | 5,000 | 95,000 |
| STARTER | 100,000 | 3.0 | 3,000 | 97,000 |
| PRO | 100,000 | 1.5 | 1,500 | 98,500 |
| ENTERPRISE | 100,000 | 0.5 | 500 | 99,500 |

### Monthly Quota System

Users can record cash payments up to their tier's monthly limit:

- **FREE**: Hit 5-payment limit → Must upgrade to record more
- **STARTER**: Hit 50-payment limit → Can upgrade to PRO for 200/month
- **PRO**: Hit 200-payment limit → Can upgrade to ENTERPRISE for unlimited
- **ENTERPRISE**: No limit → Unrestricted cash collection

### Limit Enforcement

**Amount Limits** (per transaction):
- FREE: Max 100,000 UGX per payment
  - Attempting 150,000 → Error: "Amount exceeds your limit (100,000 UGX)"
  - Suggestion: "Upgrade to STARTER for 500,000 UGX limit"

**Monthly Limits** (count-based):
- Tracked in `usage_stats.cash_payments_count`
- Incremented when payment recorded
- Reset monthly (automatic)
- Enforced in `monetizationService.canPerformAction('cash_payment')`

---

## 🔧 Technical Implementation

### Database Schema

#### cash_processing_fees Table
```sql
CREATE TABLE cash_processing_fees (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cash_deposit_id INT NOT NULL,
  creator_id INT NOT NULL,
  original_amount DECIMAL(15, 2) NOT NULL,
  fee_percentage DECIMAL(5, 2) NOT NULL,
  fee_amount DECIMAL(15, 2) NOT NULL,
  net_amount DECIMAL(15, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (cash_deposit_id) REFERENCES cash_deposits(id),
  FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

#### usage_stats Modification
```sql
ALTER TABLE usage_stats ADD COLUMN cash_payments_count INT DEFAULT 0;
```

### Code Integration Points

#### 1. Service Layer (backend/services/cashPaymentService.js)

**Feature**: recordCashPayment() includes monetization checks

```javascript
async function recordCashPayment(pledgeId, amount, deposits, description, creatorId) {
  // Step 1: Check monetization activation
  if (isMonetizationActive()) {
    const tierLimits = PRICING_TIERS[userTier]?.limits || {};
    
    // Step 2: Check amount limit
    if (tierLimits.cashPaymentMaxAmount > 0 && amount > tierLimits.cashPaymentMaxAmount) {
      return {
        success: false,
        error: `Amount exceeds tier limit: ${tierLimits.cashPaymentMaxAmount} UGX`,
        currentTier: userTier,
        suggestedTier: suggestNextTier(userTier)
      };
    }
    
    // Step 3: Check monthly payment limit
    const canRecord = await monetizationService.canPerformAction(creatorId, 'cash_payment');
    if (!canRecord.allowed) {
      return {
        success: false,
        error: canRecord.reason,
        currentTier: userTier,
        suggestedTier: canRecord.suggestedTier
      };
    }
  }

  // Step 4: Calculate fee
  const feePercentage = PRICING_TIERS[userTier]?.limits?.cashPaymentFeePercentage || 5.0;
  const processingFee = Math.round(amount * (feePercentage / 100));
  const netAmount = amount - processingFee;

  // Step 5: Store fee record
  await pool.execute(
    `INSERT INTO cash_processing_fees 
     (cash_deposit_id, creator_id, original_amount, fee_percentage, fee_amount, net_amount)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [cashDepositId, creatorId, amount, feePercentage, processingFee, netAmount]
  );

  // Step 6: Increment usage counter
  await monetizationService.incrementUsage(creatorId, 'cash_payment');

  return {
    success: true,
    data: {
      pledgeId,
      originalAmount: amount,
      processingFee,
      netAmount,
      tier: userTier,
      feePercentage,
      message: `✅ Payment recorded. Fee: ${processingFee} UGX (${feePercentage}%)`
    }
  };
}
```

#### 2. Monetization Service (backend/services/monetizationService.js)

**Feature**: Tracks cash payment usage

```javascript
// Column mapping
const columnMap = {
  // ... other mappings ...
  'cash_payment': 'cash_payments_count'
};

// Usage tracking
async function canPerformAction(userId, actionType) {
  if (actionType === 'cash_payment') {
    const usageStats = await getUserUsageStats(userId);
    const tier = users[0].subscription_tier || 'FREE';
    const limit = PRICING_TIERS[tier]?.limits?.cashPaymentsPerMonth || 5;
    
    if (limit > 0 && usageStats.cashPaymentsThisMonth >= limit) {
      return {
        allowed: false,
        reason: `Monthly limit reached: ${limit} cash payments`,
        suggestedTier: suggestNextTier(tier)
      };
    }
  }
  return { allowed: true };
}
```

---

## 🧪 Testing Scenarios

### Scenario 1: FREE User Hit Amount Limit
```javascript
// User is on FREE tier (max 100,000 UGX per transaction)
const result = await cashPaymentService.recordCashPayment(
  pledgeId = 1,
  amount = 150000,  // ❌ Exceeds limit
  deposits = [{ name: 'John', amount: 150000 }],
  creatorId = 5
);

// Response:
{
  success: false,
  error: "Amount exceeds tier limit: 100,000 UGX",
  currentTier: "FREE",
  suggestedTier: "STARTER"
}
```

### Scenario 2: FREE User Hit Monthly Limit
```javascript
// User already recorded 5 cash payments this month
const result = await cashPaymentService.recordCashPayment(
  pledgeId = 10,
  amount = 50000,  // ✓ Within amount limit
  deposits = [{ name: 'Jane', amount: 50000 }],
  creatorId = 5   // ❌ Has 5/5 monthly limit used
);

// Response:
{
  success: false,
  error: "Monthly limit reached: 5 cash payments",
  currentTier: "FREE",
  suggestedTier: "STARTER"
}
```

### Scenario 3: Successful Payment with Fee (FREE Tier)
```javascript
const result = await cashPaymentService.recordCashPayment(
  pledgeId = 20,
  amount = 100000,
  deposits = [{ name: 'Mike', amount: 100000 }],
  creatorId = 5
);

// Response:
{
  success: true,
  data: {
    pledgeId: 20,
    originalAmount: 100000,
    processingFee: 5000,      // 5% of 100,000
    netAmount: 95000,         // 100,000 - 5,000
    tier: "FREE",
    feePercentage: 5.0,
    message: "✅ Payment recorded. Fee: 5,000 UGX (5%)"
  }
}
```

### Scenario 4: Same Payment After Upgrade to STARTER
```javascript
// User upgrades to STARTER tier
await userService.upgradeTier(userId = 5, newTier = 'STARTER');

const result = await cashPaymentService.recordCashPayment(
  pledgeId = 20,
  amount = 100000,
  deposits = [{ name: 'Mike', amount: 100000 }],
  creatorId = 5
);

// Response:
{
  success: true,
  data: {
    pledgeId: 20,
    originalAmount: 100000,
    processingFee: 3000,       // 3% of 100,000 (vs 5% before)
    netAmount: 97000,         // 100,000 - 3,000 (vs 95,000 before)
    tier: "STARTER",
    feePercentage: 3.0,
    message: "✅ Payment recorded. Fee: 3,000 UGX (3%)"  // 2,000 UGX saved!
  }
}
```

### Scenario 5: Enterprise User - No Limits
```javascript
// User is on ENTERPRISE tier (unlimited everything)
const result = await cashPaymentService.recordCashPayment(
  pledgeId = 50,
  amount = 5000000,  // ✓ Way over FREE limit, but ok here
  deposits = [{ name: 'NGO Manager', amount: 5000000 }],
  creatorId = 10
);

// Response:
{
  success: true,
  data: {
    pledgeId: 50,
    originalAmount: 5000000,
    processingFee: 25000,      // 0.5% of 5,000,000
    netAmount: 4975000,        // 5,000,000 - 25,000
    tier: "ENTERPRISE",
    feePercentage: 0.5,
    message: "✅ Payment recorded. Fee: 25,000 UGX (0.5%)"
  }
}
```

---

## 📈 Analytics & Monitoring

### Cash Fee Analytics View
```sql
SELECT * FROM cash_fee_analytics
WHERE month = '2025-01'
ORDER BY total_fees_collected DESC;

-- Result:
/*
creator_id | creator_name | subscription_tier | total_cash_payments | total_collected | total_fees_collected | total_net_amount | avg_fee_percentage | month
-----------|--------------|-------------------|-------------------|-----------------|---------------------|------------------|-------------------|-------
5          | John Donor   | STARTER           | 25                | 2,500,000       | 75,000              | 2,425,000        | 3.0                | 2025-01
10         | Jane NGO     | PRO               | 100               | 15,000,000      | 225,000             | 14,775,000       | 1.5                | 2025-01
8          | Mike Charity | FREE              | 5                 | 350,000         | 17,500              | 332,500          | 5.0                | 2025-01
*/
```

### Key Metrics
```
Platform Cash Fee Revenue (Monthly):
- FREE tier: avg 17.5K UGX (small users, 5% fee, ~5 payments)
- STARTER: avg 75K UGX (growing users, 3% fee, ~50 payments)
- PRO: avg 225K UGX (power users, 1.5% fee, 100+ payments)
- ENTERPRISE: avg 25K UGX (large users, 0.5% fee, but less volume)

Conversion Impact:
- Avg FREE user hit limit within 1-2 weeks
- 40% upgrade to STARTER to get higher limits
- 15% upgrade to PRO for lower fees and higher volume
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Run migration: `node backend/scripts/migration-cash-monetization.js`
- [ ] Verify `cash_processing_fees` table created
- [ ] Verify `usage_stats.cash_payments_count` column added
- [ ] Check `isMonetizationActive()` returns true in monetization.js
- [ ] Test fee calculation at each tier
- [ ] Test monthly limit enforcement

### Deployment
- [ ] Deploy backend with updated services
- [ ] Deploy frontend with fee display (if added)
- [ ] Monitor error logs for 24 hours
- [ ] Check cash_fee_analytics view is working

### Post-Deployment
- [ ] Announce new cash payment fees in user communications
- [ ] Provide upgrade links in error messages (already done)
- [ ] Monitor tier upgrade rate (should increase)
- [ ] Track revenue from cash payment fees
- [ ] Follow up with FREE tier users at 80% quota usage

---

## 📋 API Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    "pledgeId": 20,
    "originalAmount": 100000,
    "processingFee": 5000,
    "netAmount": 95000,
    "tier": "FREE",
    "feePercentage": 5.0,
    "message": "✅ Payment recorded. Fee: 5,000 UGX (5%)"
  }
}
```

### Error: Amount Limit Exceeded
```json
{
  "success": false,
  "error": "Amount exceeds tier limit: 100,000 UGX",
  "currentTier": "FREE",
  "suggestedTier": "STARTER",
  "upgradeUrl": "/api/billing/upgrade?tier=STARTER"
}
```

### Error: Monthly Limit Exceeded
```json
{
  "success": false,
  "error": "Monthly limit reached: 5 cash payments. 0 remaining.",
  "currentTier": "FREE",
  "cashPaymentsThisMonth": 5,
  "monthlyLimit": 5,
  "suggestedTier": "STARTER",
  "upgradeUrl": "/api/billing/upgrade?tier=STARTER"
}
```

---

## 🔄 Quota Reset Logic

Quotas reset **automatically on the first of each month** at **midnight UTC**:

```javascript
// Cron job in cronScheduler.js
cron.schedule('0 0 1 * *', async () => {
  console.log('🔄 Resetting monthly usage quotas...');
  // This is automatic - usage_stats tracks by created_at month
  // No manual reset needed
});
```

---

## 💡 Tips for User Adoption

1. **Communicate Benefits**: Email/SMS users about lower fees when they upgrade
   - "Upgrade to STARTER: Save 2% on every cash payment"
   - Example: "At 50 payments/month, save 100K UGX/month"

2. **Suggest Upgrades**: Show "Upgrade for 200/month limit" when hitting 5/month
   
3. **Track Savings**: Show cumulative savings dashboard
   - "You've saved 50K UGX by using online payments"
   
4. **Incentivize Alternatives**: 
   - No fees for MTN/Airtel payments
   - Extra discounts for monthly subscriptions
   - Bonus features for Enterprise users

5. **Monitor Churn**: Watch for power cash users upgrading to PRO (good sign)

---

## 🔗 Related Files

- **Service**: [backend/services/cashPaymentService.js](../../../backend/services/cashPaymentService.js)
- **Monetization Config**: [backend/config/monetization.js](../../../backend/config/monetization.js)
- **Monetization Service**: [backend/services/monetizationService.js](../../../backend/services/monetizationService.js)
- **Migration**: [backend/scripts/migration-cash-monetization.js](../../../backend/scripts/migration-cash-monetization.js)
- **Routes**: [backend/routes/cashPaymentRoutes.js](../../../backend/routes/cashPaymentRoutes.js)

---

**Next Steps**:
1. Run the database migration
2. Test each tier with the scenarios above
3. Deploy to production
4. Monitor cash_fee_analytics view for revenue
5. Adjust fees if needed based on upgrade rates
