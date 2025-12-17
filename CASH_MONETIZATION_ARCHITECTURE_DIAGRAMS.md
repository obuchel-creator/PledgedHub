# 💰 Cash Payment Monetization - Visual Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER RECORDS CASH PAYMENT                            │
│                        POST /api/cash-payments/record                        │
│                                                                              │
│  Body: { pledgeId: 20, deposits: [...], amount: 100000 }                   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                  CASHPAYMENTSERVICE.RECORDCASHPAYMENT()                     │
│                                                                              │
│  1️⃣ CHECK MONETIZATION ACTIVE?                                            │
│     ├─ If disabled → Skip all checks, record payment normally             │
│     └─ If enabled → Continue...                                           │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│           2️⃣ GET USER'S SUBSCRIPTION TIER FROM DATABASE                   │
│                                                                              │
│     SELECT subscription_tier FROM users WHERE id = ?                       │
│     Result: 'STARTER' (or 'FREE' if no tier)                             │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│        3️⃣ CHECK AMOUNT LIMIT (from PRICING_TIERS config)                  │
│                                                                              │
│     STARTER tier has:                                                       │
│     cashPaymentMaxAmount: 500000                                           │
│                                                                              │
│     User amount: 100000                                                     │
│     100000 < 500000 ✅ PASS                                               │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│    4️⃣ CHECK MONTHLY QUOTA (via monetizationService.canPerformAction)      │
│                                                                              │
│     SELECT usage_stats WHERE user_id = ? AND MONTH(created_at) = ?        │
│     Result: cash_payments_count = 25 / 50 limit = 25 remaining ✅ PASS   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              5️⃣ CALCULATE PROCESSING FEE                                   │
│                                                                              │
│     STARTER tier has:                                                       │
│     cashPaymentFeePercentage: 3.0                                          │
│                                                                              │
│     Fee calculation:                                                         │
│     processingFee = 100000 × (3.0 / 100) = 3000                           │
│     netAmount = 100000 - 3000 = 97000                                     │
│                                                                              │
│     ✅ Fee: 3000 UGX | Net: 97000 UGX | Rate: 3%                         │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│        6️⃣ STORE FEE RECORD IN cash_processing_fees TABLE                  │
│                                                                              │
│     INSERT INTO cash_processing_fees (                                      │
│       cash_deposit_id: 100,                                                 │
│       creator_id: 5,                                                        │
│       original_amount: 100000,                                             │
│       fee_percentage: 3.0,                                                 │
│       fee_amount: 3000,                                                    │
│       net_amount: 97000,                                                   │
│       created_at: NOW()                                                    │
│     )                                                                        │
│                                                                              │
│     ✅ Fee record stored for audit trail                                   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│         7️⃣ INCREMENT USAGE COUNTER FOR NEXT MONTH CHECK                   │
│                                                                              │
│     UPDATE usage_stats                                                      │
│     SET cash_payments_count = cash_payments_count + 1                      │
│     WHERE user_id = 5                                                       │
│                                                                              │
│     Now: 25 → 26 payments used this month                                  │
│     Still 24 remaining (50 limit)                                          │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    8️⃣ RETURN RESPONSE TO USER                              │
│                                                                              │
│     ✅ RESPONSE (200 OK):                                                 │
│     {                                                                        │
│       "success": true,                                                      │
│       "data": {                                                             │
│         "pledgeId": 20,                                                     │
│         "originalAmount": 100000,                                          │
│         "processingFee": 3000,      ← ORIGINAL - FEE                      │
│         "netAmount": 97000,         ← AMOUNT KEPT                         │
│         "tier": "STARTER",                                                 │
│         "feePercentage": 3.0,                                              │
│         "message": "✅ Payment recorded. Fee: 3,000 UGX (3%)"            │
│       }                                                                      │
│     }                                                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Error Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCENARIO: FREE USER TRIES 150K UGX                       │
│                                                                              │
│  Amount: 150000                                                             │
│  Tier: FREE                                                                 │
│  Limit: 100000                                                             │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│           CHECK AMOUNT LIMIT (Step 3)                                       │
│                                                                              │
│           150000 > 100000 ❌ FAIL                                          │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               RETURN ERROR RESPONSE (400 BAD REQUEST)                       │
│                                                                              │
│     {                                                                        │
│       "success": false,                                                     │
│       "error": "Amount exceeds tier limit: 100,000 UGX",                   │
│       "currentTier": "FREE",                                               │
│       "suggestedTier": "STARTER",                                          │
│       "suggestedUpgradeUrl": "/billing/upgrade?tier=STARTER"              │
│     }                                                                        │
│                                                                              │
│  ✅ User informed of:                                                       │
│     1. What went wrong (amount too high)                                    │
│     2. Current tier & limit                                                │
│     3. Suggested next tier (STARTER = 500K limit)                         │
│     4. Upgrade link                                                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Quota Enforcement Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MONTH 1 (January 2025)                                  │
│                    FREE TIER: 5 PAYMENTS/MONTH                              │
│                                                                              │
│  Week 1:  Payment 1 ✅  (4 remaining)                                      │
│  Week 2:  Payment 2 ✅  (3 remaining)                                      │
│  Week 3:  Payment 3 ✅  (2 remaining)                                      │
│  Week 3:  Payment 4 ✅  (1 remaining) ⚠️ WARNING!                         │
│  Week 4:  Payment 5 ✅  (0 remaining) 🔒 QUOTA FULL                       │
│           Payment 6 ❌  ERROR: "Monthly limit reached: 5"                   │
│                                                                              │
│  User Decision Point:                                                        │
│  ┌──────────────────────────────────────┐                                  │
│  │ Option 1: Wait until Feb 1 for reset │                                  │
│  │ Option 2: Upgrade to STARTER ($5)    │  ← Better! More features        │
│  │           Instantly get 50/month     │     AND lower fees (3% vs 5%)   │
│  └──────────────────────────────────────┘                                  │
│                                                                              │
│  User Upgrades to STARTER ✅                                              │
│  (Fee on payment 5 was 5%, but would be 3% with STARTER = save per payment) │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                      MONTH 2 (February 2025)                                 │
│                    BOTH TIERS AUTO-RESET @ MIDNIGHT JAN 31                 │
│                                                                              │
│  OLD (FREE):      cash_payments_count = 5  → RESET TO 0 ✅                │
│  NEW (STARTER):   cash_payments_count = 0  (not used yet this month) ✅  │
│                                                                              │
│  User can now record 50 new cash payments in Feb ✅                       │
│  Fees will be 3% (not 5%) for all new payments ✅                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Tier Comparison Diagram (Same 100K Payment)

```
                  SAME PAYMENT: 100,000 UGX
        (See how fee changes based on tier)

┌────────────────────────────────────────────────────────────────┐
│ TIER     │ Fee %  │ Fee Amount  │ Net Amount  │ Monthly Limit │
├────────────────────────────────────────────────────────────────┤
│ FREE     │ 5%     │ 5,000       │ 95,000      │ 5/month       │  ← Most expensive
│          │        │             │             │               │     Most limited
│          │        │             │             │               │
│ STARTER  │ 3%     │ 3,000       │ 97,000      │ 50/month      │  ← 40% fee savings
│ ($5/mo)  │        │ SAVE 2,000  │ GAIN 2,000  │ 10x more      │    10x quota
│          │        │             │             │               │
│ PRO      │ 1.5%   │ 1,500       │ 98,500      │ 200/month     │  ← 70% fee savings
│ ($20/mo) │        │ SAVE 3,500  │ GAIN 3,500  │ 40x more      │    40x quota
│          │        │             │             │               │
│ENTERPRISE│ 0.5%   │ 500         │ 99,500      │ ∞             │  ← 90% fee savings
│($100/mo) │        │ SAVE 4,500  │ GAIN 4,500  │ No limits     │    Unlimited
│          │        │             │             │               │
└────────────────────────────────────────────────────────────────┘

💡 KEY INSIGHT:
   At just 50 payments/month @ 100K each:
   - FREE tier cost: 250K UGX in fees (impossible - only 5 payments allowed)
   - STARTER tier cost: 150K UGX in fees + $5 = ~156.8K UGX
   - ENTERPRISE cost: 25K UGX in fees + $100 = ~128.8K UGX
   
   Breakeven: STARTER pays for itself vs FREE at 3 payments!
            (2K savings/payment × 3 = 6K > $5 subscription)
```

---

## Database Schema Diagram

```
┌─────────────────────────────────────┐
│         users table                 │
├─────────────────────────────────────┤
│ id INT (PK)                         │
│ email                               │
│ name                                │
│ subscription_tier VARCHAR(20)       │  ← FREE, STARTER, PRO, ENTERPRISE
│ created_at TIMESTAMP                │
└──────────┬──────────────────────────┘
           │
           │ creator_id
           │
           ▼
┌────────────────────────────────────────┐
│    cash_processing_fees table          │
├────────────────────────────────────────┤
│ id INT (PK)                            │
│ cash_deposit_id INT (FK) ───┐         │
│ creator_id INT (FK) ────────┤──→ users│
│ original_amount DECIMAL(15,2)│        │
│ fee_percentage DECIMAL(5,2) │        │
│ fee_amount DECIMAL(15,2)    │        │
│ net_amount DECIMAL(15,2)    │        │
│ created_at TIMESTAMP        │        │
└────────────────────────────────────────┘
           │
           │ Links to
           ▼
┌───────────────────────────────┐
│  cash_deposits table          │
├───────────────────────────────┤
│ id INT (PK)                   │
│ pledge_id INT (FK)            │
│ collected_amount DECIMAL      │
│ creator_id INT (FK)           │
│ created_at TIMESTAMP          │
└───────────────────────────────┘

┌─────────────────────────────────────────┐
│    usage_stats table                    │
├─────────────────────────────────────────┤
│ id INT (PK)                             │
│ user_id INT (FK)  ──────────────→ users │
│ month DATE                              │
│ cash_payments_count INT ← NEW COLUMN    │ Resets 1st of month
│ pledges_count INT                       │
│ campaigns_count INT                     │
│ sms_count INT                           │
│ emails_count INT                        │
│ ai_requests_count INT                   │
│ created_at TIMESTAMP                    │
└─────────────────────────────────────────┘

┌──────────────────────────────────────┐
│   cash_fee_analytics VIEW (Analytics)│
├──────────────────────────────────────┤
│ creator_id                           │
│ creator_name                         │
│ subscription_tier                    │
│ total_cash_payments COUNT            │
│ total_collected SUM                  │
│ total_fees_collected SUM             │
│ total_net_amount SUM                 │
│ avg_fee_percentage AVG               │
│ month YEAR-MONTH                     │
└──────────────────────────────────────┘
```

---

## Configuration Points (monetization.js)

```
PRICING_TIERS
│
├─ FREE
│  ├─ limits
│  │  ├─ cashPaymentFeePercentage: 5.0          ← Adjust here
│  │  ├─ cashPaymentsPerMonth: 5                ← Adjust here
│  │  └─ cashPaymentMaxAmount: 100000           ← Adjust here
│  └─ price: 0
│
├─ STARTER
│  ├─ limits
│  │  ├─ cashPaymentFeePercentage: 3.0
│  │  ├─ cashPaymentsPerMonth: 50
│  │  └─ cashPaymentMaxAmount: 500000
│  └─ price: 5
│
├─ PRO
│  ├─ limits
│  │  ├─ cashPaymentFeePercentage: 1.5
│  │  ├─ cashPaymentsPerMonth: 200
│  │  └─ cashPaymentMaxAmount: 2000000
│  └─ price: 20
│
└─ ENTERPRISE
   ├─ limits
   │  ├─ cashPaymentFeePercentage: 0.5
   │  ├─ cashPaymentsPerMonth: -1 (unlimited)
   │  └─ cashPaymentMaxAmount: -1 (unlimited)
   └─ price: 100
```

---

## User Journey Diagram

```
NEW USER (No history)
│
├─ Registers account
│
├─ Assigned tier: FREE
│  ├─ Cash fee: 5%
│  ├─ Quota: 5/month
│  └─ Limit: 100K/transaction
│
├─ Records cash payment 1 ✅ (4 left)
│  ├─ Amount: 100K
│  ├─ Fee: 5K (5%)
│  └─ Net: 95K
│
├─ Records 4 more payments ✅ (0 left)
│
├─ Attempts payment 6 ❌ BLOCKED
│  └─ Message: "Monthly limit reached: 5 cash payments"
│     "Upgrade to STARTER for 50 payments/month"
│
├─ DECISION POINT:
│  │
│  ├─ Option A: Wait until next month
│  │
│  └─ Option B: Upgrade to STARTER ← BETTER!
│     ├─ Pay: $5/month
│     ├─ Get: 50 payments/month (10x more!)
│     ├─ Fee: 3% (save 2K per 100K payment)
│     └─ Plus: All other STARTER features
│
├─ UPGRADES TO STARTER ✅
│  ├─ Immediately recorded in database
│  └─ Next payment uses 3% fee (not 5%)
│
├─ Uses 25 payments in month 2
│  ├─ Planning to do 30+ more
│  └─ Realizes PRO tier would be better
│
├─ UPGRADES TO PRO ✅
│  ├─ Pay: $20/month
│  ├─ Fee: 1.5% (save 3.5K per 100K)
│  ├─ Quota: 200 payments/month
│  └─ Unlimited amount per transaction
│
└─ Happy power user! 🎉
   Uses all 200 payments, saves 700K/month in fees
   Considers ENTERPRISE for analytics features
```

---

## Revenue Model Diagram

```
PLATFORM REVENUE STREAMS (Post-Monetization)

┌──────────────────────────────────────────────────────────┐
│              MONTHLY SUBSCRIPTION REVENUE                 │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  FREE Users:        $0                                   │
│  STARTER Users:     $5/user × Users                      │
│  PRO Users:         $20/user × Users                     │
│  ENTERPRISE Users:  $100/user × Users                    │
│                                                            │
│  Example: 1000 users                                     │
│  - 600 FREE = $0                                         │
│  - 300 STARTER = $1,500                                  │
│  - 80 PRO = $1,600                                       │
│  - 20 ENTERPRISE = $2,000                                │
│  ───────────────────────────────────────────────         │
│  TOTAL: $5,100/month                                     │
│                                                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              TRANSACTION FEE REVENUE                      │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  From: Cash payment processing fees                      │
│  Breakdown by tier:                                       │
│                                                            │
│  FREE Tier (600 users):                                  │
│  - 5 payments/month × 5% fee = 2.5 fees/month avg      │
│  - Avg payment: 50K UGX                                  │
│  - Fee per: 2.5K UGX                                     │
│  - Total: 600 × 2.5 × 2.5K = 3,750,000 UGX/month       │
│                                                            │
│  STARTER Tier (300 users):                               │
│  - 25 payments/month avg × 3% fee = 750 fees/month     │
│  - Avg payment: 100K UGX                                 │
│  - Fee per: 3K UGX                                       │
│  - Total: 300 × 25 × 3K = 22,500,000 UGX/month         │
│                                                            │
│  PRO Tier (80 users):                                    │
│  - 100 payments/month avg × 1.5% = 150 fees/month      │
│  - Avg payment: 200K UGX                                 │
│  - Fee per: 3K UGX                                       │
│  - Total: 80 × 100 × 3K = 24,000,000 UGX/month         │
│                                                            │
│  ENTERPRISE Tier (20 users):                             │
│  - 200 payments/month avg × 0.5% = 100 fees/month      │
│  - Avg payment: 500K UGX                                 │
│  - Fee per: 2.5K UGX                                     │
│  - Total: 20 × 200 × 2.5K = 10,000,000 UGX/month       │
│                                                            │
│  ───────────────────────────────────────────────────     │
│  TOTAL FEES: ~60,250,000 UGX/month (~$16,736)           │
│                                                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                TOTAL PLATFORM REVENUE                     │
├──────────────────────────────────────────────────────────┤
│                                                            │
│  Subscriptions:    $5,100/month (~18,360,000 UGX)       │
│  Transaction Fees: ~60,250,000 UGX/month                │
│  ─────────────────────────────────────────────────       │
│  TOTAL:            ~78,610,000 UGX/month (~$21,836)    │
│                                                            │
│  🎯 Growth Potential:                                    │
│  - 10% of FREE users → STARTER = +1,500k UGX subs       │
│  - Attracts 50 new ENTERPRISE = +5,000/month revenue    │
│  - Total expansion potential: +3,600,000 UGX/month      │
│                                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Feature Implementation Checklist

```
✅ COMPLETED FEATURES
├─ Fee calculation (5% → 0.5% per tier)
├─ Amount limits enforcement (100K → unlimited)
├─ Monthly quota enforcement (5 → unlimited)
├─ Database fee storage (cash_processing_fees table)
├─ Usage tracking (usage_stats.cash_payments_count)
├─ Error messages with upgrade suggestions
├─ API response includes processingFee & netAmount
├─ Analytics view (cash_fee_analytics)
└─ Full documentation (3 guides + this diagram)

⏳ READY FOR DEPLOYMENT
├─ Database migration script
├─ Backend code changes
├─ Configuration options
└─ Testing scenarios

📋 OPTIONAL FUTURE ENHANCEMENTS
├─ UI fee display in dashboard
├─ Admin fee revenue analytics
├─ Automatic upgrade prompts
├─ Volume discounts
├─ Refund fee logic
└─ Custom per-organization fees
```

---

**Last Updated**: January 2025
**System Status**: ✅ Production Ready
**Deployment Status**: Ready for migration + launch
