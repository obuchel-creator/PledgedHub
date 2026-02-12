# QR Payment Webhook Integration - Visual Architecture

## High-Level Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         QR PAYMENT WORKFLOW                         │
└─────────────────────────────────────────────────────────────────────┘

1. GENERATE QR CODE
   ┌──────────────────────┐
   │  User creates pledge  │
   └──────────┬───────────┘
              │
              ▼
   ┌──────────────────────────────────┐
   │ POST /api/qr/mtn or /api/qr/airtel│
   └──────────┬───────────────────────┘
              │
              ▼
   ┌─────────────────────────────────────────────┐
   │ QR Generated with:                          │
   │ • qrCodeId (database ID)                    │
   │ • qrReference (unique identifier)           │
   │ • QR image (Base64 encoded)                 │
   │ • USSD instructions                         │
   └──────────┬──────────────────────────────────┘
              │
              ▼
        ┌──────────────┐
        │ User scans QR│
        └──────┬───────┘
               │

2. INITIATE PAYMENT
               │
               ▼
   ┌──────────────────────────────────────────┐
   │ POST /api/qr/initiate                    │
   │ Body: { paymentLink, phoneNumber }       │
   └─────────────┬──────────────────────────┬─┘
                 │                          │
                 ▼                          ▼
        ┌─────────────────┐      ┌──────────────────┐
        │ Record QR scan  │      │ Verify pledge    │
        └─────────────────┘      └──────────────────┘
                 │                          │
                 └──────────┬───────────────┘
                            │
                            ▼
        ┌──────────────────────────────────────┐
        │ Route to Mobile Money Service        │
        │ (Auto-detect provider from phone)    │
        └─────────────┬──────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │ externalId = PLEDGE-{id}-{time}     │
        │ reference = qrReference             │
        │ Pass to MTN/Airtel API              │
        └─────────────┬──────────────────────┘
                      │
                      ▼
        ┌──────────────────────────────────┐
        │ Provider sends USSD prompt       │
        │ User enters PIN on phone         │
        └─────────────┬────────────────────┘
                      │
                      ▼
        ┌──────────────────────────────────┐
        │ User confirms payment            │
        └─────────────┬────────────────────┘
                      │

3. WEBHOOK CALLBACK
                      │
                      ▼
        ┌────────────────────────────────────────────────┐
        │ MTN/Airtel sends webhook callback              │
        │ (Async, may take seconds to minutes)           │
        └────────┬───────────────────────────────────────┘
                 │
        ┌────────▼──────────────────────────────────┐
        │ POST /api/payments/mtn/callback           │
        │           OR                              │
        │ POST /api/payments/airtel/callback        │
        │                                           │
        │ Body: {                                  │
        │   referenceId: "MTN_REF_123",            │
        │   status: "SUCCESSFUL",                  │
        │   amount: 50000,                         │
        │   externalId: "PLEDGE-123-1234567890"    │
        │ }                                        │
        └────────┬──────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────┐
        │ Webhook Handler RECEIVED        │
        │ Returns: 200 OK                 │
        │ (Immediately, then processes)   │
        └────────┬────────────────────────┘
                 │

4. PROCESS PAYMENT
                 │
                 ▼
        ┌──────────────────────────────────────┐
        │ Extract pledge ID from externalId    │
        │ PLEDGE-{123}-1234567890 → 123        │
        └────────┬─────────────────────────────┘
                 │
        ┌────────▼──────────────────────────────┐
        │ Within Database Transaction:          │
        │                                       │
        │ 1. Create/Update payment record       │
        │    INSERT payments (...)              │
        │                                       │
        │ 2. Update pledge balance              │
        │    amount_paid += 50000               │
        │    balance -= 50000                   │
        │    status = 'paid' or 'active'        │
        │                                       │
        │ 3. Link QR code to payment            │
        │    INSERT qr_code_payments (...)      │
        │                                       │
        │ 4. Check idempotency                  │
        │    (same reference = no duplicate)    │
        │                                       │
        │ COMMIT (all or nothing)               │
        └────────┬─────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────┐
        │ ✅ Payment Processed            │
        │ ✅ Pledge Updated               │
        │ ✅ QR Linked                    │
        │ ✅ Audit Logged                 │
        └─────────────────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────┐
        │ Dashboard Updates Automatically  │
        │ (If real-time connected)        │
        │ - Pledge status: PAID/ACTIVE    │
        │ - Balance: Updated              │
        │ - Last payment: Recorded        │
        └─────────────────────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPONENT INTERACTIONS                       │
└─────────────────────────────────────────────────────────────────────┘

USER INTERFACE                  BACKEND SERVICES             DATABASE
┌──────────────┐              ┌──────────────────┐         ┌────────┐
│   Frontend   │              │  Express Server  │         │ MySQL  │
│  (React)     │              │   (Port 5001)    │         │        │
└──────┬───────┘              └────────┬─────────┘         └────────┘
       │                               │                        │
       │ 1. Generate QR               │                        │
       │ POST /api/qr/mtn             │                        │
       │──────────────────────────────>│                        │
       │                               │ 2. Call qrCodeService │
       │                               │──────────────────────>│
       │                               │                        │
       │                               │ CREATE qr_codes       │
       │                               │ CREATE qr_code_scans  │
       │                               │<──────────────────────│
       │                               │                        │
       │<── Returns QR with reference  │                        │
       │    qrReference: "unique-123"  │                        │
       │                               │                        │
       │ 3. User scans QR             │                        │
       │ Opens payment link            │                        │
       │                               │                        │
       │ 4. Initiate Payment          │                        │
       │ POST /api/qr/initiate         │                        │
       │ {paymentLink, phoneNumber}    │                        │
       │──────────────────────────────>│                        │
       │                               │ 5. Record scan        │
       │                               │─────────────────────>│
       │                               │                        │
       │                               │ 6. Route to           │
       │                               │    mobileMoneyService │
       │                               │    (MTN/Airtel)       │
       │                               │                        │
       │<── Returns pending payment    │                        │
       │                               │                        │
       │ 7. User completes payment    │                        │
       │ on phone (USSD/App)          │                        │
       │                               │                        │
       │ [Time delay: Seconds to      │                        │
       │  minutes while processing]   │                        │
       │                               │                        │
       │                               │ 8. MTN/Airtel webhook │
       │                               │    callback received   │
       │                               │                        │
       │                               │ mtnCallbackRoutes OR  │
       │                               │ airtelCallbackRoutes  │
       │                               │                        │
       │                               │<──────────────────────│
       │                               │                        │
       │                               │ 9. Extract pledgeId   │
       │                               │ 10. Create payment rec│
       │                               │────────────────────── │
       │                               │                        │
       │                               │ BEGIN TRANSACTION     │
       │                               │ INSERT payments       │
       │                               │ UPDATE pledges        │
       │                               │ INSERT qr_code_pay... │
       │                               │ COMMIT                │
       │                               │                        │
       │                               │<──────────────────────│
       │                               │                        │
       │ 11. Dashboard polls status    │ 12. GET /api/pledges  │
       │ (Real-time or polling)        │_____────────────────>│
       │<────────────────────────────── ────────────────────── │
       │                               │ SELECT * FROM pledges │
       │                               │<──────────────────────│
       │                               │                        │
       │ Updated pledge view:          │                        │
       │ ✓ Amount paid updated         │                        │
       │ ✓ Balance recalculated        │                        │
       │ ✓ Status changed to PAID      │                        │
       │                               │                        │
```

---

## Database State Changes

```
┌─────────────────────────────────────────────────────────────────┐
│               DATABASE TRANSACTION FLOW                         │
└─────────────────────────────────────────────────────────────────┘

BEFORE WEBHOOK:
┌──────────────────┐  ┌─────────────────────┐  ┌───────────────┐
│ pledges table    │  │ payments table      │  │ qr_codes table│
├──────────────────┤  ├─────────────────────┤  ├───────────────┤
│ id: 123          │  │ (empty for this QR) │  │ id: 456       │
│ amount: 100000   │  │                     │  │ qr_ref: "..."│
│ amount_paid: 0   │  │                     │  │ status: ...   │
│ balance: 100000  │  │                     │  │               │
│ status: active   │  │                     │  │               │
└──────────────────┘  └─────────────────────┘  └───────────────┘

WEBHOOK RECEIVED:
{
  status: "SUCCESSFUL",
  amount: 50000,
  externalId: "PLEDGE-123-1234567890"
}

TRANSACTION BEGINS:
1. INSERT INTO payments (...)
   ├─ pledge_id: 123
   ├─ amount: 50000
   ├─ payment_method: 'mtn'
   ├─ status: 'completed'
   └─ Notes contain reference

2. UPDATE pledges SET
   ├─ amount_paid = 50000
   ├─ balance = 50000
   ├─ status = 'active'
   └─ last_payment_date = NOW()

3. INSERT INTO qr_code_payments (...)
   ├─ qr_code_id: 456
   ├─ payment_id: (new payment ID)
   ├─ status: 'completed'
   └─ completed_at: NOW()

4. COMMIT (Success) or ROLLBACK (Failure)

AFTER WEBHOOK (COMMIT):
┌──────────────────┐  ┌─────────────────────┐  ┌───────────────────┐
│ pledges table    │  │ payments table      │  │ qr_code_payments  │
├──────────────────┤  ├─────────────────────┤  ├───────────────────┤
│ id: 123          │  │ id: 999             │  │ id: 555           │
│ amount: 100000   │  │ pledge_id: 123      │  │ qr_code_id: 456   │
│ amount_paid: 50K │  │ amount: 50000       │  │ payment_id: 999   │
│ balance: 50K     │  │ payment_method: mtn │  │ status: completed │
│ status: active   │  │ status: completed   │  │ completed_at: NOW │
└──────────────────┘  └─────────────────────┘  └───────────────────┘

IDEMPOTENCY:
If same webhook received again:
├─ Check for existing payment by reference
├─ If found: Update status to 'completed' (no duplicate)
└─ If not found: Create new payment record
```

---

## Error Handling Flow

```
┌────────────────────────────────────────────────────┐
│          ERROR HANDLING STRATEGY                   │
└────────────────────────────────────────────────────┘

Webhook Received
      │
      ▼
  Validate (referenceId, status required?)
      │
      ├─ NO → Return 400 Bad Request
      │        (But still return 200 OK)
      │
      ▼
  BEGIN TRANSACTION
      │
      ├─ Extract pledgeId
      │   ├─ Success → Continue
      │   └─ Fail → Log, Rollback, Return 200
      │
      ├─ Find/Create Payment
      │   ├─ Success → Continue
      │   └─ Fail → Rollback, Log, Return 200
      │
      ├─ Update Pledge
      │   ├─ Success → Continue
      │   └─ Fail → Rollback, Log, Return 200
      │
      ├─ Link QR (optional)
      │   ├─ Success → Continue
      │   └─ Fail → Log (non-blocking), Continue
      │
      ▼
  COMMIT
      │
      ├─ Success → Return 200 { success: true }
      └─ Fail → ROLLBACK, Log, Return 200 { success: false }

KEY: Always return 200 OK (HTTP) to prevent provider retries,
     but report actual success in JSON response body
```

---

## Performance Timeline

```
┌────────────────────────────────────────────────────────┐
│        TYPICAL PAYMENT PROCESSING TIMELINE             │
└────────────────────────────────────────────────────────┘

User Action:
0.0s    User taps "Pay with MTN"
        └─> POST /api/qr/initiate
        └─> Response: 200 OK (pending)
        └─> Show "Awaiting payment..." screen

Mobile Money:
0.2s-2s MTN sends USSD prompt to phone
2-30s   User dials USSD code OR uses app
30-60s  User enters PIN and confirms
60s-2m  MTN processes payment

Webhook:
60s-120s MTN sends webhook callback
        └─> POST /api/payments/mtn/callback received
        └─> Handler processes (<200ms database transaction)
        └─> Payment record created
        └─> Pledge balance updated
        └─> QR code linked

Dashboard:
120s+   Frontend polls pledge status
        └─> Sees updated amount_paid
        └─> Shows "Payment Complete!"
        └─> Updates UI with new balance

Total Latency: ~90-180 seconds (typical)
Database Transaction Time: ~50-150ms
Webhook Processing Time: <200ms
```

---

## Security Architecture

```
┌──────────────────────────────────────────────┐
│         SECURITY LAYERS                      │
└──────────────────────────────────────────────┘

1. WEBHOOK VALIDATION
   ├─ Required fields check (referenceId, status)
   └─ PaymentRequestValidation

2. PLEDGE VERIFICATION
   ├─ Extract and validate pledge ID
   ├─ Verify pledge exists
   └─ Verify not deleted

3. IDEMPOTENCY CHECK
   ├─ Query by payment_method_reference
   ├─ Query by notes containing transaction ID
   └─ Prevent duplicate processing

4. DATABASE TRANSACTIONS
   ├─ BEGIN TRANSACTION
   ├─ Atomic updates (all or nothing)
   └─ ROLLBACK on any error

5. PARAMETERIZED QUERIES
   ├─ No SQL injection possible
   ├─ All values bound as parameters
   └─ No string concatenation

6. AUDIT LOGGING
   ├─ All transactions logged
   ├─ Error messages recorded
   ├─ Timestamps captured
   └─ For compliance and debugging

7. ERROR HANDLING
   ├─ Always return 200 OK (acknowledge)
   ├─ Log actual errors internally
   ├─ Prevent provider retries
   └─ No sensitive data in response

FUTURE ENHANCEMENTS:
├─ HMAC signature verification of webhook payloads
├─ IP whitelisting for provider servers
├─ Rate limiting on /callback endpoints
└─ Encrypted webhook payloads
```

---

## Ready for Deployment

```
✅ Architecture Designed
✅ Code Implemented
✅ Tests Created
✅ Documentation Complete
✅ Manual Testing Verified
✅ Error Handling Tested
✅ Database Transactions Working
✅ Idempotency Implemented
✅ Logging Enabled

🔄 Next Steps:
├─ Integration testing with real sandbox
├─ Update callback URLs in provider dashboards
└─ Deploy to production with monitoring
```

