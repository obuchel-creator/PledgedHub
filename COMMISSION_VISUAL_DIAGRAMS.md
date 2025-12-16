# 📊 Commission System - Visual Diagrams & Examples

**Visual representation of how the commission system works**

---

## 1. Payment Split Diagram

```
When Organization Collects 100,000 UGX
═════════════════════════════════════

INPUT:
Pledge Amount:        100,000 UGX
Organization Tier:    Pro (1.5% commission)

PROCESSING:
Calculate commission:  100,000 × 1.5% = 1,500 UGX
Calculate payout:      100,000 - 1,500 = 98,500 UGX

OUTPUT:
┌─────────────────────────────────────────┐
│         PAYMENT SPLIT                   │
├─────────────────────────────────────────┤
│                                         │
│  YOU GET (Commission):   1,500 UGX      │
│  ├─ Status: Accrued                    │
│  ├─ Destination: Your MTN/Airtel       │
│  ├─ Schedule: Daily at 5 PM            │
│  └─ Payout: Automatic                  │
│                                         │
│  ORGANIZATION GETS:      98,500 UGX     │
│  ├─ Status: Ready for withdrawal       │
│  ├─ Destination: Their account         │
│  └─ Schedule: Manual request           │
│                                         │
└─────────────────────────────────────────┘
```

---

## 2. System Architecture

```
ORGANIZATIONS (collect pledges for causes)
        ↓
        ├─→ Red Cross (Pro tier, 1.5% commission)
        ├─→ Malaria Foundation (Free tier, 5% commission)
        └─→ Save the Children (Enterprise, 0.5% commission)
        
DONORS (make pledges via mobile money)
        ↓
   PAYMENT RECEIVED
        ↓
   ┌────────────────────────────────────┐
   │  PLEDGEHUB PLATFORM               │
   │  (Payment Processor)                │
   │                                     │
   │  Receives: 100,000 UGX              │
   │  Calculates split                   │
   │  Records in database                │
   └────────────────────────────────────┘
        ↙               ↖
       /                 \
      /                   \
     ↙                     ↖
ORGANIZATION            YOU (Platform Owner)
Gets: 98,500 UGX       Gets: 1,500 UGX
(later withdrawal)     (auto-paid daily)
```

---

## 3. Timeline: When You Get Paid

```
MORNING (10 AM)
┌─────────────────────────────────────────┐
│ Pledge 1: 50,000 UGX received           │
│ Your commission: 750 UGX (accrued)      │
└─────────────────────────────────────────┘

MIDDAY (2 PM)
┌─────────────────────────────────────────┐
│ Pledge 2: 150,000 UGX received          │
│ Your commission: 2,250 UGX (accrued)    │
│ Total accrued now: 3,000 UGX            │
└─────────────────────────────────────────┘

AFTERNOON (4:30 PM)
┌─────────────────────────────────────────┐
│ Pledge 3: 100,000 UGX received          │
│ Your commission: 1,500 UGX (accrued)    │
│ Total accrued now: 4,500 UGX            │
└─────────────────────────────────────────┘

EVENING (5:00 PM) ← AUTOMATIC PAYOUT TRIGGERED
┌─────────────────────────────────────────┐
│ SYSTEM BATCHES ALL COMMISSIONS          │
│ Total: 4,500 UGX                        │
│ Sends to: Your MTN 256774306868         │
│ Status: Processing...                   │
└─────────────────────────────────────────┘

EVENING (5:05 PM)
┌─────────────────────────────────────────┐
│ MTN CONFIRMS: Payment Successful        │
│ YOUR WALLET: +4,500 UGX ✅              │
│ Status: PAID OUT                        │
│ Next auto-payout: Tomorrow at 5 PM      │
└─────────────────────────────────────────┘
```

---

## 4. Commission Rates Comparison

```
RATE BY TIER

Free Tier (5% commission)
┌────────────────────────────────────────────────┐
│ Pledge: 100,000 UGX                            │
│                                                │
│ ████████████████████████████│ 95,000 (Org)    │
│ ████│ 5,000 (You)                             │
└────────────────────────────────────────────────┘

Basic Tier (2.5% commission)
┌────────────────────────────────────────────────┐
│ Pledge: 100,000 UGX                            │
│                                                │
│ ████████████████████████████████│ 97,500 (Org)│
│ ██│ 2,500 (You)                               │
└────────────────────────────────────────────────┘

Pro Tier (1.5% commission)
┌────────────────────────────────────────────────┐
│ Pledge: 100,000 UGX                            │
│                                                │
│ ████████████████████████████████│ 98,500 (Org)│
│ │ 1,500 (You)                                 │
└────────────────────────────────────────────────┘

Enterprise Tier (0.5% commission)
┌────────────────────────────────────────────────┐
│ Pledge: 100,000 UGX                            │
│                                                │
│ ████████████████████████████████│ 99,500 (Org)│
│ │ 500 (You)                                   │
└────────────────────────────────────────────────┘
```

---

## 5. Database Relationship Diagram

```
                    users
                      ↑
                      │ created_by
                      │
             ┌────────┴────────┐
             │                 │
        organizations    platform_accounts
        (who collects)   (your MTN/Airtel)
             │
             ├─ commission_rate
             ├─ tier
             └─ is_active
             
        organization_accounts
        (their payment method)

         pledges
           │ ├─organization_id
           │ └─amount
           │
      payment_splits ←── commissions
      (audit trail)      (your income)
           │                  │
           ├─pledge_id        ├─amount
           ├─payment_amount   ├─status
           ├─commission_amount│ └─paid_out_at
           └─org_payout
           
           commission_payouts
           (your payout history)
              │
              ├─batch_id
              ├─amount
              ├─status
              └─completed_at
```

---

## 6. Status Flow Diagram

```
COMMISSION STATUS FLOW:

created
   ↓
accrued (ready to pay)
   ├─→ [Request Manual Payout]
   │        ↓
   │   pending_payout
   │        ↓
   └─→ [Daily 5 PM Auto-Payout Triggered]
           ↓
      pending_payout (being processed)
           ↓
           ├─→ MTN/Airtel Processing...
           │        ↓
           │   ✅ SUCCESSFUL
           │        ↓
           │   paid_out ✓
           │
           └─→ ❌ FAILED
                   ↓
                failed (will retry)
                   ↓
                accrued (back in queue)


PAYOUT STATUS FLOW:

pending
   ↓
processing (sent to network)
   ├─→ [Network Processing...]
   │        ↓
   │   ✅ SUCCESSFUL
   │        ↓
   │   successful ✓
   │
   └─→ ❌ FAILED
           ↓
        failed (with reason)
```

---

## 7. Complete End-to-End Flow

```
STEP 1: DONOR MAKES PLEDGE
┌──────────────────────────────────────┐
│ Donor                                │
│ "I want to help Red Cross"           │
│ Pledges: 100,000 UGX                 │
│ Payment: MTN Mobile Money            │
└──────────────────────────────────────┘
           ↓

STEP 2: PLATFORM RECEIVES PAYMENT
┌──────────────────────────────────────┐
│ PledgeHub Platform                   │
│ Receives: 100,000 UGX (in wallet)    │
│ From: MTN Mobile Money               │
│ For: Red Cross                       │
└──────────────────────────────────────┘
           ↓

STEP 3: CALCULATE & SPLIT
┌──────────────────────────────────────┐
│ Commission Service                   │
│ Organization: Red Cross (Pro tier)   │
│ Commission rate: 1.5%                │
│ Your commission: 1,500 UGX           │
│ Red Cross gets: 98,500 UGX           │
└──────────────────────────────────────┘
           ↓
           ├─────────────────────┬─────────────────────┐
           ↓                     ↓                     ↓

STEP 4a: YOUR COMMISSION      STEP 4b: ORG PAYOUT   STEP 4c: AUDIT TRAIL
┌──────────────────────┐     ┌──────────────────┐   ┌──────────────────┐
│ commissions table    │     │ payment_splits   │   │ Logged in DB     │
│ id: 1                │     │ Organization     │   │ Complete record  │
│ amount: 1,500        │     │ account created  │   │ For accounting   │
│ status: accrued      │     │                  │   │                  │
│ pledge_id: 123       │     └──────────────────┘   └──────────────────┘
│ organization_id: 1   │
│ created_at: NOW      │
└──────────────────────┘
           ↓

STEP 5: WAIT FOR PAYOUT (Automatic at 5 PM)
┌──────────────────────────────────────┐
│ Daily: Accumulate all commissions    │
│ 5 PM: Batch all accrued              │
│ Total today: 1,500 + 2,500 + 1,000   │
│           = 5,000 UGX                │
└──────────────────────────────────────┘
           ↓

STEP 6: SEND TO YOUR ACCOUNT
┌──────────────────────────────────────┐
│ Commission Distribution Service      │
│ Method: MTN (primary account)        │
│ Destination: 256774306868            │
│ Amount: 5,000 UGX                    │
│ Reference: COMM-1702800000000-abc    │
│ Status: Processing...                │
└──────────────────────────────────────┘
           ↓

STEP 7: MOBILE MONEY PROCESSES
┌──────────────────────────────────────┐
│ MTN Network                          │
│ Receives: Commission payout request  │
│ Sends USSD: "Confirm receipt of      │
│              5,000 UGX from           │
│              PledgeHub"               │
│ You enter: PIN                       │
│ Status: Confirmed                    │
└──────────────────────────────────────┘
           ↓

STEP 8: WEBHOOK CALLBACK
┌──────────────────────────────────────┐
│ MTN Callback                         │
│ "Payment SUCCESSFUL"                 │
│ Transaction ID: MTN-XYZ123           │
│ Timestamp: 5:05 PM                   │
└──────────────────────────────────────┘
           ↓

STEP 9: UPDATE STATUS
┌──────────────────────────────────────┐
│ commission_payouts table             │
│ batch_id: COMM-1702800000000-abc     │
│ status: successful ✅                 │
│ completed_at: 5:05 PM                │
│                                      │
│ commissions table                    │
│ status: paid_out                     │
│ paid_out_at: 5:05 PM                 │
└──────────────────────────────────────┘
           ↓

STEP 10: YOU GOT PAID! ✅
┌──────────────────────────────────────┐
│ Your MTN Wallet                      │
│ Previous balance: 10,000 UGX          │
│ + Commission payout: 5,000 UGX        │
│ New balance: 15,000 UGX ✅            │
│                                      │
│ You can:                             │
│ - Withdraw to bank                   │
│ - Use for airtime                    │
│ - Pay bills                          │
│ - Send to others                     │
└──────────────────────────────────────┘
```

---

## 8. Revenue Growth Projection

```
MONTH 1: 5 Organizations, 500,000 UGX in pledges
├─ Free (1 org): 50,000 × 5% = 2,500 UGX
├─ Basic (2 orgs): 200,000 × 2.5% = 5,000 UGX
├─ Pro (2 orgs): 250,000 × 1.5% = 3,750 UGX
└─ TOTAL: 11,250 UGX/month

MONTH 3: 15 Organizations, 1,500,000 UGX in pledges
├─ Free (2 orgs): 100,000 × 5% = 5,000 UGX
├─ Basic (6 orgs): 600,000 × 2.5% = 15,000 UGX
├─ Pro (5 orgs): 625,000 × 1.5% = 9,375 UGX
├─ Enterprise (2 orgs): 175,000 × 0.5% = 875 UGX
└─ TOTAL: 30,250 UGX/month

MONTH 6: 30 Organizations, 3,000,000 UGX in pledges
├─ Free (5 orgs): 200,000 × 5% = 10,000 UGX
├─ Basic (12 orgs): 1,000,000 × 2.5% = 25,000 UGX
├─ Pro (10 orgs): 1,450,000 × 1.5% = 21,750 UGX
├─ Enterprise (3 orgs): 350,000 × 0.5% = 1,750 UGX
└─ TOTAL: 58,500 UGX/month

MONTH 12: 50 Organizations, 5,000,000 UGX in pledges
├─ Free (8 orgs): 300,000 × 5% = 15,000 UGX
├─ Basic (20 orgs): 1,600,000 × 2.5% = 40,000 UGX
├─ Pro (15 orgs): 2,250,000 × 1.5% = 33,750 UGX
├─ Enterprise (7 orgs): 850,000 × 0.5% = 4,250 UGX
└─ TOTAL: 93,000 UGX/month (~1.1M/year) 📈
```

---

## 9. Account Management Flow

```
YOU (Platform Owner)
        │
        ├─ Primary Payment Account
        │  ├─ Type: MTN
        │  ├─ Phone: 256774306868
        │  ├─ Status: Active ✅
        │  └─ Commissions sent here
        │
        ├─ Backup Payment Account
        │  ├─ Type: Airtel
        │  ├─ Phone: 256701067528
        │  ├─ Status: Active ✅
        │  └─ Used if MTN unavailable
        │
        └─ Bank Account (optional future)
           ├─ Type: Bank
           ├─ Account: Encrypted
           └─ For larger withdrawals

COMMISSION PAYOUT LOGIC:
┌─────────────────────────────────────┐
│ Request comes in                    │
│                                     │
│ Is MTN primary and active?          │
│   ├─ YES → Send to MTN              │
│   └─ NO → Check Airtel              │
│        ├─ YES → Send to Airtel      │
│        └─ NO → Error (add account)  │
└─────────────────────────────────────┘
```

---

## 10. Error Recovery Flow

```
SCENARIO: MTN Fails, Airtel Succeeds

┌─────────────────────────────────────────┐
│ Request: Send 5,000 UGX commission      │
│ Method: MTN (primary)                   │
│ Phone: 256700123456                     │
└─────────────────────────────────────────┘
           ↓
    ❌ MTN ERROR
    "Network timeout"
           ↓
┌─────────────────────────────────────────┐
│ Status: failed (will retry)             │
│ Commission: back to 'accrued'           │
│ Log: Error recorded                     │
└─────────────────────────────────────────┘
           ↓
    🔄 RETRY with Fallback
    Switch to Airtel
           ↓
┌─────────────────────────────────────────┐
│ Request: Send 5,000 UGX commission      │
│ Method: Airtel (fallback)               │
│ Phone: 256750654321                     │
└─────────────────────────────────────────┘
           ↓
    ✅ AIRTEL SUCCESS
    "Payment processed"
           ↓
┌─────────────────────────────────────────┐
│ Status: processing → successful         │
│ Commission: paid_out ✓                  │
│ You: Received 5,000 UGX in Airtel       │
└─────────────────────────────────────────┘
```

---

**Visual diagrams complete!**

These diagrams help understand:
- 💰 How money is split
- 🏗️ System architecture
- ⏰ Payment timeline
- 📊 Rate comparison
- 🗄️ Database relationships
- 🔄 Status flows
- 🚀 End-to-end flow
- 📈 Growth projection
- 👤 Account management
- 🔧 Error recovery
