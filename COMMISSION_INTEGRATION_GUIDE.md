# 🔗 Integration Guide: Commission System with Existing Payment System

**What this document shows:** How commission distribution integrates with your existing payment tracking system.

---

## Current Flow (Before)

```
Payment Received → paymentTrackingService → Update Pledge Status → Done
```

## New Flow (After)

```
Payment Received 
  → paymentTrackingService 
  → calculateAndSplitPayment (NEW)
  → paymentSplits table (NEW)
  → Commission accrued (NEW)
  → Organization payout scheduled (NEW)
  → Your commission queued (NEW)
  → Daily automatic payout to you (NEW)
```

---

## WHERE TO INTEGRATE

### Location 1: In paymentTrackingService.js

When a pledge payment is recorded, immediately split it and accrue commission:

```javascript
// In backend/services/paymentTrackingService.js

// Add import at top
const commissionDistributionService = require('./commissionDistributionService');

// In the function that records pledge payment
async function recordPledgePayment(pledgeId, amount, paymentMethod, userId, organizationId) {
  try {
    // 1. Record payment (existing code)
    const paymentResult = await pool.execute(
      'INSERT INTO payments (pledge_id, amount, payment_method, status) VALUES (?, ?, ?, ?)',
      [pledgeId, amount, paymentMethod, 'completed']
    );
    
    // 2. NEW: Split payment and accrue commission
    const splitResult = await commissionDistributionService.calculateAndSplitPayment(
      pledgeId,
      organizationId,
      amount
    );
    
    if (!splitResult.success) {
      console.warn('⚠️  Commission calculation failed:', splitResult.error);
      // Continue anyway - payment was recorded, commission is optional
    }
    
    // 3. Update pledge status (existing code)
    await pool.execute(
      'UPDATE pledges SET status = ? WHERE id = ?',
      ['fulfilled', pledgeId]
    );
    
    return {
      success: true,
      payment: paymentResult,
      commission: splitResult.data // Shows org vs commission split
    };
    
  } catch (error) {
    console.error('Error recording payment:', error);
    return { success: false, error: error.message };
  }
}
```

### Location 2: In Pledge Payment Routes

When payment endpoint receives money, ensure organization_id is included:

```javascript
// In backend/routes/pledgeRoutes.js (or paymentRoutes.js)

router.post('/pledges/:id/pay', authenticateToken, async (req, res) => {
  try {
    const { pledgeId } = req.params;
    const { amount, paymentMethod, organizationId } = req.body;  // ← organizationId required
    
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'Organization ID is required for payment processing'
      });
    }
    
    // Process payment with commission
    const result = await paymentTrackingService.recordPledgePayment(
      pledgeId,
      amount,
      paymentMethod,
      req.user.id,
      organizationId  // ← Pass to service
    );
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    res.json({
      success: true,
      data: {
        payment: result.payment,
        commission: result.commission,  // Show commission info
        message: `Payment processed. Your commission: ${result.commission.data.commissionAmount} UGX`
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Pledges Table Modification

The pledges table should have an `organization_id` field. If not, add it:

```sql
-- Add if not exists
ALTER TABLE pledges ADD COLUMN organization_id INT;
ALTER TABLE pledges ADD FOREIGN KEY (organization_id) REFERENCES organizations(id);
```

Update your Pledge model:

```javascript
// backend/models/Pledge.js

async function create(pledgeData) {
  const {
    title,
    amount,
    donor_name,
    donor_phone,
    collection_date,
    organization_id,  // ← Add this
    campaign_id,
    status = 'pending'
  } = pledgeData;
  
  const [result] = await pool.execute(`
    INSERT INTO pledges (
      title, amount, donor_name, donor_phone, 
      collection_date, organization_id, campaign_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [title, amount, donor_name, donor_phone, collection_date, organization_id, campaign_id, status]);
  
  return result;
}
```

---

## Cron Job Integration

Add to **backend/services/cronScheduler.js**:

```javascript
// Add import
const commissionDistributionService = require('./commissionDistributionService');

// Around line 100, add this job
const dailyCommissionPayout = cron.schedule('0 17 * * *', async () => {
  console.log('💰 Triggered: Daily Commission Payout (5:00 PM)');
  try {
    const result = await commissionDistributionService.processDailyCommissionBatch();
    if (result.success) {
      console.log('✅ Commission batch processed successfully');
    } else {
      console.log('⚠️  Commission batch failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Commission payout error:', error);
  }
}, {
  scheduled: false,
  timezone: "Africa/Kampala"
});

// Add to jobs array
jobs.push({
  name: 'Daily Commission Payout',
  schedule: '5:00 PM daily',
  job: dailyCommissionPayout,
  description: 'Sends accrued commissions to your MTN/Airtel account'
});
```

---

## Server.js Routes Registration

Add to **backend/server.js**:

```javascript
// Add with other imports (around line 20)
const commissionRoutes = require('./routes/commissionRoutes');

// Add with other route registrations (around line 150)
app.use('/api/commissions', authenticateToken, requireAdmin, commissionRoutes);
```

---

## Webhook Integration

When MTN/Airtel sends webhook confirming payment:

```javascript
// In backend/routes/paymentRoutes.js or mtnRoutes.js

router.post('/mtn/callback', async (req, res) => {
  try {
    const { transactionId, status, pledgeId } = req.body;
    
    if (status === 'SUCCESSFUL') {
      // Existing code: update pledge
      // ...
      
      // NEW: Mark commission as paid out if this was commission payout
      if (transactionId.startsWith('COMM-')) {
        await commissionDistributionService.markCommissionAsPaidOut(
          transactionId,
          transactionId
        );
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

---

## Accounting Integration

When you integrate with your accounting system, add journal entries:

```javascript
// In accountingService.js or new entries

async function recordCommissionPayment(amount, organizationId, pledgeId) {
  // Your platform commission account (asset)
  const commissionAssetAccount = 1300; // Chart of Accounts
  
  // Unearned revenue account (liability) 
  const unearnedRevenueAccount = 2000;
  
  // Entry: Commission is revenue
  await createJournalEntry({
    date: new Date(),
    description: `Commission accrued from Pledge #${pledgeId}`,
    reference: `COMM-${pledgeId}`,
    lines: [
      { accountId: 1000, type: 'debit', amount, description: 'Cash received' },
      { accountId: 4100, type: 'credit', amount, description: 'Commission revenue' }
    ]
  });
}
```

---

## Summary: What Gets Connected

| Component | File | What It Does |
|-----------|------|-------------|
| **Payment Recording** | paymentTrackingService.js | Calls commission split when payment received |
| **Commission Split** | commissionDistributionService.js | Calculates org vs platform amounts |
| **Routes** | commissionRoutes.js | API endpoints to view/request payouts |
| **Server** | server.js | Registers commission routes |
| **Cron** | cronScheduler.js | Daily automatic payout at 5 PM |
| **Webhooks** | mtnRoutes.js / airtelRoutes.js | Confirm commission payouts |
| **Accounting** | accountingService.js | Record commission as revenue |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    PAYMENT RECEIVED                      │
│                   (100,000 UGX from                      │
│                     MTN/Airtel)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │  paymentTrackingService     │
        │  recordPledgePayment()      │
        └────────┬────────────────────┘
                 │
                 ▼
    ┌───────────────────────────────────────┐
    │ commissionDistributionService         │
    │ calculateAndSplitPayment()            │
    │                                       │
    │ Organization Tier: Pro (1.5%)         │
    │ Commission: 1,500 UGX ← YOU GET THIS  │
    │ Org Payout: 98,500 UGX                │
    └────┬───────────────────────┬──────────┘
         │                       │
         ▼                       ▼
    ┌─────────────────┐  ┌───────────────┐
    │ payment_splits  │  │  commissions  │
    │    table        │  │    table      │
    │                 │  │ status:accrued│
    └─────────────────┘  └───────┬───────┘
                                 │
                    (Accumulate until 5 PM)
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │ cronScheduler (5 PM)   │
                    │ processDailyBatch()    │
                    └────────┬───────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
          ┌──────────────┐        ┌──────────────┐
          │ Send via MTN │        │ Send via     │
          │ 256700123456 │        │ Airtel       │
          │ 15,000 UGX   │        │ 256750654321 │
          └──────┬───────┘        └──────┬───────┘
                 │                       │
                 └───────────┬───────────┘
                             │
                             ▼
                 ┌─────────────────────────┐
                 │   commission_payouts    │
                 │   table                 │
                 │ status: processing →    │
                 │         successful      │
                 └─────────────────────────┘
                             │
                             ▼
              ┌──────────────────────────────┐
              │  YOUR MTN/AIRTEL WALLET      │
              │  Balance: +15,000 UGX ✅     │
              └──────────────────────────────┘
```

---

## ✅ Integration Checklist

- [ ] Run migration: `migration-multi-org-commission.js`
- [ ] Add `organization_id` to pledges table
- [ ] Update Pledge model to include `organization_id`
- [ ] Modify paymentTrackingService to call commission split
- [ ] Add organizationId to payment routes
- [ ] Register commissionRoutes in server.js
- [ ] Add daily commission payout cron job
- [ ] Configure your MTN/Airtel accounts via API
- [ ] Test with sample pledge and payment
- [ ] Verify commission appears in commission table
- [ ] Test manual payout
- [ ] Test automatic daily payout (or wait until 5 PM)

---

## Testing the Integration

### Test 1: Verify Commission Split

```powershell
# Check if commission was created when pledge was paid
$commission = Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/details?status=accrued&limit=10" `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' }

$commission.data.commissions | ForEach-Object {
    Write-Host "Pledge #$($_.pledge_id): Commission $($_.amount) UGX from $($_.organization_name)"
}
```

### Test 2: Request Payout

```powershell
$payout = @{ method = "mtn"; timing = "immediate" } | ConvertTo-Json

$result = Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/payout" `
    -Method POST `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } `
    -Body $payout

Write-Host "Payout initiated:"
Write-Host "  Batch ID: $($result.data.batchId)"
Write-Host "  Amount: $($result.data.amount) UGX"
Write-Host "  Status: $($result.data.status)"
```

### Test 3: Check Status

```powershell
Invoke-RestMethod -Uri "http://localhost:5001/api/commissions/summary" `
    -Headers @{ 'Authorization' = 'Bearer YOUR_JWT_TOKEN' } | 
    ForEach-Object { $_.data | ConvertTo-Json -Depth 10 }
```

---

You're ready to integrate! 🚀
