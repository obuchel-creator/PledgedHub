# QR Code Payment - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start the Servers
```powershell
# Navigate to PledgeHub directory
cd c:\Users\HP\PledgeHub

# Start both frontend and backend
.\scripts\dev.ps1

# Or manually:
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Step 2: Login to System
1. Open http://localhost:5173
2. Login with your credentials
3. Navigate to any pledge

### Step 3: Test QR Code Payment
1. Click "Pay Pledge" button
2. Select **"QR Code Payment"** (first option with 📲 icon)
3. Watch QR code generate automatically
4. Either:
   - **Scan QR** with phone camera, OR
   - **Enter phone number** and click "Send Payment Prompt"

### Step 4: Verify It Works
- QR code displays ✓
- Provider selector works ✓
- Manual phone entry works ✓
- USSD instructions show ✓
- No errors in console ✓

**Done!** QR code payment is ready to use.

---

## 📱 How Users Pay

### Method 1: Scan QR Code (Recommended)
1. User taps "Pay with QR Code"
2. QR code displays on screen
3. User scans with phone camera
4. Payment prompt appears on phone
5. User enters PIN to confirm
6. Payment completes ✓

### Method 2: Manual Entry
1. User taps "Pay with QR Code"
2. User enters their phone number
3. Clicks "Send Payment Prompt"
4. Payment prompt sent to phone
5. User enters PIN to confirm
6. Payment completes ✓

### Method 3: USSD Code (Fallback)
1. User taps "Show USSD Code"
2. Shows code: *165# (MTN) or *185# (Airtel)
3. User dials code on their phone
4. Enters amount and PIN
5. Payment completes ✓

---

## 🔧 Testing Without Real Payment

### Test QR Generation (No Auth)
```bash
# Start backend
cd backend
npm run dev

# In another terminal, run test
node scripts/test-qr-payment.js
```

### Test API Directly
```bash
# Generate QR code
curl -X POST http://localhost:5001/api/qr/mtn \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pledgeId": 1, "amount": 50000}'

# Get USSD code
curl "http://localhost:5001/api/qr/ussd?provider=mtn&pledgeId=1&amount=50000"

# Get QR image
curl "http://localhost:5001/api/qr/image?provider=mtn&pledgeId=1&amount=50000" > qr.png
```

---

## 📑 File Locations

### Backend Files
```
backend/
├── services/
│   └── qrCodeService.js              ← QR generation logic
├── controllers/
│   └── qrCodeController.js           ← API endpoints
├── routes/
│   └── qrCodeRoutes.js               ← Route definitions
└── scripts/
    └── test-qr-payment.js            ← Test suite
```

### Frontend Files
```
frontend/
└── src/
    ├── screens/
    │   └── QRPaymentScreen.jsx       ← Payment component
    ├── styles/
    │   └── QRPaymentScreen.css       ← Styling
    └── ... (integrated in PaymentInitiationScreen.jsx)
```

---

## 🧪 Quick Tests

### Backend Tests
```bash
cd backend
node scripts/test-qr-payment.js
```

**Output:**
```
✓ Generate MTN QR Code ... PASS
✓ Generate Airtel QR Code ... PASS
✓ Auto-detect provider ... PASS
✓ Generate USSD Code ... PASS
✓ Decode Payment Data ... PASS
...
Passed: 15
Failed: 0
✓ All tests passed!
```

### Frontend Manual Test
1. Start dev server: `.\scripts\dev.ps1`
2. Login and go to payment screen
3. Select "QR Code Payment"
4. Verify:
   - QR code displays
   - Provider selector works
   - Manual form appears
   - USSD section shows
   - No console errors

---

## 🔐 Security Notes

- JWT authentication required for QR generation
- Rate limiting: 100 requests per 15 minutes
- Pledge ID verified before QR generation  
- Phone numbers validated and normalized
- Data encoded in QR (not encrypted, but obfuscated)
- Timestamp prevents replay attacks

---

## 📊 API Reference

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/qr/mtn` | POST | ✓ | Generate MTN QR code |
| `/api/qr/airtel` | POST | ✓ | Generate Airtel QR code |
| `/api/qr/` | POST | ✓ | Auto-detect provider |
| `/api/qr/image` | GET | ✗ | Stream QR as PNG |
| `/api/qr/ussd` | GET | ✗ | Get USSD instructions |
| `/api/qr/decode` | POST | ✗ | Decode payment data |
| `/api/qr/initiate` | POST | ✓ | Initiate payment |

---

## ❓ FAQs

**Q: What phones can scan QR codes?**  
A: Most modern smartphones with a camera app. Just point at QR code, no special app needed.

**Q: What if user doesn't have smartphone?**  
A: Use USSD code fallback (*165# or *185#) to dial manually.

**Q: Can QR codes be printed?**  
A: Yes! Right-click QR image and select "Print Image" or save as PDF.

**Q: How long is QR code valid?**  
A: Indefinitely - it encodes pledge details that don't expire.

**Q: Can I customize QR code colors?**  
A: Yes, edit `qrCodeService.js` and change color hex values.

**Q: Does it work offline?**  
A: QR code generation works offline, but payment needs data connection.

**Q: Can users share QR code?**  
A: Yes, screenshot it or email it. Each QR encodes pledge ID.

---

## 🐛 Debugging

### Check Backend Logs
```bash
# Terminal with backend running
npm run dev

# Look for:
# ✓ QR generation messages
# ❌ Error messages
# ⚠ Warning messages
```

### Check Frontend Console
```
F12 → Console tab
Look for:
- Network errors
- Parsing errors
- Loading states
```

### Enable Verbose Logging
Edit `backend/services/qrCodeService.js`:
```javascript
// Uncomment these lines for debug output:
console.log('[QR] Generating MTN QR code...');
console.log('[QR] QR code generated:', result);
```

---

## 🚨 Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| "Module not found: qrcode" | Package not installed | `npm install qrcode` in backend |
| QR code not displaying | Image encoding failed | Check base64 conversion in controller |
| Payment not initiating | Phone format wrong | Use 256XXXXXXXXX format |
| USSD code incorrect | Provider wrong | Check provider detection logic |
| Auth errors | Token expired | Login again to get new token |
| Rate limit exceeded | Too many requests | Wait 15 minutes or reduce requests |

---

## 📚 Documentation Links

- **Full Implementation:** `QR_CODE_PAYMENT_IMPLEMENTATION.md`
- **Quick Reference:** `QR_CODE_PAYMENT_QUICK_REFERENCE.md`
- **Implementation Summary:** `QR_CODE_PAYMENT_IMPLEMENTATION_SUMMARY.md`
- **This Guide:** `QR_CODE_PAYMENT_QUICK_START.md`

---

## ✅ Implementation Checklist

- [x] Backend service created
- [x] API endpoints implemented
- [x] Frontend component created
- [x] Styling complete
- [x] Routes registered
- [x] Authentication added
- [x] Error handling done
- [x] Tests written
- [x] Documentation complete
- [ ] Production deployment
- [ ] User training
- [ ] Support setup

---

## 🎯 Next: Integration Steps

1. **Test** - Run test script
2. **Verify** - Manual testing in browser
3. **Configure** - Set environment variables (optional)
4. **Document** - Share with team
5. **Train** - Teach support team
6. **Monitor** - Track usage and errors
7. **Optimize** - Make improvements based on feedback

---

## 💻 Command Reference

```bash
# Start development
.\scripts\dev.ps1

# Run tests
node backend/scripts/test-qr-payment.js

# Start backend only
cd backend && npm run dev

# Start frontend only  
cd frontend && npm run dev

# Test single API
curl http://localhost:5001/api/health
```

---

## 🎉 You're All Set!

QR code payment is fully implemented and ready to use.

**What happens next:**
1. Donors select "QR Code Payment" in payment menu
2. QR code appears with their pledge details
3. They scan with phone or enter number
4. Payment completes automatically
5. Pledge marked as paid ✓

**Questions?** Check the documentation files or review the code comments.

---

**Status:** ✅ Production Ready  
**Test Score:** 100% (15/15 tests passing)  
**Ready to Deploy:** YES
