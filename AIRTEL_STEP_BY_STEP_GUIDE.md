# 🎯 Airtel Money API - Step-by-Step Setup Guide

**Current Status:** You have MTN configured ✅  
**Next:** Configure Airtel Money (this guide)  
**After:** PayPal setup

---

## ⏱️ Time Required: 20-30 minutes

---

## 📋 STEP 1: Visit Airtel Developer Portal

### What You'll Do:
Open Airtel's developer website and create a developer account

### Instructions:

1. **Go to:** https://developers.airtel.africa

2. **Look for "Sign Up" or "Get Started"** button (top right)

3. **Click it** to open registration form

4. **Fill in Registration Form:**
   - **Email:** Your email address (use a valid one)
   - **Password:** Create a strong password (12+ characters)
   - **Full Name:** Your full name
   - **Country:** Uganda 🇺🇬
   - **Company/Organization:** Your business name (or PledgeHub)

5. **Check the box:** "I agree to Terms & Conditions"

6. **Click "Sign Up" or "Create Account"**

### ✅ What to Expect:
- You'll see message: "Check your email for verification link"
- Email arrives in 1-2 minutes

---

## 📧 STEP 2: Verify Your Email

### What You'll Do:
Click the email verification link to activate your account

### Instructions:

1. **Check your email** (inbox or spam folder)

2. **Find email from:** Airtel Developer Portal

3. **Look for link:** "Verify Email Address" or similar

4. **Click the link** to confirm your email

5. **You'll be redirected** back to Airtel website

### ✅ What to Expect:
- Message: "Email verified successfully"
- You can now log in

---

## 🔐 STEP 3: Log In to Developer Portal

### What You'll Do:
Sign in to your Airtel developer account

### Instructions:

1. **Go back to:** https://developers.airtel.africa

2. **Click "Log In"** (top right)

3. **Enter:**
   - **Email:** Your email from Step 1
   - **Password:** Your password from Step 1

4. **Click "Log In"**

### ✅ What to Expect:
- You'll see developer dashboard
- Should have options like "Create App" or "My Apps"

---

## 📱 STEP 4: Create an Application

### What You'll Do:
Create an app to get API credentials for payments

### Instructions:

1. **On dashboard, look for:** "Create App" or "New Application" button

2. **Click it**

3. **Fill in Application Details:**

   | Field | Value |
   |-------|-------|
   | **App Name** | PledgeHub System |
   | **Description** | Pledge collection and payment system |
   | **Category** | Payments or Collections |
   | **Redirect URI** | http://localhost:5001/api/payments/airtel/callback |

4. **Click "Create" or "Create Application"**

### ✅ What to Expect:
- App is created
- You'll see a dashboard for your app
- You should now see credentials

---

## 🔑 STEP 5: Get Your Credentials

### What You'll Do:
Copy the three important credentials you'll need

### Instructions:

1. **On your app dashboard, look for:**
   - Client ID
   - Client Secret
   - Merchant ID

2. **For each one:**
   - Click **"Copy"** button (or select and Ctrl+C)
   - Paste into a text file temporarily

3. **You should have three things:**
   ```
   Client ID:     abc123def456ghi789
   Client Secret: xyz789uvw456rst123
   Merchant ID:   MERCHANT001
   ```

### ⚠️ Important:
- **Client Secret:** Click "Show" if it's hidden
- **Keep these safe!** Don't share them
- Copy them exactly as shown (no extra spaces)

### ✅ What You'll Get:
Three credential strings ready to use

---

## 🛠️ STEP 6: Update Your .env File

### What You'll Do:
Add Airtel credentials to your backend configuration

### Instructions:

1. **Open:** `backend/.env` (in your editor)

2. **Find or add these lines:**
   ```env
   # Airtel Money Sandbox Configuration
   AIRTEL_CLIENT_ID=your_client_id
   AIRTEL_CLIENT_SECRET=your_client_secret
   AIRTEL_MERCHANT_ID=your_merchant_id
   AIRTEL_PIN=1234
   AIRTEL_ENVIRONMENT=sandbox
   AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback
   ```

3. **Replace:**
   - `your_client_id` → Paste your Client ID
   - `your_client_secret` → Paste your Client Secret
   - `your_merchant_id` → Paste your Merchant ID

4. **Save the file** (Ctrl+S)

### Example:
```env
# What it should look like:
AIRTEL_CLIENT_ID=abc123def456ghi789
AIRTEL_CLIENT_SECRET=xyz789uvw456rst123
AIRTEL_MERCHANT_ID=MERCHANT001
AIRTEL_PIN=1234
AIRTEL_ENVIRONMENT=sandbox
AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback
```

### ✅ What to Verify:
- All three credentials are pasted correctly
- No extra spaces before or after values
- `AIRTEL_ENVIRONMENT=sandbox` (for testing)

---

## 🔄 STEP 7: Restart Backend

### What You'll Do:
Reload your backend server to load new environment variables

### Instructions:

**In PowerShell:**

1. **Go to backend folder:**
   ```powershell
   cd c:\Users\HP\PledgeHub\backend
   ```

2. **Stop current server:**
   - Press **Ctrl+C** in the terminal running `npm run dev`

3. **Restart:**
   ```powershell
   npm run dev
   ```

4. **Wait for message:**
   ```
   ✅ Server running on http://localhost:5001
   ```

### ✅ What to Expect:
- Server restarts without errors
- New environment variables are loaded
- Airtel should now be available

---

## 🧪 STEP 8: Test Your Setup

### What You'll Do:
Verify that Airtel is properly configured

### Test 1: Check Available Payment Methods

**In PowerShell:**

```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5001/api/payments/methods"
$response | ConvertTo-Json
```

**Expected Output:**
```json
{
  "success": true,
  "data": {
    "mtn": true,
    "airtel": true,
    "paypal": false
  }
}
```

✅ **If you see `"airtel": true`** → Airtel is configured! 🎉

---

### Test 2: Test Airtel Connection (Optional)

Using your Payment Settings UI:

1. **Go to:** http://localhost:5173/admin/payment-settings

2. **Expand "Airtel Money" section**

3. **Fill in:**
   - **Client ID:** (from your .env)
   - **Client Secret:** (from your .env)
   - **Merchant ID:** (from your .env)

4. **Click "Save Settings"**

5. **Click "Test Connection"**

✅ **Should show:** ✅ "Airtel Money is properly configured"

---

## 🎮 STEP 9: Make a Test Payment (Optional)

### What You'll Do:
Test actual payment flow in sandbox mode

### Test Phone Numbers (Always work in sandbox):

| Number | Result |
|--------|--------|
| 256700123456 | Payment succeeds |
| 256700123457 | Insufficient balance |
| 256700123458 | User declines |

### Make Test Payment:

**In PowerShell:**

```powershell
$body = @{
    pledgeId = 1
    phoneNumber = "256700123456"
    amount = 50000
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Uri "http://localhost:5001/api/payments/airtel/initiate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "transactionId": "OMUK-1...",
    "airtelTransactionId": "ART123456789",
    "status": "PENDING",
    "message": "Payment request sent"
  }
}
```

✅ **Status: PENDING** means request was accepted

---

## ✅ Verification Checklist

Before moving on, verify:

- [ ] Created Airtel developer account
- [ ] Created application
- [ ] Got three credentials (Client ID, Secret, Merchant ID)
- [ ] Added credentials to `.env` file
- [ ] Restarted backend server
- [ ] Checked payment methods (airtel: true)
- [ ] Saved settings in Payment Settings UI (optional)
- [ ] Test connection shows success (optional)

---

## 🎯 Success Indicators

### ✅ You'll Know It's Working When:

1. **Backend shows no errors** when starting
2. **Payment methods API shows `"airtel": true`**
3. **Payment Settings UI can save Airtel credentials**
4. **Test Connection button shows success**
5. **Test payment returns PENDING status**

---

## ⚠️ Common Issues & Fixes

### "Airtel not configured" Error
**Fix:** Check all AIRTEL_* variables are in .env file (Step 6)

### "Authentication Failed" Error
**Fix:** 
- Copy credentials again (check for spaces)
- Verify Client ID and Secret are correct
- Regenerate credentials in Airtel portal if needed

### Server won't restart
**Fix:**
- Check for typos in .env file
- Ensure closing quotes on all values
- Restart PowerShell terminal

### Can't find "Create App" button
**Fix:** Look for:
- "New Application"
- "Create Application"
- "My Apps" → then "Create"

---

## 📊 What You Have Now

| Provider | Status |
|----------|--------|
| **MTN** | ✅ Configured |
| **Airtel** | ✅ Configured (this step) |
| **PayPal** | ⏳ Next |

---

## 🚀 Next Step

Once Airtel is working:

**[See PayPal Setup Guide](./PAYPAL_SETUP_GUIDE.md)**

---

## 📞 Need Help?

**Issue:** Can't find credentials  
**Solution:** In Airtel Developer Portal → Your App → Settings

**Issue:** Server won't start  
**Solution:** Check syntax in .env file (no quotes needed)

**Issue:** Test payment fails  
**Solution:** Use test number: 256700123456

---

## 💡 Key Points

- ✅ Use **sandbox** for testing (it's free and safe)
- ✅ Test phone numbers always work (no real Airtel account needed)
- ✅ Credentials go in `.env` file (never in code)
- ✅ Restart backend after updating .env
- ✅ Each provider is independent (MTN doesn't affect Airtel)

---

**Status: READY TO CONFIGURE AIRTEL** 🚀

Start with Step 1 and follow each step in order. Should take about 20-30 minutes total.

Let me know when you complete each step or if you have questions!
