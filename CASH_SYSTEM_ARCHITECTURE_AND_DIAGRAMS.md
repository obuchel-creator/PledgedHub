# Cash Payment System - Architecture & Visual Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CASH PAYMENT SYSTEM                                 │
│                                                                              │
│  ┌──────────────────┐              ┌──────────────────┐                    │
│  │   STAFF (User)   │              │  ADMIN (User)    │                    │
│  │                  │              │                  │                    │
│  │ Record Cash      │              │ Verify Payments  │                    │
│  │ Collection       │              │ Deposit to Bank  │                    │
│  └────────┬─────────┘              │ View Reports     │                    │
│           │                        │ Track Discrepancies                   │
│           │                        └────────┬─────────┘                    │
│           │                                 │                             │
│           └──────────────────────┬──────────┘                             │
│                                  │                                        │
│                    ┌─────────────▼─────────────┐                         │
│                    │   FRONTEND (React Vite)   │                         │
│                    │                           │                         │
│                    │ CashAccountabilityDash    │                         │
│                    │ - Summary Cards (6)       │                         │
│                    │ - Tabs (3: Overview,     │                         │
│                    │   Pending, Collectors)   │                         │
│                    │ - Modals (Verify, Deposit)                         │
│                    │ - Responsive Design      │                         │
│                    └─────────────┬─────────────┘                         │
│                                  │                                        │
│                    HTTP API (JSON)│                                        │
│                                  │                                        │
│                    ┌─────────────▼─────────────┐                         │
│                    │  BACKEND (Node.js Express)│                         │
│                    │                           │                         │
│                    │ Routes: /api/cash-payments│                         │
│                    │ - POST /record            │                         │
│                    │ - POST /:id/verify       │                         │
│                    │ - POST /:id/deposit      │                         │
│                    │ - GET /pending/list      │                         │
│                    │ - GET /dashboard         │                         │
│                    │ etc.                      │                         │
│                    │                           │                         │
│                    │ Service: cashPaymentService│                         │
│                    │ - recordCashPayment()    │                         │
│                    │ - verifyCashPayment()    │                         │
│                    │ - markAsDeposited()      │                         │
│                    │ - getAccountability...() │                         │
│                    │ etc.                      │                         │
│                    └─────────────┬─────────────┘                         │
│                                  │                                        │
│              ┌───────────────────┼───────────────────┐                   │
│              │                   │                   │                   │
│              ▼                   ▼                   ▼                   │
│        ┌──────────────┐   ┌──────────────┐   ┌──────────────┐           │
│        │  MYSQL DB    │   │  MYSQL DB    │   │  MYSQL DB    │           │
│        │              │   │              │   │              │           │
│        │ cash_deposits│   │cash_accountab│   │cash_audit_log│           │
│        │ (Collections)│   │(Monthly     │   │(Action     │           │
│        │ + indexes    │   │summaries)   │   │history)    │           │
│        └──────────────┘   └──────────────┘   └──────────────┘           │
│                                                                          │
│              ┌──────────────────────────┐                               │
│              │   DATABASE VIEWS         │                               │
│              │                          │                               │
│              │ cash_pending_verification│                               │
│              │ (Quick pending list)     │                               │
│              │                          │                               │
│              │ cash_collector_accountab │                               │
│              │ (Monthly per-collector)  │                               │
│              └──────────────────────────┘                               │
│                                                                          │
│              ┌──────────────────────────┐                               │
│              │  PAYMENTS TABLE COLUMNS  │                               │
│              │   (Extended)             │                               │
│              │                          │                               │
│              │ payment_method           │                               │
│              │ cash_collected_by        │                               │
│              │ cash_collection_date     │                               │
│              │ verification_status      │                               │
│              │ receipt_number           │                               │
│              │ + 4 more columns         │                               │
│              └──────────────────────────┘                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Recording Payment Flow
```
┌──────────────┐
│ STAFF USER   │
│              │
│ Fills form:  │
│ - Pledge ID  │
│ - Amount     │
│ - Donor name │
│ - Date       │
└──────┬───────┘
       │
       │ POST /api/cash-payments/record
       │ (with JWT token)
       │
       ▼
┌──────────────────────────────────┐
│ Backend Route Handler            │
│                                  │
│ authenticateToken middleware     │
│ requireStaff middleware          │
│ Input validation                 │
└──────┬───────────────────────────┘
       │
       │ Calls: recordCashPayment()
       │
       ▼
┌──────────────────────────────────┐
│ CashPaymentService               │
│                                  │
│ - Validate inputs                │
│ - Insert into cash_deposits      │
│ - Set status = 'pending'         │
│ - Log audit trail                │
│ - Return depositId               │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Database Insertion               │
│                                  │
│ INSERT cash_deposits {           │
│   pledge_id: 123,               │
│   collected_by: 5,              │
│   collected_amount: 50000,      │
│   collection_date: NOW(),       │
│   verification_status: 'pending'│
│ }                                │
│                                  │
│ INSERT cash_audit_log {         │
│   deposit_id: 1,                │
│   action: 'RECORDED',           │
│   performed_by: 5,              │
│   new_status: 'pending'         │
│ }                                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Response to Frontend             │
│                                  │
│ {                                │
│   success: true,                 │
│   data: {                        │
│     depositId: 1,               │
│     status: 'pending'           │
│   }                              │
│ }                                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Frontend UI Update               │
│                                  │
│ Show success message             │
│ Payment appears in pending tab   │
│ Admin receives notification      │
└──────────────────────────────────┘
```

### Verification Flow
```
┌──────────────┐
│ ADMIN USER   │
│              │
│ Reviews:     │
│ - Payment    │
│ - Amount     │
│ - Donor info │
│ - Receipt    │
└──────┬───────┘
       │
       │ Clicks: Verify ✅ or Reject ❌
       │
       ▼
┌──────────────────────────────────┐
│ Modal opens with options:        │
│                                  │
│ Approved: Yes/No                 │
│ Verification Notes: [textarea]   │
│ Submit button                    │
└──────┬───────────────────────────┘
       │
       │ POST /api/cash-payments/:id/verify
       │ { approved: true, notes: "..." }
       │
       ▼
┌──────────────────────────────────┐
│ Backend Route Handler            │
│                                  │
│ authenticateToken middleware     │
│ requireAdmin middleware          │
│ Input validation                 │
└──────┬───────────────────────────┘
       │
       │ Calls: verifyCashPayment()
       │
       ▼
┌──────────────────────────────────┐
│ CashPaymentService               │
│                                  │
│ - Get deposit from DB            │
│ - Update verification_status     │
│ - Set verified_by & verified_at  │
│ - Save verification_notes        │
│ - Log audit trail                │
│ - Return updated deposit         │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Database Update                  │
│                                  │
│ UPDATE cash_deposits SET         │
│   verification_status = 'verified│
│   verified_by = 1,               │
│   verified_at = NOW(),           │
│   verification_notes = '...'     │
│ WHERE id = 1                     │
│                                  │
│ INSERT cash_audit_log {         │
│   action: 'VERIFIED',            │
│   performed_by: 1,              │
│   old_status: 'pending',        │
│   new_status: 'verified'        │
│ }                                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Response to Frontend             │
│                                  │
│ {                                │
│   success: true,                 │
│   data: {                        │
│     depositId: 1,               │
│     status: 'verified'          │
│   }                              │
│ }                                │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Frontend UI Update               │
│                                  │
│ Modal closes                     │
│ Payment removed from Pending tab │
│ Summary cards update             │
│ Verified amount increases        │
└──────────────────────────────────┘
```

---

## Status Lifecycle Diagram

```
                      ┌─────────────────────┐
                      │  PAYMENT RECORDED   │
                      │  status: 'pending'  │
                      │  ⏳ Awaiting Admin  │
                      └──────────┬──────────┘
                                 │
                      (Admin reviews)
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
        ┌──────────────────────┐   ┌──────────────────┐
        │   ADMIN APPROVES     │   │ ADMIN REJECTS    │
        │   status: 'verified' │   │ status: 'reject' │
        │   ✅ Approved        │   │ ❌ Denied        │
        └──────────┬───────────┘   └──────┬───────────┘
                   │                      │
                   │ (Admin deposits)     │ (End here)
                   │                      │
                   ▼                      └──────────────────┐
        ┌──────────────────────────┐                        │
        │  DEPOSIT TO BANK         │                        │
        │  deposited_to_bank = true│                        │
        │  🏦 In Bank              │                        │
        └──────────┬───────────────┘                        │
                   │                                        │
                   ▼                                        ▼
        ┌──────────────────────────┐         ┌────────────────────────┐
        │  FULLY RECONCILED        │         │  REJECTED (NO CREDIT)  │
        │  reconciled = true       │         │  Not counted in totals │
        │  ✅ Complete             │         │  Audit trail shows why │
        └──────────────────────────┘         └────────────────────────┘

Every status change logged in cash_audit_log with:
  - Timestamp
  - User who made change
  - Old status
  - New status
  - Reason/notes
```

---

## Monthly Accountability Reporting Flow

```
┌─────────────────────────────────────┐
│ ADMIN REQUESTS MONTHLY REPORT       │
│                                     │
│ Select: Month = 1, Year = 2024     │
│ GET /api/cash-payments/dashboard   │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ Backend Processes Request            │
│                                      │
│ Calls: getAccountabilityDashboard() │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│ SQL Queries Run                                          │
│                                                          │
│ Query 1: SELECT SUM(collected_amount)                   │
│          FROM cash_deposits                             │
│          WHERE MONTH = 1 AND YEAR = 2024               │
│          → Total Collected: 5,000,000                   │
│                                                          │
│ Query 2: SELECT SUM(collected_amount)                   │
│          FROM cash_deposits                             │
│          WHERE verification_status = 'verified'        │
│          AND MONTH = 1 AND YEAR = 2024                 │
│          → Verified: 4,500,000                          │
│                                                          │
│ Query 3: SELECT SUM(collected_amount)                   │
│          FROM cash_deposits                             │
│          WHERE verification_status = 'pending'         │
│          AND MONTH = 1 AND YEAR = 2024                 │
│          → Pending: 500,000                             │
│                                                          │
│ Query 4: SELECT * FROM cash_collector_accountability   │
│          WHERE month_year = '2024-01'                   │
│          → Per-collector breakdown                      │
│                                                          │
│ Query 5: SELECT * FROM cash_discrepancies               │
│          WHERE MONTH = 1 AND YEAR = 2024               │
│          → Variance tracking                            │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────┐
│ Data Aggregation                                      │
│                                                       │
│ {                                                     │
│   summary: {                                          │
│     total_collected: 5000000,                        │
│     verified: 4500000,                               │
│     pending: 500000,                                 │
│     rejected: 0,                                     │
│     deposited: 3500000,                              │
│     undeposited: 1000000,                            │
│     discrepancies: 3                                 │
│   },                                                  │
│   activeCollectors: 5,                               │
│   topCollectors: [                                    │
│     { name: "John", amount: 1500000, ... },         │
│     { name: "Jane", amount: 1200000, ... },         │
│     ...                                               │
│   ],                                                  │
│   verificationAverageTime: 1.5,  (days)             │
│   rejectionRate: 2.5,  (percent)                    │
│   discrepancies: [                                    │
│     { type: 'amount_mismatch', count: 2, ... }     │
│   ]                                                   │
│ }                                                     │
└───────────────┬────────────────────────────────────┘
                │
                ▼
┌────────────────────────────────────────────┐
│ Response to Frontend                       │
│                                            │
│ 200 OK                                     │
│ {                                          │
│   success: true,                           │
│   data: {                                  │
│     summary: {...},                        │
│     activeCollectors: 5,                   │
│     topCollectors: [...],                  │
│     ...                                    │
│   }                                        │
│ }                                          │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────┐
│ Frontend Dashboard Display                 │
│                                            │
│ ┌──────────────────────────────────────┐   │
│ │ 6 Summary Cards                      │   │
│ │ ┌────────┐ ┌────────┐ ┌────────┐    │   │
│ │ │5000000 │ │4500000 │ │500000  │    │   │
│ │ │Collected│ │Verified│ │Pending │    │   │
│ │ └────────┘ └────────┘ └────────┘    │   │
│ │                                      │   │
│ │ ┌────────┐ ┌────────┐ ┌────────┐    │   │
│ │ │3500000 │ │1000000 │ │  3     │    │   │
│ │ │Deposited│ │Undepositd│Discrepancy   │
│ │ └────────┘ └────────┘ └────────┘    │   │
│ │                                      │   │
│ │ [Tabs: Overview | Pending | Collectors]   │
│ │                                      │   │
│ │ Overview Tab:                        │   │
│ │ - Top 5 Collectors (cards)          │   │
│ │ - Key Metrics                        │   │
│ │ - Verification Rate: 90%             │   │
│ │ - Avg Verification: 1.5 days         │   │
│ │ - Rejection Rate: 2.5%               │   │
│ └──────────────────────────────────────┘   │
└────────────────────────────────────────────┘
```

---

## Database Schema Visualization

```
┌─────────────────────────────────────────────────────────────────┐
│                    payments (Extended)                           │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)                                                          │
│ pledge_id (FK → pledges)                                        │
│ amount                                                           │
│ status                                                           │
│ ... existing columns ...                                        │
│                                                                 │
│ *** NEW COLUMNS ***                                            │
│ payment_method (cash, mtn, airtel, bank)                       │
│ cash_collected_by (FK → users)  [STAFF ID]                    │
│ cash_collection_date                                           │
│ cash_verified_by (FK → users)   [ADMIN ID]                    │
│ cash_verified_at                                               │
│ verification_status (pending, verified, rejected)             │
│ verification_notes (TEXT)                                     │
│ receipt_number (UNIQUE)                                       │
│ receipt_photo_url                                             │
└─────────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │ cash_deposits    │ │cash_accountability│ │ cash_audit_log   │
    ├──────────────────┤ ├──────────────────┤ ├──────────────────┤
    │ id (PK)          │ │ id (PK)          │ │ id (PK)          │
    │ pledge_id (FK)   │ │ deposit_id (FK)  │ │ deposit_id (FK)  │
    │ collected_by (FK)│ │ month_year (DATE)│ │ action (ENUM)    │
    │ collected_amount │ │ total_collected  │ │ performed_by (FK)│
    │ collection_date  │ │ pending_amount   │ │ old_status (TEXT)│
    │ donor_name       │ │ verified_amount  │ │ new_status (TEXT)│
    │ donor_phone      │ │ rejected_amount  │ │ notes (TEXT)     │
    │ verification_st. │ │ deposited_amount │ │ timestamp        │
    │ verified_by (FK) │ │ undeposited_amt  │ │                  │
    │ verified_at      │ │                  │ │                  │
    │ deposited_to_bank│ │                  │ │                  │
    │ bank_reference   │ │                  │ │                  │
    │ created_at       │ │                  │ │                  │
    │ updated_at       │ │                  │ │                  │
    └──────────────────┘ └──────────────────┘ └──────────────────┘
                │                              │
                └──────────────────┬───────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ cash_discrepancies  │
                        ├─────────────────────┤
                        │ id (PK)             │
                        │ deposit_id (FK)     │
                        │ discrepancy_type    │
                        │ expected_amount     │
                        │ actual_amount       │
                        │ variance_percentage │
                        │ description         │
                        │ resolution_status   │
                        │ reported_by (FK)    │
                        │ reported_at         │
                        └─────────────────────┘
```

---

## Permission Matrix

```
┌─────────────────────┬──────────┬───────┐
│ Action              │ Staff    │ Admin │
├─────────────────────┼──────────┼───────┤
│ Record Payment      │ ✅ Yes   │ ✅ Yes│
│ View Own Recordings │ ✅ Yes   │ ✅ Yes│
│ Verify Payment      │ ❌ No    │ ✅ Yes│
│ Reject Payment      │ ❌ No    │ ✅ Yes│
│ Deposit to Bank     │ ❌ No    │ ✅ Yes│
│ View Pending List   │ ❌ No    │ ✅ Yes│
│ View Dashboard      │ ❌ No    │ ✅ Yes│
│ Report Discrepancy  │ ❌ No    │ ✅ Yes│
│ View Audit Trail    │ ❌ No    │ ✅ Yes│
│ Export Reports      │ ❌ No    │ ✅ Yes│
└─────────────────────┴──────────┴───────┘
```

---

## Technology Stack

```
┌────────────────────────────────────────────────────────────┐
│                   CASH PAYMENT SYSTEM                      │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ FRONTEND                                                   │
│ ├─ React 18+                                              │
│ ├─ React Router v7                                        │
│ ├─ Vite (bundler)                                         │
│ ├─ CSS3 (Grid, Flexbox, Responsive)                      │
│ ├─ Fetch API (HTTP client)                               │
│ └─ JavaScript ES6+                                        │
│                                                            │
│ BACKEND                                                    │
│ ├─ Node.js                                                │
│ ├─ Express.js (web framework)                             │
│ ├─ MySQL2/Promise (database driver)                       │
│ ├─ JWT (authentication)                                   │
│ ├─ Middleware (auth, validation, error handling)         │
│ └─ JavaScript ES6+                                        │
│                                                            │
│ DATABASE                                                   │
│ ├─ MySQL 8.0+                                             │
│ ├─ 4 new tables                                           │
│ ├─ 2 views for fast reporting                            │
│ ├─ 9 columns added to payments table                     │
│ ├─ Proper indexes for performance                        │
│ └─ Foreign key constraints for integrity                 │
│                                                            │
│ DEPLOYMENT                                                │
│ ├─ Development: npm run dev (both servers)               │
│ ├─ Production: Node.js process + nginx reverse proxy     │
│ ├─ Database: MySQL instance                              │
│ └─ Ports: Backend 5001, Frontend 5173                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## API Request/Response Cycle

```
┌─────────────────────────────────────────────────────────────┐
│ REQUEST PHASE                                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Client (React)                                              │
│   │                                                         │
│   ├─ Prepare request data                                  │
│   ├─ Add JWT token to Authorization header                │
│   ├─ POST http://localhost:5001/api/cash-payments/record  │
│   │                                                         │
│   └─ Payload:                                              │
│      {                                                      │
│        pledgeId: 123,                                      │
│        collectedAmount: 50000,                            │
│        collectionDate: "2024-01-15T10:00:00Z",            │
│        donorName: "John Doe",                             │
│        ...                                                  │
│      }                                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SERVER PROCESSING PHASE                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 1. Route Matching                                          │
│    POST /api/cash-payments/record                          │
│    → cashPaymentRoutes.post('/record', ...)               │
│                                                             │
│ 2. Middleware Chain                                        │
│    a) authenticateToken() ✅ Valid JWT                     │
│    b) requireStaff() ✅ User is staff                      │
│    c) Input validation ✅ All fields valid                 │
│                                                             │
│ 3. Service Layer                                           │
│    recordCashPayment({...}) called                         │
│    ├─ Validate inputs (try-catch)                         │
│    ├─ Generate SQL query                                   │
│    ├─ Execute: INSERT INTO cash_deposits                  │
│    ├─ Log audit trail                                      │
│    └─ Return { success: true, data: {...} }              │
│                                                             │
│ 4. Database Operations                                     │
│    ├─ INSERT cash_deposits row                            │
│    ├─ Get insertId as depositId                           │
│    ├─ INSERT cash_audit_log row                           │
│    └─ Both succeed (transaction consistent)               │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ RESPONSE PHASE                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Server sends response                                       │
│   ├─ Status code: 201 Created                             │
│   ├─ Content-Type: application/json                       │
│   │                                                        │
│   └─ Response body:                                        │
│      {                                                      │
│        success: true,                                      │
│        data: {                                             │
│          depositId: 1,                                     │
│          status: "pending",                               │
│          createdAt: "2024-01-15T10:00:00Z"                │
│        }                                                    │
│      }                                                      │
│                                                             │
│ Client receives response                                    │
│   ├─ Parse JSON                                            │
│   ├─ Extract depositId from response                       │
│   ├─ Show success message to user                         │
│   └─ Update UI (payment appears in pending list)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘

ERROR CASE:

If something fails:
  
  Error in middleware?
    → Return 400/401/403 with error message
    
  Error in service?
    → Catch error, return 400 with error message
    
  Database error?
    → Log error, return 500 with generic message
    
Response format (always consistent):
{
  success: false,
  error: "Descriptive error message"
}

Client shows error toast/alert to user.
```

---

## Dashboard Component Hierarchy

```
<CashAccountabilityDashboard>
  │
  ├─ <div className="cash-accountability-container">
  │   │
  │   ├─ <div className="cash-header">
  │   │   ├─ <h1>Cash Accountability Dashboard</h1>
  │   │   └─ <div className="month-year-selector">
  │   │       ├─ Month <select>
  │   │       └─ Year <select>
  │   │
  │   ├─ <div className="cash-summary-cards">
  │   │   ├─ <div className="summary-card">Total Collected</div>
  │   │   ├─ <div className="summary-card verified">Verified ✅</div>
  │   │   ├─ <div className="summary-card pending">Pending ⏳</div>
  │   │   ├─ <div className="summary-card deposited">Deposited 🏦</div>
  │   │   ├─ <div className="summary-card">Undeposited 📍</div>
  │   │   └─ <div className="summary-card discrepancy">Discrepancies ⚠️</div>
  │   │
  │   ├─ <div className="tabs-container">
  │   │   ├─ <div className="tabs-header">
  │   │   │   ├─ <button className="tab-button active">Overview</button>
  │   │   │   ├─ <button className="tab-button">Pending</button>
  │   │   │   └─ <button className="tab-button">Collectors</button>
  │   │   │
  │   │   ├─ Overview Tab Content (activeTab === 'overview')
  │   │   │   ├─ <h3>Top Collectors</h3>
  │   │   │   ├─ <div className="top-collectors">
  │   │   │   │   └─ <div className="collector-card">
  │   │   │   │       ├─ <div className="collector-name">John Doe</div>
  │   │   │   │       └─ <div className="collector-amount">UGX 1,500,000</div>
  │   │   │   │
  │   │   │   └─ <div className="metrics-grid">
  │   │   │       ├─ <div className="metric-box">Active Collectors: 5</div>
  │   │   │       ├─ <div className="metric-box">Verification Rate: 90%</div>
  │   │   │       └─ <div className="metric-box">Avg Time: 1.5 days</div>
  │   │   │
  │   │   ├─ Pending Tab Content (activeTab === 'pending')
  │   │   │   └─ <table className="pending-table">
  │   │   │       ├─ <thead>
  │   │   │       │   ├─ Collector
  │   │   │       │   ├─ Donor
  │   │   │       │   ├─ Amount
  │   │   │       │   ├─ Date
  │   │   │       │   ├─ Days
  │   │   │       │   └─ Actions
  │   │   │       │
  │   │   │       └─ <tbody>
  │   │   │           └─ <tr> (for each pending deposit)
  │   │   │               └─ <td className="action-buttons">
  │   │   │                   ├─ <button className="btn-verify">Verify</button>
  │   │   │                   └─ <button className="btn-reject">Reject</button>
  │   │   │
  │   │   └─ Collectors Tab Content (activeTab === 'collectors')
  │   │       └─ <div className="collectors-grid">
  │   │           └─ <div className="collector-detail-card">
  │   │               ├─ <div className="collector-header">
  │   │               │   ├─ <h3>Staff Name</h3>
  │   │               │   └─ <span className="status-badge active">Active</span>
  │   │               │
  │   │               ├─ <div className="stats-grid">
  │   │               │   ├─ <div className="stat-item">Total: 1.5M</div>
  │   │               │   ├─ <div className="stat-item">Pending: 200K</div>
  │   │               │   ├─ <div className="stat-item">Verified: 1.3M</div>
  │   │               │   └─ <div className="stat-item">Deposited: 1M</div>
  │   │               │
  │   │               └─ <button className="deposit-now-btn">
  │   │                   Deposit Now
  │   │
  │   └─ Modal (verifyModal.open)
  │       └─ <div className="modal-overlay">
  │           └─ <div className="modal-content">
  │               ├─ <div className="modal-header">
  │               │   ├─ <h2>Verify Payment</h2>
  │               │   └─ <button className="modal-close">✕</button>
  │               │
  │               ├─ <div className="modal-body">
  │               │   ├─ Deposit details (display)
  │               │   ├─ <div className="form-group">
  │               │   │   ├─ <label>Notes</label>
  │               │   │   └─ <textarea>...</textarea>
  │               │   │
  │               │   └─ Checkbox: I confirm this payment
  │               │
  │               └─ <div className="modal-footer">
  │                   ├─ <button className="btn btn-primary">Verify ✅</button>
  │                   ├─ <button className="btn btn-danger">Reject ❌</button>
  │                   └─ <button className="btn btn-secondary">Cancel</button>
  │
  └─ State Management
      ├─ dashboard (summary data)
      ├─ pending (pending list)
      ├─ collectors (per-collector breakdown)
      ├─ month / year (selection)
      ├─ activeTab (current tab)
      ├─ selectedDeposit (for modal)
      ├─ verifyModal (open/close state)
      ├─ verifyForm (form data & errors)
      ├─ loading (API call state)
      └─ error (error message)
```

---

## File Structure

```
PledgeHub/
├── backend/
│   ├── services/
│   │   ├── ... (existing services)
│   │   └── cashPaymentService.js          (✨ NEW - 423 lines)
│   │
│   ├── routes/
│   │   ├── ... (existing routes)
│   │   └── cashPaymentRoutes.js           (✨ NEW - 267 lines)
│   │
│   ├── scripts/
│   │   ├── ... (existing scripts)
│   │   └── migration-cash-payment-tracking.js  (✨ NEW - 310 lines)
│   │
│   └── server.js                          (MODIFIED - Added route registration)
│
├── frontend/
│   └── src/
│       ├── screens/
│       │   ├── ... (existing screens)
│       │   ├── CashAccountabilityDashboard.jsx  (✨ NEW - 456 lines)
│       │   └── CashAccountabilityDashboard.css  (✨ NEW - 800+ lines)
│       │
│       └── App.jsx                        (MODIFIED - Added route)
│
├── docs/
│   └── CASH_PAYMENT_SYSTEM_GUIDE.md       (✨ NEW - 600+ lines)
│
├── CASH_SYSTEM_QUICK_REFERENCE.md        (✨ NEW - 400+ lines)
├── CASH_SYSTEM_IMPLEMENTATION_CHECKLIST.md (✨ NEW - 400+ lines)
├── CASH_PAYMENT_SYSTEM_DELIVERY.md       (✨ NEW - 500+ lines)
└── CASH_SYSTEM_ARCHITECTURE_AND_DIAGRAMS.md (This file - 400+ lines)
```

---

## Summary

This comprehensive diagram documentation shows:
✅ System architecture and data flow  
✅ Status lifecycle and transitions  
✅ Monthly reporting aggregation  
✅ Database schema relationships  
✅ Permission matrix  
✅ Technology stack  
✅ API request/response cycle  
✅ React component hierarchy  
✅ File structure and organization  

The cash payment system is a complete, production-ready solution for tracking cash donations with full accountability, audit trails, and administrative verification.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete
