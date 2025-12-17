# Cash Payment ↔️ Reminder Integration Guide

## Overview
When donors pay pledges in **cash**, their payment reminders are automatically **flagged off** to prevent reminder spam after payment is received.

## How It Works

### 🎯 The Integration Flow

```
Donor makes cash payment
        ↓
recordCashPayment() called
        ↓
✅ Pledge status → 'paid'
✅ last_reminder_sent → NOW()
        ↓
Reminder system excludes pledge
(status != 'paid' in query filter)
        ↓
No more reminders sent ✓
```

## Technical Details

### Database Updates
When a cash payment is recorded, the `pledges` table is updated with:

```sql
UPDATE pledges SET 
  status = 'paid',
  last_reminder_sent = NOW(),
  payment_method = 'cash',
  collection_date = [payment_date]
WHERE id = [pledge_id]
```

### Dual-Layer Protection
The system uses TWO checks to prevent reminders:

**Layer 1: Status Check**
```sql
WHERE status != 'paid'
```
- When status = 'paid', pledge is excluded from all reminder queries

**Layer 2: Date Check** 
```sql
WHERE last_reminder_sent IS NULL 
   OR DATE(last_reminder_sent) != CURDATE()
```
- Even if status changes, reminders won't repeat same-day

---

## Complete Payment Lifecycle

### 1️⃣ **Cash Payment Recording** (`recordCashPayment()`)
**Status**: `pending` → `paid`

```javascript
// Payment recorded by donor/admin
const result = await cashPaymentService.recordCashPayment({
  pledgeId: 123,
  amount: 50000,
  collectedBy: staffId,
  collectionDate: new Date()
});

// ✅ Reminders automatically flagged off
console.log("🚫 Reminders flagged off for pledge #123")
```

**What happens to reminders**:
- ✅ Marked as sent (last_reminder_sent = NOW())
- ✅ Pledge status = 'paid' (excluded from queries)
- ✅ Will NOT receive any future reminders

---

### 2️⃣ **Cash Verification** (`verifyCashPayment()`)
**Status**: `pending` → `verified` OR `rejected`

#### If Approved ✅
```javascript
await cashPaymentService.verifyCashPayment({
  cashDepositId: 456,
  approved: true,
  verifiedBy: adminId
});

// ✅ Reminders remain flagged off
// Status: paid → Confirms reminders off
// Messages: "Cash payment verified - reminders turned off"
```

**Reminder behavior**:
- ✅ Reminders stay OFF (status remains 'paid')
- ✅ Donor won't receive additional messages

#### If Rejected ❌
```javascript
await cashPaymentService.verifyCashPayment({
  cashDepositId: 456,
  approved: false,
  verifiedBy: adminId,
  verificationNotes: "Amount mismatch"
});

// ⚠️ Reminders restored
// Status: pending (back to normal)
// last_reminder_sent: NULL (resets)
```

**Reminder behavior**:
- ✅ Reminders automatically RESUME
- ✅ Pledge back in reminder queue
- ✅ Donor will receive reminders again if payment still pending

---

### 3️⃣ **Bank Deposit** (`markAsDeposited()`)
**Status**: `verified` → `deposited_to_bank`

```javascript
await cashPaymentService.markAsDeposited({
  cashDepositId: 456,
  bankReference: "DEP-2025-001",
  depositDate: new Date()
});

// ✅ Reminders stay OFF through deposit phase
console.log("🏦 Cash deposited to bank - Reminders remain off")
```

**Reminder behavior**:
- ✅ Reminders stay OFF (status confirmed 'paid')
- ✅ Maintains reminder flags even after bank deposit
- ✅ Clean audit trail showing reminder status

---

## Reminder Query Filters

### Pledges EXCLUDED from reminders (❌ Won't receive messages)
```sql
-- These pledges are filtered OUT:
WHERE status = 'paid'           -- Cash payment recorded
   OR status = 'cancelled'      -- Pledge cancelled
   OR status = 'declined'       -- Payment declined
```

### Pledges INCLUDED in reminders (✅ Will receive messages)
```sql
-- These pledges are included:
WHERE status = 'pending'        -- Awaiting payment
   AND last_reminder_sent IS NULL  -- Never sent reminder
   OR DATE(last_reminder_sent) != CURDATE()  -- Not sent today
```

---

## Admin Dashboard Indicators

When viewing cash payment details:

### Paid & Reminders Off ✅
```
Pledge ID: 123
Status: PAID
Reminders: 🚫 OFF
Last Reminder: 2025-01-15 09:00 AM
Message: "Donor will not receive additional reminders"
```

### Pending & Reminders Active ⏰
```
Pledge ID: 124
Status: PENDING
Reminders: ✅ ACTIVE
Last Reminder: Never sent
Next Reminder: 2025-01-16 09:00 AM
Message: "Donor will receive reminders until payment received"
```

### Rejected & Reminders Restored ⚠️
```
Pledge ID: 125
Status: PENDING
Reminders: ✅ RESTORED
Last Reminder: NULL (reset)
Next Reminder: 2025-01-15 09:00 AM
Message: "Payment rejected - reminders resumed"
```

---

## Code Implementation

### File: `backend/services/cashPaymentService.js`

#### Method: `recordCashPayment()`
```javascript
async recordCashPayment({pledgeId, amount, collectedBy, collectionDate}) {
  // ... existing code ...

  // Update pledge with cash flag
  await pool.execute(
    'UPDATE pledges SET payment_method = ?, collection_date = ? WHERE id = ?',
    ['cash', collectionDate, pledgeId]
  );

  // FLAG OFF REMINDERS - Mark pledge reminders as completed
  await pool.execute(
    'UPDATE pledges SET last_reminder_sent = NOW(), status = ? WHERE id = ?',
    ['paid', pledgeId]
  );

  console.log(`🚫 Reminders flagged off for pledge #${pledgeId}`);
  
  return { success: true, data: { /* ... */ } };
}
```

#### Method: `verifyCashPayment()`
```javascript
async verifyCashPayment({cashDepositId, approved, verifiedBy}) {
  // ... existing code ...

  if (approved) {
    // Update payment status
    await pool.execute(
      'UPDATE payments SET status = ?, payment_method = ? WHERE pledge_id = ?',
      ['completed', 'cash', deposit.pledge_id]
    );

    // KEEP REMINDERS FLAGGED OFF - Verification confirms payment received
    await pool.execute(
      'UPDATE pledges SET status = ?, last_reminder_sent = NOW() WHERE id = ?',
      ['paid', deposit.pledge_id]
    );

    console.log(`✅ Cash verified - Reminders confirmed off for #${deposit.pledge_id}`);
  } else {
    // RESTORE REMINDERS IF REJECTED - Let donor know payment still needed
    await pool.execute(
      'UPDATE pledges SET status = ?, last_reminder_sent = NULL WHERE id = ?',
      ['pending', deposit.pledge_id]
    );

    console.log(`⚠️ Cash rejected - Reminders restored for #${deposit.pledge_id}`);
  }
}
```

#### Method: `markAsDeposited()`
```javascript
async markAsDeposited({cashDepositId, bankReference, recordedBy}) {
  // ... existing code ...

  // Get pledge info
  const [pledges] = await pool.execute(
    'SELECT id FROM pledges WHERE id = (?)',
    // ... get from cash_deposits ...
  );

  // MAINTAIN REMINDER FLAGS - Payment complete and deposited
  if (pledges.length > 0) {
    await pool.execute(
      'UPDATE pledges SET status = ?, last_reminder_sent = NOW() WHERE id = ?',
      ['paid', pledges[0].id]
    );
    console.log(`🏦 Deposited - Reminders stay off for #${pledges[0].id}`);
  }
}
```

---

## Reminder Service Integration

### File: `backend/services/reminderService.js`

The reminder system automatically respects cash payments via status checks:

```javascript
async getPledgesNeedingReminder(date) {
  const [pledges] = await pool.execute(`
    SELECT p.* FROM pledges p
    WHERE DATE(p.collection_date) = ? 
      AND p.status != 'paid'              ← Excludes paid pledges ✓
      AND p.status != 'cancelled'         ← Also excludes cancelled ✓
      AND (p.last_reminder_sent IS NULL 
           OR DATE(p.last_reminder_sent) != CURDATE())
  `, [date]);
  
  return pledges;
}
```

**Why cash-paid pledges are excluded**:
- When `recordCashPayment()` runs: `status = 'paid'`
- Reminder query filters: `WHERE status != 'paid'`
- Result: Pledge never selected for reminders ✓

---

## Testing the Integration

### Test Case 1: Record Cash Payment
```bash
# Record cash payment
curl -X POST http://localhost:5001/api/cash/record \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "pledgeId": 123,
    "amount": 50000,
    "collectedBy": 5
  }'

# Expected response:
{
  "success": true,
  "message": "Cash payment recorded. Awaiting verification.",
  "data": {
    "pledgeId": 123,
    "status": "recorded"
  }
}

# Check database:
SELECT status, last_reminder_sent FROM pledges WHERE id = 123;
# Should show: status = 'paid', last_reminder_sent = NOW()
```

### Test Case 2: Verify Approved
```bash
curl -X POST http://localhost:5001/api/cash/verify \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "cashDepositId": 456,
    "approved": true,
    "verifiedBy": 5
  }'

# Expected: Reminders stay OFF
# Console: "✅ Cash payment verified - Reminders confirmed off"
```

### Test Case 3: Verify Rejected
```bash
curl -X POST http://localhost:5001/api/cash/verify \
  -H "Authorization: Bearer {adminToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "cashDepositId": 456,
    "approved": false,
    "verifiedBy": 5,
    "verificationNotes": "Amount mismatch"
  }'

# Expected: Reminders restored
# Console: "⚠️ Cash rejected - Reminders restored"
# Check database: status = 'pending', last_reminder_sent = NULL
```

### Test Case 4: Trigger Reminder Job
```bash
# Run the daily reminder scheduler
node -e "
  const cronScheduler = require('./backend/services/cronScheduler');
  cronScheduler.triggerReminderJob();
"

# Check logs:
# ✅ Paid pledges excluded from reminder queue
# ✅ Only pending pledges receive reminders
# ✅ No duplicate reminders sent
```

---

## Troubleshooting

### ❓ Donor still receiving reminders after cash payment
**Causes & Solutions**:

1. **Cash payment not recorded**
   - Verify cash_deposits entry created
   - Check: `SELECT * FROM cash_deposits WHERE pledge_id = 123`

2. **Reminder query not filtering correctly**
   - Check pledge status: `SELECT status FROM pledges WHERE id = 123`
   - Should be: `status = 'paid'`
   - Verify query has: `WHERE status != 'paid'`

3. **Cron job hasn't run yet**
   - Reminder jobs run daily at 9 AM & 5 PM (Africa/Kampala timezone)
   - Manually trigger: `node backend/scripts/test-all-features.js`

4. **Multiple pending pledges**
   - Each pledge tracked separately
   - Verify correct pledge_id in cash_deposits

**Debug steps**:
```bash
# 1. Check pledge status
SELECT id, phone, status, last_reminder_sent FROM pledges WHERE id = 123;

# 2. Check cash deposit recorded
SELECT * FROM cash_deposits WHERE pledge_id = 123;

# 3. Check reminder logs
SELECT * FROM payments WHERE pledge_id = 123 ORDER BY created_at DESC;

# 4. Manually test reminder query
SELECT * FROM pledges 
WHERE status != 'paid' 
  AND DATE(collection_date) = CURDATE()
  AND (last_reminder_sent IS NULL 
       OR DATE(last_reminder_sent) != CURDATE());
```

---

## Summary

| Step | Reminders | Status | Message |
|------|-----------|--------|---------|
| **Record Cash Payment** | 🚫 OFF | paid | "Reminders flagged off" |
| **Verify Approved** | 🚫 OFF | paid | "Reminders confirmed off" |
| **Verify Rejected** | ✅ ON | pending | "Reminders restored" |
| **Deposit to Bank** | 🚫 OFF | paid | "Reminders stay off" |

✅ **Integration complete**: Cash payments automatically stop reminders, preventing donor spam and confusion.

