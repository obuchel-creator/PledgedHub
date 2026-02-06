# Phone Number Validation for Pledge Creation

## Overview

PledgeHub now supports flexible phone number validation when creating pledges. This feature allows administrators to choose between strict validation (phone must match user's registered phone) or flexible validation (any phone number allowed).

## Why This Feature?

Users often have multiple phone numbers (work, personal, family). Enforcing strict phone validation could prevent legitimate pledges. However, some organizations may want strict validation for accountability and verification purposes.

## Configuration

The phone validation mode is controlled by an environment variable:

```bash
# In backend/.env
ENABLE_STRICT_PHONE_VALIDATION=false  # Default: flexible mode
```

### Modes

#### Flexible Mode (Default: `ENABLE_STRICT_PHONE_VALIDATION=false`)
- ✅ Allows users to create pledges with any phone number
- ⚠️  Logs a warning when phone doesn't match registered phone
- 👍 Better user experience for users with multiple phones
- 📱 Suitable for most organizations

**Use Case**: Most churches/organizations where members may have multiple phones or share phones.

#### Strict Mode (`ENABLE_STRICT_PHONE_VALIDATION=true`)
- ❌ Rejects pledges if phone doesn't match registered phone
- 🔒 Enforces accountability through phone verification
- 📞 Ensures only registered phone can be used
- 🎯 Higher security and data integrity

**Use Case**: Organizations requiring strict identity verification or compliance.

## Validation Logic

### Phone Number Normalization

Before comparison, phone numbers are normalized by removing:
- Spaces: `+256 700 123 456` → `256700123456`
- Dashes: `+256-700-123-456` → `256700123456`
- Plus signs: `+256700123456` → `256700123456`

This ensures that different formats of the same number are recognized as matching.

### Example Scenarios

#### Scenario 1: Matching Phones (Both Modes)
```javascript
// User's registered phone: +256700123456
// Submitted phone: 256 700 123 456
// Result: ✅ ALLOWED (normalized forms match)
```

#### Scenario 2: Different Phones - Flexible Mode
```javascript
// User's registered phone: +256700123456
// Submitted phone: +256750999888
// Result: ✅ ALLOWED with warning log
// Log: "⚠️ Phone mismatch - User ID: 123, Registered: +256700123456, Submitted: +256750999888"
```

#### Scenario 3: Different Phones - Strict Mode
```javascript
// User's registered phone: +256700123456
// Submitted phone: +256750999888
// Result: ❌ REJECTED
// Error: "Phone number must match your registered phone (+256700123456)"
```

#### Scenario 4: User Without Registered Phone
```javascript
// User's registered phone: null
// Submitted phone: +256700123456
// Result: ✅ ALLOWED (no validation performed)
```

## Name Validation (Always Strict)

Regardless of phone validation mode, **name validation is always strict**:
- Pledge name MUST match user's registered name (case-insensitive)
- This ensures accountability for individual pledges
- Staff/Admin can create pledges for others via batch import

```javascript
// User's registered name: "John Doe"
// Submitted name: "john doe" → ✅ ALLOWED (case-insensitive)
// Submitted name: "Jane Smith" → ❌ REJECTED
```

## API Behavior

### Success Response (Both Modes)
```json
{
  "success": true,
  "pledge": {
    "id": 123,
    "donor_name": "John Doe",
    "donor_phone": "+256700123456",
    "amount": 50000,
    "status": "pending"
  },
  "message": "Pledge created! Please verify your email to confirm."
}
```

### Error Response (Strict Mode)
```json
{
  "success": false,
  "error": "Phone number must match your registered phone (+256700123456). Individual pledges can only be created with your registered phone number for verification and accountability.",
  "details": {
    "registeredPhone": "+256700123456",
    "submittedPhone": "+256750999888"
  }
}
```

## Testing

### Run Phone Validation Tests
```bash
cd backend
npm test -- phoneValidation.test.js
```

### Test Coverage
- ✅ Flexible mode with matching phone
- ✅ Flexible mode with different phone
- ✅ Phone normalization (spaces, dashes, plus signs)
- ✅ Strict mode with matching phone
- ✅ Strict mode with different phone (rejection)
- ✅ User without registered phone
- ✅ Name validation enforcement

## Integration with Existing Tests

The phone validation is tested alongside existing pledge creation tests. To run all pledge-related tests:

```bash
cd backend
npm test -- pledge
```

## Monitoring and Logging

### Flexible Mode Logs
When a phone mismatch occurs in flexible mode, two warning logs are generated:

```
⚠️  [PLEDGE CREATE] Phone mismatch - User ID: 123, Registered: +256700123456, Submitted: +256750999888
⚠️  [PLEDGE CREATE] Allowing pledge with different phone number (flexible mode enabled)
```

These logs help administrators:
1. Track phone number mismatches
2. Identify users with multiple phones
3. Detect potential security issues
4. Make informed decisions about switching to strict mode

### Monitoring Queries
To analyze phone mismatches, query server logs:

```bash
# Count phone mismatches
grep "Phone mismatch" logs/app.log | wc -l

# Find users with most mismatches
grep "Phone mismatch" logs/app.log | awk '{print $7}' | sort | uniq -c | sort -rn | head -10
```

## Migration Guide

### From Strict to Flexible (Recommended)
If you currently have issues with users unable to create pledges due to phone mismatches:

1. Update `.env`:
   ```bash
   ENABLE_STRICT_PHONE_VALIDATION=false
   ```

2. Restart the backend:
   ```bash
   npm restart
   ```

3. Monitor logs for phone mismatches:
   ```bash
   tail -f logs/app.log | grep "Phone mismatch"
   ```

### From Flexible to Strict
If you need stricter validation:

1. Analyze current phone mismatches in logs
2. Communicate the change to users
3. Update `.env`:
   ```bash
   ENABLE_STRICT_PHONE_VALIDATION=true
   ```
4. Restart and monitor for user complaints

## Future Enhancements

Potential improvements for future versions:

1. **Multiple Phone Numbers**: Allow users to register multiple phones
   - Database: Add `user_phones` table
   - Validation: Check against all registered phones

2. **Phone Verification**: Send SMS codes to verify phone ownership
   - Integration with Twilio/Africa's Talking
   - Update `phone_verified` status

3. **Admin Override**: Allow admins to create pledges with any phone
   - Add `skipPhoneValidation` permission
   - Useful for data migration

4. **Analytics Dashboard**: Track phone mismatch patterns
   - Visualization of mismatch frequency
   - User behavior insights

## Support

For questions or issues:
- Check logs for error details
- Verify `.env` configuration
- Run tests to ensure proper setup
- Contact support with log excerpts

## Related Files

- Controller: `backend/controllers/pledgeController.js` (lines 194-229)
- Tests: `backend/tests/phoneValidation.test.js`
- Config: `backend/.env.example` (line 185-188)
- Routes: `backend/routes/pledgeRoutes.js`
