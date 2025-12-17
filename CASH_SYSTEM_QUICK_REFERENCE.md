# Cash Payment System - Quick Reference

## System Status ✅ LIVE

Migration completed successfully on **January 2025**

- ✅ 4 database tables created
- ✅ 2 database views created  
- ✅ 9 columns added to payments table
- ✅ Backend service ready (8 methods)
- ✅ API routes registered (8 endpoints)
- ✅ Frontend dashboard complete (456 lines)
- ✅ CSS styling applied (800+ lines)
- ✅ Routes registered in server.js and App.jsx

---

## Quick Access

### Database Tables
```
cash_deposits              │ Individual cash collections
cash_accountability        │ Monthly summaries per collector
cash_audit_log            │ Complete action history
cash_discrepancies        │ Variance/shortage tracking

Views:
cash_pending_verification      │ Pending approvals list
cash_collector_accountability  │ Monthly collector report
```

### Backend Service Methods
```
recordCashPayment()                    Record new cash payment
verifyCashPayment()                    Admin approve/reject
markAsDeposited()                      Track bank deposit
getPendingVerification()               List pending approvals
getCollectorAccountability()           Monthly per-collector stats
getCashDepositDetail()                 Full record with audit trail
reportDiscrepancy()                    Flag variance
getAccountabilityDashboard()           Complete monthly summary
```

### API Endpoints (All require JWT + authenticateToken)
```
POST   /api/cash-payments/record              Staff: Record payment
POST   /api/cash-payments/:id/verify          Admin: Verify/reject
POST   /api/cash-payments/:id/deposit         Admin: Mark deposited
GET    /api/cash-payments/pending/list        Admin: Get pending
GET    /api/cash-payments/:id/detail          Admin: Get details
GET    /api/cash-payments/accountability      Admin: Get per-collector
GET    /api/cash-payments/dashboard           Admin: Full dashboard
POST   /api/cash-payments/:id/discrepancy     Admin: Report variance
```

---

## Frontend Dashboard

### URL
```
http://localhost:5173/admin/cash-accountability
```

### Three Tabs
1. **Overview** - Top collectors, key metrics
2. **Pending** - Awaiting admin verification (actionable)
3. **Collectors** - Individual accountability cards

### Six Summary Cards
- 💰 Total Collected
- ✅ Verified
- ⏳ Pending
- 🏦 Deposited  
- 📍 Undeposited
- ⚠️  Discrepancies

---

## Roles & Permissions

| Action | Staff | Admin | Note |
|--------|-------|-------|------|
| Record payment | ✅ | ✅ | CREATE phase |
| Verify payment | ❌ | ✅ | APPROVAL phase |
| Reject payment | ❌ | ✅ | DENIAL phase |
| Mark deposited | ❌ | ✅ | BANK phase |
| View pending | ❌ | ✅ | Admin only |
| View dashboard | ❌ | ✅ | Admin only |
| Report discrepancy | ❌ | ✅ | Admin only |

---

## Request/Response Examples

### 1. Record Cash Payment
```bash
POST /api/cash-payments/record
Authorization: Bearer STAFF_TOKEN
Content-Type: application/json

{
  "pledgeId": 123,
  "collectedAmount": 50000,
  "collectionDate": "2024-01-15T10:00:00Z",
  "donorName": "John Doe",
  "donorPhone": "+256700123456",
  "donorIdType": "national_id",
  "donorIdNumber": "123456789",
  "collectionLocation": "Kampala Office",
  "receiptNumber": "RCP-20240115-001",
  "receiptPhotoUrl": "https://...",
  "notes": "Donor visited office"
}

Response: { success: true, data: { depositId: 1, status: "pending" } }
```

### 2. Verify Cash Payment
```bash
POST /api/cash-payments/1/verify
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "approved": true,
  "verificationNotes": "Verified against receipt photo"
}

Response: { success: true, data: { depositId: 1, verification_status: "verified" } }
```

### 3. Mark as Deposited
```bash
POST /api/cash-payments/1/deposit
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "bankReference": "BANK-123456789",
  "depositDate": "2024-01-15T15:00:00Z"
}

Response: { success: true, data: { depositId: 1, deposited_to_bank: true } }
```

### 4. Get Pending Verifications
```bash
GET /api/cash-payments/pending/list
Authorization: Bearer ADMIN_TOKEN

Response: {
  success: true,
  data: [
    {
      id: 1,
      donor_name: "John Doe",
      collected_amount: 50000,
      collection_date: "2024-01-15",
      collector_name: "Staff Name",
      days_pending: 2,
      ...
    }
  ]
}
```

### 5. Get Accountability Dashboard
```bash
GET /api/cash-payments/dashboard?year=2024&month=1
Authorization: Bearer ADMIN_TOKEN

Response: {
  success: true,
  data: {
    summary: {
      total_collected: 5000000,
      verified: 4500000,
      pending: 500000,
      deposited: 3500000,
      undeposited: 1000000,
      discrepancies: 3
    },
    activeCollectors: 5,
    topCollectors: [...],
    verificationAverageTime: 1.5,
    rejectionRate: 2.5,
    discrepancies: [...]
  }
}
```

---

## Payment Status Lifecycle

```
┌────────────────────────────────────────┐
│         PAYMENT RECORDED               │
│         Status: PENDING                │
│   (Awaiting admin verification)        │
└────────────────────────────────────────┘
              │
         ┌────┴────┐
         │          │
         ▼          ▼
    ┌────────┐  ┌────────┐
    │VERIFIED│  │REJECTED│
    │Status✅│  │Status❌ │
    └───┬────┘  └────────┘
        │
        │ (Admin deposits)
        │
        ▼
    ┌──────────────────────┐
    │  DEPOSITED TO BANK   │
    │  Status: 🏦         │
    │  (Reconciled)        │
    └──────────────────────┘

Audit Trail → Every step logged with:
  - Who (User ID)
  - When (Timestamp)
  - What (Action)
  - Why (Notes)
```

---

## Common Tasks

### Record a Cash Payment
1. Staff login → Dashboard
2. Find "Record Cash Payment"
3. Enter: Pledge ID, Amount, Date, Donor details
4. Submit → Payment status = **PENDING** ⏳
5. Admin receives notification

### Verify Pending Payments
1. Admin login → Goto /admin/cash-accountability
2. Click "Pending" tab
3. Review each pending payment
4. Click "Verify" ✅ or "Reject" ❌
5. Add notes & confirm
6. Status updates immediately

### Deposit to Bank
1. Admin login → Cash Accountability dashboard
2. Click "Collectors" tab or pending list
3. Find verified payments ready to deposit
4. Click "Deposit Now"
5. Enter bank reference & date
6. Submit → Status = **DEPOSITED** 🏦

### View Monthly Accountability
1. Admin login → Cash Accountability dashboard
2. Select Month/Year at top
3. View summary cards
4. Click tabs to drill down:
   - Overview: Key metrics
   - Pending: Items awaiting action
   - Collectors: Per-staff breakdown

---

## File Locations

### Backend
```
backend/
├── services/
│   └── cashPaymentService.js          (423 lines, 8 methods)
├── routes/
│   └── cashPaymentRoutes.js           (267 lines, 8 endpoints)
├── scripts/
│   └── migration-cash-payment-tracking.js  (310 lines)
└── server.js                           (Modified - route registered)
```

### Frontend
```
frontend/
└── src/
    ├── screens/
    │   ├── CashAccountabilityDashboard.jsx     (456 lines)
    │   └── CashAccountabilityDashboard.css     (800+ lines)
    └── App.jsx                                  (Modified - route added)
```

### Database
```
Database: pledgehub_db
Tables:
  ├── cash_deposits                    (Main tracking table)
  ├── cash_accountability              (Monthly summaries)
  ├── cash_audit_log                   (Action history)
  ├── cash_discrepancies               (Variance tracking)
  └── payments (modified)              (9 columns added)

Views:
  ├── cash_pending_verification        (Quick pending list)
  └── cash_collector_accountability    (Monthly report)
```

---

## Testing Checklist

### Backend Tests
```
[ ] POST /api/cash-payments/record
    - Valid data → 201 Created, depositId returned
    - Missing pledgeId → 400 Bad Request
    - Zero amount → 400 Bad Request
    
[ ] POST /api/cash-payments/:id/verify
    - Valid verify → 200 OK, status = verified
    - Verify with notes → Notes saved
    - Non-admin user → 403 Forbidden
    
[ ] GET /api/cash-payments/pending/list
    - Admin user → 200 OK, pending items listed
    - Staff user → 403 Forbidden
    
[ ] GET /api/cash-payments/dashboard?year=2024&month=1
    - Valid params → 200 OK, dashboard data
    - Missing month → 400 Bad Request
```

### Frontend Tests
```
[ ] Navigate to /admin/cash-accountability
    - Non-admin → Protected route, redirected
    - Admin → Dashboard loads
    - Month/year selector works
    - Summary cards display
    
[ ] Pending Tab
    - Table displays pending items
    - Verify button opens modal
    - Reject button opens modal
    - Modal saves verification
    
[ ] Collectors Tab
    - Collector cards display
    - Stats grid shows numbers
    - "Deposit Now" button works
    
[ ] CSS Responsive
    - Mobile (480px) → Single column
    - Tablet (768px) → 2 columns
    - Desktop (1200px) → Full layout
```

---

## Database Queries

### Get All Pending Payments
```sql
SELECT * FROM cash_deposits WHERE verification_status = 'pending'
ORDER BY collection_date DESC;
```

### Monthly Accountability by Collector
```sql
SELECT 
  DATE_FORMAT(collection_date, '%Y-%m') as month,
  u.name as collector,
  COUNT(*) as count,
  SUM(collected_amount) as total,
  SUM(CASE WHEN verification_status='verified' THEN collected_amount ELSE 0 END) as verified,
  SUM(CASE WHEN deposited_to_bank=1 THEN collected_amount ELSE 0 END) as deposited
FROM cash_deposits cd
JOIN users u ON cd.collected_by = u.id
WHERE DATE_FORMAT(collection_date, '%Y-%m') = '2024-01'
GROUP BY u.id
ORDER BY total DESC;
```

### Discrepancy Summary
```sql
SELECT 
  discrepancy_type,
  COUNT(*) as count,
  SUM(expected_amount - actual_amount) as total_variance,
  AVG(variance_percentage) as avg_variance_pct
FROM cash_discrepancies
GROUP BY discrepancy_type;
```

### Audit Trail for Specific Deposit
```sql
SELECT 
  action, 
  performed_by,
  old_status,
  new_status,
  notes,
  action_timestamp
FROM cash_audit_log
WHERE deposit_id = 1
ORDER BY action_timestamp ASC;
```

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Missing required fields | Check all required params present |
| 403 | Insufficient permissions | Ensure correct role (staff/admin) |
| 404 | Deposit not found | Verify deposit ID exists |
| 409 | Duplicate receipt number | Receipt must be unique |
| 500 | Database error | Check database connection, logs |

---

## Performance Tips

1. **For Large Pending Lists**: Use pagination on pending/list endpoint
2. **For Monthly Reports**: Cache result for 1 hour
3. **For Dashboard Loads**: Pre-calculate summaries daily
4. **For Audit Logs**: Archive old records (>6 months) to separate table
5. **For Exports**: Generate PDFs asynchronously, don't block request

---

## Security Reminders

✅ **Always required:**
- JWT token in Authorization header
- Parameterized SQL queries (DONE in service)
- Role validation (staff vs admin)
- Input validation (amount, date, phone format)

⚠️ **Never allow:**
- Direct SQL via API
- Role escalation
- Deleting audit log records
- Modifying verification without admin role
- Negative amounts or future dates

---

## Support & Maintenance

### Health Check
```bash
curl -X POST http://localhost:5001/api/cash-payments/record \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pledgeId":1,"collectedAmount":1000,...}'
```

### Database Backup
```bash
mysqldump -u root -p pledgehub_db > backup.sql
```

### Clear Pending for Testing
```sql
DELETE FROM cash_deposits WHERE collection_date >= NOW() - INTERVAL 1 DAY
  AND verification_status = 'pending';
```

### Check System Status
```bash
# Check if service is running
curl http://localhost:5001/api/health

# Check database connectivity
node -e "require('./backend/config/db').pool.query('SELECT 1')"
```

---

## Integration Points

This system integrates with:
1. **Pledge System** - Links via pledge_id
2. **User System** - Links staff/admin via user_id
3. **Payment System** - Extended payments table
4. **Payout System** - Cash deposits feed into payout calculations
5. **Accounting System** - Cash recorded as journal entries

---

## Next Features (Coming Soon)

- [ ] Staff mobile app for recording on-field
- [ ] SMS receipt confirmation to donors
- [ ] Batch verification (multiple at once)
- [ ] Receipt photo validation (OCR amount matching)
- [ ] Escalation workflow (pending >3 days alert admin)
- [ ] Export to PDF/Excel monthly reports
- [ ] Analytics charts (collection trends, top collectors)
- [ ] Email digest (daily pending summary to admin)
- [ ] WhatsApp integration for collector notifications
- [ ] Discrepancy auto-resolution suggestions

---

**System Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: ✅ Production Ready  
**Database**: MySQL (pledgehub_db)  
**Backend**: Node.js Express (port 5001)  
**Frontend**: React Vite (port 5173)

---

## Quick Commands

```bash
# Run migration
node backend\scripts\migration-cash-payment-tracking.js

# Start servers
.\scripts\dev.ps1

# Test API
curl -X GET http://localhost:5001/api/cash-payments/pending/list \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check database
mysql -u root -p pledgehub_db
> SELECT * FROM cash_deposits LIMIT 1;

# View logs
tail -f backend/logs/cash-system.log
```

---

**Have questions?** Check CASH_PAYMENT_SYSTEM_GUIDE.md for detailed documentation.
