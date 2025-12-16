# Airtel Money Integration Setup Guide

This guide will help you set up Airtel Money payment integration for the PledgeHub system in Uganda.

## Overview

Airtel Money integration allows donors to:
- Pay pledges directly from their Airtel Money account
- Receive payment prompts on their phone
- Complete payments with their Airtel Money PIN
- Get instant SMS confirmations

## Prerequisites

- Business or organization registration in Uganda
- Valid business documents
- Airtel Money Merchant Account
- Phone number for testing

## Step 1: Register on Airtel Money Developer Portal

### For Sandbox (Testing)

1. **Visit Airtel Developer Portal**
   - Go to: https://developers.airtel.africa
   - Click "Get Started" or "Sign Up"

2. **Create Account**
   - Fill in registration form:
     - Email address
     - Password (strong password required)
     - Full Name
     - Country: **Uganda**
     - Company/Organization Name
   - Accept Terms & Conditions
   - Click "Create Account"

3. **Verify Email**
   - Check your email for verification link
   - Click the link to activate account
   - Log in to the developer portal

4. **Create Application**
   - After login, click "Create App" or "New Application"
   - Fill in details:
     - **App Name**: PledgeHub System
     - **Description**: Pledge collection and management system
     - **Category**: Payments / Collections
     - **Redirect URL**: `http://localhost:5001/api/payments/airtel/callback`
   - Click "Create"

5. **Get Sandbox Credentials**
   - After creating app, you'll see:
     - **Client ID**: Your application's client ID
     - **Client Secret**: Click "Show" to reveal
     - **Merchant ID**: Your sandbox merchant ID
   - Copy all three credentials

## Step 2: Configure Environment Variables

Add these to your `backend/.env` file:

```env
# Airtel Money Sandbox Configuration (for testing)
AIRTEL_CLIENT_ID=your_client_id_from_step_1
AIRTEL_CLIENT_SECRET=your_client_secret_from_step_1
AIRTEL_MERCHANT_ID=your_merchant_id_from_step_1
AIRTEL_PIN=your_encrypted_pin
AIRTEL_ENVIRONMENT=sandbox
AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback

# Example (replace with your actual credentials):
# AIRTEL_CLIENT_ID=abc123def456ghi789
# AIRTEL_CLIENT_SECRET=xyz789uvw456rst123
# AIRTEL_MERCHANT_ID=MERCHANT001
# AIRTEL_PIN=1234
# AIRTEL_ENVIRONMENT=sandbox
```

**Important Notes:**
- `AIRTEL_ENVIRONMENT=sandbox` - Use for testing
- `AIRTEL_ENVIRONMENT=production` - Use for live payments
- `AIRTEL_PIN` - Your Airtel Money PIN (encrypted in production)
- Never commit real credentials to version control!

## Step 3: Test Airtel Money Integration

### Check Configuration

1. **Verify Airtel is Available**
   ```bash
   curl http://localhost:5001/api/payments/methods
   ```
   Response should show:
   ```json
   {
     "success": true,
     "data": {
       "paypal": false,
       "mtn": false,
       "airtel": true
     }
   }
   ```

### Test Payment Request (Sandbox)

In sandbox mode, use these test numbers:

**Test Phone Numbers (Sandbox):**
- `256700123456` - Always succeeds
- `256700123457` - Insufficient balance
- `256700123458` - User declines
- `256700123459` - Network timeout

**Test Payment:**

```bash
curl -X POST http://localhost:5001/api/payments/airtel/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "pledgeId": 1,
    "phoneNumber": "256700123456",
    "amount": 50000
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "transactionId": "OMUK-1634567890123-A1B2C3D4",
    "airtelTransactionId": "ART123456789",
    "status": "PENDING",
    "message": "Payment request sent. User will receive prompt on their phone."
  }
}
```

### Check Payment Status

```bash
curl http://localhost:5001/api/payments/airtel/status/YOUR_TRANSACTION_ID
```

Expected response (after ~30 seconds):
```json
{
  "success": true,
  "data": {
    "transactionId": "OMUK-1634567890123-A1B2C3D4",
    "status": "TS",
    "statusMessage": "Transaction Successful",
    "amount": 50000,
    "currency": "UGX",
    "phoneNumber": "256700123456"
  }
}
```

**Payment Status Values:**
- `TS` - Transaction Successful
- `TF` - Transaction Failed
- `TP` - Transaction Pending
- `TA` - Transaction Ambiguous

## Step 4: Production Setup (Go Live)

### Business Requirements

To go live with Airtel Money, you need:

1. **Airtel Uganda Merchant Account**
   - Visit Airtel shop or call: +256 200 200 100
   - Provide business documents:
     - Certificate of Incorporation/Registration
     - Trading License
     - Tax Identification Number (TIN)
     - Proof of business address
     - National IDs of directors
     - Bank account details
   - Complete KYC process

2. **Merchant Code**
   - Airtel will provide a unique Merchant Code
   - This identifies your business in transactions

3. **Production API Credentials**
   - Contact Airtel Developer Support: developersupport@airtel.africa
   - Request production credentials
   - Provide:
     - Business name and registration
     - Use case description
     - Expected transaction volume
     - Merchant Code (from step 2)

### Request Production Access

Send email to: developersupport@airtel.africa

**Email Template:**
```
Subject: Production API Access Request - PledgeHub System

Dear Airtel Developer Support,

I am requesting production API access for our pledge management system.

Business Details:
- Company Name: [Your Company Name]
- Registration Number: [Your Business Registration #]
- TIN: [Your Tax ID]
- Merchant Code: [From Airtel Merchant Account]

Application Details:
- App Name: PledgeHub System
- Sandbox Client ID: [Your Sandbox Client ID]
- Use Case: Collecting pledge payments from donors
- Expected Volume: [e.g., 50-100 transactions/month]

Contact Information:
- Contact Person: [Your Name]
- Phone: [Your Phone]
- Email: [Your Email]

Please provide production API credentials.

Thank you,
[Your Name]
```

### Update Environment Variables

Once you get production credentials:

```env
# Airtel Money Production Configuration
AIRTEL_CLIENT_ID=your_production_client_id
AIRTEL_CLIENT_SECRET=your_production_client_secret
AIRTEL_MERCHANT_ID=your_production_merchant_id
AIRTEL_PIN=your_encrypted_pin
AIRTEL_ENVIRONMENT=production
AIRTEL_CALLBACK_URL=https://yourdomain.com/api/payments/airtel/callback
```

### Production Testing Checklist

- [ ] Test with real Airtel Money number (small amount: 1,000 UGX)
- [ ] Verify SMS receipt
- [ ] Check database updates correctly
- [ ] Test insufficient balance scenario
- [ ] Test user cancellation
- [ ] Test network timeout handling
- [ ] Verify callback URL is reachable
- [ ] Test refund functionality
- [ ] Reconcile with Airtel statements

## Common Issues & Troubleshooting

### "Airtel not configured" Error
- **Cause**: Missing credentials in .env
- **Fix**: Verify all AIRTEL_* variables are set

### "Authentication Failed" Error
- **Cause**: Invalid Client ID or Client Secret
- **Fix**: 
  1. Log in to Airtel Developer Portal
  2. Check your app credentials
  3. Regenerate if necessary
  4. Update .env file

### "Invalid Merchant ID" Error
- **Cause**: Wrong merchant ID
- **Fix**: Verify merchant ID matches the one in your Airtel Developer Portal

### "Invalid Phone Number" Error
- **Cause**: Phone number format issue
- **Fix**: Use format `256XXXXXXXXX` (no + or 0)
  - Correct: `256700123456`
  - Wrong: `+256700123456`, `0700123456`

### Payment Stuck in "PENDING" (TP)
- **Cause**: User hasn't responded or network issue
- **Fix**:
  - Wait 2-3 minutes (user has up to 5 minutes)
  - Check status again after 5 minutes
  - Treat as timeout if still pending

### "Transaction Failed" (TF) Error
- **Possible Causes**:
  - Insufficient balance
  - User declined
  - Invalid phone number
  - Account suspended
  - Network error
- **Fix**: Check specific error message in response

### Callback Not Received
- **Cause**: Callback URL not accessible
- **Fix**:
  - For local testing, use ngrok: `ngrok http 5001`
  - Update `AIRTEL_CALLBACK_URL` to ngrok URL
  - For production, ensure public HTTPS URL

### Sandbox Test Numbers Not Working
- **Cause**: Sandbox environment issue
- **Fix**:
  1. Try different test number
  2. Wait 5 minutes and retry
  3. Check Airtel Developer Portal status

## Phone Number Formats

The system automatically normalizes phone numbers:

**Correct Formats:**
- `256700123456` (✓ Preferred)
- `+256700123456` (✓ Automatically normalized)
- `0700123456` (✓ Automatically converted)

**Airtel Uganda Prefixes:**
- `2567X` - Airtel Uganda numbers
- Common: `25670`, `25675`, `25674`, `25672`

**Wrong Formats:**
- `700123456` (✗ Missing country code)
- `+256 700 123 456` (✗ Spaces not supported)
- `256-700-123-456` (✗ Dashes not supported)

## Payment Flow

1. **User initiates payment** → Frontend calls `/api/payments/airtel/initiate`
2. **Backend requests payment** → Airtel API sends prompt to user's phone
3. **User receives USSD prompt** → Shows amount and merchant
4. **User enters PIN** → Confirms or cancels
5. **Airtel processes payment** → Returns result
6. **Backend checks status** → Polls `/api/payments/airtel/status/{transactionId}`
7. **Payment completes** → Database updated, pledge marked as paid

**Typical Timeline:**
- Prompt delivery: 5-15 seconds
- User response: 30 seconds - 5 minutes
- Payment processing: 10-30 seconds
- **Total**: 1-6 minutes average

## Transaction Limits

### Sandbox Limits
- Min: 100 UGX
- Max: 5,000,000 UGX per transaction
- No daily limit

### Production Limits
- **Min**: 100 UGX
- **Max per transaction**: 4,000,000 UGX (standard merchants)
- **Max per transaction**: 10,000,000 UGX (premium merchants)
- **Daily limit**: Varies by merchant category

**To increase limits:**
- Contact Airtel Merchant Support
- Provide transaction history
- Justify increased limits

## Fees

### Merchant Fees (Production)
- **Tier 1 (< 50,000 UGX)**: 2% + 100 UGX
- **Tier 2 (50,000 - 500,000 UGX)**: 1.5% + 500 UGX
- **Tier 3 (> 500,000 UGX)**: 1% + 1,000 UGX

**Note**: Fees charged to merchant. Factor into pricing.

### Example Fee Calculation
- Pledge: 100,000 UGX
- Fee: (100,000 × 1.5%) + 500 = 2,000 UGX
- You receive: 98,000 UGX

## Security Best Practices

1. **Secure Credentials**
   - Never commit to Git
   - Use environment variables
   - Rotate credentials quarterly
   - Encrypt PIN in production

2. **Validate Phone Numbers**
   - Check format before API call
   - Verify Airtel network (starts with 70, 75, 74, 72)

3. **Implement Idempotency**
   - Use unique transaction IDs
   - Store IDs to prevent duplicates
   - Check status before retrying

4. **Monitor Transactions**
   - Log all API calls
   - Alert on failed payments
   - Reconcile daily with Airtel statements

5. **Handle Errors Gracefully**
   - Retry failed requests (max 3 times)
   - Set 5-minute timeout
   - Show clear error messages to users

6. **Protect API Keys**
   - Use HTTPS only
   - Don't expose in client-side code
   - Use server-side proxies

## API Rate Limits

### Sandbox
- **Requests per minute**: 100
- **Requests per hour**: 1,000
- **Daily limit**: 10,000

### Production
- **Requests per minute**: 500
- **Requests per hour**: 10,000
- **Daily limit**: 100,000

**Rate Limit Handling:**
- System automatically retries on 429 errors
- Implements exponential backoff
- Logs rate limit warnings

## Webhook Configuration

### Setup Webhooks (Optional)

1. **Configure in Developer Portal**
   - Go to your app settings
   - Add webhook URL: `https://yourdomain.com/api/payments/airtel/webhook`
   - Select events:
     - Payment Success
     - Payment Failed
     - Payment Pending

2. **Implement Webhook Handler**
   - Already implemented in `airtelService.js`
   - Validates webhook signatures
   - Updates payment status automatically

3. **Test Webhook**
   ```bash
   # Trigger test payment and monitor webhook endpoint
   curl -X POST http://localhost:5001/api/payments/airtel/initiate \
     -H "Content-Type: application/json" \
     -d '{"pledgeId": 1, "phoneNumber": "256700123456", "amount": 1000}'
   ```

## Account Balance Check

Monitor your merchant account balance:

```bash
curl http://localhost:5001/api/payments/airtel/balance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "balance": 5000000,
  "currency": "UGX"
}
```

**Note**: Balance check requires special permissions. Contact Airtel support if not working.

## Refunds

### Process Refunds

```bash
curl -X POST http://localhost:5001/api/payments/refund/PAYMENT_ID \
  -H "Content-Type: application/json" \
  -d '{"reason": "Duplicate payment"}'
```

**Refund Timeline:**
- **Sandbox**: Instant
- **Production**: 1-3 business days

**Refund Limits:**
- Must refund within 180 days
- Partial refunds supported
- Fees not refunded

## Useful Links

- **Airtel Developer Portal**: https://developers.airtel.africa
- **API Documentation**: https://developers.airtel.africa/documentation
- **Sandbox Testing**: https://developers.airtel.africa/sandbox
- **Developer Support**: developersupport@airtel.africa
- **Merchant Support**: merchantsupport@ug.airtel.com

## Support Contacts

### For Technical Issues:
- **Email**: developersupport@airtel.africa
- **Developer Portal**: https://developers.airtel.africa/support

### For Business/Merchant Account:
- **Email**: merchantsupport@ug.airtel.com
- **Phone**: +256 200 200 100
- **Visit**: Airtel shop (nearest branch)
- **Working Hours**: Mon-Fri, 8:00 AM - 5:00 PM EAT

### For Integration Help:
- **Airtel Developer Community**: https://developers.airtel.africa/community
- **Stack Overflow**: Tag `airtel-money`

## Checklist Before Going Live

- [ ] Business registration complete
- [ ] Merchant account activated
- [ ] Production credentials obtained
- [ ] Environment variables updated
- [ ] Test transactions completed successfully
- [ ] Error handling tested
- [ ] Callback URL configured and tested
- [ ] Security audit completed
- [ ] Transaction logging implemented
- [ ] Reconciliation process established
- [ ] Customer support process defined
- [ ] Backup payment method available

---

**Next Steps**:
1. Test all three payment methods (PayPal, MTN, Airtel) together
2. Implement frontend payment UI
3. Set up transaction monitoring and alerts
4. Create user documentation for payment process

