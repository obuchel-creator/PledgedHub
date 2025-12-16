# 💰 Commission Auto-Payment System Setup

**Status:** Ready to Deploy  
**Setup Time:** 10 minutes  
**Complexity:** Easy

---

## 📋 What This Does

When organizations collect pledges on your platform:

1. **Donor sends 100,000 UGX** to organization
2. **Platform receives 100,000 UGX**
3. **System automatically splits:**
   - Organization gets: 98,500 UGX (98.5% - if Pro tier with 1.5% commission)
   - **You get: 1,500 UGX commission** → Sent to your MTN/Airtel account
4. **Organization withdraws later**
5. **You get paid daily** (or immediately if you choose)

---

## 🚀 Setup in 4 Steps

### STEP 1: Run Database Migration
```powershell
# Navigate to backend
cd backend

# Run migration
node scripts/migration-multi-org-commission.js

# Expected output:
# ✨ Migration completed successfully!
# 📊 Tables created:
#    ✅ organizations
#    ✅ organization_accounts
#    ✅ payment_splits
#    ✅ commissions
#    ✅ commission_payouts
#    ✅ platform_accounts
```

### STEP 2: Configure Your Payment Accounts

Add your MTN and Airtel accounts where you'll receive commissions:

```powershell
# HTTP POST to setup your accounts
$headers = @{
    'Authorization' = 'Bearer YOUR_JWT_TOKEN'
    'Content-Type' = 'application/json'
}

# Add MTN account
$mtnAccount = @{
    account_type = "mtn"
    phone_number = "256774306868"          # Your MTN number
    account_holder_name = "Zigocut Technologies Ltd"
    account_label = "PledgeHub Commission - MTN"
    is_primary = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts" `
    -Method POST `
    -Headers $headers `
    -Body $mtnAccount

# Add Airtel account
$airtelAccount = @{
    account_type = "airtel"
    phone_number = "256701067528"          # Your Airtel number
    account_holder_name = "Zigocut Technologies Ltd"
    account_label = "PledgeHub Commission - Airtel"
    is_primary = $false
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts" `
    -Method POST `
    -Headers $headers `
    -Body $airtelAccount
```

### STEP 3: Register Commission Routes

Edit **backend/server.js** and add this after other routes:

```javascript
// Add this line with other route imports (near the top)
const commissionRoutes = require('./routes/commissionRoutes');

// Add this line with other route registrations (before app.listen)
app.use('/api/commissions', authenticateToken, requireAdmin, commissionRoutes);
```

### STEP 4: Restart Backend

```powershell
# Stop current server (Ctrl+C)
# Then restart
npm run dev

# Verify commission routes are loaded
# Check console for: "✓ Server running..."
```

---

## 📊 Commission Rates by Organization Tier

Your commission is automatically calculated based on each organization's tier:

| Tier | Commission Rate | Organization Gets |
|------|-----------------|-------------------|
| **Free** | 5.0% | 95.0% |
| **Basic** | 2.5% | 97.5% |
| **Pro** | 1.5% | 98.5% |
| **Enterprise** | 0.5% | 99.5% |

**Example:**
- Organization is "Pro" tier
- Pledge payment: 100,000 UGX
- Commission (1.5%): 1,500 UGX → **Sent to you**
- Organization gets: 98,500 UGX → **Sent to organization**

---

## 💻 API Endpoints

### 1. Check Your Commission Balance

```powershell
# Get commission summary
$headers = @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' }

Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/summary" `
    -Headers $headers | ConvertTo-Json

# Returns:
# {
#   "success": true,
#   "data": {
#     "accrued": {
#       "amount": 15000,        # Ready to pay out
#       "count": 10             # Number of commissions
#     },
#     "pending": {
#       "amount": 5000,         # Being processed
#       "count": 2
#     },
#     "paidOut": {
#       "total": 50000,         # Already paid to you
#       "days": 5
#     }
#   }
# }
```

### 2. Request Commission Payout

```powershell
# Send commission to your MTN account
$payoutRequest = @{
    method = "mtn"                 # or "airtel"
    timing = "immediate"           # or "batch"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/payout" `
    -Method POST `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } `
    -ContentType "application/json" `
    -Body $payoutRequest

# Returns:
# {
#   "success": true,
#   "message": "Commission payout initiated",
#   "data": {
#     "batchId": "COMM-1702800000000-abc123def",
#     "method": "mtn",
#     "amount": 15000,
#     "commissionCount": 10,
#     "status": "processing",
#     "transactionId": "COMM-..."
#   }
# }
```

### 3. View Commission History

```powershell
# Get all your commission payouts
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/history?limit=50" `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } | 
    ConvertTo-Json

# Returns history of all your commission payouts
```

### 4. View Individual Commissions

```powershell
# See all accrued commissions
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/details?status=accrued" `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } | 
    ConvertTo-Json

# Shows each commission from each organization
```

### 5. Manage Your Payment Accounts

```powershell
# Get your configured accounts
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts" `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } | 
    ConvertTo-Json

# Update account
$update = @{ is_primary = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts/1" `
    -Method PUT `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } `
    -Body $update

# Delete account
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/accounts/2" `
    -Method DELETE `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' }
```

---

## ⏱️ Automatic Daily Payout

Add this to **backend/services/cronScheduler.js** to automatically send commissions daily at 5PM:

```javascript
// Around line 50, add this job
const commissionJob = cron.schedule('0 17 * * *', async () => {
  console.log('💰 Triggered: Daily Commission Payout (5:00 PM)');
  const result = await commissionDistributionService.processDailyCommissionBatch();
  if (result.success) {
    console.log('✅ Commission batch processed successfully');
  } else {
    console.log('⚠️  Commission batch failed:', result.error);
  }
}, {
  scheduled: false,
  timezone: "Africa/Kampala"
});

jobs.push({
  name: 'Daily Commission Payout',
  schedule: '5:00 PM daily',
  job: commissionJob
});
```

Then add to your imports:
```javascript
const commissionDistributionService = require('./commissionDistributionService');
```

---

## 🔄 Payment Flow (Detailed)

```
Step 1: Donor Makes Pledge
├─ Amount: 100,000 UGX
├─ Organization: Red Cross (Pro tier)
└─ Status: Pledge created

Step 2: Pledge Fulfilled / Payment Received
├─ Platform receives: 100,000 UGX
├─ Commission calculated: 100,000 × 1.5% = 1,500 UGX
├─ Organization gets: 100,000 - 1,500 = 98,500 UGX
└─ Status: Payment split recorded

Step 3: Commission Record Created
├─ Amount: 1,500 UGX
├─ Status: 'accrued' (ready to pay out)
├─ Organization: Red Cross
└─ Pledge: The specific pledge

Step 4: Commission Accumulated
├─ More pledges received...
├─ More commissions accrued...
└─ Total available: 15,000 UGX

Step 5: Daily Payout (5 PM)
├─ All accrued commissions batched
├─ Total: 15,000 UGX
├─ Sent to: Your MTN 256700123456
├─ Status: Processing
└─ Batch ID: COMM-1702800000000-abc123def

Step 6: Mobile Money Network Processing
├─ MTN receives request
├─ Customer (you) receives USSD prompt
├─ You enter PIN
└─ Transfer completes

Step 7: Payment Webhook Callback
├─ MTN confirms: "SUCCESSFUL"
├─ Status updated to: 'paid_out'
├─ Completed at: timestamp
└─ Transaction ID: recorded

Step 8: Commission Confirmed
├─ Status: 'paid_out'
├─ Amount received: 15,000 UGX in your MTN wallet
└─ Ready for next cycle
```

---

## 💡 Key Features

✅ **Automatic Calculation** - No manual math needed  
✅ **Immediate Split** - Payment is split right away  
✅ **Tiered Commission** - Different rates per org tier  
✅ **Auto Payout** - Daily automatic payment to you  
✅ **Multiple Payment Methods** - MTN and Airtel support  
✅ **Failover Support** - Falls back to Airtel if MTN fails  
✅ **Full History** - Track all commissions and payouts  
✅ **Audit Trail** - Everything logged in database  

---

## 🧪 Testing

### Test the System End-to-End

1. **Create test organization** in database:
```sql
INSERT INTO organizations (name, email, tier, is_active, is_verified)
VALUES ('Test Org', 'test@org.local', 'pro', 1, 1);
```

2. **Create test pledge**:
```sql
INSERT INTO pledges (title, amount, organization_id, status)
VALUES ('Test Pledge', 100000, 1, 'fulfilled');
```

3. **Trigger payment split**:
```powershell
# Call payment processing that includes commission splitting
# The service will automatically:
# - Calculate 1.5% commission (1,500 UGX)
# - Create payment_split record
# - Create commission record
# - Ready to payout
```

4. **Manually trigger payout**:
```powershell
$payout = @{ method = "mtn"; timing = "immediate" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/payout" `
    -Method POST `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } `
    -Body $payout
```

5. **Check status**:
```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/summary" `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } | ConvertTo-Json
```

---

## ⚠️ Important Notes

1. **Primary Account Required** - You must set a primary MTN or Airtel account before requesting payouts
2. **Commission Rates** - Change organization tier to adjust their commission rate
3. **Minimum Amount** - No minimum payout amount (even 100 UGX will be sent)
4. **Scheduling** - Daily payout at 5 PM Africa/Kampala time
5. **Fallback** - If MTN unavailable, system tries Airtel automatically
6. **Encryption** - Bank account numbers encrypted at rest (if you add bank accounts)

---

## 🎯 Next Steps

1. ✅ Run migration
2. ✅ Add your payment accounts
3. ✅ Register routes in server.js
4. ✅ Restart backend
5. ✅ Test with HTTP requests
6. ✅ Add cron job for automatic daily payouts
7. ✅ Create UI dashboard for viewing commissions

---

## 📞 Troubleshooting

**Q: No commissions showing?**  
A: Make sure pledges are assigned to organizations and have been fulfilled.

**Q: Payout request fails?**  
A: Check you have a primary payment account set. Use GET /commissions/accounts

**Q: "Account not configured" error?**  
A: Add your MTN/Airtel account first using POST /commissions/accounts

**Q: Cron job not running?**  
A: Make sure you added it to cronScheduler.js and restarted the server.

---

## 📊 Database Tables

The migration creates:
- `organizations` - Organizations collecting pledges
- `organization_accounts` - Their MTN/Airtel for receiving payouts
- `payment_splits` - Split of each payment (org vs commission)
- `commissions` - Your commission income
- `commission_payouts` - Your payout history
- `platform_accounts` - Your MTN/Airtel accounts

---

## 🎊 You're Ready!

Everything is set up to automatically pay you commissions when organizations collect pledges.

**Next:** Create your first organization and test with a pledge!
