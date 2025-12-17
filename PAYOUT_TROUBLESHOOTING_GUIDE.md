# 🔧 Payout System - Troubleshooting Guide

**Last Updated:** Dec 17, 2025  
**Severity Levels:** 🟢 Low | 🟡 Medium | 🔴 Critical

---

## Quick Problem Finder

**System won't start?** → [Server Won't Start](#server-wont-start)  
**Database errors?** → [Database Issues](#database-issues)  
**APIs not working?** → [API Errors](#api-errors)  
**Fee calculations wrong?** → [Fee Calculation Issues](#fee-calculation-issues)  
**Monthly job not running?** → [Cron Job Issues](#cron-job-issues)  
**Frontend screens missing?** → [Frontend Issues](#frontend-issues)  
**Payout stuck?** → [Payout Processing Issues](#payout-processing-issues)

---

## Server Won't Start

### Problem: "Cannot find module 'bankFeeCalculatorService'"
**Severity:** 🔴 Critical  
**Cause:** Service file not created or path wrong

**Solution:**
```bash
# 1. Verify file exists
dir backend\services\bankFeeCalculatorService.js

# 2. If missing, recreate from backup or documentation
# 3. Check syntax: node -c backend\services\bankFeeCalculatorService.js

# 4. Restart server
npm run dev
```

---

### Problem: "Port 5001 already in use"
**Severity:** 🟡 Medium  
**Cause:** Backend already running or another process using port

**Solution:**
```powershell
# 1. Kill process on port 5001
Get-Process | Where-Object { $_.Port -eq 5001 } | Stop-Process

# OR specify different port
$env:PORT = 5002
npm run dev

# OR find what's using the port
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

---

### Problem: "ECONNREFUSED - Cannot connect to database"
**Severity:** 🔴 Critical  
**Cause:** MySQL not running or credentials wrong

**Solution:**
```bash
# 1. Check MySQL is running
mysql -u root -p

# 2. Verify credentials in .env
Get-Content backend\.env | grep DB_

# 3. Test connection
node -e "require('./config/db').pool.getConnection().then(c => { console.log('✅ Connected'); c.release(); }).catch(e => console.error('❌ Error:', e.message))"

# 4. Start MySQL (Windows)
mysqld --console

# OR use Service Manager
services.msc → Find MySQL → Start
```

---

### Problem: ".env file not found or not loaded"
**Severity:** 🔴 Critical  
**Cause:** .env file missing or not in correct location

**Solution:**
```bash
# 1. Verify file exists
Test-Path backend\.env

# 2. If missing, copy from example
Copy-Item backend\.env.example backend\.env

# 3. Edit with actual values
notepad backend\.env

# 4. Verify load
node -e "require('dotenv').config(); console.log('AIRTEL_MERCHANT_ID:', process.env.AIRTEL_MERCHANT_ID)"
```

---

## Database Issues

### Problem: "Table 'pledgehub_db.payment_fees' doesn't exist"
**Severity:** 🔴 Critical  
**Cause:** Migration script not run

**Solution:**
```bash
# 1. Run migration script
cd backend
node scripts/migration-payout-system.js

# Expected output:
# ✅ Migration completed successfully!
# Tables ready: 5 new tables created
# Banks configured: 6

# 2. Verify tables exist
mysql -u root -p pledgehub_db -e "SHOW TABLES LIKE '%payout%';"

# Should show:
# | Tables_in_pledgehub_db (%payout%) |
# | creator_earnings                 |
# | payment_fees                     |
# | payout_details                   |
# | payouts                          |
```

---

### Problem: "Duplicate entry for key 'creator_earnings'"
**Severity:** 🟡 Medium  
**Cause:** Unique constraint violation - two payouts for same creator/month

**Solution:**
```sql
-- Check duplicate
SELECT creator_id, month_year, COUNT(*) 
FROM creator_earnings 
GROUP BY creator_id, month_year 
HAVING COUNT(*) > 1;

-- View duplicates
SELECT * FROM creator_earnings 
WHERE creator_id = X AND month_year = 'YYYY-MM';

-- Delete incorrect one (keep most recent)
DELETE FROM creator_earnings 
WHERE id = WRONG_ID;

-- Recalculate
POST /api/payouts/admin/calculate-monthly
```

---

### Problem: "Migration script fails with 'Column already exists'"
**Severity:** 🟢 Low  
**Cause:** Tables already created (running migration twice)

**Solution:**
```bash
# 1. This is safe - script is idempotent
#    You can ignore the warning

# 2. Or clean up first:
mysql -u root -p pledgehub_db -e "
DROP TABLE IF EXISTS payout_details;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS payment_fees;
DROP TABLE IF EXISTS creator_earnings;
DROP TABLE IF EXISTS bank_configurations;
"

# 3. Then rerun migration
node scripts/migration-payout-system.js
```

---

### Problem: "Bank seeding failed - EXIM bank exists"
**Severity:** 🟢 Low  
**Cause:** Banks already seeded

**Solution:**
```bash
# 1. This is normal - ignore
# 2. Verify banks exist:
mysql -u root -p pledgehub_db -e "SELECT COUNT(*) FROM bank_configurations;"

# Should return: 6

# 3. Or reseed:
mysql -u root -p pledgehub_db -e "
DELETE FROM bank_configurations;
"
# Then rerun migration
```

---

## API Errors

### Problem: "404 Not Found - /api/bank-settings/calculate-fees"
**Severity:** 🔴 Critical  
**Cause:** Routes not registered in server.js

**Solution:**
```javascript
// Check backend/server.js line ~200 has:

const bankSettingsRoutes = require('./routes/bankSettingsRoutes');
const payoutRoutes = require('./routes/payoutRoutes');

// And:
app.use('/api/bank-settings', bankSettingsRoutes);
app.use('/api/payouts', authenticateToken, payoutRoutes);

// If missing:
// 1. Add imports
// 2. Add route registrations
// 3. Restart server
```

---

### Problem: "401 Unauthorized - /api/payouts/my-dashboard"
**Severity:** 🟡 Medium  
**Cause:** Token missing or invalid

**Solution:**
```javascript
// 1. Check token in request
const token = localStorage.getItem('token');
console.log('Token:', token);

// 2. Should be in Authorization header
fetch('/api/payouts/my-dashboard', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})

// 3. Or get new token
// 1. Login to get token
// 2. Store in localStorage
// 3. Add to all API calls

// 4. Check token not expired
// JWT tokens valid for 7 days, then need re-login
```

---

### Problem: "500 Internal Server Error"
**Severity:** 🔴 Critical  
**Cause:** Backend error - check logs

**Solution:**
```bash
# 1. Check backend console for error message
#    Look for: "Error: ..." in the output

# 2. Common causes:
#    - Database not connected
#    - .env variable missing
#    - Invalid parameter
#    - Service method error

# 3. Test specific endpoint with curl
curl -X POST http://localhost:5001/api/bank-settings/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{"donorAmount": 100000, "paymentMethod": "airtel", "bankCode": "EXIM"}'

# 4. Should return JSON response (not 500)

# 5. If still 500, add debug logging:
# In route handler:
console.log('Request:', req.body);
console.log('Service response:', result);
```

---

### Problem: "Invalid request - missing required field"
**Severity:** 🟡 Medium  
**Cause:** API call missing required parameter

**Solution:**
```javascript
// Check required fields:

// POST /api/bank-settings/calculate-fees needs:
{
  "donorAmount": 500000,           // Required
  "paymentMethod": "airtel",       // Required (airtel or mtn)
  "bankCode": "EXIM",              // Required
  "platformCommissionPercent": 10  // Optional (default 10)
}

// POST /api/payouts/admin/create needs:
{
  "creatorId": 1,                  // Required
  "amount": 50000,                 // Required
  "bankCode": "EXIM"               // Optional (default EXIM)
}

// Verify all required fields present before sending
```

---

### Problem: "Fee calculation returns null or 0"
**Severity:** 🟡 Medium  
**Cause:** Invalid parameters or missing bank

**Solution:**
```bash
# 1. Verify bank exists
GET /api/bank-settings/banks

# Response should include:
# { code: "EXIM", name: "EXIM Bank", deposit_fee_percentage: 1 }

# 2. Verify payment method valid
# Must be: "airtel" or "mtn"

# 3. Verify amount > 0
# donorAmount must be > 0

# 4. Test with valid data
curl -X POST http://localhost:5001/api/bank-settings/calculate-fees \
  -H "Content-Type: application/json" \
  -d '{
    "donorAmount": 500000,
    "paymentMethod": "airtel",
    "bankCode": "EXIM",
    "platformCommissionPercent": 10
  }'

# If still fails, check bankFeeCalculatorService.js:
# - calculatePaymentFees function exists
# - All fee percentages defined
# - Math operations correct
```

---

## Fee Calculation Issues

### Problem: "Creator receiving wrong amount"
**Severity:** 🟡 Medium  
**Cause:** Fee calculation error or wrong commission %

**Solution:**
```bash
# 1. Check commission % set correctly
echo $env:PLATFORM_COMMISSION_PERCENT
# Should be: 10 (default)

# 2. Verify calculation manually
Example: 500,000 UGX via Airtel to EXIM

Step 1: Airtel fee (2%)
  500,000 × 2% = 10,000
  Remaining: 490,000

Step 2: Bank fee (1%)
  490,000 × 1% = 4,900
  Remaining: 485,100

Step 3: Commission (10%)
  485,100 × 10% = 48,510
  Creator: 485,100 - 48,510 = 436,590

Creator should get: 436,590 UGX

# 3. Check database record
SELECT * FROM payment_fees 
WHERE pledge_id = X;

# Verify all fields match calculation

# 4. If wrong, check:
# - paymentMethod (airtel=2%, mtn=3%)
# - bankCode and its fee
# - platformCommissionPercent
```

---

### Problem: "MTN fee different from Airtel (correctly!)"
**Severity:** 🟢 Low  
**Cause:** MTN charges 3% vs Airtel's 2%

**Solution:**
```
This is NORMAL and CORRECT!

MTN: 3% fee (higher)
Airtel: 2% fee (lower)

Example comparison (500,000 UGX):
┌─────────────────────────────────┐
│ Via Airtel:    Creator gets 436,590 │
│ Via MTN:       Creator gets 431,690 │
│ Difference:    -4,900 (MTN costs more) │
└─────────────────────────────────┘

This is why creators prefer Airtel.
Donors can choose preferred method.
```

---

### Problem: "Bank fee doesn't match my records"
**Severity:** 🟡 Medium  
**Cause:** Outdated fee in system

**Solution:**
```sql
-- 1. Check current bank fees
SELECT code, name, deposit_fee_percentage, monthly_account_fee
FROM bank_configurations;

-- 2. If fee wrong, update bank
UPDATE bank_configurations 
SET deposit_fee_percentage = 0.75
WHERE code = 'EXIM';

-- 3. Verify update
SELECT * FROM bank_configurations WHERE code = 'EXIM';

-- 4. New calculations will use new fee automatically

-- 5. For existing payments, update manually if needed
UPDATE payment_fees 
SET bank_deposit_fee_amount = (
  subtotal_after_mobile * (new_fee_percent / 100)
)
WHERE bank_code = 'EXIM' AND DATE(created_at) >= '2025-12-01';
```

---

## Cron Job Issues

### Problem: "Monthly payout job not running"
**Severity:** 🔴 Critical  
**Cause:** Cron job not scheduled or disabled

**Solution:**
```bash
# 1. Check job is in advancedCronScheduler.js
grep -n "monthlyPayoutJob" backend/services/advancedCronScheduler.js

# Should find the job definition

# 2. Check imports
grep "payoutService" backend/services/advancedCronScheduler.js

# Should show: const payoutService = require('./payoutService');

# 3. Check timezone
grep "Africa/Kampala" backend/services/advancedCronScheduler.js

# Should show multiple lines

# 4. Restart server to activate
npm run dev

# Should show in logs:
# ✅ Started: Monthly Payout Processing

# 5. Manual test
node -e "
const scheduler = require('./services/advancedCronScheduler');
scheduler.runManually('payout');
"

# Should output: Processing results
```

---

### Problem: "Cron job ran but no earnings calculated"
**Severity:** 🟡 Medium  
**Cause:** No pledges completed that month

**Solution:**
```bash
# 1. Check creator has pledges
SELECT COUNT(*) FROM pledges WHERE creator_id = X AND status = 'completed';

# If 0: Create test pledges to test system

# 2. Check pledges were paid
SELECT * FROM pledges WHERE creator_id = X 
AND DATE(collection_date) >= '2025-12-01'
AND status = 'completed';

# If empty: Mark a pledge as completed

# 3. Check earnings calculated
SELECT * FROM creator_earnings 
WHERE creator_id = X AND month_year = '2025-12';

# If empty: Earnings not calculated, re-run

# 4. Manually trigger calculation
POST /api/payouts/admin/calculate-monthly
Body: { "creatorId": X, "year": 2025, "month": 12 }

# Should return: calculation result
```

---

### Problem: "Cron job runs but payouts not created"
**Severity:** 🟡 Medium  
**Cause:** Creator has 0 net earnings after fees

**Solution:**
```bash
# 1. Check creator earnings
SELECT * FROM creator_earnings WHERE creator_id = X;

# If net_earnings = 0 or negative: Normal, no payout created

# 2. Check if payouts exist
SELECT * FROM payouts WHERE creator_id = X;

# If empty with earnings > 0: Check service logs

# 3. Manually create payout
POST /api/payouts/admin/create
Body: { "creatorId": X, "amount": 50000, "bankCode": "EXIM" }

# Should return: payout created

# 4. If fails, check error message
# Common: "Creator has no bank preference"
# Solution: Creator must set bank in settings first
```

---

### Problem: "Wrong month calculated"
**Severity:** 🟡 Medium  
**Cause:** Cron job calculates previous month (correct)

**Solution:**
```
IMPORTANT: Cron job calculates PREVIOUS month, not current!

Timeline:
├─ Dec 1, 6 AM: Calculates November earnings
├─ Jan 1, 6 AM: Calculates December earnings
└─ Feb 1, 6 AM: Calculates January earnings

This is CORRECT - gives month 30 days to complete.

To calculate specific month:
POST /api/payouts/admin/calculate-monthly
Body: { 
  "creatorId": X,
  "year": 2025,
  "month": 11  // November
}
```

---

## Frontend Issues

### Problem: "CreatorEarningsScreen doesn't load"
**Severity:** 🟡 Medium  
**Cause:** Route not added to App.jsx

**Solution:**
```javascript
// 1. Check App.jsx has routes

import CreatorEarningsScreen from './screens/CreatorEarningsScreen';
import AdminPayoutDashboardScreen from './screens/AdminPayoutDashboardScreen';

// In route definitions:
<Route path="/dashboard/earnings" element={<CreatorEarningsScreen />} />
<Route path="/admin/payouts" element={<AdminPayoutDashboardScreen />} />

// 2. If missing, add them

// 3. Restart frontend
npm run dev

// 4. Navigate to http://localhost:5173/dashboard/earnings
```

---

### Problem: "Screen shows 'No earnings yet'"
**Severity:** 🟢 Low  
**Cause:** Creator hasn't received pledges yet

**Solution:**
```
This is NORMAL for new creators.

To test:
1. Create a pledge to this creator
2. Mark pledge as "completed"
3. Dashboard should show earnings

To show sample data:
- Use test/admin account
- Create pledges via API
- Mark as completed
- Run payout calculation
```

---

### Problem: "Dashboard shows 'Unauthorized'"
**Severity:** 🟡 Medium  
**Cause:** User not logged in

**Solution:**
```javascript
// 1. Must be logged in
// 2. Check token stored
const token = localStorage.getItem('token');
console.log('Token:', token);

// Should show JWT token

// 3. If empty, login first
// 4. Navigate to /dashboard/earnings after login

// 5. Check browser console for errors
// F12 → Console → Check for errors
```

---

### Problem: "CSS styling looks broken"
**Severity:** 🟡 Medium  
**Cause:** CSS files not loaded or syntax error

**Solution:**
```bash
# 1. Verify CSS files exist
Test-Path frontend\src\screens\CreatorEarningsScreen.css
Test-Path frontend\src\screens\AdminPayoutDashboardScreen.css

# 2. Check imports in JSX
grep -n "import.*css" frontend/src/screens/CreatorEarningsScreen.jsx

# Should show: import './CreatorEarningsScreen.css';

# 3. Check CSS syntax
# Open file and look for:
# - Missing semicolons
# - Unmatched braces
# - Invalid property names

# 4. Hard refresh browser
# F5 in browser or Ctrl+Shift+Delete cache
```

---

### Problem: "Tables show no data"
**Severity:** 🟡 Medium  
**Cause:** API failing silently or no data

**Solution:**
```javascript
// 1. Check browser Network tab
// F12 → Network → Make API call
// Look for /api/payouts/my-dashboard

// 2. Check response
// If 500: Backend error
// If 404: Route not registered
// If 401: Auth error

// 3. Check browser console
// F12 → Console
// Look for JavaScript errors

// 4. Test API directly
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5001/api/payouts/my-dashboard

// 5. If no data, create test pledges first
```

---

## Payout Processing Issues

### Problem: "Payout stuck in 'pending' status"
**Severity:** 🟡 Medium  
**Cause:** Admin didn't complete the payout

**Solution:**
```bash
# 1. Check pending payouts
GET /api/payouts/admin/pending

# 2. View specific payout
SELECT * FROM payouts WHERE id = X;

# 3. Admin needs to transfer money to creator's bank

# 4. Then mark complete
PUT /api/payouts/admin/X/complete
Body: { "referenceNumber": "BANK_TXN_REF_123" }

# 5. Status should change to "completed"
```

---

### Problem: "Creator's bank preference not saved"
**Severity:** 🟡 Medium  
**Cause:** Update endpoint failed

**Solution:**
```bash
# 1. Check user has bank info
SELECT * FROM users WHERE id = X;

# Should have: bank_code, bank_account_number, etc.

# 2. Update via API
PUT /api/bank-settings/my-bank-preference
Body: {
  "bankCode": "EXIM",
  "accountNumber": "1234567890",
  "accountName": "Creator Name",
  "accountType": "personal"
}

# 3. Verify save
SELECT * FROM users WHERE id = X;

# Should show updated bank_code

# 4. If fails, check:
# - bankCode exists in bank_configurations
# - accountNumber is valid
# - User is logged in
```

---

### Problem: "Can't create payout - 'Creator not found'"
**Severity:** 🟡 Medium  
**Cause:** creatorId doesn't exist

**Solution:**
```bash
# 1. Verify creator exists
SELECT * FROM users WHERE id = X AND role = 'creator';

# 2. Get list of all creators
SELECT id, name FROM users WHERE role = 'creator';

# 3. Use correct ID in request
POST /api/payouts/admin/create
Body: {
  "creatorId": CORRECT_ID,
  "amount": 50000,
  "bankCode": "EXIM"
}

# 4. If still fails, check error details
# Error should specify what's missing
```

---

### Problem: "Can't create payout - 'No bank preference'"
**Severity:** 🟡 Medium  
**Cause:** Creator hasn't set bank details

**Solution:**
```bash
# 1. Creator must set bank preference first
# In dashboard: Settings → Bank Account

# 2. Or admin can override in request
POST /api/payouts/admin/create
Body: {
  "creatorId": X,
  "amount": 50000,
  "bankCode": "EXIM"  # Override creator's preference
}

# 3. Verify bank info
SELECT bank_code, bank_account_number FROM users WHERE id = X;

# Should have both fields

# 4. If missing, creator must update:
PUT /api/bank-settings/my-bank-preference
Body: {
  "bankCode": "EXIM",
  "accountNumber": "1234567890",
  "accountName": "Name",
  "accountType": "personal"
}
```

---

## General Troubleshooting

### Check Overall System Health

```bash
# 1. Database connected
mysql -u root -p pledgehub_db -e "SELECT 1;"

# 2. Tables exist
mysql -u root -p pledgehub_db -e "SHOW TABLES LIKE '%payout%';"

# 3. Backend running
curl http://localhost:5001/api/health

# 4. Frontend running
curl http://localhost:5173

# 5. Check logs
Get-Content backend\logs\*.log | Select-Object -Last 50
```

---

### Reset Everything

**Only if nothing else works:**

```bash
# 1. Stop servers (Ctrl+C)

# 2. Drop tables
mysql -u root -p pledgehub_db -e "
DROP TABLE IF EXISTS payout_details;
DROP TABLE IF EXISTS payouts;
DROP TABLE IF EXISTS payment_fees;
DROP TABLE IF EXISTS creator_earnings;
DROP TABLE IF EXISTS bank_configurations;
"

# 3. Delete .env
Remove-Item backend\.env

# 4. Copy from example
Copy-Item backend\.env.example backend\.env

# 5. Edit .env with correct values

# 6. Rerun migration
node backend\scripts\migration-payout-system.js

# 7. Restart servers
npm run dev  # Backend
npm run dev  # Frontend
```

---

## Still Need Help?

1. **Check the logs**
```bash
tail -f backend/logs/error.log
```

2. **Test the API**
```bash
# With valid token and parameters
```

3. **Review the code**
- Check service file for logic
- Check route for request handling
- Check database for data

4. **Search for error message**
- Google the exact error
- Check GitHub issues
- Review documentation

---

**Last Resort:** Review the complete implementation docs and rebuild step-by-step.
