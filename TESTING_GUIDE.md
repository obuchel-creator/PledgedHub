# 🧪 Analytics Backend Integration - Testing Guide

## ✅ Quick Status

All 3 backend API endpoints are **LIVE and READY** at:
- `http://localhost:5001/api/analytics/payment-methods`
- `http://localhost:5001/api/analytics/credit-metrics`  
- `http://localhost:5001/api/analytics/at-risk`

---

## 🎯 What to Test

### Frontend (http://localhost:5173)

1. **Navigate to Analytics Page**
   - Go to dashboard and click "Analytics"
   - Page should load with all 6 improvements visible

2. **Verify All 6 Features Display**
   - [ ] Mobile money payment method cards (orange/red/blue/green)
   - [ ] Credit system metrics cards (gray/amber/blue/purple)
   - [ ] Conversion funnel with percentages
   - [ ] At-risk pledges section (or "Great news!" if none)
   - [ ] AI insights at top with gradient background
   - [ ] Date picker dropdown with 6 preset options

3. **Test Date Picker**
   - [ ] Select "📅 Today" → data updates
   - [ ] Select "📅 Last 7 Days" → data updates
   - [ ] Select "📅 Last 30 Days" → data updates
   - [ ] Select "🗓️ Custom Range" → shows date inputs
   - [ ] Change custom dates → data updates

4. **Check Network Requests**
   - Open DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Should see 3 GET requests:
     - `/api/analytics/payment-methods`
     - `/api/analytics/credit-metrics`
     - `/api/analytics/at-risk`
   - All should return Status 200

5. **Verify Data Display**
   - Payment methods show UGX amounts
   - Credit metrics show user counts
   - At-risk pledges show donors and amounts
   - Conversion funnel shows calculated percentages

---

## 📊 Sample Response Data

### Payment Methods Response
```json
{
  "success": true,
  "data": [
    {
      "provider": "mtn",
      "method": "mtn",
      "amount": 2500000,
      "count": 5
    },
    {
      "provider": "airtel",
      "method": "airtel",
      "amount": 1500000,
      "count": 3
    }
  ]
}
```

### Credit Metrics Response
```json
{
  "success": true,
  "data": {
    "freeUsers": 150,
    "payAsYouGoUsers": 45,
    "campaignTierSubscribers": 12,
    "premiumTierSubscribers": 5,
    "totalCreditsLoaded": 50000000,
    "totalUsers": 212
  }
}
```

### At-Risk Pledges Response
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "donorName": "John Doe",
      "donorEmail": "john@example.com",
      "donorPhone": "+256700000001",
      "amount": 5000000,
      "purpose": "Educational Support",
      "dueDate": "2025-12-10",
      "status": "pending",
      "lastReminderSent": "2025-12-18",
      "daysOverdue": 9,
      "riskLevel": "CRITICAL"
    }
  ]
}
```

---

## 🔍 Troubleshooting

### Issue: No data shows in cards
**Solution**: 
- Check DevTools → Network tab for API errors
- Verify you have test data in database
- Check backend logs for SQL errors

### Issue: API returns 401/403
**Reason**: Not authenticated or not staff role
**Solution**:
- Login as admin or staff user
- Refresh page
- Try again

### Issue: API returns 500 error
**Solution**:
- Check backend console for error message
- Verify database connection
- Verify table names (payments, users, pledges exist)

### Issue: Date picker not working
**Solution**:
- Check browser console for JavaScript errors
- Verify useState hooks are in component
- Try manual date input if dropdown fails

---

## 📱 Mobile Testing Checklist

1. **Responsive Design**
   - [ ] View on phone (width ~375px)
   - [ ] Cards stack vertically
   - [ ] Date picker shows as dropdown
   - [ ] Tables scroll horizontally
   - [ ] No text cutoff

2. **Touch Interactions**
   - [ ] Can tap dropdown to select date
   - [ ] Can scroll through pledge table
   - [ ] Can click export button

3. **Performance**
   - [ ] Page loads in <3 seconds
   - [ ] No lag when changing dates
   - [ ] No excessive re-renders

---

## 🚀 Production Deployment

When ready to deploy to production:

1. **Backend**: Deploy updated `analyticsRoutes.js` and `analyticsService.js`
2. **Frontend**: Deploy updated `AnalyticsDashboard.jsx`
3. **Database**: Ensure tables exist (payments, users, pledges)
4. **Environment**: Set JWT_SECRET and database credentials

---

## 📞 Support

If endpoints not working:

1. **Check Status**: `curl http://localhost:5001/api/ping`
2. **Check Auth**: Verify JWT token in Authorization header
3. **Check Logs**: Look at backend terminal for error messages
4. **Restart Server**: 
   ```powershell
   Get-Process node | Stop-Process -Force
   cd c:\Users\HP\PledgeHub
   .\scripts\dev.ps1
   ```

---

## ✨ Features by Endpoint

| Endpoint | Feature | Status |
|----------|---------|--------|
| `/payment-methods` | Mobile money breakdown | ✅ Ready |
| `/credit-metrics` | Subscription tiers | ✅ Ready |
| `/at-risk` | Overdue pledges | ✅ Ready |

**All endpoints are live and serving requests** 🎉
