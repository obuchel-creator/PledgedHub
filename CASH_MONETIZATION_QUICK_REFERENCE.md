# 💰 Cash Payment Monetization - Quick Reference

## At a Glance

**What**: Transaction fees on cash payments (% varies by subscription tier)  
**Why**: Prevent cash-only dominance, encourage upgrades & payment diversification  
**How**: Tiered fees + monthly quotas + amount limits  
**Where**: `cashPaymentService.js` + `monetizationService.js` + new `cash_processing_fees` table  

---

## Fee Structure (One Minute Overview)

| Tier | Fee | Payments/Month | Max/Transaction | Cost @ 100K UGX |
|------|-----|----------------|-----------------|-----------------|
| 🆓 FREE | 5% | 5 | 100K | 5K fee → 95K net |
| ⭐ STARTER | 3% | 50 | 500K | 3K fee → 97K net |
| 🚀 PRO | 1.5% | 200 | 2M | 1.5K fee → 98.5K net |
| 🏆 ENTERPRISE | 0.5% | ∞ | ∞ | 500 fee → 99.5K net |

---

## Key Code Locations

```
recordCashPayment() {
  1. Check tier limits     [cashPaymentService.js:40-75]
  2. Validate amount       [cashPaymentService.js:50-55]
  3. Validate quota        [cashPaymentService.js:60-75]
  4. Calculate fee         [cashPaymentService.js:95]
  5. Store fee record      [cashPaymentService.js:100-105]
  6. Increment usage       [cashPaymentService.js:162]
  7. Return with fees      [cashPaymentService.js:165-175]
}
```

---

## Common Scenarios

### User Hits Amount Limit
```javascript
// FREE user tries: 150K UGX (max is 100K)
→ Error: "Amount exceeds tier limit: 100,000 UGX"
→ Suggestion: "Upgrade to STARTER for 500K limit"
```

### User Hits Monthly Limit
```javascript
// FREE user has done 5 payments (max is 5)
→ Error: "Monthly limit reached: 5 cash payments"
→ Suggestion: "Upgrade to STARTER for 50 payments/month"
```

### Successful Payment
```javascript
// STARTER user: 100K UGX payment
→ Fee: 3K (3%)
→ Net: 97K
→ Message: "Fee: 3,000 UGX (3%)"
→ Monthly: 1/50 payments used
```

### After Upgrade
```javascript
// Same 100K payment as STARTER (fee drops 2K)
→ Was: 5K fee (FREE) → Now: 3K fee (STARTER)
→ Savings: 2K per payment × 50/month = 100K saved monthly!
```

---

## Database Quick Ref

### New Table: cash_processing_fees
```sql
-- Track individual fees
cash_deposit_id → links to cash_deposits table
creator_id → links to users table
original_amount → what was collected
fee_percentage → what % was charged
fee_amount → what $ was charged
net_amount → what was actually kept

-- Example row:
id: 1, cash_deposit_id: 10, creator_id: 5, 
original: 100000, fee%: 3.0, fee$: 3000, net: 97000
```

### Updated: usage_stats
```sql
-- Added column (if not exists):
cash_payments_count INT DEFAULT 0

-- Tracks: How many cash payments this month
-- Resets: 1st of month automatically
-- Used by: canPerformAction() for limit checking
```

### Analytics View: cash_fee_analytics
```sql
-- Shows monthly breakdown by user:
creator_id, name, tier, payment_count, 
total_collected, total_fees_collected, 
avg_fee_percentage, month

-- Use: SELECT * FROM cash_fee_analytics WHERE month = '2025-01'
```

---

## Testing Checklist

- [ ] FREE user can do 5 payments (quota resets month 2)
- [ ] FREE user blocked on payment #6
- [ ] FREE user can't exceed 100K per transaction
- [ ] FREE user sees 5% fee on all payments
- [ ] STARTER user can do 50 payments (same month)
- [ ] STARTER user sees 3% fee (not 5%)
- [ ] PRO user can do 200 payments
- [ ] ENTERPRISE user no limits
- [ ] Fee calculation is exact (no rounding errors)
- [ ] Fee stored in cash_processing_fees table
- [ ] Usage increments in usage_stats.cash_payments_count
- [ ] Monthly quotas reset on 1st of month
- [ ] Upgrade reduces fee on next payment

---

## API Integration

### Endpoint Updated
```
POST /api/cash-payments/record
```

### New Response Fields
```json
{
  "processingFee": 3000,        // New ✨
  "netAmount": 97000,           // New ✨
  "tier": "STARTER",            // New ✨
  "feePercentage": 3.0          // New ✨
}
```

### Error Responses (New)
```json
{
  "error": "Amount exceeds tier limit: 100,000 UGX",
  "currentTier": "FREE",
  "suggestedTier": "STARTER"    // New ✨
}
```

---

## Running the Migration

```bash
# Create tables + columns
node backend/scripts/migration-cash-monetization.js

# Output:
# ✅ Created cash_processing_fees table
# ✅ Added cash_payments_count column
# ✅ Created cash_fee_analytics view
```

---

## Monitoring Cash Fees

```sql
-- Check monthly revenue
SELECT 
  DATE_FORMAT(created_at, '%Y-%m') as month,
  COUNT(*) as transactions,
  SUM(fee_amount) as total_fees,
  SUM(original_amount) as total_collected
FROM cash_processing_fees
GROUP BY DATE_FORMAT(created_at, '%Y-%m')
ORDER BY month DESC;

-- Check by tier
SELECT 
  u.subscription_tier,
  COUNT(*) as payment_count,
  SUM(cpf.fee_amount) as total_fees,
  AVG(cpf.fee_percentage) as avg_fee_pct
FROM cash_processing_fees cpf
JOIN users u ON cpf.creator_id = u.id
WHERE DATE_FORMAT(cpf.created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')
GROUP BY u.subscription_tier;
```

---

## Files Modified in This Feature

| File | Change | Lines |
|------|--------|-------|
| monetization.js | Added cash fee/limit fields to all 4 tiers | +20 |
| cashPaymentService.js | Added monetization checks, fee calc, storage | +100 |
| monetizationService.js | Added cash_payments tracking | +10 |
| migration-cash-monetization.js | New database migration | +80 |
| CASH_PAYMENT_MONETIZATION_GUIDE.md | Full documentation | +300 |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "cash_processing_fees table doesn't exist" | Run: `node backend/scripts/migration-cash-monetization.js` |
| "No fee is being charged" | Check: `isMonetizationActive()` in monetization.js (should be true) |
| "User can't record more than 5 payments" | Correct - they're on FREE tier. Suggest upgrade. |
| "Fee is too high" | Adjust `cashPaymentFeePercentage` in monetization.js PRICING_TIERS |
| "Quotas not resetting" | Check: cron job runs 1st of month, usage_stats tracks by created_at |
| "Payment recorded but no fee in response" | Check: cashPaymentRoutes returns full response data |

---

## Quick Win: Cost Savings Message

**Show users this to encourage upgrade**:

```
📊 SAVINGS CALCULATOR
┌─────────────────────────────────────────┐
│ If you paid 100K/month in cash fees:    │
├─────────────────────────────────────────┤
│ FREE ($0):      5,000 UGX fee           │
│ STARTER ($5):   3,000 UGX fee  → SAVE 2K │
│ PRO ($20):      1,500 UGX fee  → SAVE 3.5K │
│ ENTERPRISE:     500 UGX fee    → SAVE 4.5K │
└─────────────────────────────────────────┘

At 50 payments/month?
- FREE tier = 250K UGX in fees + can't do 50 anyway
- STARTER = 150K UGX in fees → PAY $5 to save 100K! 💰
```

---

## Feature Flag

Controlled by: `MONETIZATION_LAUNCH_DATE` in env

```javascript
// If current date < launch date:
// - Monetization disabled (no fees charged)
// - Users transition period to adjust
// - After launch date: fees enforced

// Set launch date: 1 month after deploy (grace period)
MONETIZATION_LAUNCH_DATE=2025-02-15
```

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Owner**: PledgeHub Platform Team  
**Status**: ✅ Production Ready
