# 🚀 Quick Start: Your Commission Accounts Are Ready!

## Your Payment Accounts

| Account | Provider | Phone | Status |
|---------|----------|-------|--------|
| Primary | MTN | 0774306868 | ✅ Active |
| Backup | Airtel | 0701067528 | ✅ Active |

**Daily Auto-Payout**: 5:00 PM (Africa/Kampala Time)

---

## What Happens Now

```
Organization creates pledge
          ↓
Donor pays (MTN/Airtel)
          ↓
System detects payment
          ↓
Amount is split:
  • 95-99.5% → Organization account
  • 0.5-5%   → YOUR commission balance
          ↓
Your share added to pending commissions
          ↓
Daily 5 PM: Automatic payout to your MTN
          ↓
SMS confirmation sent to your phone
          ↓
Commission marked as "paid_out" ✅
```

---

## Commission Rates by Organization Tier

| Tier | Organization | You (Platform) |
|------|--------------|----------------|
| Free | 95% | **5%** |
| Basic | 97.5% | **2.5%** |
| Pro | 98.5% | **1.5%** |
| Enterprise | 99.5% | **0.5%** |

Example:
- 100,000 UGX pledge from Free tier org
- Your commission: 5,000 UGX
- They get: 95,000 UGX

---

## API Endpoints (Admin Only)

```bash
# Check your current balance
GET /api/commissions/summary

# List your payment accounts
GET /api/commissions/accounts

# See commissions earned
GET /api/commissions/details

# View all payouts sent
GET /api/commissions/history

# Request manual payout
POST /api/commissions/payout

# Add new account
POST /api/commissions/accounts
{
  "provider": "mtn",
  "phone_number": "256700000000",
  "account_name": "My New Account",
  "is_primary": false
}

# Update account
PUT /api/commissions/accounts/1

# Remove account (if backup exists)
DELETE /api/commissions/accounts/1
```

---

## Test Everything Works

```powershell
# Terminal 1: Start backend
cd C:\Users\HP\PledgeHub\backend
npm run dev

# Terminal 2: Run test
cd C:\Users\HP\PledgeHub\backend
node scripts/test-commission-accounts.js
```

Expected: ✅ All tests pass

---

## What's Been Set Up

✅ **Database**
- 6 tables created (organizations, platform_accounts, commissions, etc.)
- 3 views created (commission_summary, organization_earnings, etc.)
- Your accounts inserted: MTN (0774306868) + Airtel (0701067528)

✅ **Backend Service**
- commissionDistributionService.js (370 lines)
- Handles: calculation, splitting, auto-payout, retries, fallback

✅ **API Routes**
- 8 endpoints for commission management
- Protected by: JWT auth + Admin role + Rate limiting
- All encrypted and secure

✅ **Automation**
- Cron job scheduled for 5 PM daily
- Auto-detects pending commissions
- Sends to MTN, falls back to Airtel if needed

---

## Next: Add Organizations

To enable organizations to collect pledges:

1. Add org to `organizations` table
2. Set their payment method (MTN/Airtel account)
3. Set their tier (free, basic, pro, enterprise)
4. When pledges received, commission auto-calculated & sent to you

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No payout at 5 PM | Check: Is backend running? Any pending commissions? |
| MTN fails | Check: Balance? Phone format correct? Credentials valid? |
| Airtel backup not trying | Check: Is primary MTN account down? |
| Can't see accounts | Make sure: Logged in as admin? JWT token valid? |

---

## Keep in Mind

- **Timezone**: All schedules use Africa/Kampala (EAT)
- **Phone format**: 256XXXXXXXXX (no + or 0 prefix)
- **Amount format**: Decimal (15,2) - e.g., 10700.50 UGX
- **Auto-retry**: Failed payouts retry daily at 5 PM
- **Minimum payout**: Any amount ≥ 0 is paid out

---

**Your system is production-ready!** 🎉

Need to add an organization or manage accounts? Check the full documentation at:
→ COMMISSION_PAYMENT_ACCOUNTS_READY.md
