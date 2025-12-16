# 💰 Commission System - Quick Reference

**One-page guide to manage your commission auto-payments.**

---

## 📋 Setup Checklist (First Time Only)

```
☐ Step 1: Run migration
  node backend/scripts/migration-multi-org-commission.js

☐ Step 2: Add your MTN account
  POST /api/commissions/accounts
  { phone_number: "256700123456", is_primary: true, ... }

☐ Step 3: Add your Airtel account (optional)
  POST /api/commissions/accounts
  { phone_number: "256750654321", is_primary: false, ... }

☐ Step 4: Register routes in server.js
  app.use('/api/commissions', authenticateToken, requireAdmin, commissionRoutes);

☐ Step 5: Add cron job for daily payout (optional)
  In cronScheduler.js add: processDailyCommissionBatch() at 5 PM

☐ Step 6: Restart backend
  npm run dev
```

---

## 💸 How Money Flows

```
Donor sends: 100,000 UGX
             ↓
Platform receives: 100,000 UGX
             ↓
System calculates commission based on Org tier:
  - Free (5%): You get 5,000 UGX, Org gets 95,000 UGX
  - Basic (2.5%): You get 2,500 UGX, Org gets 97,500 UGX
  - Pro (1.5%): You get 1,500 UGX, Org gets 98,500 UGX
  - Enterprise (0.5%): You get 500 UGX, Org gets 99,500 UGX
             ↓
Commission accrued: 1,500 UGX (status: accrued)
             ↓
Daily at 5 PM: All commissions sent to your MTN/Airtel
             ↓
You receive: 1,500 UGX in your mobile wallet ✅
```

---

## 📊 API Quick Reference

### Check Your Commissions
```
GET /api/commissions/summary
Returns: accrued amount, pending amount, total paid out
```

### Request Payout NOW
```
POST /api/commissions/payout
Body: { method: "mtn", timing: "immediate" }
Returns: batch ID, transaction ID, status
```

### View Commission History
```
GET /api/commissions/history?limit=50&status=successful
Returns: list of all your payouts
```

### View Individual Commissions
```
GET /api/commissions/details?status=accrued
Returns: list of each commission from each pledge
```

### Manage Your Payment Accounts
```
GET    /api/commissions/accounts              (view all)
POST   /api/commissions/accounts              (add new)
PUT    /api/commissions/accounts/:id          (update)
DELETE /api/commissions/accounts/:id          (delete)
```

---

## 🚀 Common Tasks

### I want to see how much commission I have

```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/summary" `
    -Headers @{ 'Authorization' = "Bearer $token" } | 
    ForEach-Object { Write-Host "Accrued: $($_.data.accrued.amount) UGX" }
```

### I want to get paid RIGHT NOW

```powershell
$payout = @{ method = "mtn"; timing = "immediate" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/payout" `
    -Method POST `
    -Headers @{ 'Authorization' = "Bearer $token" } `
    -Body $payout
```

### I want to see where my money is going

```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/history" `
    -Headers @{ 'Authorization' = "Bearer $token" } | 
    ForEach-Object { $_.data.payouts | Format-Table -Auto }
```

### I need to change where commissions go

```powershell
# See all your accounts
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts" `
    -Headers @{ 'Authorization' = "Bearer $token" }

# Change which one is primary
$update = @{ is_primary = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts/2" `
    -Method PUT `
    -Headers @{ 'Authorization' = "Bearer $token" } `
    -Body $update
```

---

## 📈 Commission Rates by Organization Tier

| Organization Tier | Your Commission | They Get |
|-------------------|-----------------|----------|
| **Free** | 5.0% | 95.0% |
| **Basic** | 2.5% | 97.5% |
| **Pro** | 1.5% | 98.5% |
| **Enterprise** | 0.5% | 99.5% |

---

## 🗓️ Schedule

**Automatic daily payout:** 5:00 PM (Africa/Kampala time)

**Or request manually anytime:** Use POST /commissions/payout

**Timing modes:**
- `immediate` = Send right now
- `batch` = Accumulate and send at next scheduled time

---

## 📱 Phone Number Format

Commissions are sent to your MTN/Airtel account:

```
Uganda numbers: 256XXXXXXXXX
Examples:
  MTN:   256700123456
  Airtel: 256750654321
```

---

## ✅ Status Meanings

**Commission Statuses:**
- `accrued` = Ready to pay out
- `pending_payout` = Being processed
- `paid_out` = Successfully sent to you
- `failed` = Payout failed (will retry)

**Payout Statuses:**
- `pending` = Waiting to be sent
- `processing` = Mobile network is processing
- `successful` = Money in your wallet ✅
- `failed` = Something went wrong

---

## 🔧 Configuration

### Your Platform Accounts Table

```sql
SELECT * FROM platform_accounts;

-- Example output:
id | account_type | phone_number | is_primary
1  | mtn          | 256700123456 | 1
2  | airtel       | 256750654321 | 0
```

### Payment Splits Table (What organizations pay)

```sql
SELECT * FROM payment_splits;

-- Example:
id | payment_amount | commission_amount | organization_payout
1  | 100000         | 1500              | 98500
```

### Commissions Table (Your income)

```sql
SELECT * FROM commissions;

-- Example:
id | amount | status     | paid_out_at
1  | 1500   | paid_out   | 2024-12-16 17:05:00
2  | 2500   | accrued    | NULL
```

---

## ⚠️ Common Issues & Fixes

**Q: "No primary account configured"**  
A: Add account with `is_primary: true`

**Q: "No commissions to distribute"**  
A: Need pledges fulfilled first

**Q: Commission amount wrong**  
A: Check organization tier (affects rate)

**Q: Payout not happening**  
A: Make sure cron job is running (check logs at 5 PM)

**Q: Want to change commission rates?**  
A: Modify organization tier (Free=5%, Basic=2.5%, Pro=1.5%, Enterprise=0.5%)

---

## 📊 Database Views (For Reporting)

```sql
-- View all commissions (for you)
SELECT * FROM commission_summary;

-- View organization earnings
SELECT * FROM organization_earnings;

-- View commission summary
SELECT * FROM my_commission_summary;
```

---

## 🎯 Next Steps

1. ✅ Setup completed
2. ⏳ Organizations start collecting pledges
3. 🤖 Commissions accrue automatically
4. 💳 Get paid daily via mobile money
5. 📈 Scale to more organizations
6. 💰 Increase your revenue

---

## 💡 Pro Tips

- **Monitor daily:** Check `/commissions/summary` each morning
- **Batch vs immediate:** Immediate for urgent, batch for scheduled
- **Fallback method:** Keep both MTN and Airtel accounts active
- **Tier strategy:** Higher tiers = lower commission = more attractive to orgs
- **Track trends:** Use `/commissions/history` to see pattern
- **Accounting:** Export commission data for your accountant

---

## 🆘 Need Help?

| Issue | Check |
|-------|-------|
| Can't request payout | Do you have a primary account? GET /accounts |
| Payout failed | Is the phone number correct? Try other method |
| Commission not accruing | Is pledge assigned to organization? |
| Don't see new commissions | Did pledge status change to fulfilled? |
| Cron job not running | Check server logs at 5 PM |

---

## 📞 Key Endpoints

```
GET    /api/commissions/summary            ← Check balance
POST   /api/commissions/payout             ← Request payout
GET    /api/commissions/history            ← View payouts
GET    /api/commissions/details            ← See each commission
GET    /api/commissions/accounts           ← Your payment accounts
POST   /api/commissions/accounts           ← Add account
PUT    /api/commissions/accounts/:id       ← Update account
DELETE /api/commissions/accounts/:id       ← Remove account
```

---

**Version:** 1.0  
**Last Updated:** December 16, 2024  
**Status:** Ready for Production  

🎉 **You're all set! Commission auto-payments are ready to go!**
