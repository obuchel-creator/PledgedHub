# PledgeHub Testing Checklist - Post-Code Audit

After comprehensive code fixes, use this checklist to validate all systems are working correctly.

## Pre-Testing Setup

### ✓ Prerequisites
- [ ] All code fixes applied (8 bugs fixed)
- [ ] `.env` files configured (backend & frontend)
- [ ] Database initialized: `node backend/scripts/complete-migration.js`
- [ ] Node modules installed: `npm install` in both backend and frontend directories
- [ ] MySQL running and accessible

### ✓ Service Check
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev

# Terminal 3 - Tests
.\test-pledgehub.ps1
```

Expected output: Backend on port 5001, Frontend on port 5173

---

## Automated Test Suite

### ✓ Run PowerShell Test Script
```powershell
.\test-pledgehub.ps1
```

**Expected Results:**
- [ ] Health Check ✓
- [ ] User Registration ✓
- [ ] User Login ✓
- [ ] Create Pledge ✓
- [ ] Get Pledges ✓
- [ ] Get Pledge by ID ✓
- [ ] Unauthorized Access Blocked ✓
- [ ] Invalid Input Validation ✓
- [ ] Response Format Valid ✓

**All 9+ tests should PASS**

---

## Manual Functional Testing

### 1. Authentication Flow

#### Register New User
- [ ] Navigate to http://localhost:5173/register
- [ ] Enter valid email, password, name, phone
- [ ] **EXPECTED**: Registration succeeds, redirects to login
- [ ] **ERROR CASE**: Submit empty email → Shows validation error

#### Login
- [ ] Navigate to http://localhost:5173/login
- [ ] Enter registered credentials
- [ ] **EXPECTED**: Login succeeds, JWT token saved to localStorage
- [ ] Verify in browser DevTools → Application → LocalStorage → `token`
- [ ] **ERROR CASE**: Wrong password → Shows "Invalid credentials" error

#### Session Persistence
- [ ] Log in successfully
- [ ] Refresh page (F5)
- [ ] **EXPECTED**: Still logged in, no redirect to login
- [ ] Verify in DevTools Console: `localStorage.getItem('token')` returns valid JWT

#### Logout
- [ ] Click logout in navbar
- [ ] **EXPECTED**: Redirected to login page, localStorage cleared
- [ ] Verify: `localStorage.getItem('token')` returns null

### 2. Pledge Management

#### Create Pledge
- [ ] Click "New Pledge" button
- [ ] Fill form:
  - [ ] Title: "Test Pledge - Education"
  - [ ] Amount: 50000
  - [ ] Donor Phone: +256700000000
  - [ ] Collection Date: 30 days from now
  - [ ] Purpose: "School Fees"
- [ ] Click Submit
- [ ] **EXPECTED**: Success message, pledge appears in list
- [ ] **ERROR CASE**: Empty amount → Shows "Amount is required"
- [ ] **ERROR CASE**: Invalid phone → Shows "Invalid phone format"

#### View Pledges
- [ ] Navigate to Pledges page
- [ ] **EXPECTED**: List shows all created pledges with correct data
- [ ] Verify columns: Title, Amount, Status, Donor, Collection Date
- [ ] **ERROR CASE**: Unlogged in user → Redirected to login

#### View Pledge Details
- [ ] Click on any pledge in list
- [ ] **EXPECTED**: Detailed view shows all fields
  - [ ] Pledge title and amount
  - [ ] Donor information
  - [ ] Collection date
  - [ ] Current payment status
  - [ ] Payment history (if any)
  - [ ] Remaining balance

#### Update Pledge
- [ ] Click Edit button on pledge details
- [ ] Modify title or amount
- [ ] Click Save
- [ ] **EXPECTED**: Changes saved, detail view updated
- [ ] **ERROR CASE**: Invalid amount (negative) → Shows validation error

#### Delete Pledge
- [ ] Click Delete button on pledge
- [ ] Confirm deletion
- [ ] **EXPECTED**: Pledge removed from list
- [ ] Verify database: Record has `deleted_at` timestamp (soft delete)

### 3. Database Operations

#### Verify Pool.execute() Fixes
```javascript
// Backend console should show no errors related to:
// - pool.query() is not a function
// - Cannot read property 'length' of undefined

// Look for these SUCCESS messages in logs:
// "✓ Pledge created successfully"
// "✓ User profile fetched"
// "✓ Payment recorded successfully"
```

#### Check Soft Delete Enforcement
```sql
-- In MySQL Workbench
SELECT id, title, deleted_at FROM pledges WHERE id = 123;
-- Result: deleted_at should have timestamp after deletion

SELECT id, title FROM pledges WHERE deleted_at IS NULL;
-- Result: Deleted pledges should NOT appear
```

#### Verify Database Queries
- [ ] Create pledge → Record appears in DB
- [ ] Update pledge → Changes appear in DB
- [ ] Delete pledge → `deleted_at` is set
- [ ] Query pledges → Only non-deleted records returned

### 4. API Error Handling

#### 400 Bad Request
```bash
curl -X POST http://localhost:5001/api/pledges \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "", "amount": "invalid"}'
```
**EXPECTED**: Status 400 with error message

#### 401 Unauthorized
```bash
curl http://localhost:5001/api/pledges
```
**EXPECTED**: Status 401 with "Unauthorized" message

#### 404 Not Found
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/pledges/99999
```
**EXPECTED**: Status 404 with "Pledge not found" message

#### Response Format
All responses should have:
```json
{
  "success": true/false,
  "data": {...},           // On success
  "error": "message",      // On failure
  "timestamp": "ISO-8601"
}
```

### 5. CORS Security

#### Valid Origin (Frontend)
- [ ] Frontend http://localhost:5173 can call backend APIs
- [ ] No CORS errors in browser console

#### Invalid Origin
- [ ] Open browser DevTools Console
- [ ] Run:
```javascript
fetch('http://localhost:5001/api/pledges', {
  headers: {'Authorization': 'Bearer ' + localStorage.getItem('token')}
})
```
**From localhost:5173: EXPECTED SUCCESS**
**From other origin: EXPECTED CORS ERROR**

### 6. Input Validation

#### Phone Number Validation
Test cases:
- [ ] "+256700000000" → VALID
- [ ] "0700000000" → VALID
- [ ] "256700000000" → VALID
- [ ] "12345" → INVALID
- [ ] "abc" → INVALID

#### Email Validation
Test cases:
- [ ] "user@example.com" → VALID
- [ ] "invalid.email" → INVALID
- [ ] "" (empty) → INVALID

#### Amount Validation
Test cases:
- [ ] "50000" → VALID
- [ ] "-100" → INVALID (negative)
- [ ] "abc" → INVALID
- [ ] "0" → INVALID (must be > 0)

#### Password Validation
Test cases:
- [ ] "ValidPass123!" → VALID (8+ chars, upper, lower, number)
- [ ] "weakpass" → INVALID (no uppercase/number)
- [ ] "Pass1" → INVALID (too short)

### 7. Logging Output

#### Check Backend Logs
Terminal running `npm run dev` should show:
- [ ] No "pool.query is not a function" errors
- [ ] No undefined reference errors
- [ ] No excessive debug console.log statements
- [ ] Clean request/response logs from new logger

#### Verify Logger Levels
```javascript
// In code: logger.error, logger.warn, logger.info, logger.debug
// In console: Colored output based on LOG_LEVEL env var
// Default: DEBUG in dev, INFO in prod
```

### 8. Session Management

#### Session Persistence
- [ ] Log in
- [ ] Check browser Storage → Cookies → connect.sid
- [ ] **EXPECTED**: Session cookie present with httpOnly flag
- [ ] Close browser window
- [ ] Reopen browser, navigate to app
- [ ] **EXPECTED**: Session restored, can access protected routes

#### Session Timeout
- [ ] Log in
- [ ] Wait for session to expire (maxAge: 24 hours in production)
- [ ] Try to access protected route
- [ ] **EXPECTED**: Redirected to login

### 9. Payment Tracking (If enabled)

#### Record Payment
- [ ] Create pledge for 100,000 UGX
- [ ] Go to pledge details
- [ ] Record payment of 50,000 UGX
- [ ] **EXPECTED**: 
  - [ ] Payment recorded in database
  - [ ] Balance updates to 50,000 UGX
  - [ ] Payment history shows transaction

#### Soft Delete Verified
- [ ] Payment records should persist even if pledge deleted
- [ ] Payment table should have no deleted_at filter (payments are immutable)

---

## Performance Testing

### Response Times
- [ ] List 100 pledges → < 200ms
- [ ] Create new pledge → < 500ms
- [ ] Update pledge → < 300ms
- [ ] Search pledges → < 300ms

### Memory Usage
- [ ] Backend running for 5+ minutes
- [ ] No memory leak (Task Manager → Node.js process)
- [ ] No accumulating console errors

### Database Queries
```bash
# Enable MySQL slow query log
SET GLOBAL slow_query_log = 'ON';

# Review log for queries > 1 second
SELECT * FROM mysql.general_log;
```

---

## Security Testing

### SQL Injection Prevention
```bash
# Try to inject SQL
curl -X POST http://localhost:5001/api/pledges \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title": "'; DROP TABLE pledges; --", ...}'
```
**EXPECTED**: Treated as literal string, not executed

### XSS Prevention
- [ ] Create pledge with title: `<script>alert('XSS')</script>`
- [ ] **EXPECTED**: Script tag rendered as text, not executed
- [ ] Check response headers: `X-XSS-Protection` present

### Rate Limiting
```bash
# Rapid requests from auth endpoint
for i in {1..10}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```
**EXPECTED**: After 5 attempts, requests rejected with 429 Too Many Requests

### CSRF Protection
- [ ] All POST/PUT/DELETE requests include CSRF token
- [ ] Verify token validation in middleware

---

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (macOS - if available)

**Expected**: No console errors, all features work

---

## Troubleshooting

### Backend Won't Start
```bash
# Check if port 5001 is in use
netstat -ano | findstr :5001

# Check environment variables
Get-Content backend\.env | Select-String "DB_" 

# Verify MySQL connection
mysql -u root -p

# Check Node version (should be 18+)
node --version
```

### Database Connection Error
```javascript
// Test direct connection
node -e "const mysql = require('mysql2/promise'); 
mysql.createPool({host: 'localhost', user: 'root', password: 'YOUR_PASS', database: 'pledgehub_db'})
  .then(() => console.log('✓ Connected'))
  .catch(err => console.log('✗ Error:', err.message))"
```

### CORS Errors
- [ ] Verify frontend URL in CORS whitelist
- [ ] Check `backend/.env` has correct values
- [ ] Restart backend after .env changes

### JWT Token Invalid
- [ ] Verify `JWT_SECRET` is set in `.env`
- [ ] Token format: `Authorization: Bearer <token>` (with space)
- [ ] Check token hasn't expired

---

## Sign-Off

**Date Tested**: _______________  
**Tester Name**: _______________  
**Browser/OS**: _______________  
**Total Tests Passed**: ___ / ___  
**Critical Issues Found**: [ ] None  [ ] Yes - Details: _______________  
**Ready for Production**: [ ] Yes  [ ] No - Reason: _______________  

---

## Test Results Log

```
Session 1: [Tester] [Date] [Result: PASS/FAIL]
- Health Check: PASS
- Auth Flow: PASS
- Pledge CRUD: PASS
- Database: PASS
- Security: PASS
- Performance: PASS
- Notes: _______________

Session 2: [Tester] [Date] [Result: PASS/FAIL]
...
```

---

**All tests passing = Application ready for deployment! 🚀**
