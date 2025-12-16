# Payment Integration Setup - Quick Start Guide

This guide helps you configure PayPal, MTN Mobile Money, and Airtel Money payments for PledgeHub.

---

## 🎯 Quick Summary

Your `backend/.env` file currently has these payment credentials **EMPTY**:

```env
# PayPal (EMPTY ❌)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=

# MTN Mobile Money (EMPTY ❌)
MTN_SUBSCRIPTION_KEY=
MTN_API_USER=
MTN_API_KEY=

# Airtel Money (EMPTY ❌)
AIRTEL_CLIENT_ID=
AIRTEL_CLIENT_SECRET=
AIRTEL_MERCHANT_ID=
```

This document shows you **exactly how to get each credential**.

---

## 1️⃣ PayPal Setup (5 minutes)

### Step 1: Go to PayPal Developer Dashboard
- Visit: https://developer.paypal.com
- Click "Sign In" (top right)
- Log in with your PayPal account (create one if needed)

### Step 2: Create Sandbox App
- In dashboard, click **"Apps & Credentials"** (top menu)
- Make sure you're on the **"Sandbox"** tab
- Click **"Create App"**
- Name it: `PledgeHub`
- Click **"Create App"**

### Step 3: Copy Credentials
- After creation, you'll see a table with your app
- Under "Sandbox API Signature", you'll see:
  - **Client ID** (starts with `A...`)
  - **Secret** (click "Show" to reveal)
- Copy both values to your `.env`:

```env
PAYPAL_CLIENT_ID=A1b2C3d4E5f6G7h8I9j0k1L2M3N4O5P6...
PAYPAL_CLIENT_SECRET=xyz789uvw456rst123abc...
PAYPAL_MODE=sandbox
```

### Step 4: Create Test Account
- In dashboard, click **"Sandbox Accounts"** (under Testing Tools)
- Click **"Create Account"**
- Type: **Personal**
- Email: Auto-generated (save it!)
- Default balance: $1000
- Click **"Create"**
- Save the email and password - use it to test payments

✅ **Done! PayPal is ready for testing**

---

## 2️⃣ MTN Mobile Money Setup (10 minutes)

### Step 1: Register on MTN Developer Portal
- Visit: https://momodeveloper.mtn.com
- Click **"Sign Up"**
- Fill form:
  - Email
  - Password (strong)
  - First & Last Name
  - Country: **Uganda**
- Click **"Register"**
- Verify email (check inbox)
- Log in

### Step 2: Subscribe to Collection Product
- Click **"Products"** (in dashboard)
- Find **"Collection"** (for receiving payments)
- Click **"Subscribe"**
- Accept terms
- You'll get a **Primary Key** (Subscription Key)
- Copy it: 

```env
MTN_SUBSCRIPTION_KEY=your_primary_key_here
```

### Step 3: Create API User & Key
Open **PowerShell** on your computer and run these commands:

```powershell
# Set your subscription key from Step 2
$subscriptionKey = "PASTE_YOUR_PRIMARY_KEY_HERE"

# Generate a unique API User ID
$apiUser = [guid]::NewGuid().ToString()

# Create the API User
$response = Invoke-RestMethod -Uri "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser" `
  -Method POST `
  -Headers @{
    "X-Reference-Id" = $apiUser
    "Ocp-Apim-Subscription-Key" = $subscriptionKey
  } `
  -Body '{"providerCallbackHost": "webhook.site"}' `
  -ContentType "application/json"

Write-Host "✅ API User Created: $apiUser"

# Now create API Key for this user
$apiKeyResponse = Invoke-RestMethod `
  -Uri "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/$apiUser/apikey" `
  -Method POST `
  -Headers @{
    "Ocp-Apim-Subscription-Key" = $subscriptionKey
  } `
  -ContentType "application/json"

$apiKey = $apiKeyResponse.apiKey
Write-Host "✅ API Key: $apiKey"
```

**Copy the output and save it:**

```env
MTN_SUBSCRIPTION_KEY=your_primary_key_from_step_2
MTN_API_USER=api_user_id_from_powershell_output
MTN_API_KEY=api_key_from_powershell_output
MTN_ENVIRONMENT=sandbox
MTN_CALLBACK_URL=http://localhost:5001/api/payments/mtn/callback
```

### Step 4: Test with Sandbox Phone
To test MTN payments, you need a test phone number:
- Go back to MTN Developer Portal
- Find your sandbox test account details
- Use phone: `256700000000` (sandbox test number)
- Amount: 100 UGX (very small to test)

✅ **Done! MTN is ready for testing**

---

## 3️⃣ Airtel Money Setup (10 minutes)

### Step 1: Register on Airtel Developer Portal
- Visit: https://developers.airtel.africa
- Click **"Sign Up"** or **"Get Started"**
- Fill form:
  - Email
  - Password (strong)
  - Full Name
  - Country: **Uganda**
  - Company/Organization
- Click **"Create Account"**
- Verify email (check inbox)
- Log in

### Step 2: Create App
- Click **"Create App"** or **"New Application"**
- Fill in:
  - **App Name**: `PledgeHub`
  - **Description**: Pledge collection system
  - **Category**: Payments
  - **Redirect URL**: `http://localhost:5001/api/payments/airtel/callback`
- Click **"Create"**

### Step 3: Copy Credentials
- After creation, you'll see:
  - **Client ID**
  - **Client Secret** (click "Show")
  - **Merchant ID**
- Copy all three to `.env`:

```env
AIRTEL_CLIENT_ID=your_client_id_here
AIRTEL_CLIENT_SECRET=your_client_secret_here
AIRTEL_MERCHANT_ID=your_merchant_id_here
AIRTEL_PIN=0000
AIRTEL_ENVIRONMENT=sandbox
AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback
```

### Step 4: Test with Sandbox Phone
- Use phone: `256700000000` (sandbox test number)
- Amount: 100 UGX (very small to test)
- PIN: `0000` (default sandbox PIN)

✅ **Done! Airtel is ready for testing**

---

## 📝 Complete Environment File Template

After completing all three setups, your `.env` should look like:

```env
# PayPal
PAYPAL_CLIENT_ID=A1b2C3d4E5f6G7h8I9j0k1L2M3N4O5P6...
PAYPAL_CLIENT_SECRET=xyz789uvw456rst123abc...
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=

# MTN Mobile Money
MTN_SUBSCRIPTION_KEY=abcd1234efgh5678ijkl9012mnop3456
MTN_API_USER=12345678-1234-1234-1234-123456789012
MTN_API_KEY=abcd1234efgh5678ijkl9012mnop3456
MTN_ENVIRONMENT=sandbox
MTN_CALLBACK_URL=http://localhost:5001/api/payments/mtn/callback

# Airtel Money
AIRTEL_CLIENT_ID=your_client_id_here
AIRTEL_CLIENT_SECRET=your_client_secret_here
AIRTEL_MERCHANT_ID=your_merchant_id_here
AIRTEL_PIN=0000
AIRTEL_ENVIRONMENT=sandbox
AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback
```

---

## ✅ Testing Payments

Once credentials are in `.env`, restart your backend:

```powershell
# Stop current backend (Ctrl+C in the terminal)
# Then restart:
cd backend
npm run dev
```

You should see:
```
✓ PayPal payments enabled
✓ MTN Mobile Money payments enabled
✓ Airtel Money payments enabled
```

### Test in UI:
1. Create a pledge on http://localhost:5173
2. Go to "Make Payment"
3. Select "PayPal" or "Mobile Money"
4. Choose test account/phone
5. Complete payment flow

---

## 🔧 Troubleshooting

### "Invalid credentials"
- Double-check you copied the exact text (no spaces)
- Make sure you're using **Sandbox** credentials (not Live)

### "PayPal payment not working"
- Ensure `PAYPAL_MODE=sandbox`
- Check Client ID starts with `A`

### "MTN payment not working"
- Make sure Primary Key is from "Collection" product (not other products)
- Test phone must be sandbox format: `256700000000`
- Amount in UGX (1 USD ≈ 3,600 UGX)

### "Airtel payment not working"
- Verify Client ID and Secret match exactly
- Test phone must be sandbox format: `256700000000`
- PIN is usually `0000` in sandbox

---

## 📚 More Details

For detailed setup instructions, see:
- [PAYPAL_SETUP_GUIDE.md](PAYPAL_SETUP_GUIDE.md) - Full PayPal guide
- [MTN_SETUP_GUIDE.md](MTN_SETUP_GUIDE.md) - Full MTN guide  
- [AIRTEL_SETUP_GUIDE.md](AIRTEL_SETUP_GUIDE.md) - Full Airtel guide

---

**Last Updated:** December 16, 2025
