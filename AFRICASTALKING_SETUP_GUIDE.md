# 🌍 Africa's Talking SMS Setup Guide

## Why Africa's Talking?

✅ **Much cheaper** than Twilio for African numbers
✅ **No trial restrictions** - send to any number immediately  
✅ **Uganda-focused** - Better delivery rates
✅ **Simple pricing**: UGX 25-60 per SMS (vs Twilio's $0.0075 USD)
✅ **FREE testing** with sandbox

## Step 1: Create Account

1. Go to: https://account.africastalking.com/auth/register
2. Sign up with your email
3. Verify your email address
4. **Get FREE UGX 500 credit** for testing!

## Step 2: Get Your Credentials

1. Login to: https://account.africastalking.com/apps
2. Click on **"Sandbox App"** (for testing) or create a **"Production App"**
3. On the app dashboard, find:
   - **Username**: Usually `sandbox` for testing
   - **API Key**: Click "Settings" → "API Key" → Generate/View

## Step 3: Configure Your App

Your `.env` file is already set up! Just add your credentials:

```env
SMS_PROVIDER=africastalking
AFRICASTALKING_USERNAME=sandbox
AFRICASTALKING_API_KEY=your_api_key_here
AFRICASTALKING_SENDER_ID=PledgeHub
```

## Step 4: Sandbox vs Production

### **Sandbox (FREE Testing)**
- Username: `sandbox`
- Can only send to numbers you add in the sandbox
- Add numbers: Dashboard → Sandbox → Simulator → Add Phone Number
- Perfect for development!

### **Production (Real SMS)**
- Create a production app
- Top up your account (minimum UGX 1,000)
- Can send to ANY Uganda number
- Cost: ~UGX 25-60 per SMS

## Step 5: Restart Backend

```powershell
# Stop backend
Get-Process -Name node | Stop-Process -Force

# Start backend
cd backend
node server.js
```

You should see:
```
✓ Africa's Talking SMS service initialized
```

## Step 6: Test SMS

1. Go to http://localhost:5173
2. Login to dashboard
3. Click on any pledge
4. Make sure phone number is in format: `+256700123456`
5. Click "Send Reminder"
6. Check your phone! 📱

## 📞 Phone Number Format

Africa's Talking accepts:
- `+256700123456` ✓
- `0700123456` ✓ (auto-converted)
- `256700123456` ✓ (auto-converted)

## 💰 Pricing Comparison

| Provider | Cost per SMS (Uganda) | Trial Restrictions |
|----------|----------------------|-------------------|
| **Africa's Talking** | UGX 25-60 (~$0.007-$0.016) | None (after account verification) |
| **Twilio** | $0.0075 (~UGX 28) | Can only send to verified numbers in trial |

## 🔧 Troubleshooting

### "Insufficient balance" error
- Top up your account at: https://account.africastalking.com/billing
- Minimum: UGX 1,000

### "Invalid phone number" error
- Ensure format is `+256700123456`
- Check that you're using a valid Uganda number

### Messages not arriving in Sandbox
- Add the recipient number in Sandbox Simulator
- Dashboard → Sandbox → Phone Numbers → Add Number

### Switch back to Twilio
In `.env` file, change:
```env
SMS_PROVIDER=twilio
```

## 🚀 Going Live (Production)

1. Create a production app in dashboard
2. Request a Sender ID (your brand name, e.g., "PledgeHub")
   - Takes 1-3 business days for approval
3. Top up your account (UGX 1,000+ recommended)
4. Update `.env`:
```env
AFRICASTALKING_USERNAME=your_production_username
AFRICASTALKING_API_KEY=your_production_api_key
AFRICASTALKING_SENDER_ID=YourApprovedSenderID
```

## 📊 Monitor Usage

- Dashboard: https://account.africastalking.com/apps
- View sent messages, delivery reports, and balance
- Set up low balance alerts

## 🌟 Benefits for Uganda

- **Local support** - Kampala office
- **Better delivery** - Direct connections with Uganda telcos (MTN, Airtel)
- **Bulk SMS** - Discounts for high volume
- **Voice calls** - Also supports voice if needed later

---

**Need help?** 
- Africa's Talking Support: support@africastalking.com
- Documentation: https://developers.africastalking.com/docs/sms/overview

