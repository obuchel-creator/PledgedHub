# PayPal Integration Setup Guide

This guide will help you set up PayPal payment integration for the PledgeHub system.

## Overview

PayPal integration allows donors to:
- Pay pledges using their PayPal account
- Pay with credit/debit cards (no PayPal account required)
- Receive payment confirmations via email
- Get instant payment processing

## Step 1: Create PayPal Developer Account

1. **Go to PayPal Developer Portal**
   - Visit: https://developer.paypal.com
   - Click "Log in to Dashboard" (top right)

2. **Sign Up or Log In**
   - Use your existing PayPal account or create a new one
   - If creating new: Follow the registration process

3. **Access the Dashboard**
   - After login, you'll see the Developer Dashboard
   - This is where you'll create your app and get credentials

## Step 2: Create a PayPal App

1. **Navigate to Apps & Credentials**
   - Click "Apps & Credentials" in the top menu
   - You'll see two environments: Sandbox (testing) and Live (production)

2. **Create App in Sandbox (for testing)**
   - Select "Sandbox" tab
   - Click "Create App" button
   - Enter App Name: `PledgeHub Sandbox`
   - Click "Create App"

3. **Get Sandbox Credentials**
   - After creation, you'll see:
     - **Client ID**: Long string starting with `A...`
     - **Secret**: Click "Show" to reveal it
   - Copy both credentials (you'll need them for .env)

4. **Configure Sandbox Settings**
   - Scroll down to "App settings"
   - Under "Return URL", add: `http://localhost:5001/api/payments/paypal/return`
   - Under "Webhook URL", add: `http://localhost:5001/api/payments/paypal/webhook`
   - Click "Save"

## Step 3: Create Sandbox Test Accounts

1. **Navigate to Sandbox Accounts**
   - In Developer Dashboard, click "Testing Tools" → "Sandbox Accounts"

2. **Create Personal Account (Buyer)**
   - Click "Create Account"
   - Account Type: **Personal**
   - Email: Auto-generated (e.g., `sb-test123@personal.example.com`)
   - Password: Choose a password (save it!)
   - PayPal Balance: $1,000.00 (default)
   - Click "Create"

3. **View Account Details**
   - Click the `...` menu next to your test account
   - Select "View/Edit Account"
   - Note the email and password for testing

## Step 4: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# PayPal Sandbox Configuration (for testing)
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID_HERE
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_SECRET_HERE
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=

# Example (replace with your actual credentials):
# PAYPAL_CLIENT_ID=AYourLongClientIDStringFromPayPalDashboard
# PAYPAL_CLIENT_SECRET=EYourSecretKeyFromPayPalDashboard
# PAYPAL_MODE=sandbox
```

**Important Notes:**
- `PAYPAL_MODE=sandbox` - Use this for testing
- `PAYPAL_MODE=live` - Use this for production (after going live)
- Never commit real credentials to version control!

## Step 5: Test PayPal Integration

### Backend Testing

1. **Check PayPal Availability**
   ```bash
   curl http://localhost:5001/api/payments/methods
   ```
   Response should show:
   ```json
   {
     "success": true,
     "data": {
       "paypal": true,
       "mtn": false,
       "airtel": false
     }
   }
   ```

2. **Create Test Order**
   ```bash
   curl -X POST http://localhost:5001/api/payments/paypal/order \
     -H "Content-Type: application/json" \
     -d '{
       "pledgeId": 1,
       "amount": 100000,
       "currency": "UGX"
     }'
   ```
   Response should include:
   ```json
   {
     "success": true,
     "data": {
       "orderId": "7AB12345CD678901E",
       "approvalUrl": "https://www.sandbox.paypal.com/checkoutnow?token=..."
     }
   }
   ```

3. **Test Payment Capture**
   - Copy the `orderId` from step 2
   - Open the `approvalUrl` in a browser
   - Log in with your sandbox personal account
   - Complete the payment
   - Capture the payment:
   ```bash
   curl -X POST http://localhost:5001/api/payments/paypal/capture/YOUR_ORDER_ID
   ```

### Frontend Testing

1. **Add PayPal Button to Payment Page**
   - The frontend integration guide will show you how to add PayPal buttons
   - For now, you can test using the API endpoints above

## Step 6: Go Live (Production)

Once you're ready for real payments:

1. **Create Production App**
   - Go to PayPal Developer Dashboard
   - Switch to "Live" tab
   - Click "Create App"
   - Name it: `PledgeHub Live`
   - Get your LIVE credentials

2. **Update Environment Variables**
   ```env
   # PayPal Live Configuration (for production)
   PAYPAL_CLIENT_ID=YOUR_LIVE_CLIENT_ID_HERE
   PAYPAL_CLIENT_SECRET=YOUR_LIVE_SECRET_HERE
   PAYPAL_MODE=live
   ```

3. **Update Return URLs**
   - Use your production domain instead of localhost
   - Example: `https://yourdomain.com/api/payments/paypal/return`

4. **Enable Webhooks (Optional)**
   - In Live app settings, add webhook URL
   - Subscribe to events:
     - `PAYMENT.CAPTURE.COMPLETED`
     - `PAYMENT.CAPTURE.DENIED`
     - `PAYMENT.CAPTURE.REFUNDED`

## Currency Conversion

The system automatically converts UGX to USD for PayPal:
- **Conversion Rate**: 1 USD = 3,700 UGX (hardcoded in `paypalService.js`)
- **Why?**: PayPal doesn't support UGX directly
- **Update Rate**: Edit `UGX_TO_USD_RATE` in `backend/services/paypalService.js` if exchange rate changes

Example:
- Pledge: 100,000 UGX
- PayPal charges: $27.03 USD (100,000 ÷ 3,700)

## Common Issues & Troubleshooting

### "PayPal not configured" Error
- **Cause**: Missing or invalid credentials in .env
- **Fix**: Verify `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set correctly

### "AUTHENTICATION_FAILURE" Error
- **Cause**: Invalid Client ID or Secret
- **Fix**: Double-check credentials from PayPal Dashboard
- **Tip**: Make sure there are no extra spaces or quotes in .env

### "ORDER_NOT_APPROVED" Error
- **Cause**: User didn't complete payment in PayPal window
- **Fix**: User needs to approve payment in PayPal checkout

### Webhook Not Working
- **Cause**: Incorrect webhook URL or not configured
- **Fix**: 
  1. Add webhook URL in PayPal app settings
  2. Use ngrok for local testing: `ngrok http 5001`
  3. Update webhook URL to: `https://your-ngrok-url.ngrok.io/api/payments/paypal/webhook`

### Currency Conversion Issues
- **Symptom**: Wrong amount charged in PayPal
- **Fix**: Update `UGX_TO_USD_RATE` in `paypalService.js`
- **Check**: Current exchange rate at https://www.xe.com

## Security Best Practices

1. **Never Commit Credentials**
   - Add `.env` to `.gitignore`
   - Use environment variables for all secrets

2. **Use Sandbox for Testing**
   - Never test with real money
   - Always use `PAYPAL_MODE=sandbox` during development

3. **Validate Webhooks**
   - Verify webhook signatures (implemented in service)
   - Don't trust webhook data without validation

4. **Rotate Credentials Regularly**
   - Change credentials every 6 months
   - Immediately rotate if credentials are exposed

5. **Monitor Transactions**
   - Regularly check PayPal Dashboard for suspicious activity
   - Set up email alerts for transactions

## Useful Links

- **PayPal Developer Portal**: https://developer.paypal.com
- **PayPal Sandbox**: https://www.sandbox.paypal.com
- **API Documentation**: https://developer.paypal.com/docs/api/overview
- **Sandbox Testing**: https://developer.paypal.com/docs/api-basics/sandbox
- **Currency Codes**: https://developer.paypal.com/docs/api/reference/currency-codes

## Support

- **PayPal Developer Support**: https://www.paypal-community.com/t5/Developer-Central/ct-p/developer-central
- **PayPal Help Center**: https://www.paypal.com/us/cshelp/personal

---

**Next Steps**: 
1. Complete MTN Mobile Money setup (see `MTN_SETUP_GUIDE.md`)
2. Complete Airtel Money setup (see `AIRTEL_SETUP_GUIDE.md`)
3. Test all payment methods together

