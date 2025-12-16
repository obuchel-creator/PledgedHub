# QuickBooks-Style Accounting & Analytics Features Guide

## Overview

PledgeHub includes comprehensive financial management features inspired by QuickBooks, including double-entry bookkeeping, financial reports, and advanced analytics. This guide shows you where to access and use these features.

---

## 📊 ACCOUNTING FEATURES (QuickBooks-Style)

### Available Endpoints

#### 1. **Chart of Accounts Management**
```
GET    /api/accounting/accounts
POST   /api/accounting/accounts
```

**Example - Get all accounts:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/accounting/accounts
```

**Example - Create new account:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "5300",
    "name": "Training Expenses",
    "type": "EXPENSE"
  }' \
  http://localhost:5001/api/accounting/accounts
```

**Account Types:**
- `ASSET` - Cash, Receivables, Inventory
- `LIABILITY` - Payables, Loans
- `EQUITY` - Owner's Capital, Retained Earnings
- `REVENUE` - Income sources
- `EXPENSE` - Operating costs

---

#### 2. **Journal Entry Creation** (Core Double-Entry Bookkeeping)
```
POST /api/accounting/journal-entries
```

**Example - Record a pledge payment:**
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2025-01-15",
    "description": "Payment for Pledge #123",
    "reference": "PLG-123-PMT",
    "lines": [
      {
        "accountId": 1,
        "type": "debit",
        "amount": 100000,
        "description": "Mobile Money received"
      },
      {
        "accountId": 3,
        "type": "credit",
        "amount": 100000,
        "description": "Reduce pledge receivable"
      }
    ]
  }' \
  http://localhost:5001/api/accounting/journal-entries
```

**Key Rule:** Debits MUST equal Credits (double-entry validation)

---

#### 3. **Trial Balance Report**
```
GET /api/accounting/trial-balance?asOfDate=YYYY-MM-DD
```

**Shows:**
- All accounts with debit/credit balances
- Total debits and credits
- Whether accounting is balanced

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/accounting/trial-balance?asOfDate=2025-01-15
```

---

#### 4. **Balance Sheet Report**
```
GET /api/accounting/balance-sheet?asOfDate=YYYY-MM-DD
```

**Shows:**
- Assets (what you own)
- Liabilities (what you owe)
- Equity (net worth)
- Accounting equation: Assets = Liabilities + Equity

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/accounting/balance-sheet?asOfDate=2025-01-31
```

---

#### 5. **Income Statement (P&L Report)**
```
GET /api/accounting/income-statement?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:**
- Total Revenue
- Total Expenses
- Net Income/Loss (Revenue - Expenses)

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5001/api/accounting/income-statement?startDate=2025-01-01&endDate=2025-01-31"
```

---

#### 6. **General Ledger** (All transactions for an account)
```
GET /api/accounting/general-ledger/:accountId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:**
- All journal entries affecting an account
- Transaction history with dates and amounts

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5001/api/accounting/general-ledger/1?startDate=2025-01-01&endDate=2025-01-31"
```

---

#### 7. **Account Balance**
```
GET /api/accounting/account-balance/:accountId?asOfDate=YYYY-MM-DD
```

**Shows:**
- Current balance of a specific account
- Debit and credit totals

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/accounting/account-balance/1?asOfDate=2025-01-31
```

---

## 📈 ANALYTICS FEATURES

### Available Endpoints

#### 1. **Basic Analytics Dashboard**
```
GET /api/analytics/dashboard
```

**Shows:**
- Total pledges
- Total amount pledged
- Pledges by status (pending, paid, overdue)
- Monthly pledge trends
- Collection rate percentage

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/analytics/dashboard
```

---

#### 2. **Campaign Analytics**
```
GET /api/analytics/campaigns
```

**Shows:**
- Performance by campaign
- Participation rate
- Collection status per campaign

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/analytics/campaigns
```

---

#### 3. **Donor Analytics**
```
GET /api/analytics/donors
```

**Shows:**
- Top donors by amount
- Donor frequency
- Donor retention metrics

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/analytics/donors
```

---

#### 4. **Advanced Analytics**

##### A. **Drill-down by Campaign**
```
GET /api/advanced-analytics/drilldown/campaign/:campaign?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:** Individual pledges in selected campaign

---

##### B. **Drill-down by Donor**
```
GET /api/advanced-analytics/drilldown/donor/:donor?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:** All pledges by specific donor

---

##### C. **Drill-down by Status**
```
GET /api/advanced-analytics/drilldown/status/:status?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:** Pledges filtered by status (pending, paid, overdue, cancelled)

---

##### D. **Drill-down by Purpose**
```
GET /api/advanced-analytics/drilldown/purpose/:purpose?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:** Pledges for specific purpose/description

---

##### E. **Collection Rate Analysis**
```
GET /api/advanced-analytics/collection-rate?groupBy=campaign|status|donor&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:**
- % of pledges collected
- % pending
- % overdue
- Grouped by campaign, status, or donor

**Example:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5001/api/advanced-analytics/collection-rate?groupBy=campaign&startDate=2025-01-01&endDate=2025-01-31"
```

---

##### F. **Donor Retention Analytics**
```
GET /api/advanced-analytics/donor-retention?period=monthly|quarterly|yearly
```

**Shows:**
- New donors
- Returning donors
- Churn rate (donors who stopped pledging)

---

##### G. **Payment Method Analytics**
```
GET /api/advanced-analytics/payment-methods?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```

**Shows:**
- Pledges by payment method (MTN, Airtel, Cash, etc.)
- Revenue by payment method
- Success rate per method

---

## 🔧 DEFAULT CHART OF ACCOUNTS

When the accounting system is initialized, these accounts are created:

| Code | Name | Type |
|------|------|------|
| 1000 | Cash | ASSET |
| 1100 | Mobile Money | ASSET |
| 1200 | Pledges Receivable | ASSET |
| 2000 | Unearned Revenue | LIABILITY |
| 2100 | Accounts Payable | LIABILITY |
| 3000 | Retained Earnings | EQUITY |
| 4000 | Pledge Income | REVENUE |
| 4100 | Donation Income | REVENUE |
| 5000 | Operating Expenses | EXPENSE |
| 5100 | Payment Processing Fees | EXPENSE |
| 5200 | SMS/Email Costs | EXPENSE |

---

## 💡 COMMON USE CASES

### Recording a Pledge
1. When a pledge is created, automatically record:
   - Debit: Pledges Receivable (1200)
   - Credit: Unearned Revenue (2000)

### Recording a Payment
1. When payment is received:
   - Debit: Cash or Mobile Money (1000 or 1100)
   - Credit: Pledges Receivable (1200)
2. When revenue is recognized:
   - Debit: Unearned Revenue (2000)
   - Credit: Pledge Income (4000)

### Recording Operating Expenses
1. When SMS is sent (charged to user):
   - Debit: SMS/Email Costs (5200)
   - Credit: Cash (1000)

### Monthly Financial Review
1. Run Trial Balance (verify balanced)
2. Run Balance Sheet (financial position)
3. Run Income Statement (profit/loss)
4. Run Donor Analytics (top performers)
5. Run Collection Rate Analysis (payment status)

---

## 🔐 PERMISSIONS

All accounting and analytics endpoints require:
- Authentication: `Authorization: Bearer {JWT_TOKEN}`
- Role: Most endpoints require `admin` or `staff` role
- Public endpoints: Some analytics summary data may be available to all authenticated users

---

## 📱 FRONTEND INTEGRATION

### Dashboard Component (add to DashboardScreen.jsx)
```jsx
import { useEffect, useState } from 'react';

export function FinancialDashboard() {
  const [trialBalance, setTrialBalance] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [incomeStatement, setIncomeStatement] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    const token = localStorage.getItem('token');
    
    // Get trial balance
    const tbRes = await fetch('/api/accounting/trial-balance', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setTrialBalance(await tbRes.json());
    
    // Get balance sheet
    const bsRes = await fetch('/api/accounting/balance-sheet', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setBalanceSheet(await bsRes.json());
    
    // Get income statement (this month)
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = today;
    const isRes = await fetch(
      `/api/accounting/income-statement?startDate=${start.toISOString().split('T')[0]}&endDate=${end.toISOString().split('T')[0]}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    setIncomeStatement(await isRes.json());
  }

  return (
    <div className="financial-dashboard">
      <h2>Financial Overview</h2>
      
      {/* Trial Balance */}
      {trialBalance && (
        <div className="card">
          <h3>Trial Balance</h3>
          <p>Total Debits: {trialBalance.data.totalDebits}</p>
          <p>Total Credits: {trialBalance.data.totalCredits}</p>
          <p>Balanced: {trialBalance.data.balanced ? '✓ Yes' : '✗ No'}</p>
        </div>
      )}
      
      {/* Balance Sheet */}
      {balanceSheet && (
        <div className="card">
          <h3>Balance Sheet</h3>
          <p>Total Assets: {balanceSheet.data.totalAssets}</p>
          <p>Total Liabilities: {balanceSheet.data.totalLiabilities}</p>
          <p>Total Equity: {balanceSheet.data.totalEquity}</p>
        </div>
      )}
      
      {/* Income Statement */}
      {incomeStatement && (
        <div className="card">
          <h3>Income Statement (This Month)</h3>
          <p>Total Revenue: {incomeStatement.data.totalRevenue}</p>
          <p>Total Expenses: {incomeStatement.data.totalExpenses}</p>
          <p>Net Income: {incomeStatement.data.netIncome}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🐛 TROUBLESHOOTING

### "Accounting routes not found"
- Check that `accountingRoutes` is imported in `backend/server.js`
- Verify accounts table exists: `SHOW TABLES LIKE 'accounts';`
- Run migration if needed: `node backend/scripts/complete-migration.js`

### "Journal entry not balanced"
- Error: "Debits must equal credits"
- Solution: Ensure sum of `debit` amounts = sum of `credit` amounts
- Each line must specify type: `debit` or `credit`

### "Account not found in chart of accounts"
- Solution: Create account first with POST /api/accounting/accounts
- Or initialize defaults: POST /api/accounting/initialize

### "Analytics showing no data"
- Check that pledges exist in database
- Verify date filters are correct
- Data only includes non-deleted pledges (deleted = 0)

---

## 📚 DOCUMENTATION LINKS

- Full API Docs: See `docs/API_DOCUMENTATION.md`
- Database Schema: See `backend/scripts/complete-migration.js`
- Service Code: See `backend/services/accountingService.js` and `analyticsService.js`
- Routes: See `backend/routes/accountingRoutes.js` and `analyticsRoutes.js`

---

## ✅ VERIFICATION CHECKLIST

Confirm accounting and analytics are working:

```bash
# 1. Check backend is running
curl http://localhost:5001/api/health

# 2. Get JWT token (login first)
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "testpass"}'

# 3. Test accounting endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/accounting/accounts

# 4. Test analytics endpoints
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/api/analytics/dashboard

# 5. All should return 200 OK with data
```

---

**Last Updated:** January 2025
