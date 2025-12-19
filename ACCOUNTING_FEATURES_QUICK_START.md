# 🎯 Accounting Features - Quick Start Guide

## ✅ What's New

Your accounting system is now **fully visible** in PledgeHub! Two new screens have been created to display and manage your financial data.

---

## 📊 1. Accounting Dashboard

**Location**: `/accounting/dashboard`

### What You'll See:
```
┌─ ACCOUNTING DASHBOARD ───────────────────────────────┐
│                                                       │
│  📊 Summary Tab                                       │
│  ├─ Total Assets: [💰 Amount]                        │
│  ├─ Total Liabilities: [💳 Amount]                   │
│  ├─ Total Equity: [📊 Amount]                        │
│  ├─ Net Income: [📈 Amount]                          │
│  └─ Key Metrics (Current Ratio, Debt-to-Equity)     │
│                                                       │
│  ⚖️ Balance Sheet Tab                                │
│  ├─ Assets (showing 17 accounts with balances)      │
│  ├─ Liabilities & Equity breakdown                  │
│  └─ ✓ Balance Check (Assets = Liabilities + Equity) │
│                                                       │
│  📈 Income Statement Tab                             │
│  ├─ Revenues by category                            │
│  ├─ Expenses by category                            │
│  └─ Net Income (Profit/Loss)                        │
│                                                       │
│  ✓ Trial Balance Tab                                │
│  ├─ All accounts with Debits/Credits                │
│  ├─ Total Debits vs Total Credits                   │
│  └─ Validation check (Debits = Credits)             │
│                                                       │
│  [Select Date] (as of date picker)                  │
└─────────────────────────────────────────────────────┘
```

### Key Features:
- **Date Selection**: View financials as of any date
- **Tab Navigation**: Switch between different financial reports
- **Auto-Calculation**: All totals calculated in real-time
- **Validation**: System checks if entries are balanced
- **Color Coding**: Green (profit/assets), Red (expenses/losses)

### How to Access:
```
1. Login as Admin
2. Navigate to /accounting/dashboard
3. Select a date using the date picker
4. Click tabs to view different reports
```

---

## 📑 2. Chart of Accounts

**Location**: `/accounting/chart-of-accounts`

### What You'll See:
```
┌─ CHART OF ACCOUNTS ──────────────────────────────────┐
│                                                       │
│  Total Accounts: 17                                  │
│                                                       │
│  [Filter by Type] [Search accounts...]               │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ Code │ Account Name      │ Type  │ Balance │View│ │
│  ├─────────────────────────────────────────────────┤ │
│  │ 1000 │ Cash              │Asset  │ 500,000 │View│ │
│  │ 1100 │ Mobile Money      │Asset  │ 250,000 │View│ │
│  │ 1200 │ Pledges Receivable│Asset  │ 850,000 │View│ │
│  │ 2000 │ Unearned Revenue  │Liab   │ 400,000 │View│ │
│  │ 3000 │ Retained Earnings │Equity │1,200,000│View│ │
│  │ 4000 │ Pledge Income     │Rev    │ 500,000 │View│ │
│  │ 5000 │ Operating Expenses│Exp    │  50,000 │View│ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
│  [Clicking "View" opens account details modal]       │
└─────────────────────────────────────────────────────┘
```

### Features:
- **Search**: Find accounts by code or name
- **Filter by Type**:
  - 💰 Assets (things you own)
  - 💳 Liabilities (things you owe)
  - 📊 Equity (owner's stake)
  - 📈 Revenue (income)
  - 📉 Expenses (costs)
- **View Details**: Click account to see full information
- **Current Balances**: Real-time account balances

### Account Details Modal Shows:
```
┌─ ACCOUNT DETAILS ─────────────────┐
│                                   │
│ Account Information               │
│ ├─ Code: 1000                    │
│ ├─ Name: Cash                    │
│ ├─ Type: Asset                   │
│ └─ Normal Balance: Debit          │
│                                   │
│ Balance Information               │
│ ├─ Current Balance: 500,000 UGX   │
│ └─ Status: ✓ Active              │
│                                   │
│ Account Classification            │
│ ├─ Category: Balance Sheet        │
│ └─ Normal Balance Side: Debit     │
│                                   │
│ [Close]                           │
└─────────────────────────────────────┘
```

---

## 📊 Understanding the Reports

### Balance Sheet (⚖️ Tab)
Shows your financial position:
- **Assets** (left side): What you own
- **Liabilities** (right side): What you owe
- **Equity** (right side): Owner's stake
- **Formula**: Assets = Liabilities + Equity

### Income Statement (📈 Tab)
Shows your profitability:
- **Revenues**: Money coming in (+)
- **Expenses**: Money going out (-)
- **Net Income**: Profit or loss

### Trial Balance (✓ Tab)
Verifies bookkeeping accuracy:
- **Debits**: Left side entries
- **Credits**: Right side entries
- **Formula**: Total Debits = Total Credits

### Summary (📊 Tab)
Quick overview:
- **Metrics**: Key financial numbers
- **Ratios**: Financial health indicators
  - Current Ratio: Ability to pay short-term debts
  - Debt-to-Equity: Financial leverage
  - Profit Margin: Profitability percentage

---

## 🔐 Access Control

### Who Can Access:
- ✅ Admins only
- ❌ Regular users (access denied)
- ❌ Not logged in users (redirected to login)

### How System Protects Your Data:
1. Requires admin login
2. JWT token verification
3. Database query validation
4. Error handling for unauthorized access

---

## 💡 Tips & Tricks

### 1. Monitor Financial Health
Visit the dashboard daily/weekly to:
- Track total assets
- Monitor profit/loss
- Verify account balances
- Check if books balance

### 2. Use Date Picker
- View past financial statements
- Track financial history
- Generate historical reports
- Analyze trends over time

### 3. Search Chart of Accounts
- Quick lookup: Type account code (e.g., "1000")
- Find by name: Type "Pledge" or "Income"
- Filter by type: Select "Revenue" to see all income accounts

### 4. Validate Your Books
Always check:
- ✓ Balance Sheet balances (should see green checkmark)
- ✓ Trial Balance balances (should see green checkmark)
- If red ✗ appears, contact admin - data might need reconciliation

---

## 📱 Mobile Access

Both screens are fully responsive:
- ✅ Works on desktop browsers
- ✅ Tablets (iPad, Android tablets)
- ✅ Mobile phones (landscape and portrait)
- ✅ Touch-friendly buttons and navigation

---

## 🚀 Common Tasks

### Task 1: Check Total Assets
1. Go to `/accounting/dashboard`
2. Click "Summary" tab
3. Look at "Total Assets" card

### Task 2: Find an Account
1. Go to `/accounting/chart-of-accounts`
2. Use search box (type account name or code)
3. Click "View" to see details

### Task 3: View Income Statement
1. Go to `/accounting/dashboard`
2. Click "Income Statement" tab
3. See revenues and expenses
4. Check net income (profit/loss)

### Task 4: Verify Books are Balanced
1. Go to `/accounting/dashboard`
2. Look for checkmarks:
   - ✓ Balance Sheet is balanced
   - ✓ Trial Balance is balanced
3. If ✗ appears, check for unbalanced entries

---

## ⚙️ Backend API Endpoints

These are automatically called by the UI:

```
GET /api/accounting/accounts
  → Returns all 17 accounts with balances

GET /api/accounting/reports/balance-sheet?asOfDate=2025-01-15
  → Returns balance sheet data

GET /api/accounting/reports/income-statement?startDate=2025-01-01&endDate=2025-01-31
  → Returns income statement

GET /api/accounting/reports/trial-balance?asOfDate=2025-01-15
  → Returns trial balance

GET /api/accounting/reports/financial-summary?asOfDate=2025-01-15
  → Returns key metrics and ratios
```

---

## 🐛 Troubleshooting

### Problem: "Loading..." takes too long
**Solution**: Check backend is running
```bash
# Check if backend is running on port 5001
curl http://localhost:5001/api/accounting/status
```

### Problem: "Failed to load accounts"
**Solution**: 
1. Verify you're logged in as admin
2. Check network connection
3. Make sure backend is running

### Problem: Can't access accounting screens
**Solution**:
1. Make sure you're logged in
2. Verify your user role is "admin"
3. Check if routes exist in App.jsx

### Problem: Numbers look wrong
**Solution**:
1. Check if you selected correct date
2. Verify date picker shows right date
3. Try refreshing the page

---

## 📞 Support

**Need help?**
- Check the dashboard for validation messages (✓ or ✗)
- Error messages appear at top of screen in red
- Check browser console for detailed errors (F12)

---

## 📈 Next Features (Coming Soon)

- 📝 Journal Entry Manager (create/edit transactions)
- 📊 Financial Charts (visual trends)
- 💾 Export Reports (PDF, Excel)
- 🔄 Budget vs Actual (compare projections)
- 📅 Period Comparison (month-to-month, year-to-year)

---

**Last Updated**: January 2025
**Version**: 1.0 - Initial Release
**Status**: ✅ Production Ready
