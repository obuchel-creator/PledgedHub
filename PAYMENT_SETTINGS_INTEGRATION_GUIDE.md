# 🎯 Payment Settings Backend Integration - Complete Guide

## ✅ What's Been Completed

### Backend Files Created
1. **`backend/services/paymentSettingsService.js`** - Business logic layer
   - `getPaymentSettings()` - Retrieves encrypted credentials
   - `savePaymentSettings(provider, credentials)` - Encrypts and stores
   - `testPaymentGateway(provider)` - Validates configuration
   - AES-256-CBC encryption for sensitive data

2. **`backend/routes/paymentSettingsRoutes.js`** - API endpoints
   - `GET /api/payment-settings` - Fetch all settings (admin only)
   - `POST /api/payment-settings/:provider` - Save provider credentials
   - `POST /api/payment-settings/:provider/test` - Test connection
   - `GET /api/payment-settings/:provider/status` - Check status

3. **`backend/scripts/migration-payment-settings.js`** - Database setup
   - Creates `payment_settings` table
   - Three encrypted data columns (mtn_data, airtel_data, paypal_data)
   - Timestamps and audit fields

### Frontend Files Created
1. **`frontend/src/screens/PaymentSettingsScreenIntegrated.jsx`** - React component
   - Professional admin UI (MTN portal style)
   - Expandable sections for each provider
   - Real-time API integration
   - Form validation and error handling
   - Success/error messaging

2. **`frontend/src/screens/PaymentSettingsScreen.css`** - Professional styling
   - Responsive design
   - Tabs for Gateways, Security, Documentation
   - Smooth animations
   - Mobile-friendly layout

### Server Configuration
- ✅ Updated `backend/server.js` to import and register payment settings routes
- ✅ Routes protected with `authenticateToken` and `requireAdmin` middleware
- ✅ Follows security best practices

---

## 🚀 Setup Instructions

### Step 1: Execute Database Migration

Run the migration script to create the `payment_settings` table:

```powershell
cd backend
node scripts/migration-payment-settings.js
```

**Expected Output:**
```
🔧 Payment Settings Migration
════════════════════════════════════════
⏳ Creating payment_settings table...
✅ payment_settings table created successfully
📊 Current records: 0
════════════════════════════════════════
✅ Migration completed successfully
```

**Verify in MySQL:**
```sql
USE pledgehub_db;
DESCRIBE payment_settings;
```

You should see:
- `id` (INT, PRIMARY KEY)
- `mtn_data` (LONGTEXT, encrypted)
- `airtel_data` (LONGTEXT, encrypted)
- `paypal_data` (LONGTEXT, encrypted)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Step 2: Verify Backend Routes

Check that routes are properly registered in `backend/server.js`:

```javascript
// Line ~23: Import statement
const paymentSettingsRoutes = require('./routes/paymentSettingsRoutes');

// Line ~146-150: Route registration
app.use('/api/payment-settings',
  authenticateToken,
  requireAdmin,
  paymentSettingsRoutes
);
```

✅ Both should be in place (already done)

### Step 3: Verify Frontend Component

Ensure the React component is available:

```
✅ frontend/src/screens/PaymentSettingsScreenIntegrated.jsx
✅ frontend/src/screens/PaymentSettingsScreen.css
```

### Step 4: Add Route to Frontend Navigation

In `frontend/src/screens/NavBar.jsx` or your routing setup, add a link to payment settings:

```jsx
// If using React Router
import PaymentSettingsScreen from './PaymentSettingsScreenIntegrated';

// In your route definitions:
<Route path="/admin/payment-settings" element={<PaymentSettingsScreen />} />

// In navigation menu (admin only):
{isAdmin && (
  <Link to="/admin/payment-settings">⚙️ Payment Settings</Link>
)}
```

---

## 🧪 Testing the Integration

### Test 1: Verify API is Running

```powershell
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Test endpoint (should require auth)
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}

$response = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/payment-settings" `
    -Headers $headers

$response | ConvertTo-Json
```

### Test 2: Save MTN Settings

```powershell
$mtnData = @{
    subscriptionKey = "003a382ff7dc4443b076c9096dd82032"
    apiUser = "92360f76-a4da-4ea6-af2f-fe559e59f20c"
    apiKey = "a5b00ad48bd14ad181771d10dff29a43"
    environment = "sandbox"
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/payment-settings/mtn" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer YOUR_JWT_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $mtnData

$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "message": "mtn settings saved successfully",
    "provider": "mtn"
  }
}
```

### Test 3: Retrieve Settings

```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/payment-settings" `
    -Headers @{
        "Authorization" = "Bearer YOUR_JWT_TOKEN"
    }

$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "mtn": {
      "configured": true
    },
    "airtel": {
      "configured": false
    },
    "paypal": {
      "configured": false
    }
  }
}
```

### Test 4: Test Gateway Connection

```powershell
$response = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/payment-settings/mtn/test" `
    -Method Post `
    -Headers @{
        "Authorization" = "Bearer YOUR_JWT_TOKEN"
    }

$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "status": "configured",
    "message": "MTN Mobile Money is properly configured",
    "provider": "mtn",
    "lastTested": "2024-01-15T10:30:00Z"
  }
}
```

---

## 🔐 Security Notes

### Encryption
- **Algorithm:** AES-256-CBC
- **Key Source:** `ENCRYPTION_KEY` from `.env` (or derived from `JWT_SECRET`)
- **IV Generation:** Random 16-byte initialization vector per save
- **Storage:** LONGTEXT columns store `iv:encryptedData`

### Access Control
- **Authentication:** All endpoints require valid JWT token
- **Authorization:** Only admins can access payment settings
- **No Sensitive Data:** Frontend never receives decrypted credentials
- **Audit Trail:** `created_by` and timestamps track who made changes

### .env Variables

Ensure your `.env` file has:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=pledgehub_db

# Authentication
JWT_SECRET=your_secret_key
SESSION_SECRET=your_session_secret

# Encryption (optional, falls back to JWT_SECRET)
ENCRYPTION_KEY=your_32_byte_hex_key

# Payment Credentials (from your MTN setup)
MTN_SUBSCRIPTION_KEY=003a382ff7dc4443b076c9096dd82032
MTN_API_USER=92360f76-a4da-4ea6-af2f-fe559e59f20c
MTN_API_KEY=a5b00ad48bd14ad181771d10dff29a43
MTN_ENVIRONMENT=sandbox

# (Add AIRTEL_* and PAYPAL_* when configured)
```

---

## 📊 Database Schema

```sql
CREATE TABLE payment_settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  mtn_data LONGTEXT NULL COMMENT 'Encrypted MTN Mobile Money credentials',
  airtel_data LONGTEXT NULL COMMENT 'Encrypted Airtel Money credentials',
  paypal_data LONGTEXT NULL COMMENT 'Encrypted PayPal credentials',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
```

---

## 🎨 Frontend Integration

### Component Features

1. **Professional UI**
   - MTN Developer Portal-style design
   - Three tabs: Payment Gateways, Security, Documentation
   - Expandable credential sections for each provider

2. **Real-time API Integration**
   - Loads existing credentials on mount
   - Saves to backend with encryption
   - Tests gateway connections
   - Auto-hides success messages after 5 seconds

3. **Form Validation**
   - Prevents saving empty credentials
   - Tests require credentials to be present
   - User-friendly error messages

4. **Responsive Design**
   - Works on desktop and mobile
   - Touch-friendly buttons and inputs
   - Proper font sizes on mobile (prevents zoom)

### Component Usage

```jsx
import PaymentSettingsScreen from './PaymentSettingsScreenIntegrated';

// In your routes:
<Route path="/admin/settings/payment" element={<PaymentSettingsScreen />} />

// Or in your admin dashboard:
<PaymentSettingsScreen />
```

### Props
- None (uses `AuthContext` for JWT token)
- Uses `localStorage` for token storage (via `AuthContext`)

### State Management
- `activeTab` - Currently selected tab
- `loading` - Initial data load state
- `saving` - Individual provider save states
- `testing` - Individual provider test states
- `mtnData`, `airtelData`, `paypalData` - Form data
- `expandedProvider` - Which provider section is open
- `message` - Success/error notifications

---

## 🔗 API Endpoints Summary

### Get All Settings
```
GET /api/payment-settings
Authorization: Bearer {token}
Role Required: admin
```

### Save Provider Settings
```
POST /api/payment-settings/:provider
Authorization: Bearer {token}
Role Required: admin
Body: { subscriptionKey, apiUser, apiKey } (for MTN)
```

### Test Gateway Connection
```
POST /api/payment-settings/:provider/test
Authorization: Bearer {token}
Role Required: admin
```

### Get Provider Status
```
GET /api/payment-settings/:provider/status
Authorization: Bearer {token}
Role Required: admin
```

---

## 🚨 Troubleshooting

### Error: "Table doesn't exist"
**Solution:** Run the migration script
```powershell
node backend/scripts/migration-payment-settings.js
```

### Error: "Invalid provider"
**Solution:** Provider must be one of: `mtn`, `airtel`, `paypal` (lowercase)

### Error: "Only admins can access"
**Solution:** Ensure your user has `role: 'admin'` in the database or JWT token

### Error: "Credentials incomplete"
**Solution:** Make sure all required fields are filled in:
- **MTN:** subscriptionKey, apiUser, apiKey
- **Airtel:** clientId, clientSecret, merchantId
- **PayPal:** clientId, clientSecret

### Decryption Errors
**Solution:** Check that `ENCRYPTION_KEY` is consistent (don't change it after saving credentials)

---

## ✨ Next Steps

### For Complete Payment Integration:

1. **Verify Airtel Setup**
   - Get ngrok running for HTTPS callbacks
   - Obtain Airtel credentials
   - Save via Payment Settings UI

2. **Configure PayPal**
   - Create PayPal Developer account
   - Get Client ID and Secret
   - Save via Payment Settings UI

3. **Test Payments**
   - Create test pledge
   - Initiate payment with each provider
   - Verify webhook callbacks work

4. **Production Setup**
   - Switch MTN environment to `production`
   - Get production credentials for Airtel and PayPal
   - Update settings with production keys
   - Test thoroughly before launching

---

## 📚 Related Documentation

- [Payment Setup Quickstart](./PAYMENT_SETUP_QUICKSTART.md)
- [Security Guidelines](./GITHUB_SECURITY_COMPLETE_GUIDE.md)
- [MTN Setup Guide](./MTN_SETUP_GUIDE.md)
- [Airtel Setup Guide](./AIRTEL_SETUP_GUIDE.md)
- [PayPal Setup Guide](./PAYPAL_SETUP_GUIDE.md)

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] Migration executed successfully
- [ ] `payment_settings` table exists in database
- [ ] Routes imported in `server.js`
- [ ] Routes registered in `server.js`
- [ ] Frontend component added to app
- [ ] Navigation link added (admin only)
- [ ] Can save MTN settings
- [ ] Can retrieve settings (without sensitive data)
- [ ] Can test gateway connection
- [ ] Error handling works
- [ ] Success messages display
- [ ] Security: Only admins can access
- [ ] Security: Credentials are encrypted
- [ ] Security: No sensitive data in API responses

---

**Status:** ✅ Backend Integration Complete
**Last Updated:** December 15, 2024
**Ready For:** Testing and Airtel/PayPal setup completion
