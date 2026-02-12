# QR Webhook Integration - Quick Reference Card

## Webhook Endpoints

### MTN Callback
```
POST /api/payments/mtn/callback
Content-Type: application/json

{
  "referenceId": "MTN_REF_123",
  "status": "SUCCESSFUL",
  "amount": 50000,
  "externalId": "PLEDGE-123-1234567890",
  "financialTransactionId": "FIN_TXN_123"
}
```

### Airtel Callback
```
POST /api/payments/airtel/callback
Content-Type: application/json

{
  "transactionId": "AIRTEL_TXN_456",
  "statusCode": "0",
  "amount": 75000,
  "externalId": "PLEDGE-123-1234567890"
}
```

## Status Codes

### MTN
- `SUCCESSFUL` - Payment completed
- `FAILED` - Payment failed
- `PENDING` - Payment still processing

### Airtel
- `0` - Successful
- `1` - Failed
- `2` - Pending

## Testing Webhook

```bash
# Test MTN
curl -X POST http://localhost:5001/api/payments/mtn/callback \
  -H "Content-Type: application/json" \
  -d '{"referenceId":"TEST","status":"SUCCESSFUL","amount":50000,"externalId":"PLEDGE-1-123"}'

# Test Airtel
curl -X POST http://localhost:5001/api/payments/airtel/callback \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"TEST","statusCode":"0","amount":50000,"externalId":"PLEDGE-1-123"}'
```

## Files

| File | Purpose |
|------|---------|
| `backend/routes/mtnCallbackRoutes.js` | MTN webhook handler |
| `backend/routes/airtelCallbackRoutes.js` | Airtel webhook handler |
| `backend/scripts/test-qr-webhooks.js` | Webhook test suite |
| `backend/scripts/verify-webhook-routes.js` | Route verification |

## Key Database Operations

```sql
-- Check if payment was created
SELECT * FROM payments WHERE pledge_id = 123 ORDER BY created_at DESC;

-- View pledge balance update
SELECT id, amount_paid, balance, status FROM pledges WHERE id = 123;

-- See QR-payment links
SELECT * FROM qr_code_payments WHERE payment_id = 789;

-- Monitor webhook activity
SELECT * FROM payments WHERE payment_method IN ('mtn', 'airtel') ORDER BY created_at DESC LIMIT 20;
```

## Feature Flow

```
Generate QR → Fund Payment → MTN/Airtel API → Webhook Call → Update DB → Done
                ↓
            reference = qrReference
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Webhook returning 401 | Routes registered after auth (server.js) |
| Payment not updating | Check pledge exists, review error logs |
| Duplicate payments | Idempotency checking on payment_method_reference |
| Database error | Verify pledges table exists, check permissions |

## Environment Variables

```bash
MTN_CALLBACK_URL=https://yourdomain.com/api/payments/mtn/callback
AIRTEL_CALLBACK_URL=https://yourdomain.com/api/payments/airtel/callback
```

## Response Format

```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

Note: Always returns 200 OK to prevent provider retries.

## Testing

```bash
# Quick test
node backend/scripts/verify-webhook-routes.js

# Full integration test
node backend/scripts/test-qr-webhooks.js

# Run server
npm run dev
```

---
**Last Updated**: December 2025
