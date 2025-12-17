# 🧮 Fee Calculation Reference Card

## Quick Math Examples

### Example 1: 500,000 UGX via Airtel to EXIM Bank

```
Step 1: Donor Amount
├─ 500,000 UGX

Step 2: Mobile Money Fee (Airtel: 2%)
├─ 500,000 × 2% = 10,000 UGX
├─ Subtotal = 490,000 UGX

Step 3: Bank Deposit Fee (EXIM: 1%)
├─ 490,000 × 1% = 4,900 UGX
├─ Subtotal = 485,100 UGX

Step 4: Platform Commission (Default: 10%)
├─ 485,100 × 10% = 48,510 UGX (YOUR PROFIT)
├─ Creator Gets = 436,590 UGX

FINAL BREAKDOWN:
├─ Donor sent: 500,000
├─ Airtel fee: -10,000 (2%)
├─ Bank fee: -4,900 (1%)
├─ Your commission: -48,510 (10%)
├─ Creator receives: 436,590 (87.3%)
└─ Total deductions: 63,410 (12.7%)
```

---

## All Bank Comparisons (500K UGX via Airtel)

| Bank | Deposit Fee | Creator Gets | Difference |
|------|------------|--------------|-----------|
| 🥇 **Centenary** | 0.5% | 439,680 | +3,090 |
| 🥈 **EXIM** | 1.0% | 436,590 | baseline |
| 🥉 **Equity** | 0.75% | 437,985 | +1,395 |
| **Stanbic** | 0.75% | 437,985 | +1,395 |
| **ABSA** | 1.0% | 436,590 | baseline |
| **Barclays** | 1.0% | 436,590 | baseline |

**Recommendation:** Use **Centenary** to maximize creator earnings

---

## Fee Calculator API

### Request
```json
POST /api/bank-settings/calculate-fees

{
  "donorAmount": 500000,
  "paymentMethod": "airtel",
  "bankCode": "EXIM",
  "platformCommissionPercent": 10
}
```

### Response
```json
{
  "success": true,
  "calculation": {
    "donor_amount": 500000,
    "payment_method": "airtel",
    "mobile_money_fee_percent": 2,
    "mobile_money_fee_amount": 10000,
    "subtotal_after_mobile": 490000,
    "bank_code": "EXIM",
    "bank_deposit_fee_percent": 1,
    "bank_deposit_fee_amount": 4900,
    "subtotal_after_bank": 485100,
    "platform_commission_percent": 10,
    "platform_commission_amount": 48510,
    "creator_net_payout": 436590,
    "total_fees": 63410,
    "creator_percentage": 87.32
  }
}
```

---

## Commission Percentage Impact

### For 500,000 UGX (Airtel → EXIM)

| Commission % | Your Profit | Creator Gets | Total Deductions |
|-------------|-----------|--------------|-----------------|
| 5% | 24,255 | 460,845 | 39,155 (7.8%) |
| 10% | 48,510 | 436,590 | 63,410 (12.7%) |
| 15% | 72,765 | 412,335 | 87,665 (17.5%) |
| 20% | 97,020 | 388,080 | 111,920 (22.4%) |

---

## Mobile Money Provider Fees

| Provider | Fee % | Example on 500K |
|----------|-------|-----------------|
| **Airtel** | 2% | -10,000 |
| **MTN** | 3% | -15,000 |

---

## Monthly Account Fees (Additional)

Deducted from creator's bank account separately:

| Bank | Monthly Fee |
|------|------------|
| EXIM | 5,000 |
| Centenary | 5,000 |
| Equity | 7,500 |
| Stanbic | 10,000 |
| ABSA | 7,500 |
| Barclays | 15,000 |

> **Note:** These come out of account separately, not from individual transactions

---

## Creator Payment Schedule

### When Payout Happens
- **Monthly**: 1st of month at 6:00 AM (automatic)
- **Manual**: Admin can create anytime via dashboard

### What Creates a Payout
1. Creator has received pledges
2. Pledges are marked as collected/paid
3. Monthly calculation runs
4. If total > 0, payout batch created
5. Admin reviews & transfers money
6. Admin marks as complete in system

### Creator Visibility
- Real-time earnings in `/dashboard/earnings`
- Pending payouts list with estimated date
- Historical payouts with bank reference
- Detailed breakdown of each payout

---

## Tax & Compliance Records

### Automatic Record-Keeping

**payment_fees table tracks:**
- Donor name & phone
- Pledge ID
- Payment method (Airtel/MTN)
- Donor amount
- Mobile money fee
- Bank deposit fee
- Platform commission amount
- Creator net payout
- Bank used
- Payment date & reference

### For URA Reporting
Export by month:
```sql
SELECT 
  pf.donor_amount,
  pf.mobile_money_fee_amount,
  pf.bank_deposit_fee_amount,
  pf.platform_commission_amount,
  pf.creator_net_payout,
  u.name as creator,
  u.tax_id
FROM payment_fees pf
JOIN pledges p ON pf.pledge_id = p.id
JOIN users u ON p.creator_id = u.id
WHERE MONTH(pf.created_at) = 12 AND YEAR(pf.created_at) = 2025
```

---

## Operational Checklists

### Daily (No action needed)
- ✅ System processes pledges
- ✅ Fees calculated automatically
- ✅ Records logged

### Monthly (1st at 6 AM)
- ✅ Automatic earnings calculation
- ✅ Payout batches created
- ✅ Admin notified

### Admin Review (1st-5th of month)
- [ ] Check pending payouts
- [ ] Verify amounts in dashboard
- [ ] Initiate bank transfers
- [ ] Collect bank reference numbers
- [ ] Mark payouts complete in system

### Creator Communication
- [ ] Send payout notification
- [ ] Include amount & breakdown
- [ ] Include bank reference
- [ ] Confirm receipt

---

## Common Scenarios

### Scenario 1: Creator earns 1,000,000 UGX in Month

```
Total pledges received: 1,000,000
Airtel fees (2%): -20,000
Bank fees (1% avg): -9,800
Subtotal available: 970,200

Platform commission (10%): -97,020
Creator receives: 873,180

URA Records: 
├─ Gross income: 970,200
├─ Commission paid: 97,020
├─ Tax-deductible payout: 873,180
```

### Scenario 2: Multiple Payment Methods

```
Airtel pledges: 600,000 UGX
├─ Fee (2%): 12,000
├─ Available: 588,000

MTN pledges: 400,000 UGX
├─ Fee (3%): 12,000
├─ Available: 388,000

Total available: 976,000 UGX
(Fee difference: 1,000 more from MTN)
```

### Scenario 3: Changing Banks Mid-Month

```
Payments to Bank A: 600,000
├─ Bank A fees: 6,000
├─ Available: 594,000

Payments to Bank B: 400,000
├─ Bank B fees: 5,000
├─ Available: 395,000

Total payout: 989,000
(Each bank deducted separately)
```

---

## Configuration

### In .env

```bash
# Mobile Money Fees (FIXED - hardcoded in services)
AIRTEL_FEE_PERCENT=2
MTN_FEE_PERCENT=3

# Platform Commission (CONFIGURABLE)
PLATFORM_COMMISSION_PERCENT=10

# Bank Selection
DEFAULT_BANK_CODE=EXIM

# Payout Timing
MONTHLY_PAYOUT_DAY=1
MONTHLY_PAYOUT_HOUR=6
```

### How to Change
```bash
# Lower commission to 5% for competitive edge
PLATFORM_COMMISSION_PERCENT=5

# Switch default to Centenary for better fees
DEFAULT_BANK_CODE=CENTENARY

# Change payout timing to 15th instead of 1st
MONTHLY_PAYOUT_DAY=15
```

---

## Testing Calculations

### API Test with curl
```bash
curl -X POST http://localhost:5001/api/bank-settings/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{
    "donorAmount": 500000,
    "paymentMethod": "airtel",
    "bankCode": "EXIM",
    "platformCommissionPercent": 10
  }'
```

### Compare All Banks
```bash
curl -X POST http://localhost:5001/api/bank-settings/compare-banks \
  -H "Content-Type: application/json" \
  -d '{
    "donorAmount": 500000,
    "paymentMethod": "airtel",
    "platformCommissionPercent": 10
  }'
```

---

## Troubleshooting Fee Issues

### "Creator getting wrong amount"
1. Check payment_fees table for specific payment
2. Verify bank_code used
3. Verify platform commission % at time of payment
4. Recalculate using API

### "Monthly payout amount wrong"
1. Check creator_earnings table for month
2. Verify status = "calculated"
3. Check payment_fees for all pledges that month
4. Re-run calculation via API

### "Fee breakdown missing"
1. Verify payment_fees record exists
2. Check all fields populated
3. Query fee_breakdown JSON field
4. Contact support with pledge_id

---

## Quick Reference

**Mobile Money Fees:**
- Airtel: 2%
- MTN: 3%

**Bank Fees (Deposit):**
- Min: Centenary (0.5%)
- Max: Barclays (1%)

**Platform Commission:**
- Default: 10%
- Configurable: 5-20%

**Creator Gets:**
- Minimum: 85% (20% commission + max bank fees)
- Typical: 87-88% (10% commission + avg bank fees)
- Maximum: 93% (5% commission + min bank fees)

---

**Last Updated:** Dec 17, 2025  
**Version:** 1.0
