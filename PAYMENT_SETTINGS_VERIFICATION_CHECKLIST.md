# ✅ Payment Settings Integration - Verification Checklist

## 🔍 Pre-Flight Checks

### File Existence
- [ ] `backend/services/paymentSettingsService.js` exists and contains encryption logic
- [ ] `backend/routes/paymentSettingsRoutes.js` exists with 4 endpoints
- [ ] `backend/scripts/migration-payment-settings.js` exists
- [ ] `frontend/src/screens/PaymentSettingsScreenIntegrated.jsx` exists
- [ ] `frontend/src/screens/PaymentSettingsScreen.css` exists

### Code Integration
- [ ] `backend/server.js` imports `paymentSettingsRoutes`
- [ ] `backend/server.js` registers `/api/payment-settings` route with `authenticateToken, requireAdmin`
- [ ] Payment Settings route is AFTER payment routes but BEFORE other admin routes

### Database
- [ ] MySQL is running
- [ ] `pledgehub_db` database exists
- [ ] Have valid DB credentials in `.env`

### Environment
- [ ] `backend/.env` has `JWT_SECRET` set
- [ ] `backend/.env` has `SESSION_SECRET` set
- [ ] Backend can start without errors: `npm run dev`

---

## 🗄️ Database Migration

### Pre-Migration
```sql
-- Verify no existing table
SHOW TABLES LIKE 'payment_settings';
-- Should return: Empty set
```

### Run Migration
```powershell
cd c:\Users\HP\PledgeHub\backend
node scripts\migration-payment-settings.js
```

### Post-Migration Verification
```sql
-- Check table exists
DESCRIBE payment_settings;

-- Should show columns:
-- - id (INT, PK)
-- - mtn_data (LONGTEXT)
-- - airtel_data (LONGTEXT)
-- - paypal_data (LONGTEXT)
-- - created_at (TIMESTAMP)
-- - updated_at (TIMESTAMP)
-- - created_by (INT, FK to users)

-- Check no data yet
SELECT * FROM payment_settings;
-- Should return: Empty set
```

---

## 🧪 API Endpoint Tests

### Setup
```powershell
# Get admin JWT token (login as admin first)
$token = "YOUR_JWT_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$baseUrl = "http://localhost:5001/api/payment-settings"
```

### Test 1: Get Empty Settings
```powershell
Invoke-RestMethod -Uri $baseUrl -Headers $headers | ConvertTo-Json
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "mtn": { "configured": false },
    "airtel": { "configured": false },
    "paypal": { "configured": false }
  }
}
```

- [ ] Returns `success: true`
- [ ] Shows all three providers as not configured

### Test 2: Save MTN Credentials
```powershell
$body = @{
    subscriptionKey = "003a382ff7dc4443b076c9096dd82032"
    apiUser = "92360f76-a4da-4ea6-af2f-fe559e59f20c"
    apiKey = "a5b00ad48bd14ad181771d10dff29a43"
    environment = "sandbox"
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "$baseUrl/mtn" `
    -Method Post `
    -Headers $headers `
    -Body $body | ConvertTo-Json
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "message": "mtn settings saved successfully",
    "provider": "mtn"
  }
}
```

- [ ] Returns `success: true`
- [ ] Shows message about saving
- [ ] No errors in response

### Test 3: Verify Save in Database
```sql
SELECT * FROM payment_settings;
-- Should show 1 row with mtn_data encrypted
SELECT mtn_data FROM payment_settings;
-- Should show encrypted string like: "a1b2c3d4e5f6...:1a2b3c4d5e6f..."
```

- [ ] One row exists
- [ ] `mtn_data` is encrypted (contains `:` separator)
- [ ] `airtel_data` and `paypal_data` are NULL

### Test 4: Get Settings (Confirm Encryption)
```powershell
Invoke-RestMethod -Uri $baseUrl -Headers $headers | ConvertTo-Json
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "mtn": { "configured": true },
    "airtel": { "configured": false },
    "paypal": { "configured": false }
  }
}
```

- [ ] `mtn.configured` is `true`
- [ ] No sensitive data visible in response
- [ ] `airtel` and `paypal` still show `configured: false`

### Test 5: Test Gateway Connection
```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/mtn/test" `
    -Method Post `
    -Headers $headers | ConvertTo-Json
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "status": "configured",
    "message": "MTN Mobile Money is properly configured",
    "provider": "mtn",
    "lastTested": "2024-01-15T10:30:00.000Z"
  }
}
```

- [ ] Returns `success: true`
- [ ] Status shows as "configured"
- [ ] Message is positive

### Test 6: Test Empty Provider (Should Fail)
```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/airtel/test" `
    -Method Post `
    -Headers $headers | ConvertTo-Json
```

**Expected:**
```json
{
  "success": false,
  "error": "Airtel credentials incomplete"
}
```

- [ ] Returns `success: false`
- [ ] Shows error about missing credentials

### Test 7: Invalid Provider
```powershell
Invoke-RestMethod `
    -Uri "$baseUrl/invalid/test" `
    -Method Post `
    -Headers $headers | ConvertTo-Json
```

**Expected:** 400 error or error message

- [ ] Returns error (either 400 or error in response)

### Test 8: No Authentication (Should Fail)
```powershell
Invoke-RestMethod -Uri $baseUrl
```

**Expected:** 401 Unauthorized

- [ ] Returns 401 error
- [ ] Does not allow access without token

### Test 9: Non-Admin User (Should Fail)
```powershell
# Use JWT token from non-admin user
$nonAdminToken = "NON_ADMIN_TOKEN"
$nonAdminHeaders = @{
    "Authorization" = "Bearer $nonAdminToken"
    "Content-Type" = "application/json"
}

Invoke-RestMethod -Uri $baseUrl -Headers $nonAdminHeaders
```

**Expected:** 403 Forbidden

- [ ] Returns 403 error
- [ ] Does not allow access to non-admin users

---

## 🎨 Frontend Component Tests

### Setup in Browser
1. Open DevTools (F12)
2. Go to Application → Local Storage
3. Verify `token` exists (you're logged in)
4. Navigate to `/admin/payment-settings`

### Test 1: Component Loads
- [ ] Page loads without errors
- [ ] No errors in console
- [ ] Shows "Loading payment settings..." initially
- [ ] After load, shows Payment Gateways tab
- [ ] Shows three tabs: Gateways, Security, Documentation

### Test 2: MTN Settings Display
- [ ] MTN card is visible
- [ ] Shows MTN Mobile Money title
- [ ] Shows "✓ Active" status badge
- [ ] Can click to expand
- [ ] Shows form fields when expanded:
  - Subscription Key (hidden with asterisks)
  - API User
  - API Key (hidden with asterisks)
  - Environment dropdown

### Test 3: Save MTN Settings
- [ ] Populate all fields
- [ ] Click "Save Settings"
- [ ] Shows loading state: "💾 Saving..."
- [ ] After success, shows green message: "✅ MTN settings saved successfully"
- [ ] Message auto-hides after 5 seconds

### Test 4: Test Connection Button
- [ ] With empty credentials, button is disabled
- [ ] With credentials filled, button is enabled
- [ ] Click "Test Connection"
- [ ] Shows: "⏳ Testing..."
- [ ] After success, shows: "✅ MTN connection successful!"

### Test 5: Other Providers
- [ ] Airtel card visible, shows "○ Inactive"
- [ ] PayPal card visible, shows "○ Inactive"
- [ ] Can expand and fill in their credentials too

### Test 6: Security Tab
- [ ] Click "Security" tab
- [ ] Shows encryption information
- [ ] Shows best practices
- [ ] Shows requirements for each provider

### Test 7: Documentation Tab
- [ ] Click "Documentation" tab
- [ ] Shows setup guides for each provider
- [ ] Links to developer portals work

### Test 8: Error Handling
- [ ] Try saving without filling all fields
- [ ] Should show error message
- [ ] Try testing with incomplete credentials
- [ ] Should show error message

### Test 9: Responsive Design
- [ ] Shrink browser window
- [ ] At tablet size (<768px):
  - [ ] Buttons stack vertically
  - [ ] Form looks good
  - [ ] Text is readable
- [ ] At mobile size (<480px):
  - [ ] Everything is accessible
  - [ ] No horizontal scroll
  - [ ] Input font size is 16px (no iOS zoom)

---

## 🔐 Security Tests

### Test 1: Encryption Verification
```sql
-- Check encrypted data format
SELECT LENGTH(mtn_data) as data_length FROM payment_settings;
-- Should be > 100 (includes IV + encrypted data)

-- Raw encrypted data should look like:
-- 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6:encrypted_hex_string'
```

- [ ] Data is stored in encrypted format
- [ ] Contains `:` separator (IV:encryptedData)
- [ ] Raw data is not readable

### Test 2: No Plaintext in Logs
```powershell
# Check backend logs while saving credentials
# Should NOT see your actual credentials printed
```

- [ ] Logs show success without exposing credentials
- [ ] Only show provider name and confirmation

### Test 3: API Response Security
```powershell
# Save and retrieve settings multiple times
Invoke-RestMethod -Uri $baseUrl -Headers $headers | ConvertTo-Json
```

- [ ] Frontend never receives actual credentials
- [ ] Only receives `configured: true/false` status
- [ ] No passwords or keys in API response

### Test 4: Cross-Origin (CORS)
```powershell
# Try accessing from different origin (should still work for localhost)
$response = Invoke-RestMethod -Uri $baseUrl -Headers $headers
```

- [ ] CORS properly configured
- [ ] Frontend can reach backend

---

## 🎯 Integration Tests

### Test 1: Full Flow - Save All Three Providers
```powershell
# Save MTN
$mtnBody = @{ ... } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/mtn" -Method Post -Headers $headers -Body $mtnBody

# Save Airtel (when you have credentials)
$airtelBody = @{ clientId = "...", clientSecret = "...", merchantId = "..." } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/airtel" -Method Post -Headers $headers -Body $airtelBody

# Save PayPal (when you have credentials)
$paypalBody = @{ clientId = "...", clientSecret = "..." } | ConvertTo-Json
Invoke-RestMethod -Uri "$baseUrl/paypal" -Method Post -Headers $headers -Body $paypalBody

# Get all settings
Invoke-RestMethod -Uri $baseUrl -Headers $headers | ConvertTo-Json
```

- [ ] All three save successfully
- [ ] Retrieve shows all as configured
- [ ] Each can be tested independently

### Test 2: Database Persistence
1. Save credentials
2. Restart backend server
3. Retrieve credentials again

- [ ] Credentials still exist after restart
- [ ] Data persists in database

### Test 3: Update Credentials
1. Save MTN with first set of credentials
2. Change one field
3. Save again

- [ ] Updated credentials work
- [ ] Old data is replaced
- [ ] Only one row in database

---

## 📋 Final Checklist

### Backend Ready
- [ ] All files created with no errors
- [ ] `server.js` has both import and route registration
- [ ] Routes use proper middleware: `authenticateToken, requireAdmin`
- [ ] No TypeErrors or SyntaxErrors on startup
- [ ] Database migration executed
- [ ] `payment_settings` table exists in MySQL
- [ ] All 9 API tests pass

### Frontend Ready
- [ ] Component file exists at correct path
- [ ] CSS file exists with proper styling
- [ ] Component imports `useAuth` from context
- [ ] Component mounted on payment settings page
- [ ] Can load and display settings
- [ ] Can save credentials to backend
- [ ] Can test connections
- [ ] All 9 UI tests pass

### Security
- [ ] Credentials encrypted with AES-256-CBC
- [ ] Admin-only access enforced
- [ ] No plaintext credentials in logs
- [ ] No sensitive data in API responses
- [ ] CORS properly configured
- [ ] JWT token required for all endpoints

### Ready for Production
- [ ] All tests passing
- [ ] No console errors
- [ ] Database properly configured
- [ ] Encryption keys set in `.env`
- [ ] Rate limiting configured
- [ ] Error handling working

---

## 🚀 Sign-Off

**Date Verified:** _______________

**Verified By:** _______________

**Backend Status:** ✅ Ready / ⚠️ Needs Work / ❌ Broken

**Frontend Status:** ✅ Ready / ⚠️ Needs Work / ❌ Broken

**Security Status:** ✅ Ready / ⚠️ Needs Work / ❌ Broken

**Overall Status:** ✅ Ready for Testing / ⚠️ Partial / ❌ Not Ready

**Notes:**
```
_________________________________________________________
_________________________________________________________
_________________________________________________________
```

---

**Template Version:** 1.0  
**Last Updated:** December 15, 2024
