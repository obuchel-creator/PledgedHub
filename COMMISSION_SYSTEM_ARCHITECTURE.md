# 📊 Commission System Architecture & Flow

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PLEDGEHUB COMMISSION SYSTEM               │
└─────────────────────────────────────────────────────────────┘

TIER 1: INPUTS (Where money comes from)
├─ Organization creates pledge
│  └─ Org name: "Red Cross Uganda"
│  └─ Amount: 100,000 UGX
│  └─ Donor: "John Doe"
│  └─ Payment method: MTN or Airtel

TIER 2: PROCESSING (What happens)
├─ Donor sends payment via MTN/Airtel
├─ System detects payment (webhook callback)
├─ Identifies which organization collected it
├─ Calculates commission split based on org tier
│  ├─ Free tier:       95% org, 5% YOU
│  ├─ Basic tier:      97.5% org, 2.5% YOU
│  ├─ Pro tier:        98.5% org, 1.5% YOU
│  └─ Enterprise tier: 99.5% org, 0.5% YOU
├─ Creates records:
│  ├─ payment_splits row (org: 95,000, platform: 5,000)
│  └─ commissions row (YOUR share: 5,000, status: pending)

TIER 3: STORAGE (Where data lives)
├─ organizations table (which orgs collect pledges)
├─ platform_accounts table (YOUR accounts - MTN & Airtel)
├─ commissions table (YOUR earnings, pending & paid out)
├─ commission_payouts table (payout history)
└─ Views:
   ├─ commission_summary (all your commissions)
   ├─ organization_earnings (what each org earned)
   └─ my_commission_summary (your summary)

TIER 4: AUTOMATION (Daily 5 PM)
├─ Cron scheduler wakes up at 5:00 PM
├─ Checks for pending commissions
├─ If amount > 0:
│  ├─ Sums all pending commissions
│  ├─ Attempts payout to primary MTN account
│  ├─ If MTN fails: tries Airtel backup
│  ├─ If both fail: keeps pending, retries tomorrow
│  └─ On success:
│     ├─ Marks as "paid_out"
│     ├─ Records transaction
│     └─ Sends SMS confirmation
└─ If amount = 0: skips (nothing to send)

TIER 5: OUTPUTS (Where money goes)
├─ Your MTN wallet (0774306868)
└─ Your Airtel wallet (0701067528) [if MTN fails]
```

---

## Money Flow Example

### Scenario: 3 Organizations, 1 Day of Pledges

```
ORGANIZATION A (Free Tier - 95% rate)
├─ Pledge 1: 50,000 UGX received
│  └─ A gets: 47,500 UGX
│  └─ YOU get: 2,500 UGX ← Added to your balance
├─ Pledge 2: 30,000 UGX received
│  └─ A gets: 28,500 UGX
│  └─ YOU get: 1,500 UGX ← Added to your balance

ORGANIZATION B (Pro Tier - 98.5% rate)
├─ Pledge 3: 100,000 UGX received
│  └─ B gets: 98,500 UGX
│  └─ YOU get: 1,500 UGX ← Added to your balance

ORGANIZATION C (Basic Tier - 97.5% rate)
├─ Pledge 4: 40,000 UGX received
│  └─ C gets: 39,000 UGX
│  └─ YOU get: 1,000 UGX ← Added to your balance

═══════════════════════════════════════════
YOUR DAILY TOTAL: 2,500 + 1,500 + 1,500 + 1,000 = 6,500 UGX
═══════════════════════════════════════════

AT 5:00 PM:
┌─ System checks balance: 6,500 UGX pending
├─ Calls MTN API: Send 6,500 UGX to 0774306868
├─ MTN confirms: Transaction ID MTN-20250115-12345
├─ Updates database:
│  ├─ Sets all 4 commissions status = "paid_out"
│  ├─ Records payout in commission_payouts table
│  └─ Sets paid_out_at timestamp
└─ Sends SMS to your phone:
   "Your PledgeHub commission of 6,500 UGX has been sent to 
    your MTN account. Reference: MTN-20250115-12345"
```

---

## Database Relationships

```
organizations (Multiple orgs can collect pledges)
├── id (PK)
├── name: "Red Cross Uganda"
├── email: "red@example.com"
├── tier: "free" (determines commission %)
└── is_active: true

organization_accounts (Org's payment accounts)
├── id (PK)
├── organization_id (FK)
├── provider: "mtn"
├── phone_number: "256700123456"
└── is_primary: true

pledges (Donor pledges - your existing table)
├── id (PK)
├── donor_name: "John Doe"
├── amount: 100000
├── organization_id: 1 ← Links pledge to org
└── status: "paid"

payment_splits (How each payment is divided)
├── id (PK)
├── pledge_id: 1 (FK)
├── organization_id: 1 (FK)
├── organization_amount: 95000 (95%)
├── platform_amount: 5000 (5%) ← YOUR share
└── created_at: timestamp

commissions (Your earnings)
├── id (PK)
├── pledge_id: 1 (FK)
├── organization_id: 1 (FK)
├── amount: 5000 ← YOUR commission
├── status: "paid_out" ← pending → paid_out
└── paid_out_at: timestamp

commission_payouts (Payout history)
├── id (PK)
├── total_amount: 6500 ← Sum of commissions
├── account_id: 1 (FK) ← Which account received it
├── transaction_reference: "MTN-20250115-12345"
├── status: "completed"
├── payout_date: timestamp
└── completed_date: timestamp

platform_accounts (YOUR accounts - input by you!)
├── id (PK)
├── provider: "mtn"
├── phone_number: "256774306868"
├── account_name: "PledgeHub Commission - MTN"
├── is_primary: true ← Gets payout first
└── is_active: true
```

---

## API Call Flow

```
FRONTEND REQUEST:
GET /api/commissions/summary
Headers: { Authorization: "Bearer eyJhbGc..." }

↓

BACKEND VALIDATION:
├─ authenticateToken middleware
│  └─ Decodes JWT, extracts user_id
├─ requireAdmin middleware
│  └─ Checks if user has admin role
└─ securityService.rateLimiters.api
   └─ Checks rate limit (100 req / 15 min)

↓

ROUTE HANDLER (commissionRoutes.js):
app.get('/summary', async (req, res) => {
  const result = await commissionDistributionService.getAvailableCommissions();
  res.json(result);
});

↓

SERVICE LAYER (commissionDistributionService.js):
async function getAvailableCommissions() {
  const [rows] = await pool.execute(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_commission_owed,
      COUNT(*) as pending_commissions,
      MAX(created_at) as last_commission_date
    FROM commissions
    WHERE status = 'pending'
  `);
  return { success: true, data: rows[0] };
}

↓

DATABASE QUERY:
SELECT 
  COALESCE(SUM(amount), 0) as total_commission_owed,
  COUNT(*) as pending_commissions,
  MAX(created_at) as last_commission_date
FROM commissions
WHERE status = 'pending'

Result: { 
  total_commission_owed: 6500,
  pending_commissions: 4,
  last_commission_date: "2025-01-15T10:30:00Z"
}

↓

RESPONSE TO FRONTEND:
{
  "success": true,
  "data": {
    "total_commission_owed": 6500,
    "pending_commissions": 4,
    "last_commission_date": "2025-01-15T10:30:00Z"
  }
}
```

---

## Daily Payout Automation (Cron Job)

```
CRON SCHEDULE: Every day at 5:00 PM (Africa/Kampala)

Timeline:
├─ 4:59:50 PM - Cron scheduler is ready
├─ 5:00:00 PM - cronScheduler.processDailyCommissionBatch() fires
│
├─ STEP 1: Check for pending commissions
│  └─ Query: SELECT SUM(amount) FROM commissions WHERE status = 'pending'
│  └─ Result: 6500 UGX
│
├─ STEP 2: If amount > 0, prepare payout
│  ├─ Create payout record in commission_payouts table
│  ├─ status = 'processing'
│  └─ transaction_reference = null (will update on success)
│
├─ STEP 3: Get primary account
│  └─ Query: SELECT * FROM platform_accounts WHERE is_primary = 1
│  └─ Result: MTN 0774306868
│
├─ STEP 4: Call MTN API
│  ├─ endpoint: https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay
│  ├─ payload: {
│  │  externalId: "COMM-6500-20250115",
│  │  amount: "6500",
│  │  currency: "EUR", (converts UGX to EUR)
│  │  payer: { partyIdType: "MSISDN", partyId: "256774306868" },
│  │  payerMessage: "PledgeHub Commission Payout",
│  │  payeeNote: "Daily batch payout"
│  │ }
│  └─ auth: Basic base64(api_key:api_secret)
│
├─ STEP 5: Handle Response
│  ├─ If SUCCESS (status 202):
│  │  ├─ Update payout record: status = 'completed'
│  │  ├─ Set: transaction_reference = response.transactionId
│  │  ├─ Update commissions: status = 'paid_out'
│  │  ├─ Set: paid_out_at = NOW()
│  │  ├─ Send SMS notification to 0774306868:
│  │  │  "Your PledgeHub commission of 6,500 UGX has been sent 
│  │  │   to your account. Ref: MTN-20250115-12345"
│  │  └─ Log: "✅ Payout successful"
│  │
│  ├─ If FAILURE (API error):
│  │  ├─ Retry up to 3 times
│  │  ├─ If still fails:
│  │  │  ├─ Try AIRTEL (backup account: 0701067528)
│  │  │  └─ If Airtel also fails:
│  │  │     ├─ Keep payout record: status = 'failed'
│  │  │     ├─ Keep commissions: status = 'pending'
│  │  │     ├─ Log failure reason
│  │  │     └─ Retry automatically tomorrow
│  │  └─ Alert admin: "Payout failed for 2025-01-15"
│  │
│  └─ If both MTN & Airtel fail:
│     ├─ Update payout: status = 'failed'
│     ├─ failure_reason = "MTN: Insufficient balance, Airtel: Network error"
│     ├─ Keep commissions pending
│     └─ Retry daily until success
│
├─ STEP 6: Log everything
│  ├─ Success: commission_payouts table + commission table update + SMS sent
│  ├─ Failure: commission_payouts table with failure_reason + admin alert
│  └─ Nothing to pay: Skip silently
│
└─ 5:00:15 PM - Job complete, waits for next day

IMPORTANT NOTES:
├─ Timezone: Africa/Kampala (EAT, UTC+3)
├─ No DST: Uganda doesn't observe daylight saving
├─ Run once daily: Even if server restarts, runs only once per day
├─ Idempotent: If runs twice (unlikely), won't send twice
├─ Auto-retry: MTN → Airtel → Pending → Try again tomorrow
└─ Phone format: Always normalized to 256XXXXXXXXX
```

---

## Security & Encryption

```
SENSITIVE DATA PROTECTION:

Phone Numbers:
├─ Stored: Encrypted using AES-256-CBC
├─ Column: platform_accounts.phone_number (encrypted)
├─ Decryption: Only in memory when needed for API calls
└─ Encryption key: ENCRYPTION_KEY env variable (32-byte hex)

API Credentials:
├─ Stored: NOT in database, in .env file
├─ Used: Only by commissionDistributionService
├─ Logged: Never logged in plain text
└─ Rotated: Change in .env and restart

Database Queries:
├─ Parameterized: pool.execute('SELECT * FROM ? WHERE id = ?', [params])
├─ Never concatenated: No SQL injection possible
└─ Escaped: mysql2/promise handles escaping

Authentication:
├─ JWT tokens: Signed with JWT_SECRET from .env
├─ Required for: All /api/commissions endpoints
├─ Verified: authenticateToken middleware decodes & validates
└─ Scoped: Only admin users can access (requireAdmin)

Rate Limiting:
├─ API: 100 requests per 15 minutes per IP
├─ Payment: 10 requests per hour per IP
├─ Auth: 5 requests per 15 minutes per IP
└─ Blocks: After exceeding, returns 429 Too Many Requests

CORS:
├─ Frontend: http://localhost:5173 (dev)
├─ Headers: Content-Type, Authorization, X-CSRF-Token
├─ Credentials: true (allows cookies/auth headers)
└─ Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
```

---

## Error Handling & Retries

```
WHEN PAYMENT FAILS:

Scenario 1: MTN API returns error
├─ Error: { code: 'INSUFFICIENT_BALANCE' }
├─ Action: Retry (up to 3 times with 5-min delay)
├─ If still fails: Try Airtel
├─ If Airtel fails: Keep pending, try again tomorrow
└─ Admin notification: Email alert of failure

Scenario 2: Network timeout
├─ Error: { code: 'ETIMEDOUT' }
├─ Action: Retry immediately (3 times)
├─ If fails: Try Airtel
├─ If Airtel fails: Keep pending
└─ Log: Detailed error message for debugging

Scenario 3: Invalid phone number format
├─ Error: { code: 'INVALID_PHONE' }
├─ Action: Check primary account is valid
├─ If invalid: Skip, alert admin
├─ Fix: Update account via PUT /api/commissions/accounts/1
└─ Retry: Next daily batch

Scenario 4: Payout amount too small
├─ Error: { code: 'AMOUNT_TOO_SMALL' }
├─ Min amount: Usually 100 UGX (per provider)
├─ Action: Wait until pending commissions > min amount
├─ Try again: Next day
└─ Note: Most providers have no minimum

Scenario 5: Account deactivated
├─ Error: { code: 'ACCOUNT_INACTIVE' }
├─ Primary account marked inactive
├─ Action: Auto-tries backup (Airtel)
├─ Admin alert: "Primary account inactive, switched to backup"
└─ Fix: Reactivate primary via PUT or manually review
```

---

## Monitoring & Alerts

```
ADMIN DASHBOARD WOULD SHOW:

Real-time Metrics:
├─ Pending commissions: 6,500 UGX (4 records)
├─ Last payout: 2025-01-14, 18:30, 5,200 UGX ✅
├─ Failed payouts: 0 (none)
├─ Primary account: MTN 0774306868 ✅ Active
└─ Backup account: Airtel 0701067528 ✅ Active

Daily History:
├─ 2025-01-15: 6,500 UGX sent to MTN ✅
├─ 2025-01-14: 5,200 UGX sent to MTN ✅
├─ 2025-01-13: 0 UGX (no pending)
├─ 2025-01-12: 3,800 UGX sent to MTN ✅
└─ 2025-01-11: 8,900 UGX sent to MTN ✅

Alerts:
├─ [WARNING] Payout attempt for 2025-01-10 failed
│  Reason: MTN API timeout
│  Status: Retrying with Airtel
├─ [INFO] Switched to backup account (Airtel)
│  Primary: MTN not responding
│  Amount: 4,200 UGX sent to Airtel
└─ [CRITICAL] Both accounts failed
   MTN: Network error
   Airtel: Invalid credentials
   Action: Manual intervention needed
```

---

## Integration Points with Existing System

```
Your existing pledgeRoutes.js needs to:

1. When creating a pledge:
   POST /api/pledges
   {
     donor_name: "John Doe",
     amount: 100000,
     organization_id: 1,  ← NEW
     purpose: "Help children"
   }
   
   NEW: Include organization_id to track which org collected it

2. When pledge payment is received:
   POST /api/pledges/:id/payment
   {
     amount: 100000,
     payment_method: "mtn",
     transaction_ref: "MTN-12345"
   }
   
   NEW: Call commissionDistributionService
   const splitResult = await commissionDistributionService.calculateAndSplitPayment(
     pledgeId,
     amount,
     organizationId,
     userId
   );
   
   Result: { 
     organization_amount: 95000,
     platform_commission: 5000,
     commission_id: 1
   }

3. Update organization_accounts when org changes payment method:
   PUT /api/organizations/:id/accounts
   {
     provider: "mtn",
     phone_number: "256700000000"
   }
```

---

**Architecture complete! Ready to handle multi-org commissions at scale.** 🚀
