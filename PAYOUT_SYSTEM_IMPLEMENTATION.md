# 🎯 Payout & Commission System - Implementation Guide

**Status:** ✅ Complete Implementation  
**Date:** December 17, 2025  
**Version:** 1.0

---

## 📋 What Was Implemented

Your PledgeHub system now has a **complete payout and commission system** with:

- ✅ **Bank Fee Calculator** - Compare fees across 6 Ugandan banks
- ✅ **Commission Tracking** - Automatic 10% platform commission (customizable)
- ✅ **Payout Management** - Creator earnings dashboard + Admin payout controls
- ✅ **Monthly Automation** - Automatic earnings calculation & payout creation
- ✅ **Fee Breakdown** - Complete transparency on who gets what
- ✅ **Tax Compliance** - Detailed records for URA reporting

---

## 🚀 Quick Start (4 Steps)

### Step 1: Run Database Migration

```powershell
cd backend
node scripts/migration-payout-system.js
```

**What it does:**
- Creates 5 new tables (bank_configurations, payment_fees, payouts, payout_details, creator_earnings)
- Seeds 6 Ugandan banks with their fees
- Adds bank columns to users table

### Step 2: Update Your .env File

```bash
# Add these to backend/.env:

# CRITICAL: Set YOUR Airtel Merchant ID (not a placeholder)
AIRTEL_MERCHANT_ID=your_actual_merchant_id_here

# Platform Commission (percentage)
PLATFORM_COMMISSION_PERCENT=10

# Default Settings
DEFAULT_PAYOUT_SCHEDULE=monthly
DEFAULT_PAYOUT_METHOD=bank_transfer
DEFAULT_BANK_CODE=EXIM
MONTHLY_PAYOUT_DAY=1
```

### Step 3: Restart Backend Server

```powershell
cd backend
npm run dev
```

The new payout cron job will start automatically:
- 🕐 **1st of month at 6:00 AM** (Africa/Kampala) - Auto-process monthly payouts

### Step 4: Add Routes to Frontend (App.jsx)

```javascript
import CreatorEarningsScreen from './screens/CreatorEarningsScreen';
import AdminPayoutDashboardScreen from './screens/AdminPayoutDashboardScreen';

// Add these routes:
<Route path="/dashboard/earnings" element={<CreatorEarningsScreen />} />
<Route path="/admin/payouts" element={<AdminPayoutDashboardScreen />} />
```

---

## 💰 How Money Flows (Example)

**Scenario:** Someone pledges 500,000 UGX via Airtel

```
┌─────────────────────────────────────────────────────┐
│ Donor's Airtel Wallet: -500,000 UGX                 │
│                      ↓                              │
│ Airtel takes 2% fee: -10,000 UGX                    │
│ (Automatic)                                         │
│                      ↓                              │
│ YOUR MERCHANT ACCOUNT: +490,000 UGX                 │
│ (Payment lands here)                                │
│                      ↓                              │
│ Bank deposit fee ~1%: -4,900 UGX                    │
│ (EXIM/ABSA deducts)                                 │
│                      ↓                              │
│ PledgeHub Commission 10%: -48,410 UGX               │
│ (YOUR PROFIT)                                       │
│                      ↓                              │
│ CREATOR RECEIVES: 436,690 UGX                       │
│ (90% after all fees)                                │
└─────────────────────────────────────────────────────┘

Total Deductions: 63,310 UGX (12.66%)
Creator Net: 436,690 UGX (87.34% of original)
```

---

## 🏦 Supported Banks

| Bank | Code | Deposit Fee | Monthly Fee |
|------|------|-------------|------------|
| **EXIM Bank** | EXIM | 1.0% | 5,000 UGX |
| **Centenary Bank** | CENTENARY | 0.5% | 5,000 UGX |
| **ABSA Bank** | ABSA | 1.0% | 7,500 UGX |
| **Equity Bank** | EQUITY | 0.75% | 7,500 UGX |
| **Stanbic Bank** | STANBIC | 0.75% | 10,000 UGX |
| **Barclays Bank** | BARCLAYS | 1.0% | 15,000 UGX |

**Recommendation:** Use **EXIM** or **Centenary** for lowest fees

---

## 📊 API Endpoints

### For Creators (Authenticated)

```bash
# Get current month earnings
GET /api/payouts/my-earnings

# Get complete earnings dashboard
GET /api/payouts/my-dashboard

# Get pending payouts
GET /api/payouts/pending

# Get payout history
GET /api/payouts/history?limit=12&offset=0

# Get earnings for specific month
GET /api/payouts/earnings/{year}/{month}
```

### For Admins (Authenticated + Admin Role)

```bash
# Get all creators with earnings
GET /api/payouts/admin/all-creators

# Get pending payouts
GET /api/payouts/admin/pending?status=processing

# Calculate earnings for creator
POST /api/payouts/admin/calculate-monthly
Body: { "creatorId": 1, "year": 2025, "month": 12 }

# Create payout
POST /api/payouts/admin/create
Body: { "creatorId": 1, "amount": 50000, "bankCode": "EXIM" }

# Mark payout complete
PUT /api/payouts/admin/{payoutId}/complete
Body: { "referenceNumber": "BANK123456" }
```

### Bank Fee Calculator (Public - No Auth)

```bash
# Calculate fees for any amount
POST /api/bank-settings/calculate-fees
Body: {
  "donorAmount": 500000,
  "paymentMethod": "airtel",
  "bankCode": "EXIM",
  "platformCommissionPercent": 10
}

# Compare all banks
POST /api/bank-settings/compare-banks
Body: {
  "donorAmount": 500000,
  "paymentMethod": "airtel",
  "platformCommissionPercent": 10
}

# Get all banks
GET /api/bank-settings/banks

# Update user's bank preference
PUT /api/bank-settings/my-bank-preference
Body: {
  "bankCode": "EXIM",
  "accountNumber": "1234567890",
  "accountName": "John Doe",
  "accountType": "personal"
}
```

---

## 🎯 Key Features

### 1. **Automatic Monthly Processing**
- ⏰ **Runs on 1st of month at 6:00 AM** (Africa/Kampala)
- Calculates all creator earnings automatically
- Creates payout batches for those with pending earnings
- No manual intervention needed

### 2. **Creator Dashboard** (`/dashboard/earnings`)
Shows:
- 📊 Current month pledges received
- 💰 Net earnings after all fees
- 📈 All-time statistics
- ⏳ Pending payouts status
- 🏦 Bank account details

### 3. **Admin Dashboard** (`/admin/payouts`)
Shows:
- 👥 All creators with earnings
- 💸 Lifetime earnings per creator
- ⏳ Pending payouts queue
- 📋 Payout history
- Actions to create & complete payouts

### 4. **Fee Breakdown Transparency**
Every payment shows:
- 💵 How much donor sent
- 📱 Mobile money fee (2-3%)
- 🏦 Bank deposit fee (~1%)
- 💼 PledgeHub commission (10%)
- ✅ What creator receives

### 5. **Tax Compliance**
Records include:
- ✅ Creator name & tax ID (future)
- ✅ Payment date & reference
- ✅ Amount breakdown
- ✅ Bank account used
- ✅ Commission details
- ✅ URA-compliant reports

---

## ⚙️ Configuration

### Commission Percentage

Change in `.env`:
```bash
# Default is 10% - adjust as needed
PLATFORM_COMMISSION_PERCENT=5   # Lower for more creator value
PLATFORM_COMMISSION_PERCENT=15  # Higher for platform costs
```

### Preferred Bank per Creator

Creators set in settings:
- Store their preferred bank
- Account number
- Account name
- Account type (personal/business)

Admin can override when creating payouts.

### Payout Schedule

Available options:
```
daily    - Pay out daily
weekly   - Pay out weekly
monthly  - Pay out monthly (DEFAULT)
```

---

## 📝 Monthly Payout Workflow

### Automatic (Cron Job)
```
Month Starts (1st at 6:00 AM)
    ↓
System processes ALL creators
    ↓
For each creator:
  - Calculate earnings for previous month
  - Create payout batch (if amount > 0)
  - Set status to "pending"
    ↓
Admin receives notification
```

### Manual Processing

For specific creator:
```bash
# 1. Calculate
POST /api/payouts/admin/calculate-monthly
{ "creatorId": 5, "year": 2025, "month": 12 }

# 2. Create Payout
POST /api/payouts/admin/create
{ "creatorId": 5, "amount": 150000 }

# 3. Send Money
Transfer to creator's bank account

# 4. Mark Complete
PUT /api/payouts/admin/5/complete
{ "referenceNumber": "TRN123456789" }
```

---

## 📱 Creator Experience

### Scenario: Creator makes their first pledge

1. **Pledge Created** 
   - Creator starts campaign
   - Sets goal amount

2. **Pledges Received**
   - Donors pledge via Airtel/MTN
   - See live payout breakdown in app

3. **Monthly Earnings**
   - 1st of month: System calculates
   - View in earnings dashboard
   - See breakdown of all fees

4. **Payout Received**
   - Admin processes payout
   - Money sent to bank account
   - Creator gets notification
   - Can see history in app

---

## 🔧 Troubleshooting

### Issue: Cron job not running

**Solution:**
```powershell
# Check if job is started (should see message)
npm run dev

# Output should show:
# ✅ Monthly Payout Processing
# ✅ Started: Monthly Payout Processing
```

### Issue: Need to recalculate earnings

**Solution:**
```bash
# Manually trigger via API or:
node -e "require('./services/advancedCronScheduler').runManually('payout')"
```

### Issue: Wrong bank selected

**Solution:**
- Creator updates their bank preference in settings
- Or admin overrides when creating payout

### Issue: Payout amount seems wrong

**Debug:**
```bash
# Use fee calculator
POST /api/bank-settings/calculate-fees
{ "donorAmount": 500000, "paymentMethod": "airtel" }
```

---

## 📊 Database Tables

### `payment_fees`
Records every payment's fee breakdown
- Donor amount
- Mobile money fee
- Bank fee
- Platform commission
- Creator net payout

### `payouts`
Tracks payout batches
- Creator ID
- Total amount
- Status (pending/processing/completed)
- Bank details
- Reference number

### `creator_earnings`
Monthly summary per creator
- Total pledges
- Total fees deducted
- Net earnings
- Already paid out
- Status

### `bank_configurations`
Bank data (pre-populated)
- Fee percentages
- Monthly account fees
- Minimum deposit amounts

---

## 🎁 What You Get

### Backend Services
✅ `bankFeeCalculatorService.js` - All fee calculations  
✅ `payoutService.js` - Creator earnings & payouts  
✅ Updated `advancedCronScheduler.js` - Monthly automation  

### API Routes
✅ `bankSettingsRoutes.js` - Bank management  
✅ `payoutRoutes.js` - Earnings & payout endpoints  

### Frontend Components
✅ `CreatorEarningsScreen.jsx` - Creator dashboard  
✅ `AdminPayoutDashboardScreen.jsx` - Admin controls  
✅ Complete CSS styling  

### Database
✅ Migration script with 6 pre-configured banks  
✅ All necessary tables & indexes  

### Automation
✅ Monthly cron job (1st of month 6 AM)  
✅ Auto-earnings calculation  
✅ Auto-payout creation  

---

## 📝 Next Steps

1. ✅ **Run migration** → Creates all tables
2. ✅ **Update .env** → Set AIRTEL_MERCHANT_ID
3. ✅ **Restart server** → Cron job starts
4. ✅ **Add routes to frontend** → UI appears
5. ✅ **Test with test data** → Verify calculations
6. ✅ **Train creators** → Show them earnings dashboard
7. ✅ **Set up bank accounts** → Prepare for real payouts

---

## 💡 Pro Tips

### Optimize Commission
- **5%** = More creator value (higher adoption)
- **10%** = Balanced (covers costs + profit)
- **15%** = Premium tier (advanced features)

### Optimize Bank
- **Lower fees** = More for creators
- **Centenary (0.5%)** = Best fees
- **EXIM (1%)** = Good balance

### Automate Everything
- Let cron job handle monthly processing
- Only admin needs to verify & transfer
- Creators see real-time in dashboard

### Track Taxes
- Keep payment_fees records
- Export monthly for URA
- Create detailed receipts

---

## 🚨 Important Notes

### Security
- All fees calculated server-side (can't be manipulated)
- Payouts require admin approval
- Commission % can't be changed mid-payment

### Compliance
- Keep detailed records for URA (Uganda Revenue Authority)
- Document all payouts with reference numbers
- Get creator bank info during registration

### Transparency
- Show fee breakdown to every creator
- Explain commission in terms & conditions
- Allow fee calculator access to donors

---

## 📞 Support

If you need to:
- **Change commission %** → Update `PLATFORM_COMMISSION_PERCENT` in .env
- **Add a bank** → Add to bank_configurations table
- **Fix a payout** → Use admin dashboard to mark complete
- **Recalculate earnings** → POST to `/api/payouts/admin/calculate-monthly`

---

## ✅ Verification Checklist

Before going live:

- [ ] Migration script ran successfully
- [ ] No database errors
- [ ] .env has AIRTEL_MERCHANT_ID set to YOUR merchant
- [ ] Server started without errors
- [ ] Cron job shows "Started: Monthly Payout Processing"
- [ ] Routes accessible (`/dashboard/earnings`, `/admin/payouts`)
- [ ] Test calculation with `/api/bank-settings/calculate-fees`
- [ ] Creator can view dashboard
- [ ] Admin can view payout dashboard
- [ ] Test payout creation in admin dashboard

---

**Your system is now ready for creators to earn! 🎉**

Questions? Check the API endpoints above or review the service files.
