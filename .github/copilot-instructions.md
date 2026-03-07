
# PledgeHub – AI Coding Agent Instructions

A pledge management system with AI automation, SMS/email reminders, OAuth integration, and comprehensive analytics. Built for Windows development with PowerShell tooling.

## Architecture Overview

### Backend (Node.js + Express + MySQL)
- **No ORM**: Raw SQL via `mysql2/promise` pool from `backend/config/db.js`
- **Service Layer**: All business logic in `backend/services/` (22+ services including AI, mobile money, chatbot, monetization)
  - Core: `aiService.js`, `emailService.js`, `smsService.js`, `reminderService.js`
  - Payments: `paymentTrackingService.js`, `paypalService.js`, `mobileMoneyService.js`, `mtnService.js`, `airtelService.js`
  - Advanced: `advancedAnalyticsService.js`, `chatbotService.js`, `monetizationService.js`, `securityService.js`
- **Models**: Thin wrappers in `backend/models/` (Pledge, User, Payment, Feedback, Campaign) - no Sequelize/TypeORM
- **Routes**: REST API under `/api` prefix. See `backend/routes/` (23 route files including WhatsApp, monetization, advanced analytics)
- **Auth**: Hybrid approach - JWT tokens (sessionless) + Passport.js for OAuth (Google/Facebook)
- **Middleware**: `authMiddleware.js` with role-based access (user/staff/admin), CSP headers, CORS for localhost
  - **Test Mode**: Set `NODE_ENV=test` or `ENABLE_TEST_MODE=true` to bypass auth (returns mock user)

### Frontend (React + Vite)
- **Dev server**: Port 5173, proxies `/api` → `http://localhost:5001`
- **State management**: React hooks, no Redux/Zustand
- **Routing**: React Router v7 with protected routes
- **API calls**: Direct `fetch`/`axios` to `/api`, JWT in `Authorization: Bearer {token}` header

### Database (MySQL)
- **Main table**: `pledges` (23 columns) - includes donor info, collection dates, reminders, payment tracking
- **Other tables**: `users`, `campaigns`, `payments`, `feedback`, `sessions`
- **Schema**: See `backend/scripts/complete-migration.js` for full DDL
- **Connection pool**: 10 connections, multi-statement support enabled

### AI Integration (Google Gemini Pro)
- **Model**: `gemini-1.0-pro` via `@google/generative-ai` SDK
- **Features**: Smart message generation, analytics insights, personalized reminders
- **Graceful degradation**: Always check `isAIAvailable()` before use, fallback to templates
- **Free tier**: No cost, get API key at https://makersuite.google.com/app/apikey

### Automation (node-cron)
- **Timezone**: Africa/Kampala (EAT) for all cron jobs
- **Schedules**: Daily reminders at 9AM & 5PM, balance reminders at 10AM
- **Service**: `cronScheduler.js` manages all jobs, verbose logging with emojis

## Key Patterns & Conventions

### Service Response Format (CRITICAL)
All service functions return: `{ success: boolean, data?: any, error?: string }`
```javascript
// Success
return { success: true, data: { pledges: [...] } };

// Error
return { success: false, error: 'Pledge not found' };
```

### Raw SQL Pattern
```javascript
const { pool } = require('../config/db');
const [rows] = await pool.execute(
  'SELECT * FROM pledges WHERE id = ? AND deleted = 0',
  [pledgeId]
);
```
- Always use `pool.execute()` with parameterized queries (never string concat)
- Models in `backend/models/` just wrap SQL, no magic methods
- Column names: snake_case in DB, camelCase in JS

### Authentication Flow
1. **JWT**: Routes use `authenticateToken` middleware, token in `req.user`
2. **OAuth**: Passport redirects to `/oauth/callback?token={jwt}&provider=google`
3. **Roles**: `requireAdmin` and `requireStaff` middleware chain after `authenticateToken`
4. **Test mode**: Set `NODE_ENV=test` to bypass auth (returns mock user)

### Security Patterns (securityService.js)
Multi-layered security implementation:
```javascript
// Rate limiting (4 tiers)
const rateLimiters = {
  auth: createRateLimiter(15 * 60 * 1000, 5),      // 5 per 15 min
  api: createRateLimiter(15 * 60 * 1000, 100),     // 100 per 15 min
  payment: createRateLimiter(60 * 60 * 1000, 10),  // 10 per hour
  public: createRateLimiter(15 * 60 * 1000, 200)   // 200 per 15 min
};

// Apply to routes
router.post('/login', rateLimiters.auth, authController.login);
router.post('/payment', authenticateToken, rateLimiters.payment, paymentController.create);
```
**Security Middleware Stack** (apply in this order):
1. `helmet()` - HTTP headers security (CSP, XSS, clickjacking)
2. `xss-clean` - XSS sanitization
3. `mongoSanitize` - NoSQL injection prevention (works for SQL too)
4. `hpp` - HTTP parameter pollution prevention
5. Rate limiting per endpoint type
6. CSRF token validation for state-changing operations

**IP Blocking**: `securityStore.blockedIPs` Set tracks malicious IPs, check before auth

### Message Generation (4 types × 3 tones = 12 templates)
```javascript
const msg = await messageGenerator.generateMessage({
  type: 'reminder',      // reminder, thankYou, followUp, confirmation
  tone: 'friendly',      // friendly/warm, professional/standard, urgent/firm
  subtype: '7_days',     // 7_days, 3_days, due_today, overdue
  pledgeId: 123,
  useAI: true,           // Optional: enhance with Gemini
  format: 'sms'          // sms (160 chars) or email
});
```
Templates in `messageGenerator.js`, AI enhancement via `aiService.js`

### Cron Jobs (Africa/Kampala timezone)
```javascript
cron.schedule('0 9 * * *', async () => {
  await reminderService.runDailyReminders();
}, { scheduled: true, timezone: "Africa/Kampala" });
```
All jobs initialized in `cronScheduler.js`, started on server boot

## Critical Files & Directories

### Backend Core
- `backend/server.js` - Express app, middleware, cron init, 251 lines
- `backend/config/db.js` - MySQL pool (10 connections)
- `backend/config/passport.js` - OAuth strategies (Google/Facebook)
- `backend/middleware/authMiddleware.js` - JWT + role-based auth (262 lines)

### Services (backend/services/)
Core services (22 files):
- **AI**: `aiService.js` (Gemini Pro, 387 lines), `aiServiceEnhanced.js`, `chatbotService.js`
- **Messaging**: `messageGenerator.js` (372 lines), `emailService.js`, `smsService.js`
- **Automation**: `cronScheduler.js` (157 lines), `advancedCronScheduler.js`, `reminderService.js`, `advancedReminderService.js`
- **Analytics**: `analyticsService.js` (562 lines), `advancedAnalyticsService.js`
- **Payments**: `paymentTrackingService.js`, `paypalService.js`, `mobileMoneyService.js`, `mtnService.js`, `airtelService.js`
- **Other**: `campaignService.js`, `feedbackService.js`, `monetizationService.js`, `securityService.js`, `mockUserService.js`

### Routes (backend/routes/)
All routes under `/api`, 23 route files:
- **Auth**: `auth.js`, `register.js`, `oauthRoutes.js`, `passwordRoutes.js`, `twoFactorRoutes.js`
- **Core**: `pledgeRoutes.js`, `campaignRoutes.js`, `userRoutes.js`, `feedbackRoutes.js`
- **AI/Messages**: `aiRoutes.js`, `messageRoutes.js`, `chatbotService.js` (future)
- **Analytics**: `analyticsRoutes.js`, `advancedAnalyticsRoutes.js`
- **Payments**: `paymentRoutes.js`, `simplePaymentRoutes.js`, `monetizationRoutes.js`
- **Notifications**: `reminderRoutes.js`, `notificationRoutes.js`, `whatsappRoutes.js`
- **Admin**: `adminFeedbackRoutes.js`

### Scripts (backend/scripts/)
- `complete-migration.js` - Add columns to pledges table (manual, 172 lines)
- `test-all-features.js` - Integration tests for all APIs (306 lines)

### Frontend (frontend/)
- `App.jsx` - React Router setup (55 lines)
- `vite.config.js` - Vite config with proxy to :5001
- `src/screens/` - All page components
- `NavBar.jsx` - Shared navigation

### Dev Scripts (scripts/ - PowerShell)
- `dev.ps1` - Start both servers in separate windows (105 lines)
- `dev-frontend.ps1` - Frontend only
- `dev-backend.ps1` - Backend only
- `init-db.ps1` - Database initialization
- `run-tests.ps1` - Test runner

## Essential Workflows

### First-Time Setup
```powershell
# 1. Copy environment files
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env

# 2. Edit backend\.env - REQUIRED variables:
#    DB_HOST, DB_USER, DB_PASS, DB_NAME
#    JWT_SECRET, SESSION_SECRET
#    GOOGLE_AI_API_KEY (for AI features)
#    SMTP_USER, SMTP_PASS (for email)
#    Optional: OAuth keys, Twilio creds

# 3. Install dependencies
cd backend; npm install; cd ..
cd frontend; npm install; cd ..

# 4. Initialize database
.\scripts\init-db.ps1

# 5. Run migrations
node backend\scripts\complete-migration.js

# 6. Start dev servers
.\scripts\dev.ps1
```

### Daily Development
```powershell
# Start both servers (separate windows)
.\scripts\dev.ps1

# Backend only (manual)
cd backend; npm run dev

# Frontend only (manual)
cd frontend; npm run dev

# Run integration tests
node backend\scripts\test-all-features.js

# Run unit tests
cd backend; npm test

# Run with coverage
cd backend; npm run coverage
```

### Database Changes
```powershell
# 1. Create timestamped migration script
# Example: backend\scripts\migration-20250115-add-status-column.js

# 2. Follow pattern from complete-migration.js:
const { pool } = require('../config/db');
await pool.execute('ALTER TABLE pledges ADD COLUMN status VARCHAR(50)');

# 3. Run migration
node backend\scripts\migration-20250115-add-status-column.js

# 4. Update Pledge model if needed (backend\models\Pledge.js)
# 5. Update integration tests (backend\scripts\test-all-features.js)
```

### Adding New Features

#### New API Endpoint
1. Add business logic to `backend/services/{feature}Service.js`
2. Create route in `backend/routes/{feature}Routes.js`
3. Register route in `backend/server.js`: `app.use('/api/{feature}', {feature}Routes);`
4. Add integration test to `backend/scripts/test-all-features.js`
5. Frontend: Add API call in `frontend/src/screens/{Feature}Screen.jsx`

#### New Service
```javascript
// backend/services/exampleService.js
const { pool } = require('../config/db');

async function getData(id) {
  try {
    const [rows] = await pool.execute('SELECT * FROM table WHERE id = ?', [id]);
    return { success: true, data: rows };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { getData };
```

#### New AI Feature
```javascript
const aiService = require('./aiService');

async function generateContent(prompt) {
  // Always check availability
  if (!aiService.isAIAvailable()) {
    return fallbackContent(); // Provide non-AI alternative
  }
  
  try {
    const result = await aiService.generateText(prompt);
    return result;
  } catch (error) {
    console.error('AI error:', error);
    return fallbackContent();
  }
}
```

#### New Cron Job
```javascript
// In backend/services/cronScheduler.js
const newJob = cron.schedule('0 12 * * *', async () => {
  console.log('⏰ Triggered: Noon job');
  await yourService.doWork();
}, {
  scheduled: false,
  timezone: "Africa/Kampala" // ALWAYS use this timezone
});

jobs.push({
  name: 'Noon Task',
  schedule: '12:00 PM daily',
  job: newJob
});
```

## Testing Patterns

### Integration Tests (backend/scripts/test-all-features.js)
**Purpose**: End-to-end testing of real API with actual database
```javascript
// Pattern: test() helper with try-catch and emoji logging
await test('Create Pledge (phone required)', async () => {
  const res = await axios.post(`${BASE_URL}/pledges`, pledgePayload, authHeaders());
  if (!res.data.success) throw new Error('Pledge creation failed');
  createdPledgeId = res.data.pledge.id;
});
```
**Setup sequence**:
1. Register test user (ignore error if exists)
2. Login to get JWT token
3. Promote user to admin via direct SQL
4. Run tests with `authHeaders()` helper
5. Track results: `{ passed: 0, failed: 0 }`

**Test coverage** (306 lines, 15+ features):
- Auth (register/login), Pledges (CRUD, phone validation)
- Campaigns, Analytics, AI (status, message generation)
- Reminders, Payments, Feedback

### Unit Tests (backend/tests/*.test.js)
**Framework**: Jest + Supertest + mocked models
```javascript
// Pattern: Mock models before requiring app
jest.mock('../models/pledgeModel', () => ({
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn()
}));

const Pledge = require('../models/pledgeModel');
const request = require('supertest');
const app = require('../server');

test('POST /pledges - success returns 201', async () => {
  Pledge.create.mockResolvedValue({ id: 10, title: 'Test' });
  const res = await request(app)
    .post('/pledges')
    .send({ title: 'Test', amount: 50 })
    .set('Authorization', `Bearer ${token}`);
  
  expect(res.status).toBe(201);
  expect(Pledge.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Test' }));
});
```
**Key patterns**:
- Use `testUtils.js` for common setup (test user creation)
- Mock database at model level, not SQL level
- Test validation errors (400), server errors (500), not found (404)
- Clear mocks after each test: `afterEach(() => jest.clearAllMocks())`

**Run commands**:
```bash
npm test                    # All tests
npm run test:coverage       # With coverage report
jest --runInBand            # Sequential (no parallel)
jest pledgeController.test  # Specific file
```

### Test User Credentials
```javascript
const TEST_USER = {
  name: 'Test User',
  username: 'testuser',
  phone: '+256771234567',
  email: 'testuser@example.com',
  password: 'testpass123',
  role: 'admin'  // Promoted via SQL in test setup
};
```

### Testing Mobile Money Integrations
**Sandbox mode** (default): Use test credentials, no real money transferred
```javascript
// Test MTN payment
const result = await mtnService.requestPayment(
  '256700000000',  // MTN sandbox test number
  1000,            // Small amount for testing
  `TEST-${Date.now()}`,
  'Test Payment'
);
expect(result.status).toBe('PENDING');

// Mock webhook callback
await request(app)
  .post('/api/payments/mtn/callback')
  .send({ transactionId: result.transactionId, status: 'SUCCESSFUL' });
```

## OAuth Integration Details

### Google OAuth Flow
1. User clicks "Sign in with Google" → `/api/oauth/google`
2. Passport redirects to Google consent screen
3. Google redirects to `/api/oauth/google/callback`
4. Backend creates/finds user by email, generates JWT
5. Redirects to frontend: `http://localhost:5173/auth/callback?token={jwt}&provider=google`
6. Frontend saves token, redirects to dashboard

### Facebook OAuth (same pattern)
- Routes: `/api/oauth/facebook` and `/api/oauth/facebook/callback`
- Env vars: `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `FACEBOOK_CALLBACK_URL`

### Email Conflict Handling
If OAuth email exists for different provider:
- Google user tries Facebook with same email → Links accounts
- Implemented in `passport.js` strategy callbacks

## African Mobile Money Integration (MTN, Airtel)

### Phone Number Normalization (CRITICAL)
All mobile money services require Uganda format `256XXXXXXXXX` (no + prefix):
```javascript
// ALWAYS normalize before API calls
let normalizedPhone = phoneNumber.replace(/\+/g, '');
if (normalizedPhone.startsWith('0')) {
  normalizedPhone = '256' + normalizedPhone.substring(1);
} else if (!normalizedPhone.startsWith('256')) {
  normalizedPhone = '256' + normalizedPhone;
}
```

### MTN Mobile Money (mtnService.js)
```javascript
const result = await mtnService.requestPayment(
  '256700123456',           // Phone (normalized)
  50000,                    // Amount in UGX
  'PLEDGE-123-UUID',        // External reference (UUID)
  'Pledge Payment',         // Message to payer
  'Omukwano Pledge Payment' // Merchant note
);
// Returns: { transactionId, status, referenceId }

// Check payment status
const status = await mtnService.getTransactionStatus(transactionId);
```

### Airtel Money (airtelService.js)
```javascript
const result = await airtelService.requestPayment(
  '256750123456',      // Phone (normalized)
  50000,               // Amount in UGX
  'PLEDGE-123',        // Reference
  'Pledge Payment'     // Description
);
```

### Unified Mobile Money API (mobileMoneyService.js)
Simple abstraction layer:
```javascript
const result = await mobileMoneyService.processPayment({
  provider: 'mtn',    // or 'airtel'
  phoneNumber: '+256700123456',
  amount: 50000,
  reference: 'PLEDGE-123',
  pledgeId: 123
});
// Handles: provider detection, normalization, encryption, reconciliation
```

**Sandbox vs Production**: Set via `MTN_ENVIRONMENT` and `AIRTEL_ENVIRONMENT` env vars

**Payment Flow**:
1. User initiates payment → Backend calls `requestPayment()`
2. User receives USSD prompt on phone
3. User enters PIN
4. Provider calls webhook at `/api/payments/{mtn|airtel}/callback`
5. Backend updates pledge status, sends confirmation

**Error Handling**: Always provide fallback for unconfigured providers:
```javascript
if (!MTN_SUBSCRIPTION_KEY) {
  return { success: false, error: 'MTN not configured', fallback: 'bank' };
}
```

## Environment Variables (.env)

### Required (Backend)
```bash
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=pledgehub_db
JWT_SECRET=change_in_production
SESSION_SECRET=change_in_production
```

### Optional (Features)
```bash
# AI (Gemini Pro)
GOOGLE_AI_API_KEY=your_key_here

# Email (Gmail SMTP)
SMTP_USER=your@gmail.com
SMTP_PASS=app_password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1234567890

# OAuth (Google)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:5001/api/oauth/google/callback

# OAuth (Facebook)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/oauth/facebook/callback

# MTN Mobile Money
MTN_SUBSCRIPTION_KEY=...
MTN_COLLECTION_USER_ID=...
MTN_COLLECTION_API_KEY=...
MTN_ENVIRONMENT=sandbox  # or production
MTN_CALLBACK_URL=http://localhost:5001/api/payments/mtn/callback

# Airtel Money
AIRTEL_CLIENT_ID=...
AIRTEL_CLIENT_SECRET=...
AIRTEL_MERCHANT_ID=...
AIRTEL_ENVIRONMENT=sandbox  # or production
AIRTEL_CALLBACK_URL=http://localhost:5001/api/payments/airtel/callback

# Security
ENCRYPTION_KEY=...  # 32-byte hex for payment data encryption
```

## Monetization & Subscription System

**Service**: `monetizationService.js` manages tiered subscriptions and usage limits

### Pricing Tiers (defined in `config/monetization.js`)
```javascript
const PRICING_TIERS = {
  free: { pledges: 50, campaigns: 2, sms: 0, emails: 100, ai: 10 },
  basic: { pledges: 500, campaigns: 10, sms: 100, emails: 1000, ai: 100, price: 5 },
  pro: { pledges: 5000, campaigns: 50, sms: 1000, emails: 10000, ai: 1000, price: 20 },
  enterprise: { pledges: -1, campaigns: -1, sms: -1, emails: -1, ai: -1, price: 100 } // unlimited
};
```

### Usage Tracking Pattern
```javascript
// Before action, check limits
const check = await monetizationService.canPerformAction(userId, 'create_pledge');
if (!check.allowed) {
  return res.status(403).json({
    error: check.reason,
    upgrade: { current: check.currentTier, suggested: check.suggestedTier }
  });
}

// After action, increment usage
await monetizationService.incrementUsage(userId, 'pledges_count');
```

**Usage stats table**: Tracks monthly usage per user (pledges_count, campaigns_count, sms_sent, emails_sent, ai_requests)

**Transaction fees**: `TRANSACTION_FEE = 0.029` (2.9% for payment processing)

## AI Chatbot Integration

**Service**: `chatbotService.js` - Gemini-powered conversational assistant (622 lines)

### Multilingual Support
```javascript
const LANGUAGES = {
  en: 'English',
  lg: 'Luganda',      // Native Ugandan language
  rny: 'Runyankole',  // Western Uganda
  ateso: 'Ateso'      // Eastern Uganda
};
```

### Conversation States (State Machine)
```javascript
const STATES = {
  INITIAL: 'initial',
  AWAITING_PLEDGE_ID: 'awaiting_pledge_id',
  AWAITING_PHONE: 'awaiting_phone',
  AWAITING_AMOUNT: 'awaiting_amount',
  AWAITING_CONFIRMATION: 'awaiting_confirmation'
};

// Context stored in-memory Map (use Redis in production)
const conversationContexts = new Map();
```

### Processing Messages
```javascript
const response = await chatbotService.processMessage(
  userId,
  'I want to pay my pledge',  // User message
  'whatsapp'                   // Channel: whatsapp, sms, web
);

// Returns:
{
  success: true,
  response: 'Please provide your pledge ID',
  language: 'en',
  actions: ['send_sms', 'initiate_payment']  // Optional automated actions
}
```

### WhatsApp Integration (via Twilio)
- Webhook: `/api/whatsapp/incoming` receives messages
- Chatbot detects intent (payment, inquiry, status check)
- Responds in user's language
- Can initiate mobile money payments

**Intent Detection**: Uses Gemini AI to understand user queries:
- Payment intent → Guides through mobile money flow
- Inquiry intent → Fetches pledge details
- Help intent → Provides instructions

**Graceful degradation**: Falls back to keyword matching if AI unavailable

## Troubleshooting Quick Reference

### Check AI Status
```bash
curl http://localhost:5001/api/ai/status
# Should return: { available: true, model: "gemini-1.0-pro" }
```

### Test All Features
```bash
node backend\scripts\test-all-features.js
# Tests auth, pledges, AI, analytics, reminders, campaigns
```

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check credentials in `backend\.env`
- Test connection: `node backend\config\db.js` (will log success/error)

### OAuth Not Working
- Check callback URLs match Google/Facebook console settings
- Ensure `SESSION_SECRET` is set
- Frontend must handle `/auth/callback` route (see `OAuthCallbackScreen.jsx`)

### Cron Jobs Not Firing
- Check timezone: All jobs use "Africa/Kampala"
- Verify jobs started: Check console for "✓ Started X cron jobs"
- Manual trigger: Import service and call function directly

### Port Conflicts
- Backend: Default 5001, change via `PORT` env var
- Frontend: Default 5173, change in `vite.config.js`

### Mobile Money Not Working
- **Sandbox mode**: Ensure `MTN_ENVIRONMENT=sandbox` and `AIRTEL_ENVIRONMENT=sandbox`
- **Phone format**: Must be `256XXXXXXXXX` (no + or 0 prefix)
- **Check credentials**: Run `node backend/services/mtnService.js` (logs initialization status)
- **Webhook not called**: Expose local server with ngrok, update callback URL in env
- **Token expired**: Tokens auto-refresh, but check `getAccessToken()` function

### Chatbot Not Responding
- Check AI status: `curl http://localhost:5001/api/ai/status`
- WhatsApp webhook: Verify Twilio configuration and webhook URL
- Context lost: Conversation contexts expire after 1 hour (by design)
- Language detection failing: Defaults to English, check `detectLanguage()` function

### Security/Rate Limiting Issues
- Rate limited: Check `securityStore.blockedIPs` Set
- IP falsely blocked: Clear with `securityService.unblockIP(ip)`
- CSRF token invalid: Ensure frontend sends token in `X-CSRF-Token` header
- Bypass for testing: Set `DISABLE_RATE_LIMIT=true` in .env (NOT for production)

## Documentation Links
- Full API docs: `docs/API_DOCUMENTATION.md`
- Deployment guide: `docs/DEPLOYMENT_GUIDE.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
- AI customization: `docs/AI_PROMPT_CUSTOMIZATION_GUIDE.md`
- AI chatbot: `docs/AI_CHATBOT_PLACEMENT_STRATEGY.md`
- Features overview: `docs/FEATURES_OVERVIEW.md`
- Accessibility guide: `docs/ACCESSIBILITY_GUIDE.md`

## Project Priorities
1. **Manual migrations** - No automatic schema changes, create scripts in `backend/scripts/`
2. **Comprehensive testing** - Integration tests for every feature
3. **Graceful AI fallbacks** - Never fail if AI unavailable, provide templates
4. **Windows-first tooling** - PowerShell scripts, dev.ps1 for multi-window launch
5. **Timezone consistency** - Africa/Kampala for all cron jobs
6. **Security** - JWT tokens, parameterized queries, CSP headers, role-based access

## QuickBooks-Style Accounting Integration

**Vision**: Transform PledgeHub into a comprehensive financial management system with double-entry bookkeeping, financial reports, and automated accounting.

### Core Accounting Features to Implement

#### 1. Chart of Accounts (COA)
```javascript
// backend/models/Account.js - Account structure
const ACCOUNT_TYPES = {
  ASSET: { normal_balance: 'debit', category: 'Balance Sheet' },
  LIABILITY: { normal_balance: 'credit', category: 'Balance Sheet' },
  EQUITY: { normal_balance: 'credit', category: 'Balance Sheet' },
  REVENUE: { normal_balance: 'credit', category: 'Income Statement' },
  EXPENSE: { normal_balance: 'debit', category: 'Income Statement' }
};

// Standard accounts for pledge management
const DEFAULT_ACCOUNTS = {
  1000: { code: '1000', name: 'Cash', type: 'ASSET' },
  1100: { code: '1100', name: 'Mobile Money', type: 'ASSET' },
  1200: { code: '1200', name: 'Pledges Receivable', type: 'ASSET' },
  2000: { code: '2000', name: 'Unearned Revenue', type: 'LIABILITY' },
  3000: { code: '3000', name: 'Retained Earnings', type: 'EQUITY' },
  4000: { code: '4000', name: 'Pledge Income', type: 'REVENUE' },
  5000: { code: '5000', name: 'Operating Expenses', type: 'EXPENSE' }
};
```

#### 2. Double-Entry Bookkeeping
```javascript
// backend/services/accountingService.js
async function createJournalEntry(entry) {
  // Validate: debits must equal credits
  const debits = entry.lines.filter(l => l.type === 'debit')
    .reduce((sum, l) => sum + l.amount, 0);
  const credits = entry.lines.filter(l => l.type === 'credit')
    .reduce((sum, l) => sum + l.amount, 0);
  
  if (Math.abs(debits - credits) > 0.01) {
    return { success: false, error: 'Debits must equal credits' };
  }

  // Record entry with transaction isolation
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Insert journal entry header
    const [result] = await connection.execute(
      'INSERT INTO journal_entries (date, description, reference, created_by) VALUES (?, ?, ?, ?)',
      [entry.date, entry.description, entry.reference, entry.userId]
    );
    const entryId = result.insertId;
    
    // Insert journal entry lines
    for (const line of entry.lines) {
      await connection.execute(
        'INSERT INTO journal_entry_lines (entry_id, account_id, debit, credit, description) VALUES (?, ?, ?, ?, ?)',
        [entryId, line.accountId, 
         line.type === 'debit' ? line.amount : 0,
         line.type === 'credit' ? line.amount : 0,
         line.description]
      );
    }
    
    await connection.commit();
    return { success: true, data: { entryId } };
  } catch (error) {
    await connection.rollback();
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}
```

#### 3. Automated Pledge-to-Accounting Integration
```javascript
// backend/services/pledgeAccountingService.js
// Hook into existing paymentTrackingService

async function recordPledgePayment(pledgeId, amount, paymentMethod, userId) {
  // Call existing payment tracking
  const paymentResult = await paymentTrackingService.recordPayment(
    pledgeId, amount, paymentMethod, userId
  );
  
  // Create corresponding journal entry
  const accountMap = {
    'mtn': 1100,    // Mobile Money
    'airtel': 1100,  // Mobile Money
    'cash': 1000,    // Cash
    'bank': 1050     // Bank Account
  };
  
  const entry = {
    date: new Date(),
    description: `Payment for Pledge #${pledgeId}`,
    reference: `PLG-${pledgeId}-PMT`,
    userId: userId,
    lines: [
      { accountId: accountMap[paymentMethod] || 1000, type: 'debit', amount, description: 'Cash received' },
      { accountId: 1200, type: 'credit', amount, description: 'Reduce receivable' }
    ]
  };
  
  await accountingService.createJournalEntry(entry);
  return paymentResult;
}

// Hook into pledge creation
async function recordNewPledge(pledgeId, amount, userId) {
  const entry = {
    date: new Date(),
    description: `New Pledge #${pledgeId} created`,
    reference: `PLG-${pledgeId}-NEW`,
    userId: userId,
    lines: [
      { accountId: 1200, type: 'debit', amount, description: 'Pledge receivable' },
      { accountId: 2000, type: 'credit', amount, description: 'Unearned revenue' }
    ]
  };
  
  await accountingService.createJournalEntry(entry);
}
```

#### 4. Financial Reports
```javascript
// backend/services/financialReportsService.js

// Balance Sheet
async function generateBalanceSheet(asOfDate = new Date()) {
  const accounts = await getAccountBalances(asOfDate);
  
  return {
    assets: accounts.filter(a => a.type === 'ASSET'),
    liabilities: accounts.filter(a => a.type === 'LIABILITY'),
    equity: accounts.filter(a => a.type === 'EQUITY'),
    totalAssets: sumAccounts(accounts, 'ASSET'),
    totalLiabilities: sumAccounts(accounts, 'LIABILITY'),
    totalEquity: sumAccounts(accounts, 'EQUITY')
  };
}

// Income Statement (Profit & Loss)
async function generateIncomeStatement(startDate, endDate) {
  const [revenues] = await pool.execute(`
    SELECT a.code, a.name, 
           SUM(l.credit - l.debit) as amount
    FROM journal_entry_lines l
    JOIN journal_entries e ON l.entry_id = e.id
    JOIN accounts a ON l.account_id = a.id
    WHERE a.type = 'REVENUE'
      AND e.date BETWEEN ? AND ?
    GROUP BY a.id
  `, [startDate, endDate]);
  
  const [expenses] = await pool.execute(`
    SELECT a.code, a.name, 
           SUM(l.debit - l.credit) as amount
    FROM journal_entry_lines l
    JOIN journal_entries e ON l.entry_id = e.id
    JOIN accounts a ON l.account_id = a.id
    WHERE a.type = 'EXPENSE'
      AND e.date BETWEEN ? AND ?
    GROUP BY a.id
  `, [startDate, endDate]);
  
  const totalRevenue = revenues.reduce((sum, r) => sum + parseFloat(r.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  
  return {
    revenues,
    expenses,
    totalRevenue,
    totalExpenses,
    netIncome: totalRevenue - totalExpenses
  };
}

// Cash Flow Statement
async function generateCashFlowStatement(startDate, endDate) {
  // Operating, Investing, Financing activities
  // Track cash account movements
}
```

#### 5. Database Schema Extensions
```sql
-- Chart of Accounts
CREATE TABLE accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
  parent_id INT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES accounts(id)
);

-- Journal Entries (header)
CREATE TABLE journal_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_number VARCHAR(50) UNIQUE,
  date DATE NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Journal Entry Lines (detail)
CREATE TABLE journal_entry_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_id INT NOT NULL,
  account_id INT NOT NULL,
  debit DECIMAL(15, 2) DEFAULT 0,
  credit DECIMAL(15, 2) DEFAULT 0,
  description TEXT,
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- General Ledger View
CREATE VIEW general_ledger AS
SELECT 
  e.date,
  e.entry_number,
  a.code as account_code,
  a.name as account_name,
  a.type as account_type,
  l.debit,
  l.credit,
  l.description,
  e.reference
FROM journal_entry_lines l
JOIN journal_entries e ON l.entry_id = e.id
JOIN accounts a ON l.account_id = a.id
ORDER BY e.date, e.id, l.id;
```

### Implementation Roadmap

**Phase 1: Foundation (Week 1-2)**
- [ ] Create database schema (accounts, journal_entries, journal_entry_lines)
- [ ] Implement `accountingService.js` with double-entry validation
- [ ] Create `Account.js` model with COA management
- [ ] Seed default accounts for pledge management

**Phase 2: Integration (Week 3-4)**
- [ ] Hook accounting into existing payment tracking
- [ ] Modify pledge creation to generate receivable entries
- [ ] Update payment recording to post journal entries
- [ ] Add reconciliation utilities

**Phase 3: Reporting (Week 5-6)**
- [ ] Implement `financialReportsService.js`
- [ ] Create Balance Sheet report
- [ ] Create Income Statement (P&L) report
- [ ] Create Cash Flow Statement
- [ ] Add Trial Balance report

**Phase 4: UI & Analytics (Week 7-8)**
- [ ] Build Chart of Accounts management screen
- [ ] Create Journal Entry screen
- [ ] Build financial dashboard with reports
- [ ] Add drill-down capabilities (account → transactions)
- [ ] Export reports to PDF/Excel

**Phase 5: Advanced Features (Week 9+)**
- [ ] Bank reconciliation module
- [ ] Budgeting and forecasting
- [ ] Multi-currency support
- [ ] Audit trail and compliance reports
- [ ] Integration with actual QuickBooks API (optional)

### Key Patterns for Accounting Features

**Transaction Integrity**: Always use database transactions
```javascript
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  // Multiple related operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

**Decimal Precision**: Use DECIMAL(15,2) for all monetary amounts
```javascript
// Never use JavaScript floating point for money
const amount = parseFloat('10.10'); // ❌ Can cause rounding errors
// Use database DECIMAL and validate
if (Math.abs(debits - credits) > 0.01) { /* error */ }
```

**Audit Trail**: Every financial transaction must be traceable
```javascript
// Include: who, what, when, why, reference
{
  created_by: userId,
  created_at: timestamp,
  description: 'Clear description',
  reference: 'Unique identifier',
  original_entry_id: parentId // For adjustments
}
```

**Voiding vs Deleting**: Never delete posted entries, void with reversal
```javascript
async function voidJournalEntry(entryId, reason, userId) {
  // Mark original as void
  await pool.execute('UPDATE journal_entries SET status = ? WHERE id = ?', ['void', entryId]);
  
  // Create reversal entry (swap debits/credits)
  const [lines] = await pool.execute('SELECT * FROM journal_entry_lines WHERE entry_id = ?', [entryId]);
  const reversalLines = lines.map(l => ({
    accountId: l.account_id,
    debit: l.credit,  // Swap
    credit: l.debit,  // Swap
    description: `Void: ${l.description}`
  }));
  
  await createJournalEntry({
    date: new Date(),
    description: `VOID: ${reason}`,
    reference: `VOID-${entryId}`,
    userId,
    lines: reversalLines
  });
}
```

## Quick Checklist for New Features
- [ ] Business logic in `backend/services/{feature}Service.js` with `{ success, data?, error? }` pattern
- [ ] Raw SQL via `pool.execute()` with parameterized queries (never string concat)
- [ ] Route in `backend/routes/{feature}Routes.js` with appropriate middleware (`authenticateToken`, `requireAdmin`, `requireStaff`)
- [ ] Apply security middleware: rate limiter (choose tier), `helmet`, `xss-clean`, CSRF validation
- [ ] Register route in `backend/server.js`: `app.use('/api/{feature}', {feature}Routes);`
- [ ] Integration test in `backend/scripts/test-all-features.js` (axios + real API)
- [ ] Unit test in `backend/tests/{feature}.test.js` (Jest + mocked models)
- [ ] Frontend component in `frontend/src/screens/{Feature}Screen.jsx`
- [ ] AI features: Check `aiService.isAIAvailable()` and provide fallback
- [ ] Cron jobs: Use Africa/Kampala timezone in `cronScheduler.js`
- [ ] Payment features: Normalize phone numbers (`256XXXXXXXXX`), handle sandbox mode
- [ ] Monetization: Check user limits with `canPerformAction()`, increment usage after action
- [ ] Accounting features: Use transactions, DECIMAL precision, maintain audit trail, void (don't delete)
- [ ] Update `.env.example` with new environment variables

**Last Updated**: December 2025 | Update this file as architecture evolves

