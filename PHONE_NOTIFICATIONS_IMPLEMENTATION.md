# Phone Number & Multi-Channel Notifications Implementation

## Overview
Enhanced the PledgeHub system to capture user phone numbers and enable multi-channel notifications (Email, SMS, WhatsApp) for better communication with donors.

## Changes Implemented

### 1. Database Migration ✅
**File**: `backend/scripts/add-phone-column.js`
- Added `phone_number` VARCHAR(20) column to `users` table
- Column is optional (nullable) to allow gradual adoption
- Positioned after `email` column for logical grouping
- Includes comment: "User phone number for SMS/WhatsApp notifications"

**Status**: Migration script complete and column verified in database

### 2. Backend - User Model Updates ✅
**File**: `backend/models/User.js`

**Changes**:
- Added `phone` / `phone_number` field support in `create()` function
- Updated `update()` function to allow phone number updates
- Added phone field mapping (camelCase `phone` → snake_case `phone_number`)
- Included phone in `save()` helper function
- Added phone_number to `listAll()` SELECT query

**Supported Operations**:
```javascript
// Create user with phone
User.create({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+256700000000',
    password: 'hashed_password'
});

// Update phone number
User.update(userId, { phone: '+256700000000' });
```

### 3. Frontend - Registration Form ✅
**File**: `frontend/src/screens/RegisterScreen.jsx`

**Changes**:
- Added phone number input field between email and password
- Input type: `tel` with international format placeholder `+256 700 000 000`
- Field is optional (marked as "optional" in label)
- Added validation: basic international phone format `/^\+?[1-9]\d{7,14}$/`
- Validation allows spaces, dashes, parentheses (removed during validation)
- Updated registration payload to include phone: `{ name, email, phone, password }`
- Help text: "We'll use this for SMS and WhatsApp notifications"

**Validation Logic**:
```javascript
// Phone validation (optional but must be valid if provided)
if (phone.trim()) {
    const phonePattern = /^\+?[1-9]\d{7,14}$/;
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    if (!phonePattern.test(cleanPhone)) {
        errors.phone = 'Enter a valid phone number (e.g., +256700000000)';
    }
}
```

### 4. Frontend - User Management (Admin Panel) ✅
**File**: `frontend/src/screens/UserManagementScreen.jsx`

**Changes**:
- Added phone number field to "Add New User" modal
- Field positioned between email and password inputs
- Type: `tel` with placeholder `+256 700 000 000`
- Marked as optional in label
- Help text: "For SMS and WhatsApp notifications"
- Updated `newUser` state to include `phone: ''`
- Updated `handleAddUser` to include phone in registration payload
- Updated reset logic to clear phone field: `{ name: '', email: '', phone: '', password: '', role: 'user' }`

### 5. Frontend - Authentication Context ✅
**File**: `frontend/src/contexts/AuthContext.jsx`

**Changes**:
- Added `register()` function to handle user registration
- Function makes POST request to `/api/auth/register` with user data
- Automatically logs in user after successful registration
- Returns `{ success, token, user }` on success
- Throws error on failure for proper error handling
- Added `register` to exported context value

**Implementation**:
```javascript
const register = async (userData) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData), // Includes phone
    });
    
    const data = await response.json();
    if (data.token && data.user) {
        login(data.token, data.user); // Auto-login
    }
    return { success: true, token: data.token, user: data.user };
};
```

## Phone Number Format

### Supported Formats
- **International**: `+256700000000` (recommended)
- **With spaces**: `+256 700 000 000`
- **With dashes**: `+256-700-000-000`
- **With parentheses**: `+256 (700) 000-000`

### Validation Rules
- Must start with optional `+` followed by country code
- Must have 8-15 digits total (excluding formatting characters)
- Spaces, dashes, and parentheses are removed during validation
- Field is optional - users can skip it during registration

### Examples
✅ Valid:
- `+256700000000`
- `+256 700 000 000`
- `+1 (555) 123-4567`
- `+44 20 1234 5678`

❌ Invalid:
- `0700000000` (no country code)
- `+256` (too short)
- `abc123` (non-numeric)

## User Experience

### Registration Flow
1. User fills out registration form
2. Phone number field is visible between email and password
3. Field is optional - user can skip it
4. If provided, phone is validated for international format
5. On submit, phone is included in registration payload
6. Phone is stored in database for future notifications

### Admin Adding Users
1. Admin clicks "Add New User" button
2. Modal shows form with name, email, phone, password, role
3. Phone field is optional with helpful placeholder
4. Admin can assign user/staff/admin role
5. On submit, user is created with phone number

## Next Steps - Multi-Channel Notifications

### 1. SMS Integration (Pending)
**Recommended Service**: Twilio or Africa's Talking

**Setup Required**:
```javascript
// backend/services/smsService.js
const sendSMS = async (phoneNumber, message) => {
    // Use Twilio API
    // Or Africa's Talking API for better Uganda coverage
};
```

**Features to Implement**:
- Send pledge reminders via SMS
- Send payment confirmations via SMS
- Send overdue notifications via SMS
- SMS notification preferences in user settings

### 2. WhatsApp Integration (Pending)
**Recommended Approach**: WhatsApp Business API via Twilio

**Setup Required**:
```javascript
// backend/services/whatsappService.js
const sendWhatsApp = async (phoneNumber, message) => {
    // Use Twilio WhatsApp API
    // Requires WhatsApp Business approval
};
```

**Features to Implement**:
- Rich formatted messages with pledge details
- Payment links via WhatsApp
- Interactive buttons for quick responses
- WhatsApp notification preferences

### 3. Notification Preferences (Pending)
**User Settings Screen**:
```javascript
// Notification Preferences
{
    email: true,        // Email notifications
    sms: true,          // SMS notifications
    whatsapp: false,    // WhatsApp notifications
    reminderTime: '09:00',  // Preferred time
    frequency: 'daily'      // daily, weekly, monthly
}
```

### 4. Multi-Channel Reminder System (Pending)
**Enhanced Reminder Logic**:
```javascript
// backend/services/reminderService.js
const sendReminder = async (pledge) => {
    const user = pledge.user;
    
    // Email (existing)
    if (user.preferences.email) {
        await sendEmail(user.email, reminderMessage);
    }
    
    // SMS (new)
    if (user.preferences.sms && user.phone_number) {
        await sendSMS(user.phone_number, reminderMessage);
    }
    
    // WhatsApp (new)
    if (user.preferences.whatsapp && user.phone_number) {
        await sendWhatsApp(user.phone_number, reminderMessage);
    }
};
```

## Cost Considerations

### SMS Costs (Estimated)
- **Twilio**: ~$0.05/SMS in Uganda
- **Africa's Talking**: ~$0.02-0.04/SMS in Uganda
- **Monthly estimate**: 1000 reminders × $0.03 = $30/month

### WhatsApp Costs
- **Twilio WhatsApp**: ~$0.005-0.01/message
- **Monthly estimate**: 1000 messages × $0.007 = $7/month
- **Note**: Requires WhatsApp Business approval (1-2 weeks)

## Testing Checklist

### Registration with Phone ✅
- [x] Register new user with phone number
- [x] Register new user without phone number (optional)
- [x] Validate phone format during registration
- [x] Verify phone stored in database
- [x] Test international phone formats

### User Management ✅
- [x] Admin can add user with phone number
- [x] Admin can add user without phone number
- [x] Phone field appears in Add User modal
- [x] Phone validation works in admin panel

### Backend Updates ✅
- [x] Database migration adds phone_number column
- [x] User.create() accepts phone parameter
- [x] User.update() can update phone number
- [x] User.listAll() returns phone_number

### Pending Tests ⏳
- [ ] SMS notification delivery
- [ ] WhatsApp notification delivery
- [ ] Multi-channel notification preferences
- [ ] Cost tracking for SMS/WhatsApp
- [ ] Error handling for failed SMS/WhatsApp sends

## Configuration

### Environment Variables (To Add)
```bash
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Or Africa's Talking
AFRICAS_TALKING_API_KEY=your_api_key
AFRICAS_TALKING_USERNAME=your_username

# WhatsApp Configuration (Twilio)
TWILIO_WHATSAPP_NUMBER=whatsapp:+1234567890

# Notification Settings
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_WHATSAPP_NOTIFICATIONS=false
NOTIFICATION_RETRY_ATTEMPTS=3
```

## Files Modified

### Backend
1. ✅ `backend/scripts/add-phone-column.js` (new)
2. ✅ `backend/models/User.js` (updated)

### Frontend
1. ✅ `frontend/src/screens/RegisterScreen.jsx` (updated)
2. ✅ `frontend/src/screens/UserManagementScreen.jsx` (updated)
3. ✅ `frontend/src/contexts/AuthContext.jsx` (updated)

### Pending Files to Create
1. ⏳ `backend/services/smsService.js` (new)
2. ⏳ `backend/services/whatsappService.js` (new)
3. ⏳ `backend/routes/notificationRoutes.js` (new)
4. ⏳ `frontend/src/screens/NotificationSettingsScreen.jsx` (new)

## Summary

Phone number capture is now fully implemented and ready to use! Users can provide their phone numbers during registration, and admins can add phone numbers when creating new users. The database is ready, the forms are updated, and validation is in place.

**Current Status**: ✅ Phone Number Capture Complete
**Next Phase**: ⏳ SMS and WhatsApp Integration

The foundation is built - now we just need to integrate SMS and WhatsApp services to enable multi-channel notifications!

