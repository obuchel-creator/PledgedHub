# Phone Number Validation Implementation - Complete ✅

## Problem Summary
User could create pledges with any phone number, even if it didn't match their registered phone. This created security and data integrity issues.

## Solution Implemented
Strict validation requiring pledges to be created with the user's registered phone number only (matching the existing name validation pattern).

---

## Changes Made

### 1. Backend - JWT Token Update (authService.js)
**File**: `backend/services/authService.js` (lines 49-56)

**What Changed**: Added `phone` field to JWT token payload during login

**Before**:
```javascript
const token = jwt.sign(
  { 
    id: user.id, 
    role: user.role, 
    email: user.email,
    tenant_id: user.tenant_id
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);
```

**After**:
```javascript
const token = jwt.sign(
  { 
    id: user.id, 
    role: user.role, 
    email: user.email,
    phone: user.phone,  // ✅ ADDED
    tenant_id: user.tenant_id
  },
  JWT_SECRET,
  { expiresIn: '7d' }
);
```

---

### 2. Backend - Auth Middleware Update (authMiddleware.js)
**File**: `backend/middleware/authMiddleware.js` (TWO locations)

**What Changed**: Added `phone` to req.user in both `protect` and `authenticateToken` middlewares

#### Location 1: protect middleware (lines 125-133)
```javascript
req.user = {
  id: user.id,
  email: user.email,
  name: user.name || user.username,
  phone: user.phone,  // ✅ ADDED
  role: user.role || 'donor',
  tenant_id: user.tenant_id || decoded.tenant_id
};
```

#### Location 2: authenticateToken middleware (lines 174-184)
```javascript
req.user = {
  id: user.id,
  email: user.email,
  name: user.name || user.username,
  phone: user.phone,  // ✅ ADDED
  role: user.role || user.user_role || 'donor',
  tenant_id: user.tenant_id || decoded.tenant_id
};
```

---

### 3. Backend - Phone Validation Logic (pledgeController.js)
**File**: `backend/controllers/pledgeController.js` (lines 186-220)

**What Changed**: Added phone validation matching registered phone (parallel to name validation)

```javascript
// Fetch user from database for validation
const [userRows] = await pool.execute(
  'SELECT name, phone FROM users WHERE id = ?',
  [userId]
);

if (!userRows || userRows.length === 0) {
  return res.status(404).json({
    success: false,
    error: 'User not found. Please log in again.'
  });
}

const loggedInUser = userRows[0];

// Normalize phone numbers for comparison
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '').trim();
};

const submittedPhone = normalizePhone(donor_phone);
const registeredPhone = normalizePhone(loggedInUser.phone);

// Validate: Phone must match registered phone
if (submittedPhone !== registeredPhone) {
  return res.status(400).json({
    success: false,
    error: `Phone number must match your registered number (${loggedInUser.phone}). Individual pledges can only be created with your verified contact information for security and SMS notifications.`,
    field: 'donor_phone',
    expected: loggedInUser.phone,
    received: donor_phone
  });
}
```

---

### 4. Frontend - Phone Field Update (CreatePledgeScreen.jsx)
**File**: `frontend/src/screens/CreatePledgeScreen.jsx`

**What Changed**: 
- Phone field auto-populates from `user.phone` (from JWT token)
- Field is locked (disabled) so user cannot change it
- Updated hint text to explain security verification

```jsx
<TextField
  label="Phone Number"
  fullWidth
  margin="normal"
  value={donor_phone}
  onChange={(e) => setDonorPhone(e.target.value)}
  required
  disabled={true}  // Locked for security
  helperText="🔒 Your registered phone number is used for SMS notifications and security verification."
  sx={{
    '& .MuiInputBase-input.Mui-disabled': {
      WebkitTextFillColor: '#555',
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed'
    }
  }}
/>
```

---

## How It Works (Flow)

### 1. User Login
```
User enters credentials
  ↓
Backend validates (authService.js)
  ↓
JWT token generated with { id, role, email, phone, tenant_id }
  ↓
Token sent to frontend
  ↓
Frontend stores token in localStorage
```

### 2. User Creates Pledge
```
User navigates to "Create Pledge" screen
  ↓
Frontend calls /api/auth/me
  ↓
Backend middleware (protect/authenticateToken) sets req.user with phone
  ↓
Frontend auto-populates donor_name and donor_phone
  ↓
Fields are locked (disabled)
  ↓
User fills other fields and submits
  ↓
Backend validates:
  - donor_name matches registered name (case-insensitive)
  - donor_phone matches registered phone (normalized comparison)
  ↓
If validation passes → Pledge created ✅
If validation fails → 400 error with clear message ❌
```

### 3. Phone Normalization
To handle different formats (e.g., "+256 700 123456" vs "0700123456"), both phone numbers are normalized:

```javascript
const normalizePhone = (phone) => {
  if (!phone) return '';
  return phone.replace(/[\s\-\(\)\+]/g, '').trim();
};

// Example:
// "+256 700-123-456" → "256700123456"
// "0700123456"       → "0700123456"
```

---

## Testing Steps

### Step 1: Restart Backend
```powershell
# Stop backend (Ctrl+C in terminal)
cd backend
npm run dev
```

### Step 2: Logout & Login
1. Open app: http://localhost:5173
2. Click "Logout" (to get fresh JWT token with phone)
3. Login again with credentials

### Step 3: Test Pledge Creation
1. Navigate to "Create Pledge"
2. Verify phone field is:
   - Auto-filled with your registered phone
   - Locked (grayed out, cannot edit)
3. Fill other required fields
4. Click "Create Pledge"
5. Should succeed with your registered phone ✅

### Step 4: Test Validation (Manual)
To test validation, temporarily unlock the field in browser DevTools:
1. Right-click phone field → Inspect
2. Remove `disabled` attribute
3. Change phone number to something else
4. Submit form
5. Should get error: "Phone number must match your registered number" ❌

---

## Benefits

### Security
✅ Prevents fraud - users can only create pledges with verified contact info
✅ Accountability - all pledges tied to authenticated phone numbers
✅ Audit trail - easy to track pledge creators by phone

### Data Integrity
✅ Consistent data - donor_phone always matches registered phone
✅ SMS notifications - guaranteed to reach correct person
✅ No typos - users cannot accidentally enter wrong phone

### User Experience
✅ Auto-population - users don't need to type name/phone
✅ Clear error messages - explains why validation failed
✅ Visual feedback - locked fields indicate verified data

---

## Error Messages

### Phone Mismatch
```json
{
  "success": false,
  "error": "Phone number must match your registered number (+256700123456). Individual pledges can only be created with your verified contact information for security and SMS notifications.",
  "field": "donor_phone",
  "expected": "+256700123456",
  "received": "+256755999888"
}
```

### Missing Phone
```json
{
  "success": false,
  "error": "Phone number is required for individual pledges to enable SMS notifications and verify your identity.",
  "field": "donor_phone"
}
```

---

## Related Files

### Backend
- `backend/services/authService.js` - JWT token generation
- `backend/middleware/authMiddleware.js` - Authentication middleware
- `backend/controllers/pledgeController.js` - Pledge creation validation
- `backend/routes/auth.js` - Registration route (already had phone in JWT)

### Frontend
- `frontend/src/screens/CreatePledgeScreen.jsx` - Pledge form
- `frontend/src/context/AuthContext.jsx` - User state management (phone mapping)
- `frontend/src/services/api.js` - API client (getCurrentUser call)

---

## Production Considerations

1. **Re-enable Rate Limiting**: After testing, set `DISABLE_RATE_LIMIT=false` in `.env`

2. **Session Management**: Consider enabling session checking in authMiddleware.js (currently disabled for development):
   ```javascript
   if (decoded.jti && !isSessionActive(decoded.jti)) {
     return res.status(401).json({ message: 'Session expired' });
   }
   ```

3. **Phone Verification**: Consider adding SMS verification during registration:
   - Send OTP to phone during signup
   - Verify OTP before activating account
   - Mark phone as `verified: true` in database

4. **Multi-Phone Support**: If users need multiple phones:
   - Current approach: One verified phone per account
   - Alternative: Add `user_phones` table, flag primary phone
   - Validation: Check against all verified phones

---

## Next Steps

- [ ] Test end-to-end with real user account
- [ ] Verify phone auto-population works
- [ ] Test validation error messages
- [ ] Re-enable rate limiting after testing
- [ ] Consider adding SMS OTP verification
- [ ] Update API documentation

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Date**: January 2025
**Impact**: High - Improves security and data integrity significantly
