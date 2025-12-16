# 🎯 AIRTEL MONEY - Quick Reference Card

## 📍 9-STEP SETUP PROCESS

| # | Step | Time | Status |
|---|------|------|--------|
| 1️⃣ | Visit Airtel Developer Portal | 1 min | ⏳ Do this first |
| 2️⃣ | Verify Your Email | 2 min | 👉 After email arrives |
| 3️⃣ | Log In to Portal | 1 min | After verification |
| 4️⃣ | Create an Application | 3 min | Get your app |
| 5️⃣ | Get Credentials | 2 min | Copy 3 things |
| 6️⃣ | Update .env File | 3 min | Add credentials |
| 7️⃣ | Restart Backend | 1 min | npm run dev |
| 8️⃣ | Test Your Setup | 2 min | Run API test |
| 9️⃣ | Make Test Payment | 2 min | Optional |

**Total Time: ~20 minutes** ⏱️

---

## 🔑 Three Credentials You'll Get

```
From Airtel Developer Portal:
├─ Client ID       (looks like: abc123def456ghi789)
├─ Client Secret   (looks like: xyz789uvw456rst123)
└─ Merchant ID     (looks like: MERCHANT001)
```

---

## 📝 Environment Variables to Add

**File:** `backend/.env`

```env
AIRTEL_CLIENT_ID=<paste_your_client_id>
AIRTEL_CLIENT_SECRET=<paste_your_client_secret>
AIRTEL_MERCHANT_ID=<paste_your_merchant_id>
AIRTEL_PIN=1234
AIRTEL_ENVIRONMENT=sandbox
AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback
```

---

## 🧪 Test Commands

### Check if Airtel is Available
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:5001/api/payments/methods"
$response | ConvertTo-Json
```

**Expected:** `"airtel": true`

### Make Test Payment
```powershell
$body = @{
    pledgeId = 1
    phoneNumber = "256700123456"
    amount = 50000
} | ConvertTo-Json

Invoke-RestMethod `
    -Uri "http://localhost:5001/api/payments/airtel/initiate" `
    -Method Post `
    -ContentType "application/json" `
    -Body $body | ConvertTo-Json
```

**Expected:** `"status": "PENDING"`

---

## ✅ Test Phone Numbers (Sandbox)

```
256700123456  ✅ Success
256700123457  ❌ Insufficient balance
256700123458  ❌ User declines
256700123459  ❌ Network timeout
```

Use the first one (always succeeds)

---

## 🎯 Completion Checklist

- [ ] Account created on Airtel Developer Portal
- [ ] Email verified
- [ ] Application created
- [ ] 3 credentials copied
- [ ] .env file updated
- [ ] Backend restarted
- [ ] Payment methods API shows airtel: true
- [ ] (Optional) Saved credentials in Payment Settings UI
- [ ] (Optional) Test payment shows PENDING status

---

## 📞 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find Sign Up | Go to: https://developers.airtel.africa |
| Email not received | Check spam folder |
| Can't log in | Reset password on login page |
| Can't create app | Look for "New Application" button |
| Can't find credentials | Go to Your App → Settings/Overview |
| Copy button not visible | Try "Show" button first |
| Server won't start | Check .env syntax (no extra spaces) |
| Airtel shows false | Restart backend after .env update |

---

## 🔗 Important URLs

| What | URL |
|------|-----|
| **Developer Portal** | https://developers.airtel.africa |
| **Your App** | https://developers.airtel.africa → Your Apps |
| **Settings** | http://localhost:5173/admin/payment-settings |
| **Test Endpoint** | http://localhost:5001/api/payments/methods |

---

## 💡 Key Notes

✅ Use **sandbox** mode (free, safe for testing)  
✅ Test phone numbers are fake (no real charges)  
✅ Restart backend after every `.env` change  
✅ Credentials are case-sensitive (copy exactly)  
✅ Format: `256XXXXXXXXX` for phone numbers  

---

## ⏱️ Timeline

**Day 1 (Now):** Complete steps 1-7 (20 min)  
**Day 1 (Later):** Test with step 8-9 (10 min)  
**This Week:** Move to PayPal setup  

---

**📖 Full Guide:** See `AIRTEL_STEP_BY_STEP_GUIDE.md`

**Ready?** 👉 Start with **Step 1** in the full guide!
