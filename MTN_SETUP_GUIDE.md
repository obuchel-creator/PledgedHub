# MTN Mobile Money Integration Setup Guide

This guide will help you set up MTN Mobile Money (MoMo) payment integration for the PledgeHub system in Uganda.

## Overview

MTN Mobile Money integration allows donors to:
- Pay pledges directly from their MTN Mobile Money account
- Receive payment prompts on their phone
- Complete payments with their MTN MoMo PIN
- Get instant SMS confirmations

## Prerequisites

- Business or organization registration in Uganda
- Valid business documents (Certificate of Incorporation, Tax ID, etc.)
- MTN Mobile Money Merchant Account (for production)
- Phone number for testing

## Step 1: Register on MTN MoMo Developer Portal

### For Sandbox (Testing)

1. **Visit MTN MoMo Developer Portal**
   - Go to: https://momodeveloper.mtn.com
   - Click "Sign Up" (top right)

2. **Create Account**
   - Fill in registration form:
     - Email address
     - Password (strong password required)
     - First Name & Last Name
     - Country: **Uganda**
   - Accept Terms & Conditions
   - Click "Register"

3. **Verify Email**
   - Check your email for verification link
   - Click the link to activate account
   - Log in to the developer portal

4. **Subscribe to Collection Product**
   - After login, go to "Products"
   - Find "Collection" product (for receiving payments)
   - Click "Subscribe"
   - Agree to terms
   - You'll get a **Primary Key** (Subscription Key)

## Step 2: Get Sandbox Credentials

### Generate API User and API Key

1. **Create API User (via API)**
   
   Open PowerShell and run:
   ```powershell
   $subscriptionKey = "YOUR_PRIMARY_KEY_HERE"
   $apiUser = [guid]::NewGuid().ToString()
   
   # Create API User
   Invoke-RestMethod -Uri "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser" `
     -Method POST `
     -Headers @{
       "X-Reference-Id" = $apiUser
       "Ocp-Apim-Subscription-Key" = $subscriptionKey
     } `
     -Body '{"providerCallbackHost": "webhook.site"}' `
     -ContentType "application/json"
   
   Write-Host "API User ID: $apiUser"
   ```

   **Save the API User ID** - you'll need it!

2. **Create API Key**
   
   ```powershell
   $subscriptionKey = "YOUR_PRIMARY_KEY_HERE"
   $apiUser = "YOUR_API_USER_ID_FROM_STEP_1"
   
   # Create API Key
   $response = Invoke-RestMethod -Uri "https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/$apiUser/apikey" `
     -Method POST `
     -Headers @{
       "Ocp-Apim-Subscription-Key" = $subscriptionKey
     }
   
   Write-Host "API Key: $($response.apiKey)"
   ```

   **Save the API Key** - you'll need it!

### Alternative: Use Postman

If you prefer Postman:

1. **Import MTN MoMo Collection**
   - Download from: https://momodeveloper.mtn.com/api-documentation/
   - Import into Postman

2. **Create API User**
   - Request: `POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser`
   - Headers:
     - `X-Reference-Id`: Generate UUID (e.g., `7d03a9b5-8c0e-4c4a-9c0e-5b8c0e4c4a9c`)
     - `Ocp-Apim-Subscription-Key`: Your Primary Key
   - Body:
     ```json
     {
       "providerCallbackHost": "webhook.site"
     }
     ```

3. **Create API Key**
   - Request: `POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/{apiUserId}/apikey`
   - Headers:
     - `Ocp-Apim-Subscription-Key`: Your Primary Key
   - Response will contain your API Key

## Step 3: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# MTN Mobile Money Sandbox Configuration (for testing)
MTN_SUBSCRIPTION_KEY=your_primary_key_from_step_1
MTN_API_USER=your_api_user_id_from_step_2
MTN_API_KEY=your_api_key_from_step_2
MTN_ENVIRONMENT=sandbox
MTN_CALLBACK_URL=http://localhost:5001/api/payments/mtn/callback

# Example (replace with your actual credentials):
# MTN_SUBSCRIPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
# MTN_API_USER=7d03a9b5-8c0e-4c4a-9c0e-5b8c0e4c4a9c
# MTN_API_KEY=9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c
# MTN_ENVIRONMENT=sandbox
```

**Important Notes:**
- `MTN_ENVIRONMENT=sandbox` - Use for testing
- `MTN_ENVIRONMENT=production` - Use for live payments
- Never commit real credentials to version control!

## Step 4: Test MTN MoMo Integration

### Check Configuration

1. **Verify MTN is Available**
   ```bash
   curl http://localhost:5001/api/payments/methods
   ```
   Response should show:
   ```json
   {
     "success": true,
     "data": {
       "paypal": false,
       "mtn": true,
       "airtel": false
     }
   }
   ```

### Test Payment Request (Sandbox)

In sandbox mode, use these test numbers:

**Test Phone Numbers (Sandbox):**
- `256774567890` - Always succeeds
- `256774567891` - Always fails (insufficient balance)
- `256774567892` - Times out
- `256774567893` - User cancels

**Test Payment:**

```bash
curl -X POST http://localhost:5001/api/payments/mtn/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "pledgeId": 1,
    "phoneNumber": "256774567890",
    "amount": 50000
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "referenceId": "abc123-def456-ghi789",
    "status": "PENDING",
    "message": "Payment request sent. User will receive prompt on their phone."
  }
}
```

### Check Payment Status

```bash
curl http://localhost:5001/api/payments/mtn/status/YOUR_REFERENCE_ID
```

Expected response (after ~30 seconds):
```json
{
  "success": true,
  "data": {
    "referenceId": "abc123-def456-ghi789",
    "status": "SUCCESSFUL",
    "amount": 50000,
    "currency": "UGX",
    "phoneNumber": "256774567890"
  }
}
```

**Payment Status Values:**
- `PENDING` - Payment request sent, waiting for user
- `SUCCESSFUL` - Payment completed successfully
- `FAILED` - Payment failed (insufficient funds, user declined, etc.)

## Step 5: Production Setup (Go Live)

### Business Requirements

To go live with MTN MoMo, you need:

1. **MTN Uganda Merchant Account**
   - Visit MTN branch or call: +256 312 200 200
   - Provide business documents:
     - Certificate of Incorporation
     - Trading License
     - Tax Identification Number (TIN)
     - Proof of business address
     - Passport photos of directors
   - Complete KYC process

2. **Merchant Code**
   - MTN will provide a 6-digit Merchant Code
   - This identifies your business in transactions

3. **Production API Credentials**
   - Contact MTN MoMo Support: momodevelopers@mtn.com
   - Request production credentials
   - Provide:
     - Business name and registration
     - Intended use case (pledge collection system)
     - Expected transaction volume

### Update Environment Variables

Once you get production credentials:

```env
# MTN Mobile Money Production Configuration
MTN_SUBSCRIPTION_KEY=your_production_subscription_key
MTN_API_USER=your_production_api_user
MTN_API_KEY=your_production_api_key
MTN_ENVIRONMENT=production
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/mtn/callback
```

### Production Testing

1. **Test with Small Amount**
   - Use real MTN MoMo number
   - Test with 1,000 UGX first
   - Verify SMS receipt and database update

2. **Test Error Scenarios**
   - Insufficient balance (have test account with low balance)
   - User cancellation (decline prompt on phone)
   - Network timeout (wait without responding)

3. **Verify Callbacks**
   - Ensure callback URL is publicly accessible
   - Use ngrok for local testing: `ngrok http 5001`
   - Update `MTN_CALLBACK_URL` with ngrok URL

## Common Issues & Troubleshooting

### "MTN not configured" Error
- **Cause**: Missing credentials in .env
- **Fix**: Verify all MTN_* variables are set

### "Invalid Subscription Key" Error
- **Cause**: Wrong or expired subscription key
- **Fix**: 
  1. Log in to MTN Developer Portal
  2. Go to "Products" → "Collection"
  3. Regenerate Primary Key
  4. Update `MTN_SUBSCRIPTION_KEY` in .env

### "Invalid API User or API Key" Error
- **Cause**: Incorrect API User ID or API Key
- **Fix**: Recreate API User and Key (see Step 2)

### "Payment Request Failed" Error
- **Cause**: Invalid phone number format
- **Fix**: Use format `256XXXXXXXXX` (no + or 0)
  - Correct: `256774567890`
  - Wrong: `+256774567890`, `0774567890`

### Payment Stuck in "PENDING"
- **Cause**: User hasn't responded to prompt or network issue
- **Fix**: 
  - Wait 2-3 minutes (user has up to 5 minutes to respond)
  - Check payment status again
  - If still pending after 5 minutes, treat as timeout/cancel

### Sandbox Test Numbers Not Working
- **Cause**: Sandbox environment issue
- **Fix**: 
  1. Try different test number
  2. Wait 5 minutes and retry
  3. Check MTN Developer status: https://momodeveloper.mtn.com

### Production Payments Failing
- **Cause**: Various (insufficient balance, user declined, network)
- **Fix**: 
  - Check user's MTN MoMo balance
  - Verify phone number is registered for MTN MoMo
  - Ensure user has network connection
  - Check MTN MoMo service status

## Phone Number Formats

The system automatically normalizes phone numbers, but here's the preferred format:

**Correct Formats:**
- `256774567890` (✓ Preferred)
- `+256774567890` (✓ Automatically normalized)
- `0774567890` (✓ Automatically converted to 256774567890)

**Wrong Formats:**
- `774567890` (✗ Missing country code)
- `+256 774 567 890` (✗ Spaces not supported)
- `256-774-567-890` (✗ Dashes not supported)

## Payment Flow

1. **User initiates payment** → Frontend calls `/api/payments/mtn/initiate`
2. **Backend requests payment** → MTN MoMo API sends prompt to user's phone
3. **User receives USSD prompt** → Displays amount and merchant name
4. **User enters PIN** → Confirms or cancels payment
5. **MTN processes payment** → Returns result to backend
6. **Backend checks status** → Polls `/api/payments/mtn/status/{referenceId}`
7. **Payment completes** → Database updated, pledge marked as paid

**Typical Timeline:**
- Prompt delivery: 5-10 seconds
- User response time: 30 seconds - 5 minutes
- Payment processing: 10-30 seconds
- **Total**: 1-6 minutes average

## Transaction Limits

### Sandbox Limits
- Min: 100 UGX
- Max: 10,000,000 UGX per transaction
- No daily limit

### Production Limits (for registered merchants)
- Min: 100 UGX
- Max: 30,000,000 UGX per transaction
- Daily limit: Based on merchant category (discuss with MTN)

## Fees

### Merchant Fees (Production)
- **< 100,000 UGX**: 2% + 200 UGX
- **100,000 - 500,000 UGX**: 2% + 500 UGX
- **> 500,000 UGX**: 1.5% + 1,000 UGX

**Note**: Fees charged to merchant, not customer. Include fees in your pricing.

### Example Fee Calculation
- Pledge: 100,000 UGX
- Fee: (100,000 × 2%) + 500 = 2,500 UGX
- You receive: 97,500 UGX

## Security Best Practices

1. **Secure Credentials**
   - Never commit to Git
   - Use environment variables
   - Rotate keys quarterly

2. **Validate Phone Numbers**
   - Verify format before API call
   - Check for MTN network (starts with 77, 78, 76)

3. **Implement Idempotency**
   - Use unique reference IDs
   - Store transaction IDs to prevent duplicates
   - Check status before retrying

4. **Monitor Transactions**
   - Log all API calls
   - Set up alerts for failed payments
   - Reconcile daily with MTN statements

5. **Handle Timeouts**
   - Set 5-minute timeout for user response
   - Mark as expired if no response
   - Allow retry with new transaction

## Useful Links

- **MTN MoMo Developer Portal**: https://momodeveloper.mtn.com
- **API Documentation**: https://momodeveloper.mtn.com/api-documentation
- **Sandbox Testing**: https://momodeveloper.mtn.com/docs/services/collection
- **Production Support**: momodevelopers@mtn.com
- **Merchant Support**: +256 312 200 200

## Support Contacts

### For Technical Issues:
- **Email**: momodevelopers@mtn.com
- **Developer Forum**: https://momodeveloper.mtn.com/community

### For Business/Merchant Account:
- **Email**: merchantservices@mtn.co.ug
- **Phone**: +256 312 200 200
- **Working Hours**: Mon-Fri, 8:00 AM - 5:00 PM EAT

---

**Next Steps**:
1. Complete Airtel Money setup (see `AIRTEL_SETUP_GUIDE.md`)
2. Test all payment methods together
3. Implement frontend payment UI

