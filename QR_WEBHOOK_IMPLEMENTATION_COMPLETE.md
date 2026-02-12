# QR Payment Webhook Integration - Complete Implementation Guide

## Overview

The QR payment webhook integration enables real-time payment status updates when users complete payments via MTN Mobile Money or Airtel Money. When a payment is initiated from a QR code, a unique reference is passed to the mobile money provider. When the provider completes the payment, it sends a webhook callback to PledgeHub, which updates:

- Payment status in the database
- Pledge balance and payment tracking
- QR code payment linking

## Architecture

### Flow Diagram

```
1. User scans QR code
   ↓
2. QR Code generated with reference: e.g., "PLEDGE-123-1234567890"
   ↓
3. Payment initiated with provider (MTN/Airtel)
   Reference passed as external ID
   ↓
4. User completes payment on phone
   ↓
5. Provider calls webhook: POST /api/payments/{mtn|airtel}/callback
   ↓
6. Webhook handler processes payment
   - Updates payment record
   - Updates pledge balance
   - Links QR code to payment
   - Returns 200 OK
   ↓
7. Dashboard shows updated pledge status
```

## Implementation Details

### Files Created/Modified

#### New Files
1. **backend/routes/mtnCallbackRoutes.js** - MTN payment webhook handler
2. **backend/routes/airtelCallbackRoutes.js** - Airtel payment webhook handler
3. **backend/scripts/test-qr-webhooks.js** - Webhook integration tests
4. **backend/scripts/verify-webhook-routes.js** - Route verification utility

#### Modified Files
1. **backend/server.js**
   - Added imports for `mtnCallbackRoutes` and `airtelCallbackRoutes`
   - Registered routes: `/api/payments/mtn/callback` and `/api/payments/airtel/callback`
   - Routes are PUBLIC (no authentication required)

2. **backend/services/mobileMoneyService.js**
   - Updated `requestMTNPayment()` to accept `reference` parameter
   - Updated `requestAirtelPayment()` to accept `reference` parameter

3. **backend/controllers/paymentIntegrationController.js**
   - Added imports: `QRCodeModel` and `pool`
   - Ready to use for webhook payload processing

## Webhook Endpoints

### MTN Payment Callback

**Endpoint:** `POST /api/payments/mtn/callback`

**No Authentication Required** (Called by MTN servers)

**Request Payload:**
```json
{
  "referenceId": "MTN_REF_1234567890",
  "status": "SUCCESSFUL",
  "amount": 50000,
  "externalId": "PLEDGE-123-1234567890",
  "financialTransactionId": "FIN_TXN_123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

**Features:**
- Extracts pledge ID from externalId
- Creates/updates payment record
- Updates pledge balance
- Links QR code to payment
- Handles idempotency (same webhook twice = no duplicates)
- Logs financial transaction ID

### Airtel Money Callback

**Endpoint:** `POST /api/payments/airtel/callback`

**No Authentication Required** (Called by Airtel servers)

**Request Payload:**
```json
{
  "transactionId": "AIRTEL_TXN_9876543",
  "statusCode": "0",
  "status": "SUCCESSFUL",
  "amount": 75000,
  "externalId": "PLEDGE-123-1234567890"
}
```

**Status Codes:**
- `0` = Success
- `1` = Failed
- `2` = Pending

**Response:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Database Updates

When a webhook is successfully processed, the following updates occur:

### 1. Payment Record Created/Updated
```sql
INSERT INTO payments (pledge_id, amount, payment_method, status, transaction_id, created_at)
VALUES (123, 50000, 'mtn', 'completed', 'MTN_REF_1234567890', NOW());
```

### 2. Pledge Balance Updated
```sql
UPDATE pledges 
SET amount_paid = amount_paid + 50000,
    balance_remaining = amount - (amount_paid + 50000),
    last_payment_date = NOW(),
    status = CASE WHEN (amount - (amount_paid + 50000)) <= 0 THEN 'paid' ELSE 'active' END
WHERE id = 123;
```

### 3. QR Code Payment Link Created
```sql
INSERT INTO qr_code_payments (qr_code_id, payment_id, status, completed_at)
VALUES (456, 789, 'completed', NOW());
```

## Reference Parameter Flow

### QR Code Generation
```
POST /api/qr/mtn
↓
qrCodeService.generateMTNQRCode()
↓
Returns: { qrCodeId, qrReference: "unique-id-123" }
```

### Payment Initiation
```
POST /api/qr/initiate
↓
Mobile money service receives qrReference
↓
Creates externalId: PLEDGE-{pledgeId}-{timestamp}
↓
MTN/Airtel receives reference parameter
```

### Webhook Callback
```
MTN/Airtel sends webhook
↓
POST /api/payments/mtn/callback with externalId
↓
Handler extracts pledgeId from externalId
↓
Updates qr_code_payments linking QR → payment
```

## Testing

### Run All Webhook Tests
```bash
node backend/scripts/test-qr-webhooks.js
```

**Tests Included:**
- MTN payment success handling
- MTN payment failure handling
- Airtel payment success handling
- Airtel payment failure handling
- Idempotent webhook processing (duplicate webhooks)
- Database state verification

### Verify Webhook Routes
```bash
node backend/scripts/verify-webhook-routes.js
```

Checks if:
- MTN callback route is accessible
- Airtel callback route is accessible
- Server is running and healthy

### Manual Webhook Testing
```bash
# Test MTN webhook
curl -X POST http://localhost:5001/api/payments/mtn/callback \
  -H "Content-Type: application/json" \
  -d '{
    "referenceId": "TEST_MTN_123",
    "status": "SUCCESSFUL",
    "amount": 50000,
    "externalId": "PLEDGE-999-TEST"
  }'

# Test Airtel webhook
curl -X POST http://localhost:5001/api/payments/airtel/callback \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TEST_AIRTEL_123",
    "statusCode": "0",
    "status": "SUCCESSFUL",
    "amount": 50000,
    "externalId": "PLEDGE-999-TEST"
  }'
```

## Error Handling

### Missing Required Fields
**Response:** 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields: referenceId, status"
}
```

### Webhook Processing Error
**Response:** 200 OK (for idempotency)
```json
{
  "success": false,
  "message": "Webhook received but processing failed",
  "error": "Detailed error message"
}
```

**Note:** Always returns 200 to acknowledge receipt, preventing provider retries

### Database Transaction Failure
- Rolls back all changes
- Logs error with full context
- Returns acknowledgment to provider

## Monitoring

### Check Payment Status
```bash
SELECT * FROM payments WHERE pledge_id = 123 ORDER BY created_at DESC;
```

### View QR Code Payments
```bash
SELECT qp.*, p.status as payment_status, pl.title as pledge_title
FROM qr_code_payments qp
JOIN payments p ON qp.payment_id = p.id
JOIN pledges pl ON p.pledge_id = pl.id
WHERE qp.status = 'completed'
ORDER BY qp.completed_at DESC;
```

### Monitor Webhook Calls
Check server logs for:
```
[MTN WEBHOOK] Payment callback received: {...}
[MTN WEBHOOK] ✅ Payment processed successfully
[AIRTEL WEBHOOK] Payment callback received: {...}
[AIRTEL WEBHOOK] ✅ Payment processed successfully
```

## Security Considerations

### Current Implementation
- ✅ No authentication required (webhooks called by providers)
- ✅ Input validation on required fields
- ✅ Database transactions for data consistency
- ✅ Idempotency to handle duplicate webhooks
- ✅ Error logging for debugging

### Future Enhancements
- Add HMAC signature verification for MTN/Airtel payloads
- Rate limiting on callback endpoints
- IP whitelisting for provider servers
- Encrypted payload handling for sensitive data
- Audit logging for compliance

## Production Deployment

### Environment Configuration
Ensure these variables are set in `.env`:
```
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/mtn/callback
AIRTEL_CALLBACK_URL=https://yourdomain.com/api/payments/airtel/callback
```

### Update Provider Settings
1. Log into MTN Mobile Money dashboard
2. Set Callback URL: `https://yourdomain.com/api/payments/mtn/callback`
3. Set Environment: `production`

4. Log into Airtel Money dashboard
5. Set Callback URL: `https://yourdomain.com/api/payments/airtel/callback`
6. Set Environment: `production`

### HTTPS Requirement
- Webhooks MUST be HTTPS in production
- Configure SSL certificates
- Test with: `curl -X POST https://yourdomain.com/api/payments/mtn/callback`

## Troubleshooting

### Webhook Not Being Called
1. Verify callback URL in provider dashboard
2. Check firewall/network configuration
3. Monitor server logs for incoming requests
4. Test manually with curl command

### Payment Not Updating
1. Check if payment record exists: `SELECT * FROM payments WHERE transaction_id = 'REF_ID'`
2. Verify pledge exists: `SELECT * FROM pledges WHERE id = 123`
3. Check webhook response in provider logs
4. Run test suite to isolate issue

### Duplicate Payments
1. Idempotency prevents duplicates (same reference = no new record)
2. Check if different references are being used
3. Monitor webhook retry logic in provider dashboard

### Database Transaction Errors
1. Check MySQL connection pool
2. Verify database disk space
3. Check for transaction locks: `SHOW PROCESSLIST;`
4. Review server error logs

## API Response Examples

### Successful Payment Update
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

### Failed Payment Update
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```
Note: Still returns 200 to prevent provider retries, but logs failure internally.

## Integration Checklist

- [x] MTN callback route created and registered
- [x] Airtel callback route created and registered
- [x] Database transaction handling implemented
- [x] Idempotency handling implemented
- [x] Error logging implemented
- [x] Test suite created (test-qr-webhooks.js)
- [x] Route verification utility created
- [x] Documentation completed
- [ ] HMAC signature verification (future)
- [ ] Rate limiting on webhooks (future)
- [ ] IP whitelisting for providers (future)

## Next Steps

1. **Testing**
   ```bash
   # Run webhook tests
   node backend/scripts/test-qr-webhooks.js
   
   # Verify routes
   node backend/scripts/verify-webhook-routes.js
   ```

2. **Manual Testing**
   - Generate QR code
   - Initiate payment from QR
   - Simulate webhook callback
   - Verify pledge balance updated

3. **Production Deployment**
   - Update callback URLs in provider dashboards
   - Switch to production environment
   - Monitor webhook logs
   - Set up alerts for failed webhooks

## Support

For issues or questions about webhook integration:
1. Check server logs: `npm run dev` and watch for webhook messages
2. Run test suite: `node backend/scripts/test-qr-webhooks.js`
3. Verify routes: `node backend/scripts/verify-webhook-routes.js`
4. Check database state manually if needed

---

**Last Updated:** December 2025
**Status:** ✅ Complete - Ready for Testing
