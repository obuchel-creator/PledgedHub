# QR Code Payment Implementation for PledgeHub

## Overview
Implemented a complete QR code payment system for MTN and Airtel Money that allows donors to pay pledges by scanning QR codes. The system supports both direct payment initiation and manual USSD code entry as a fallback.

## Architecture

### Backend Components

#### 1. QR Code Service (`backend/services/qrCodeService.js`)
Core service for QR code generation with the following functions:

**Key Functions:**
- `generateMTNQRCode(options)` - Generate MTN-specific QR codes with yellow styling
- `generateAirtelQRCode(options)` - Generate Airtel-specific QR codes with red styling
- `generatePaymentQRCode(options)` - Auto-detect provider and generate appropriate QR code
- `generateUSSDCode(provider, amount, pledgeId)` - Generate USSD codes for manual payment
- `decodePaymentData(paymentLink)` - Decode payment information from scanned QR code

**QR Code Contents:**
- Provider (mtn or airtel)
- Pledge ID
- Payment amount (in UGX)
- Timestamp
- Unique transaction reference
- Donor phone (optional)

**Example QR Code Data Structure:**
```json
{
  "provider": "mtn",
  "pledgeId": 1,
  "amount": 50000,
  "timestamp": 1706000000,
  "reference": "PLG-1-A1B2C3D4",
  "donorPhone": "+256700000000"
}
```

#### 2. QR Code Controller (`backend/controllers/qrCodeController.js`)
REST API endpoints for QR code operations:

**Endpoints:**
- `POST /api/qr/mtn` - Generate MTN QR code
- `POST /api/qr/airtel` - Generate Airtel QR code
- `POST /api/qr/` - Generate QR code (auto-detect provider)
- `GET /api/qr/image` - Stream QR code as image
- `GET /api/qr/ussd` - Get USSD code instructions
- `POST /api/qr/decode` - Decode QR code payment data
- `POST /api/qr/initiate` - Initiate payment from QR code

#### 3. QR Code Routes (`backend/routes/qrCodeRoutes.js`)
Express route module with proper authentication and rate limiting:
- Public access for image streaming (`/api/qr/image`)
- Authenticated access for sensitive endpoints
- Rate limiting applied via `securityService.rateLimiters.api`

### Frontend Components

#### 1. QR Payment Screen (`frontend/src/screens/QRPaymentScreen.jsx`)
Comprehensive React component for QR code payments with:

**Features:**
- Provider selection (MTN / Airtel)
- Automatic QR code generation
- Payment details display
- Manual payment initiation via phone number
- USSD code display with copy functionality
- Payment status feedback
- Help section for users

**State Management:**
- QR code image (base64)
- Selected provider
- Loading states
- Error handling
- Payment status

**User Flow:**
1. Select payment provider (MTN or Airtel)
2. QR code auto-generates
3. Scan with phone camera OR enter phone number for manual payment
4. Receive payment prompt on phone
5. Confirmation after payment

#### 2. Payment Initiation Screen Update (`frontend/src/screens/PaymentInitiationScreen.jsx`)
Updated existing payment screen to include QR code method:

**Changes:**
- Added QR code as first payment method option
- Integrated QRPaymentScreen component
- Auto-detection of QR code selection
- Smooth transitions between payment methods

#### 3. Styling (`frontend/src/styles/QRPaymentScreen.css`)
Professional styling with:
- Gradient backgrounds
- Provider-specific colors (MTN yellow, Airtel red)
- Responsive design (mobile-first)
- Loading animations
- Error state styling
- Smooth transitions

## API Endpoints

### Generate QR Code
```bash
POST /api/qr/mtn
Content-Type: application/json
Authorization: Bearer {token}

{
  "pledgeId": 1,
  "amount": 50000,
  "donorPhone": "256700000000",
  "donorName": "John Doe"
}

Response:
{
  "success": true,
  "data": {
    "qrCode": "base64_encoded_image",
    "provider": "mtn",
    "format": "png",
    "mimeType": "image/png",
    "paymentData": {
      "provider": "mtn",
      "pledgeId": 1,
      "amount": 50000,
      "timestamp": 1706000000,
      "reference": "PLG-1-A1B2C3D4"
    },
    "pledgeId": 1,
    "amount": 50000
  }
}
```

### Stream QR Code Image
```bash
GET /api/qr/image?provider=mtn&pledgeId=1&amount=50000

Response: Binary PNG image
```

### Get USSD Instructions
```bash
GET /api/qr/ussd?provider=mtn&pledgeId=1&amount=50000

Response:
{
  "success": true,
  "data": {
    "provider": "MTN Mobile Money",
    "code": "*165#",
    "manualSteps": [
      "Dial *165# on your MTN phone",
      "Select: Send Money",
      ...
    ],
    "shortNote": "Dial *165# and follow prompts",
    "fullUSSD": "*165*50000*1#"
  }
}
```

### Initiate Payment from QR
```bash
POST /api/qr/initiate
Content-Type: application/json
Authorization: Bearer {token}

{
  "paymentLink": "pledgehub://pay/mtn?data=...",
  "phoneNumber": "256700000000"
}

Response: Mobile money payment confirmation
```

## Integration with Existing Payment System

### Payment Flow Diagram
```
User selects QR code payment
         ↓
QR code generated (pledgeId + amount encoded)
         ↓
User scans QR or enters phone number
         ↓
Payment initiated via MTN/Airtel service
         ↓
Payment prompt sent to donor's phone
         ↓
Donor approves payment
         ↓
Payment callback received
         ↓
Pledge marked as paid
         ↓
Confirmation sent to donor
```

### Database Integration
No new database tables required. Uses existing:
- `pledges` table (pledgeId, amount, donor_phone)
- `payments` table (payment_method: 'mtn'/'airtel', status)

### Deep Link Handling (Optional)
For mobile app integration, QR codes can trigger deep links:
```
pledgehub://pay/mtn?data=base64_encoded_json
pledgehub://pay/airtel?data=base64_encoded_json
```

## Security Features

### 1. Data Encoding
- Payment data encoded in Base64 format
- Includes timestamp to prevent replay attacks
- Unique reference ID per transaction

### 2. Authentication
- JWT token required for QR generation
- User context maintained in request
- Rate limiting applied to prevent abuse

### 3. Validation
- Pledge ID verified before QR generation
- Amount validation
- Phone number format validation
- Provider authentication before payment initiation

### 4. Error Handling
- Graceful degradation if AI unavailable
- Fallback to USSD codes
- Clear error messages to users
- Payment status tracking

## Testing Guidelines

### Unit Tests
Test service functions:
```javascript
// Test QR code generation
const result = await qrCodeService.generateMTNQRCode({
  pledgeId: 1,
  amount: 50000
});
expect(result.success).toBe(true);
expect(result.qrCode).toBeDefined();

// Test USSD code generation
const ussd = qrCodeService.generateUSSDCode('mtn', 50000, 1);
expect(ussd.code).toBe('*165#');
```

### Integration Tests
Test complete payment flow:
```bash
# 1. Generate QR code
curl -X POST http://localhost:5001/api/qr/mtn \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"pledgeId": 1, "amount": 50000}'

# 2. Initiate payment
curl -X POST http://localhost:5001/api/qr/initiate \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"paymentLink": "...", "phoneNumber": "256700000000"}'
```

### Frontend Testing
Test React components:
```bash
# Test QRPaymentScreen rendering
- Provider selection
- QR code display
- Manual payment form
- USSD instructions
- Error handling
```

### End-to-End Testing
Real payment flow:
1. Login to system
2. Create pledge
3. Navigate to payment
4. Select QR code method
5. Scan generated QR or enter phone
6. Verify payment prompt sent to phone
7. Complete payment on phone
8. Verify pledge marked as paid

## Configuration

### Environment Variables
```bash
# Optional merchant phone for QR encoding
MTN_MERCHANT_PHONE=256700000001
AIRTEL_MERCHANT_PHONE=256700000002

# App URL for callback
APP_URL=http://localhost:5001
```

### Provider Setup
MTN and Airtel credentials must be configured as usual:
```bash
MTN_COLLECTION_USER_ID={from portal}
MTN_COLLECTION_API_KEY={from portal}
MTN_SUBSCRIPTION_KEY={from portal}
MTN_ENVIRONMENT=sandbox

AIRTEL_CLIENT_ID={from portal}
AIRTEL_CLIENT_SECRET={from portal}
AIRTEL_MERCHANT_ID={from portal}
AIRTEL_ENVIRONMENT=sandbox
```

## Features & Benefits

### For Donors
✅ **Easy Payment:** Scan QR code with phone camera  
✅ **Multiple Options:** QR or manual payment code entry  
✅ **Clear Instructions:** Step-by-step USSD guide  
✅ **Fast Processing:** Instant payment prompts  
✅ **Confirmation:** Automatic receipts and updates  

### For Organization
✅ **Better UX:** More payment options increase completion  
✅ **Mobile-Friendly:** Works on basic phones  
✅ **Reduced Friction:** No phone number entry needed  
✅ **Offline Support:** QR codes can be printed  
✅ **Analytics:** Payment source tracking  

## Future Enhancements

### Phase 2
- [ ] Print-friendly QR codes for posters
- [ ] Email QR codes with invoice
- [ ] WhatsApp QR code sharing
- [ ] QR code branding (logo overlay)
- [ ] Payment history with QR reference

### Phase 3
- [ ] Batch QR code generation
- [ ] Custom QR code styling per organization
- [ ] QR code expiration dates
- [ ] Payment link shortening
- [ ] Dynamic QR codes (rate updates)

### Phase 4
- [ ] Mobile app deep link integration
- [ ] AR code scanning
- [ ] NFC payment tags
- [ ] Bluetooth payment initiation
- [ ] Blockchain payment verification

## Troubleshooting

### QR Code Not Generating
**Issue:** "Failed to generate QR code"  
**Solution:**
1. Verify qrcode package is installed: `npm list qrcode`
2. Check pledgeId and amount are provided
3. Verify user has permission to create payment

### Payment Not Initiated from QR
**Issue:** "Payment data decode failed"  
**Solution:**
1. Ensure QR code is fully scanned
2. Verify deep link is properly formatted
3. Check phoneNumber is in correct format (256XXXXXXXXX)

### USSD Code Not Working
**Issue:** Code doesn't initiate payment on phone  
**Solution:**
1. Verify phone number has active mobile money
2. Check amount doesn't exceed account limits
3. Try manual code entry instead of scanning

### QR Image Quality Poor
**Issue:** Blurry or unreadable QR  
**Solution:**
1. Increase QR code size (adjust width option)
2. Improve camera/scanner quality
3. Check for corrupted image encoding

## File Structure
```
backend/
├── services/
│   └── qrCodeService.js           # QR generation logic
├── controllers/
│   └── qrCodeController.js        # API endpoints
└── routes/
    └── qrCodeRoutes.js             # Express routes

frontend/
├── screens/
│   └── QRPaymentScreen.jsx         # React component
└── styles/
    └── QRPaymentScreen.css         # Component styling
```

## Related Documentation
- [Payment Integration Guide](./PAYMENT_INTEGRATION_COMPLETE.md)
- [MTN Setup Guide](./MTN_SETUP_GUIDE.md)
- [Airtel Setup Guide](./AIRTEL_SETUP_GUIDE.md)
- [Payment Security Guide](./PAYMENT_SECURITY_GUIDE.md)

## Summary
This QR code payment implementation provides a modern, user-friendly way for donors to pay pledges using MTN and Airtel Mobile Money. The system is secure, scalable, and includes fallback options for maximum compatibility.

**Key Files:**
- `backend/services/qrCodeService.js` - 300+ lines of QR logic
- `backend/controllers/qrCodeController.js` - 400+ lines of API handlers
- `backend/routes/qrCodeRoutes.js` - Route definitions
- `frontend/src/screens/QRPaymentScreen.jsx` - 530+ lines React component
- `frontend/src/styles/QRPaymentScreen.css` - 400+ lines of styling

**API Routes Added:**
- POST /api/qr/mtn - Generate MTN QR code
- POST /api/qr/airtel - Generate Airtel QR code
- POST /api/qr/ - Auto-detect and generate QR code
- GET /api/qr/image - Stream QR image
- GET /api/qr/ussd - Get USSD instructions
- POST /api/qr/decode - Decode payment data
- POST /api/qr/initiate - Initiate payment from QR

**Total Implementation:**
- Backend: ~750 lines of code
- Frontend: ~900 lines of code
- Total: ~1650 lines of production code
