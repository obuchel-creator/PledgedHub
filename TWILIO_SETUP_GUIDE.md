# 📱 Twilio SMS Setup Guide

## Step 1: Create Twilio Account

1. Go to https://www.twilio.com/try-twilio
2. Sign up with your email
3. Verify your phone number
4. Get **$15 free credit** for testing

## Step 2: Get Your Credentials

1. Log into Twilio Console: https://console.twilio.com
2. On the dashboard, find:
   - **Account SID** (starts with AC...)
   - **Auth Token** (click to reveal)

## Step 3: Get a Phone Number

1. In Twilio Console, go to **Phone Numbers** → **Manage** → **Buy a number**
2. Select country: **United States** (for international SMS)
3. Check: "SMS" capability
4. Click "Search"
5. Select a number and buy it (uses your free credit)
6. Copy your new phone number (format: +1XXXXXXXXXX)

## Step 4: Configure Your App

1. Open `backend/.env` file
2. Add your credentials:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

3. Save the file

## Step 5: Restart Backend

```powershell
# Stop all node processes
Get-Process -Name node | Stop-Process -Force

# Restart backend
cd backend
node server.js
```

## Step 6: Test SMS

1. Go to http://localhost:5173
2. Login to dashboard
3. Click on any pledge
4. Add a phone number if missing (format: +256700123456)
5. Click "Send Reminder" button
6. Check your phone for SMS!

## 📞 Phone Number Format

The system automatically converts Uganda numbers:
- `0700123456` → `+256700123456`
- `700123456` → `+256700123456`
- `+256700123456` → `+256700123456` ✓

## 💰 Pricing

- **Testing**: Free $15 credit (about 500 SMS)
- **After credit**: $0.0075 per SMS to Uganda
- **Free incoming**: Receiving SMS is free

## ✅ Verification

After setup, you should see in backend console:
```
✓ Twilio SMS service initialized
```

Instead of:
```
ℹ Twilio credentials not configured. SMS notifications disabled.
```

## 🔧 Troubleshooting

### "Invalid credentials" error
- Check Account SID starts with "AC"
- Verify Auth Token is correct (case-sensitive)
- Ensure no extra spaces in .env file

### SMS not arriving
- Check phone number format: +256700123456
- Verify Twilio number has SMS capability
- Check Twilio console logs for delivery status

### "Unverified number" error
- In trial mode, add recipient numbers in Twilio Console
- Go to **Phone Numbers** → **Verified Caller IDs**
- Add and verify the phone number
- Or upgrade to paid account (no restrictions)

## 🚀 Ready to Go!

Once configured, all SMS features will work:
- ✅ Individual reminders
- ✅ Bulk reminders
- ✅ Custom messages
- ✅ Thank you messages

