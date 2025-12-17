# ✅ Payout System - Deployment Verification Guide

**Created:** Dec 17, 2025  
**Status:** Ready for Production  
**Estimated Setup Time:** 15 minutes

---

## 📋 Pre-Deployment Checklist

### Files Created (9 files)
- ✅ `backend/scripts/migration-payout-system.js` - Database setup
- ✅ `backend/services/bankFeeCalculatorService.js` - Fee calculations
- ✅ `backend/services/payoutService.js` - Payout management
- ✅ `backend/routes/bankSettingsRoutes.js` - Bank API
- ✅ `backend/routes/payoutRoutes.js` - Payout API
- ✅ `frontend/src/screens/CreatorEarningsScreen.jsx` - Creator dashboard
- ✅ `frontend/src/screens/CreatorEarningsScreen.css` - Creator styling
- ✅ `frontend/src/screens/AdminPayoutDashboardScreen.jsx` - Admin dashboard
- ✅ `frontend/src/screens/AdminPayoutDashboardScreen.css` - Admin styling

### Files Modified (5 files)
- ✅ `backend/server.js` - Added route imports & registration
- ✅ `backend/services/advancedCronScheduler.js` - Added monthly payout job
- ✅ `backend/.env.example` - Added payout configuration

---

## 🚀 Deployment Steps

### Step 1: Stop Backend Server
```powershell
# Ctrl+C if running
# Or close the terminal window
```

### Step 2: Run Database Migration
```powershell
cd backend
node scripts/migration-payout-system.js
```

**Expected Output:**
```
✅ Database connection successful
✅ Creating tables...
✅ payment_fees table created
✅ payouts table created
✅ payout_details table created
✅ creator_earnings table created
✅ bank_configurations table created
✅ Seeding 6 banks...
✅ Migration completed successfully!

Tables ready: 5 new tables created
Banks configured: 6 (EXIM, CENTENARY, ABSA, EQUITY, STANBIC, BARCLAYS)
```

**If Error:**
```
❌ Error: Table already exists
   → This is OK! Just skip.
   → Check with: SHOW TABLES; in MySQL
```

### Step 3: Update .env File

**Location:** `backend/.env`

```bash
# Find this section:
# ===== PAYOUT SYSTEM =====

# Update with YOUR Airtel Merchant ID
AIRTEL_MERCHANT_ID=YOUR_ACTUAL_MERCHANT_ID_HERE

# (Optional) Adjust commission percentage
PLATFORM_COMMISSION_PERCENT=10

# Save file (Ctrl+S)
```

**Critical:** `AIRTEL_MERCHANT_ID` must be YOUR actual merchant account, not a test value

### Step 4: Verify Environment Variables

```powershell
# Check .env has these variables
Get-Content backend\.env | Select-String -Pattern "AIRTEL_MERCHANT_ID|PLATFORM_COMMISSION"

# Output should show:
# AIRTEL_MERCHANT_ID=your_actual_id
# PLATFORM_COMMISSION_PERCENT=10
```

### Step 5: Start Backend Server
```powershell
cd backend
npm run dev
```

**Expected Output (look for):**
```
✅ Server running on port 5001
✅ Database connected
✅ Started: 7 cron jobs
  ├─ Daily Reminders (9:00 AM)
  ├─ Evening Reminders (5:00 PM)
  ├─ Balance Reminders (10:00 AM)
  ├─ Advanced Analytics (6:30 PM)
  ├─ Monthly Payout Processing (1st of month, 6:00 AM) ← NEW
  └─ ...
```

**If Missing Payout Job:**
```
❌ Payout job not started

Solution:
1. Check advancedCronScheduler.js has the new job
2. Check importPayoutService line exists
3. Restart server
```

### Step 6: Update Frontend Routes

**Location:** `frontend/src/App.jsx`

Find the Route definitions and add:

```javascript
// Add at end of routes section (before closing switch/routes)

{/* Creator Dashboard - Earnings */}
<Route 
  path="/dashboard/earnings" 
  element={<CreatorEarningsScreen />} 
/>

{/* Admin Dashboard - Payout Management */}
<Route 
  path="/admin/payouts" 
  element={<AdminPayoutDashboardScreen />} 
/>
```

**Required Imports (at top of App.jsx):**
```javascript
import CreatorEarningsScreen from './screens/CreatorEarningsScreen';
import AdminPayoutDashboardScreen from './screens/AdminPayoutDashboardScreen';
```

### Step 7: Start Frontend Server
```powershell
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v... ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

---

## 🧪 Verification Tests

### Test 1: Database Tables
```bash
# Open MySQL client
mysql -u root -p pledgehub_db

# Run:
SHOW TABLES;

# Look for these NEW tables:
# - bank_configurations
# - payment_fees
# - payouts
# - payout_details
# - creator_earnings

# Check bank seeds:
SELECT code, name, deposit_fee_percentage FROM bank_configurations;

# Should show 6 banks
```

### Test 2: API Endpoints

**Test Fee Calculation:**
```bash
curl -X POST http://localhost:5001/api/bank-settings/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{
    "donorAmount": 500000,
    "paymentMethod": "airtel",
    "bankCode": "EXIM",
    "platformCommissionPercent": 10
  }'

# Expected response includes: creator_net_payout, mobile_money_fee_amount, etc.
```

**Test Bank Comparison:**
```bash
curl -X POST http://localhost:5001/api/bank-settings/compare-banks \
  -H "Content-Type: application/json" \
  -d '{
    "donorAmount": 500000,
    "paymentMethod": "airtel",
    "platformCommissionPercent": 10
  }'

# Expected response: Array of 6 banks with creator_payout for each
```

**Test Get Banks:**
```bash
curl http://localhost:5001/api/bank-settings/banks

# Expected response: Array of 6 banks with full details
```

### Test 3: Frontend Screens

**Creator Earnings Dashboard:**
1. Open: `http://localhost:5173/dashboard/earnings`
2. Should load without errors
3. Shows: "No earnings yet" if no pledges
4. Shows fee breakdown explanation

**Admin Payout Dashboard:**
1. Open: `http://localhost:5173/admin/payouts`
2. Should load without errors (if logged in as admin)
3. Shows empty tables if no creators/payouts yet
4. Shows buttons to create payouts

### Test 4: Cron Job Activation

**Check if running:**
```bash
# Look in server logs for:
✅ Monthly Payout Processing job scheduled

# The message should appear when server starts
```

**Manual trigger (testing):**
```javascript
// Run this in backend console/terminal:
const scheduler = require('./services/advancedCronScheduler');
scheduler.runManually('payout');

// Should output results
```

---

## 🔍 Quick Verification Checklist

### Backend Checks
- [ ] Migration script ran successfully
- [ ] 5 new tables visible in database
- [ ] 6 banks seeded in bank_configurations
- [ ] Server started with "✅ Started: X cron jobs"
- [ ] Payout job visible in cron job list
- [ ] .env has AIRTEL_MERCHANT_ID set
- [ ] Fee calculator API returns data
- [ ] Bank comparison API returns all 6 banks

### Frontend Checks
- [ ] Frontend server started successfully
- [ ] Routes added to App.jsx
- [ ] `http://localhost:5173/dashboard/earnings` loads
- [ ] `http://localhost:5173/admin/payouts` loads
- [ ] No console errors in browser

### Data Checks
- [ ] Can query bank_configurations table
- [ ] payment_fees table is empty (normal)
- [ ] payouts table is empty (normal)
- [ ] creator_earnings table is empty (normal)

---

## 📊 Database Verification Queries

Run in MySQL to verify setup:

```sql
-- Check if tables exist
SHOW TABLES LIKE '%payout%';
SHOW TABLES LIKE '%bank%';
SHOW TABLES LIKE '%payment_fees%';

-- Check banks loaded
SELECT COUNT(*) as bank_count FROM bank_configurations;

-- Should return: 6

-- Check bank details
SELECT code, name, deposit_fee_percentage, monthly_account_fee 
FROM bank_configurations 
ORDER BY code;

-- Should show 6 banks with their fees

-- Check table structure
DESCRIBE payment_fees;
DESCRIBE payouts;
DESCRIBE creator_earnings;

-- Verify indexes exist
SHOW INDEX FROM payment_fees;
SHOW INDEX FROM creator_earnings;
```

---

## ⚙️ Configuration Verification

### .env Variables

Verify these are set in `backend/.env`:

```bash
# CRITICAL
✅ AIRTEL_MERCHANT_ID=...

# IMPORTANT
✅ PLATFORM_COMMISSION_PERCENT=10

# OPTIONAL (with defaults)
✅ DEFAULT_PAYOUT_SCHEDULE=monthly
✅ DEFAULT_PAYOUT_METHOD=bank_transfer
✅ DEFAULT_BANK_CODE=EXIM
✅ MONTHLY_PAYOUT_DAY=1
```

**Get current values:**
```powershell
# PowerShell
Get-Content backend\.env | Where-Object { $_ -match 'COMMISSION|MERCHANT|PAYOUT' }
```

---

## 🚨 Common Issues & Solutions

### Issue: Migration fails with "Table already exists"
**Solution:**
- This is normal if running twice
- Drop tables and rerun:
```sql
DROP TABLE payout_details, payouts, payment_fees, creator_earnings, bank_configurations;
```
- Then run migration again

### Issue: Cron job shows but doesn't run
**Solution:**
1. Verify payoutService imported in advancedCronScheduler.js
2. Check timezone is "Africa/Kampala"
3. Restart server
4. Manually test: `scheduler.runManually('payout')`

### Issue: API returns 404 for /api/payouts/*
**Solution:**
1. Verify routes registered in server.js
2. Check imports correct
3. Verify middleware applied
4. Restart server

### Issue: Frontend screens show "Unauthorized"
**Solution:**
1. Must be logged in as creator/admin
2. Token stored in localStorage
3. Check browser console for JWT errors

### Issue: Fee calculator returns wrong amount
**Solution:**
1. Verify PLATFORM_COMMISSION_PERCENT in .env
2. Check bankCode exists in bank_configurations
3. Verify paymentMethod is 'airtel' or 'mtn'
4. Run test query to verify

---

## 📈 Post-Deployment Tasks

### Day 1: Testing
- [ ] Test all 3 endpoints (calculate, compare, banks)
- [ ] Test creator dashboard loads
- [ ] Test admin dashboard loads
- [ ] Verify cron job scheduled correctly

### Day 2: Sample Data
- [ ] Create test pledge with Airtel payment
- [ ] Verify payment_fees record created
- [ ] Verify fee breakdown correct
- [ ] Test admin payout creation

### Day 3: Creator Setup
- [ ] Have creators set bank preference
- [ ] Show them earnings dashboard
- [ ] Explain fee structure
- [ ] Prepare for first monthly payout

### First Monthly Payout (1st of month 6 AM)
- [ ] Monitor cron job execution
- [ ] Verify creator_earnings calculated
- [ ] Check payouts batch created
- [ ] Process payouts as planned

---

## 📞 Support & Debugging

### Get Diagnostic Info

```powershell
# Backend logs
Get-Content backend\logs\*.log | Select-Object -Last 50

# Check database
mysql -u root -p pledgehub_db -e "SELECT * FROM bank_configurations;"

# Check .env loaded
$env:PLATFORM_COMMISSION_PERCENT
$env:AIRTEL_MERCHANT_ID
```

### Reset Everything (if needed)

```powershell
# 1. Stop servers (Ctrl+C)

# 2. Drop tables
mysql -u root -p pledgehub_db < "DROP TABLE payout_details, payouts, payment_fees, creator_earnings, bank_configurations;"

# 3. Rerun migration
node backend\scripts\migration-payout-system.js

# 4. Restart servers
```

---

## ✅ Sign-Off Checklist

Before considering deployment complete:

- [ ] All 9 new files exist
- [ ] All 5 files modified correctly
- [ ] Migration script completed
- [ ] All 5 new tables in database
- [ ] 6 banks seeded
- [ ] Backend server started (shows cron jobs)
- [ ] Monthly payout job visible in job list
- [ ] Frontend server started
- [ ] Routes added to App.jsx
- [ ] Both dashboard screens accessible
- [ ] .env has AIRTEL_MERCHANT_ID set
- [ ] Fee calculator API works
- [ ] Bank comparison API works
- [ ] No console errors in browser
- [ ] No errors in backend logs

**All checked? You're ready! 🚀**

---

**Next:** See `PAYOUT_SYSTEM_IMPLEMENTATION.md` for usage guide

**Questions?** Check the API documentation or service files for details
