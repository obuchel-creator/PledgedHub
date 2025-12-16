# QuickBooks-Style Accounting System - Implementation Complete! 📊

## ✅ What's Been Added

### 1. Database Schema (Double-Entry Bookkeeping)
- **`accounts`** - Chart of Accounts (Assets, Liabilities, Equity, Revenue, Expenses)
- **`journal_entries`** - Transaction headers
- **`journal_entry_lines`** - Debit/Credit details
- **Views**: `general_ledger`, `account_balances`

### 2. Backend Services
- **`accountingService.js`** (440+ lines)
  - Double-entry validation (debits = credits)
  - Journal entry creation with auto-numbering
  - Void transactions (creates reversals)
  - Account balance calculations
  - General ledger queries

- **`financialReportsService.js`** (530+ lines)
  - Balance Sheet
  - Income Statement (P&L)
  - Trial Balance
  - Cash Flow Statement
  - Accounts Receivable Aging Report
  - Financial Dashboard

### 3. Integration with Existing System
- **Modified `paymentTrackingService.js`**
  - Automatic journal entries when payments recorded
  - Maps payment methods (MTN, Airtel, Cash, Bank) to accounts
  - Debits cash accounts, credits pledges receivable
  - Added functions for pledge creation journal entries

### 4. API Routes (`/api/accounting`)
- **Accounts Management**
  - `GET /accounts` - List all accounts
  - `GET /accounts/:id` - Get account with balance
  - `POST /accounts` - Create account (Admin)
  - `PUT /accounts/:id` - Update account (Admin)

- **Journal Entries**
  - `GET /journal-entries` - List entries with filters
  - `GET /journal-entries/:id` - View entry details
  - `POST /journal-entries` - Manual entry (Admin)
  - `POST /journal-entries/:id/void` - Void entry (Admin)
  - `GET /ledger/:accountId` - General ledger for account

- **Financial Reports** (Staff access)
  - `GET /reports/balance-sheet?asOfDate=2024-12-31`
  - `GET /reports/income-statement?startDate=2024-01-01&endDate=2024-12-31`
  - `GET /reports/trial-balance?asOfDate=2024-12-31`
  - `GET /reports/cash-flow?startDate=2024-01-01&endDate=2024-12-31`
  - `GET /reports/ar-aging?asOfDate=2024-12-31`
  - `GET /reports/dashboard` - All reports combined

### 5. Standard Chart of Accounts
Pre-configured accounts for pledge management:
- **Assets**: Cash (1000), Bank (1050), MTN (1100), Airtel (1110), Pledges Receivable (1200)
- **Liabilities**: Unearned Revenue (2000), Accounts Payable (2100)
- **Equity**: Retained Earnings (3000), Owner's Capital (3100)
- **Revenue**: Pledge Income (4000), Donations (4100), Campaigns (4200)
- **Expenses**: SMS (5100), Email (5110), Payment Fees (5200), Hosting (5300)

## 🚀 Setup Instructions

### Step 1: Run Database Migration
```powershell
# Create accounting tables
node backend\scripts\migration-20251216-accounting-schema.js
```

Expected output:
```
🚀 Starting Accounting Schema Migration...
✅ accounts created successfully
✅ journal_entries created successfully
✅ journal_entry_lines created successfully
✅ general_ledger created successfully
✅ account_balances created successfully
🎉 Accounting schema migration completed successfully!
```

### Step 2: Seed Default Accounts
```powershell
# Populate Chart of Accounts
node backend\scripts\seed-default-accounts.js
```

Expected output:
```
🌱 Seeding Default Chart of Accounts...
✅ Created: 1000 - Cash
✅ Created: 1100 - Mobile Money - MTN
... (22 accounts total)
🎉 Seeding complete!
```

### Step 3: Restart Server
```powershell
# Stop current server (Ctrl+C)
# Start again
.\scripts\dev.ps1
```

### Step 4: Test Accounting API
```powershell
# Get auth token first
$token = "your_jwt_token_here"

# View all accounts
curl -H "Authorization: Bearer $token" http://localhost:5001/api/accounting/accounts?includeBalances=true

# View Balance Sheet
curl -H "Authorization: Bearer $token" http://localhost:5001/api/accounting/reports/balance-sheet

# View Dashboard
curl -H "Authorization: Bearer $token" http://localhost:5001/api/accounting/reports/dashboard
```

## 💡 How It Works

### Automatic Journal Entries

#### When Pledge Created
```
Debit:  Pledges Receivable (1200)  $1,000
Credit: Unearned Revenue (2000)    $1,000
```

#### When Payment Received (MTN Mobile Money)
```
Debit:  Mobile Money - MTN (1100)  $500
Credit: Pledges Receivable (1200)  $500
```

#### When Payment Received (Cash)
```
Debit:  Cash (1000)                $500
Credit: Pledges Receivable (1200)  $500
```

### Example Journal Entry Format
```javascript
const entry = {
  date: new Date(),
  description: "Payment received for Pledge #123",
  reference: "PLG-123-PMT",
  userId: 1,
  lines: [
    {
      accountId: 1100,  // Mobile Money - MTN
      debit: 50000,
      credit: 0,
      description: "Cash received via MTN"
    },
    {
      accountId: 1200,  // Pledges Receivable
      debit: 0,
      credit: 50000,
      description: "Reduce receivable for Pledge #123"
    }
  ]
};
```

## 📊 Financial Reports Explained

### 1. Balance Sheet
**Purpose**: Shows financial position at a point in time
```json
{
  "asOfDate": "2024-12-31",
  "assets": {
    "accounts": [{"code": "1000", "name": "Cash", "balance": 100000}],
    "total": 500000
  },
  "liabilities": { "total": 200000 },
  "equity": { "total": 300000 },
  "balanced": true  // Assets = Liabilities + Equity
}
```

### 2. Income Statement (P&L)
**Purpose**: Shows profitability over a period
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "revenue": {
    "accounts": [{"code": "4000", "name": "Pledge Income", "amount": 1000000}],
    "total": 1500000
  },
  "expenses": {
    "accounts": [{"code": "5200", "name": "Payment Fees", "amount": 50000}],
    "total": 300000
  },
  "netIncome": 1200000,
  "profitMargin": 80
}
```

### 3. AR Aging Report
**Purpose**: Identify overdue pledges
```json
{
  "aging": {
    "current": { "pledges": [], "total": 50000 },
    "days_1_30": { "pledges": [{"id": 5, "daysOverdue": 15}], "total": 20000 },
    "days_31_60": { "pledges": [], "total": 0 },
    "days_61_90": { "pledges": [], "total": 0 },
    "days_90_plus": { "pledges": [{"id": 2, "daysOverdue": 120}], "total": 30000 }
  },
  "summary": {
    "totalReceivable": 100000,
    "overdueCount": 2
  }
}
```

### 4. Trial Balance
**Purpose**: Verify books are balanced
```json
{
  "accounts": [
    {"code": "1000", "name": "Cash", "debit": 100000, "credit": 0},
    {"code": "4000", "name": "Pledge Income", "debit": 0, "credit": 100000}
  ],
  "totalDebits": 500000,
  "totalCredits": 500000,
  "balanced": true,
  "difference": 0
}
```

## 🔐 Access Control

### Required Roles
- **Staff**: View accounts, journal entries, reports
- **Admin**: Create/edit accounts, manual journal entries, void entries

### Test Access
```javascript
// In test mode (NODE_ENV=test), auth is bypassed
// Mock user has admin role for testing
```

## 🎯 Next Steps (Frontend - Phase 4)

### Components to Create

1. **`AccountingDashboard.jsx`** - Main dashboard
   - Key metrics cards (total assets, liabilities, equity)
   - Net income chart
   - Quick links to reports

2. **`BalanceSheetView.jsx`** - Balance sheet display
   - Assets section
   - Liabilities section
   - Equity section
   - Downloadable PDF

3. **`IncomeStatementView.jsx`** - P&L display
   - Revenue breakdown
   - Expense breakdown
   - Profit margin visualization

4. **`ARAgingView.jsx`** - Overdue pledges
   - Aging buckets table
   - Drill-down to pledge details
   - Send reminder action

5. **`ChartOfAccounts.jsx`** - Account management
   - Tree view of accounts
   - Add/edit accounts (Admin)
   - View account balances

6. **`JournalEntryForm.jsx`** - Manual entry creation (Admin)
   - Account selector
   - Debit/credit columns
   - Real-time validation (debits = credits)

## 🧪 Testing

### Manual Testing Checklist
1. ✅ Create test pledge → Verify journal entry created
2. ✅ Record payment → Verify cash account debited, receivable credited
3. ✅ View Balance Sheet → Verify assets = liabilities + equity
4. ✅ View Income Statement → Verify revenue - expenses = net income
5. ✅ View AR Aging → Verify overdue pledges categorized correctly
6. ✅ Create manual journal entry → Verify validation works
7. ✅ Void journal entry → Verify reversal created

### Integration Test (backend/scripts/test-all-features.js)
Add accounting tests:
```javascript
await test('Create Journal Entry', async () => {
  const res = await axios.post(`${BASE_URL}/accounting/journal-entries`, {
    description: 'Test entry',
    lines: [
      { accountId: 1, debit: 100, credit: 0, description: 'Test debit' },
      { accountId: 2, debit: 0, credit: 100, description: 'Test credit' }
    ]
  }, authHeaders());
  
  expect(res.data.success).toBe(true);
});
```

## 📚 Documentation Updates

### API Documentation
Add to `docs/API_DOCUMENTATION.md`:
- `/api/accounting/*` endpoints
- Request/response examples
- Error codes

### User Guide
Create `docs/ACCOUNTING_USER_GUIDE.md`:
- How to read financial reports
- Understanding debits and credits
- Common accounting workflows

## 🎉 Benefits for Users

### Before (Tracking Only)
- Track pledges and payments
- Know who owes what
- Send reminders

### After (Full Accounting)
- **Complete financial picture** - Assets, liabilities, equity
- **Profitability tracking** - Income vs expenses
- **Cash flow monitoring** - Where money is coming from/going to
- **Professional reports** - Balance Sheet, P&L, Cash Flow
- **Audit trail** - Every transaction recorded, never deleted
- **AR aging** - Identify problem pledges quickly
- **Multi-payment method tracking** - Cash, MTN, Airtel, Bank, PayPal

### Revenue Opportunity
Charge premium for accounting features:
- **Free tier**: Basic pledge tracking
- **Basic tier** ($5/mo): Payment tracking, basic reports
- **Pro tier** ($20/mo): Full accounting, all reports, AR aging
- **Enterprise** ($100/mo): Multi-currency, advanced features

## 🛠️ Maintenance

### Regular Tasks
1. **Reconciliation**: Match bank statements monthly
2. **Backups**: Export journal entries for offline backup
3. **Audits**: Review general ledger quarterly
4. **Cleanup**: Archive old entries yearly

### Database Optimization
```sql
-- Add indexes if performance degrades
CREATE INDEX idx_entry_date_status ON journal_entries(date, status);
CREATE INDEX idx_line_amounts ON journal_entry_lines(debit, credit);
```

## 📈 Future Enhancements (Phase 5+)

1. **Bank Reconciliation Module**
   - Import bank statements
   - Match transactions automatically
   - Flag discrepancies

2. **Budgeting**
   - Set campaign budgets
   - Compare actual vs budget
   - Variance analysis

3. **Multi-Currency**
   - Support USD, EUR, GBP
   - Automatic exchange rates
   - Currency gain/loss tracking

4. **Tax Compliance**
   - Generate tax receipts
   - VAT tracking
   - Tax reports for authorities

5. **QuickBooks Integration**
   - Export to QuickBooks format
   - Import from QuickBooks
   - Sync transactions

## 🆘 Support

### Common Issues

**"Debits don't equal credits"**
- Check calculation: Sum of all debits must = Sum of all credits
- Use DECIMAL(15,2) for all amounts, not FLOAT

**"Account not found"**
- Run seed script: `node backend/scripts/seed-default-accounts.js`
- Verify account exists: `SELECT * FROM accounts WHERE code = '1000'`

**"Journal entry not created"**
- Check logs for errors
- Verify accounts are active: `is_active = TRUE`
- Ensure user has Staff/Admin role

### Contact
- Issues: GitHub Issues
- Questions: Add to project documentation

---

**Implementation Date**: December 16, 2024
**Version**: 1.0.0
**Status**: ✅ Phase 1 Complete (Backend + Database)
**Next**: Phase 4 - Frontend Dashboard
