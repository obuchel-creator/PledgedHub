# Payment Tracking & Balance Reminders Implementation

## ✅ Completed Features

### 1. Database Schema
Added four new columns to `pledges` table:
- `amount_paid` (DECIMAL 10,2) - Tracks total amount paid so far
- `balance_remaining` (DECIMAL 10,2) - Calculates remaining balance
- `last_payment_date` (DATETIME) - Timestamp of last payment
- `last_balance_reminder` (DATETIME) - Timestamp of last balance reminder sent

### 2. Payment Tracking Service
**File**: `backend/services/paymentTrackingService.js`

#### Functions:
- `recordPayment(pledgeId, amount, paymentMethod, userId)` - Records a payment and updates balance
  - Updates `amount_paid` = current + new amount
  - Calculates `balance_remaining` = total - amount_paid
  - Sets `last_payment_date` = NOW()
  - Changes status to 'paid' when balance reaches zero
  - Automatically sends payment confirmation with balance info

- `sendBalanceReminder(pledgeId, isPaymentConfirmation)` - Sends SMS/email reminder with balance info
  - Includes payment history and remaining balance
  - Beautiful HTML email template with progress bar
  - SMS with concise balance information

- `sendPaymentConfirmation(pledgeId, amount, balance)` - Sends full payment confirmation

- `getPledgesNeedingBalanceReminders(days)` - Queries pledges with unpaid balances
  - Finds pledges where `balance_remaining > 0`
  - Checks if last reminder was more than X days ago
  - Returns pledges ordered by balance amount

- `sendAllBalanceReminders()` - Batch sends reminders to all qualifying pledges
  - Runs daily via cron job
  - Throttles to send once per 7 days
  - Returns summary of sent/failed

### 3. Payment Controller Integration
**File**: `backend/controllers/paymentController.js`

Updated `createPayment()` function to:
- Use new `paymentTrackingService.recordPayment()` 
- Returns comprehensive payment info including balance
- Automatically triggers reminders
- Falls back to legacy method if new service fails

Response format:
```json
{
  "success": true,
  "payment": {
    "amount": 300000,
    "newTotal": 300000,
    "balance": 700000,
    "fullyPaid": false
  },
  "pledge": {
    "id": 21,
    "amount": 1000000,
    "amountPaid": 300000,
    "balanceRemaining": 700000,
    "status": "active",
    "fullyPaid": false
  }
}
```

### 4. Automated Balance Reminders
**File**: `backend/services/cronScheduler.js`

Added new cron job:
- **Schedule**: Daily at 10:00 AM (Africa/Kampala timezone)
- **Function**: Checks all pledges with `balance_remaining > 0`
- **Throttling**: Only sends if last reminder was 7+ days ago
- **Notification**: Sends via SMS and email with balance details

### 5. Model Updates
**File**: `backend/models/Pledge.js`

Added to `ALLOWED_UPDATE` array:
- `amount_paid`
- `balance_remaining`
- `last_payment_date`
- `last_balance_reminder`

## 🔄 Payment Flow

### Making a Partial Payment:
1. User makes payment through system
2. `paymentController.createPayment()` called
3. `paymentTrackingService.recordPayment()`:
   - Adds payment amount to `amount_paid`
   - Calculates new `balance_remaining`
   - Updates `last_payment_date`
   - Changes status if needed:
     - `pending` → `active` (first payment)
     - `active` → `paid` (balance reaches zero)
4. Automatically sends confirmation:
   - If balance > 0: Payment confirmation + balance reminder
   - If balance = 0: Full payment celebration message
5. Records payment in `payments` table

### Daily Balance Reminders:
1. Cron job runs at 10:00 AM daily
2. Queries pledges where:
   - `balance_remaining > 0`
   - `status IN ('active', 'pending')`
   - Last reminder was 7+ days ago (or never sent)
3. For each pledge:
   - Generates personalized reminder with balance info
   - Sends via SMS (instant) and email (detailed)
   - Updates `last_balance_reminder` timestamp
4. Logs summary of reminders sent

## 📧 Notification Templates

### Balance Reminder Email:
- Beautiful gradient header
- Payment received confirmation (if recent payment)
- Current balance breakdown:
  - Total pledge amount
  - Amount paid so far
  - Balance remaining
- Visual progress bar showing % completed
- Professional formatting with emojis

### Balance Reminder SMS:
```
Dear [Name], thank you for your payment of UGX [amount]! 
You have a remaining balance of UGX [balance] on your pledge 
of UGX [total]. Amount paid so far: UGX [paid]. Please 
complete your pledge at your earliest convenience. 
Thank you for your support!
```

### Full Payment Confirmation:
```
Thank you! Your payment of UGX [amount] has been received. 
Your pledge is now fully paid. We appreciate your support! 🎉
```

## 🧪 Testing

### Test Script
**File**: `backend/scripts/test-payment-tracking.js`

Run: `node backend/scripts/test-payment-tracking.js`

Tests:
1. ✅ Creates test pledge (UGX 1,000,000)
2. ✅ First partial payment (UGX 300,000)
   - Verifies: amount_paid=300,000, balance=700,000
3. ✅ Second partial payment (UGX 400,000)
   - Verifies: amount_paid=700,000, balance=300,000
4. ✅ Final payment (UGX 300,000)
   - Verifies: amount_paid=1,000,000, balance=0, status='paid'
5. ✅ Balance reminder query
6. ✅ Reminder service execution
7. ✅ Cleanup test data

### Test Results:
```
✅ All tests passed! Payment tracking system is working correctly.
```

## 🎯 Key Features

1. **Automatic Balance Calculation**: System calculates remaining balance on every payment
2. **Smart Status Updates**: Status changes automatically based on payment progress
3. **Reminder Throttling**: Won't spam - sends reminders max once per 7 days
4. **Multi-Channel Notifications**: SMS (instant) + Email (detailed)
5. **Payment Confirmations**: Every payment gets immediate confirmation
6. **Visual Progress**: Email includes progress bar showing completion percentage
7. **Graceful Fallbacks**: Works even if email/SMS services not configured
8. **Comprehensive Testing**: Full test suite verifies all functionality

## 📊 Database Queries

### Find pledges needing reminders:
```sql
SELECT p.*, u.username, u.email, u.phone_number
FROM pledges p
LEFT JOIN users u ON p.ownerId = u.id
WHERE p.balance_remaining > 0
AND p.status IN ('active', 'pending')
AND (
    p.last_balance_reminder IS NULL
    OR DATEDIFF(NOW(), p.last_balance_reminder) >= 7
)
ORDER BY p.balance_remaining DESC
```

### Update payment and balance:
```sql
UPDATE pledges 
SET amount_paid = amount_paid + ?,
    balance_remaining = amount - (amount_paid + ?),
    last_payment_date = NOW(),
    status = IF(amount - (amount_paid + ?) <= 0, 'paid', status)
WHERE id = ?
```

## 🔧 Configuration

### Cron Schedule:
- **Morning Reminders**: 9:00 AM - General pledge reminders
- **Balance Reminders**: 10:00 AM - Unpaid balance reminders
- **Evening Reminders**: 5:00 PM - Overdue/due today only

### Reminder Frequency:
- Balance reminders: Every 7 days maximum
- Prevents notification fatigue

### Timezone:
All cron jobs use `Africa/Kampala` timezone (EAT - UTC+3)

## 🚀 Manual Testing

### Test balance reminder manually:
```javascript
const cronScheduler = require('./backend/services/cronScheduler');
await cronScheduler.runBalanceRemindersManually();
```

### Test specific pledge reminder:
```javascript
const paymentTrackingService = require('./backend/services/paymentTrackingService');
await paymentTrackingService.sendBalanceReminder(pledgeId, false);
```

## 📝 Next Steps for Production

1. ✅ Database migration completed
2. ✅ Service implementation completed
3. ✅ Cron job integration completed
4. ✅ Testing completed
5. ⏳ Configure email service (SMTP credentials)
6. ⏳ Configure SMS service (Twilio/Airtel Money credentials)
7. ⏳ Test with real pledges
8. ⏳ Monitor cron job execution
9. ⏳ Frontend UI for viewing payment history and balance

## 🎉 Impact

This feature enables the organization to:
- **Track partial payments accurately**
- **Automatically remind pledgers of outstanding balances**
- **Reduce manual follow-up work**
- **Improve pledge completion rates**
- **Provide transparent payment tracking**
- **Build trust with automated confirmations**

---

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**

**Last Updated**: December 2024

