# SMS Notification Setup Guide

## 📱 SMS Notifications Feature

The PledgeHub app now supports sending SMS notifications to pledgers to remind them about their commitments!

## ✨ Features

### 1. **Send Individual Reminders**
- Go to any pledge detail page
- Click "Send Reminder" button
- Automated SMS sent with pledge amount, purpose, and collection date

### 2. **Send Bulk Reminders**
- From Dashboard, click "Send All Reminders"
- Sends reminders to all active pledges at once
- Shows success count and any failures

### 3. **Custom Messages**
- On pledge detail page, click "Custom Message"
- Type your personalized message
- SMS sent with your custom text

### 4. **Automatic Thank You Messages**
- After payment received, send thank you SMS
- API endpoint: `/api/notifications/thank-you/:pledgeId`

## 🔧 Setup Instructions

### Option 1: Full SMS Integration with Twilio (Real SMS)

#### Step 1: Create Twilio Account
1. Go to https://www.twilio.com/
2. Sign up for a free account
3. Get $15 free credit for testing

#### Step 2: Get Your Credentials
1. Log into Twilio Console: https://www.twilio.com/console
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Get a Twilio phone number:
   - Go to Phone Numbers → Manage → Buy a number
   - Select a number that supports SMS
   - For Uganda, use a US/UK number (international SMS enabled)

#### Step 3: Configure Backend
1. Open `backend/.env` file
2. Add your Twilio credentials:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=AC...your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

3. Restart backend server:
```bash
cd backend
npm run dev
```

#### Step 4: Test SMS
1. Log into the app
2. Go to a pledge with a phone number
3. Click "Send Reminder"
4. Check if SMS arrives!

### Option 2: Development Mode (Simulated SMS)

**Current Mode:** The app is already in this mode!

- SMS will be "simulated" (logged in console)
- No actual SMS sent
- Perfect for development and testing
- No Twilio account needed
- No costs

**How it works:**
- When you click "Send Reminder", you'll see: "Reminder simulated successfully"
- Check backend console to see what would have been sent
- All other features work the same way

## 📞 Phone Number Format

The system automatically handles multiple phone formats for Uganda:

### Supported Formats:
- `+256700123456` ✓ (E.164 format - recommended)
- `0700123456` ✓ (Local format)
- `700123456` ✓ (Without leading 0)
- `256700123456` ✓ (Without +)

All formats are automatically converted to E.164 format: `+256700123456`

### For Other Countries:
- Update the `formatUgandaPhoneNumber` function in `backend/services/smsService.js`
- Change country code from `256` (Uganda) to your country code
- Example for Kenya: use `254` instead of `256`

## 💰 Pricing

### Twilio Pricing (as of 2024):
- **SMS to Uganda:** ~$0.02 - $0.05 per message
- **Free Credit:** $15 (300-750 messages)
- **Monthly Cost:** Only pay for what you use

### Cost Estimates:
- 100 reminders/month = ~$2-5
- 500 reminders/month = ~$10-25
- 1000 reminders/month = ~$20-50

**Tip:** Use bulk reminders sparingly to save costs!

## 🚀 How to Use

### Sending a Reminder:
1. **Navigate** to pledge detail page
2. **Ensure** you're logged in
3. **Click** "Send Reminder" button
4. **Wait** for success message
5. **Check** pledger's phone for SMS

### Sending Bulk Reminders:
1. **Go** to Dashboard
2. **Click** "Send All Reminders"
3. **Review** results (X sent, Y failed)
4. **Check** console for details

### Sending Custom Message:
1. **Open** pledge detail page
2. **Click** "Custom Message"
3. **Type** your message
4. **Click** "Send Message"
5. **Confirm** success

## 📋 API Endpoints

### Send Individual Reminder
```bash
POST /api/notifications/reminder/:pledgeId
Authorization: Bearer <token>
```

### Send Bulk Reminders
```bash
POST /api/notifications/remind-all
Authorization: Bearer <token>
```

### Send Custom Message
```bash
POST /api/notifications/custom/:pledgeId
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Your custom message here"
}
```

### Send Thank You
```bash
POST /api/notifications/thank-you/:pledgeId
Authorization: Bearer <token>
```

## 🛡️ Security

- ✅ All notification endpoints require authentication
- ✅ Phone numbers validated before sending
- ✅ SMS service errors are caught and logged
- ✅ Failed messages don't crash the app
- ✅ Twilio credentials stored in .env (never committed)

## 🐛 Troubleshooting

### "No contact information found"
**Problem:** Pledge doesn't have a phone number  
**Solution:** Edit pledge and ensure contact field is filled

### "Invalid phone number format"
**Problem:** Phone number not in correct format  
**Solution:** Use format: +256700123456 or 0700123456

### "Twilio not configured"
**Problem:** Missing Twilio credentials  
**Solution:** 
- For testing: Use simulated mode (no action needed)
- For production: Add Twilio credentials to .env

### SMS not delivered
**Problem:** SMS sent but not received  
**Solution:**
1. Check phone number is correct
2. Check Twilio console for delivery status
3. Verify phone number is not on DND (Do Not Disturb)
4. Check Twilio account balance

### "Request failed: 401"
**Problem:** Not authenticated  
**Solution:** Log in before sending notifications

## 📊 Monitoring

### Check SMS Logs:
1. **Backend Console:** Shows all SMS attempts
2. **Twilio Console:** Shows delivery status
3. **App Feedback:** Success/error messages

### SMS Message Templates:

**Reminder:**
```
Hi [Name]! 👋

Friendly reminder about your pledge of UGX X,XXX,XXX for [Purpose].

Collection date: [Date]

Thank you for your support!

- PledgeHub
```

**Thank You:**
```
Thank you, [Name]! 🎉

We've received your payment of UGX X,XXX,XXX for [Purpose].

Your contribution makes a real difference!

- PledgeHub
```

**Custom:**
```
Hi [Name]! 👋

[Your custom message]

- PledgeHub
```

## 🎯 Best Practices

1. **Test First:** Use simulation mode before enabling Twilio
2. **Timing:** Send reminders 2-3 days before collection date
3. **Frequency:** Avoid sending multiple reminders per day
4. **Personalize:** Use custom messages for special cases
5. **Monitor:** Check Twilio console for delivery rates
6. **Budget:** Set spending limits in Twilio console
7. **Backup:** Keep a list of pledge numbers separately

## 📱 Example Workflow

### Weekly Reminder Campaign:
1. **Monday:** Review pledges due this week
2. **Tuesday:** Send bulk reminders via Dashboard
3. **Wednesday:** Follow up with custom messages for high-value pledges
4. **Thursday:** Check responses and update collection plans
5. **Friday:** Send thank you messages for received payments
6. **Weekend:** Review Twilio console for delivery reports

## 🔮 Future Enhancements

Possible additions (not yet implemented):
- [ ] Scheduled reminders (automatic)
- [ ] WhatsApp integration
- [ ] Email notifications
- [ ] SMS templates library
- [ ] Delivery reports in dashboard
- [ ] SMS history per pledge
- [ ] Opt-out management
- [ ] Multi-language support

## 💡 Tips

1. **Save Money:** Use bulk reminders instead of individual ones
2. **Better Delivery:** Send during business hours (9 AM - 5 PM)
3. **Personalize:** Add pledger names for better engagement
4. **Track:** Monitor which reminders lead to payments
5. **Test:** Always test with your own number first

## 🆘 Support

### Need Help?
- Check backend console logs
- Review Twilio console for errors
- Verify phone number format
- Test in simulation mode first

### Still Having Issues?
- Check `.env` file has correct credentials
- Restart backend server after config changes
- Verify Twilio account is active and funded
- Check firewall/network settings

---

## ✅ Quick Start Checklist

- [ ] Create Twilio account
- [ ] Get Account SID and Auth Token
- [ ] Buy Twilio phone number
- [ ] Add credentials to `.env`
- [ ] Restart backend server
- [ ] Test with your own phone number
- [ ] Send first reminder!

**You're all set!** 🎉

The SMS notification system is ready to help you collect pledges more effectively!

