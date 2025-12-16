# Payment Integration & Security Guide

**PledgeHub - Comprehensive Payment and Security System**

Last Updated: January 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Payment Integration](#payment-integration)
3. [Security Architecture](#security-architecture)
4. [Elder-Friendly Design](#elder-friendly-design)
5. [Setup Instructions](#setup-instructions)
6. [Testing Guide](#testing-guide)
7. [Troubleshooting](#troubleshooting)

---

## Overview

PledgeHub now features a production-grade payment and security system designed for:
- **Accessibility**: Elderly users can pay via USSD, SMS, or simple web interface
- **Security**: 10+ protective layers against common attacks
- **Flexibility**: MTN, Airtel, Flutterwave, and PayPal integration
- **Reliability**: Auto-detection, fallback options, comprehensive error handling

### Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     PledgeHub Platform                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web Browser │  │   USSD Dial  │  │  SMS Message │      │
│  │  (React UI)  │  │  *165# MTN   │  │  "PAY 123"   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            ↓                                 │
│         ┌──────────────────────────────────┐                │
│         │   Security Middleware Chain      │                │
│         │  • Rate Limiting (4 tiers)       │                │
│         │  • SQL Injection Prevention      │                │
│         │  • XSS Protection                │                │
│         │  • CSRF Tokens                   │                │
│         │  • IP Blocking                   │                │
│         │  • Intrusion Detection           │                │
│         └──────────────┬───────────────────┘                │
│                        ↓                                     │
│         ┌──────────────────────────────────┐                │
│         │  Simple Payment Routes           │                │
│         │  /api/simple-payment/*           │                │
│         │  • USSD instructions             │                │
│         │  • Payment initiation            │                │
│         │  • Status checking               │                │
│         │  • SMS payment                   │                │
│         │  • Help endpoint                 │                │
│         └──────────────┬───────────────────┘                │
│                        ↓                                     │
│         ┌──────────────────────────────────┐                │
│         │  Mobile Money Service            │                │
│         │  • Auto-detect provider          │                │
│         │  • MTN/Airtel APIs               │                │
│         │  • Transaction tracking          │                │
│         │  • Status polling                │                │
│         └──────────────┬───────────────────┘                │
│                        ↓                                     │
│    ┌─────────┬─────────┴─────────┬─────────────────┐       │
│    ↓         ↓                    ↓                  ↓       │
│  ┌────┐  ┌────────┐        ┌────────┐        ┌──────────┐  │
│  │MTN │  │ Airtel │        │Flutter │        │ PayPal   │  │
│  │API │  │  API   │        │ wave   │        │ API      │  │
│  └────┘  └────────┘        └────────┘        └──────────┘  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Payment Integration

### 1. Mobile Money (MTN & Airtel)

#### Auto-Detection System

The system automatically detects which provider to use based on phone number prefix:

| Provider | Prefixes | USSD Code | API Endpoint |
|----------|----------|-----------|--------------|
| MTN      | 077, 078 | *165#     | https://sandbox.momodeveloper.mtn.com |
| Airtel   | 070, 075 | *185#     | https://openapiuat.airtel.africa |

#### Payment Flow

```javascript
// 1. User initiates payment
POST /api/simple-payment/start
{
  "pledgeId": 123,
  "phoneNumber": "256772345678",
  "amount": 50000
}

// 2. System auto-detects MTN from 077 prefix
// 3. Generates transaction reference: PLEDGE-123-uuid
// 4. Returns simple instructions:
{
  "success": true,
  "reference": "PLEDGE-123-abc-def-123",
  "nextSteps": [
    "Dial *165# on your MTN phone",
    "Select 'My Wallet'",
    "Select 'My Approvals'",
    "Approve payment of UGX 50,000",
    "Enter your PIN"
  ],
  "helpline": "0800-753343",
  "statusCheckUrl": "/api/simple-payment/status/PLEDGE-123-abc-def-123"
}

// 5. User follows steps on their phone
// 6. System polls MTN API for status
// 7. Updates pledge automatically on success
```

#### MTN Mobile Money Integration

**Required Credentials** (from https://momodeveloper.mtn.com):
- `MTN_SUBSCRIPTION_KEY`: Primary subscription key from MTN Developer Portal
- `MTN_API_USER`: UUID v4 generated for your app
- `MTN_API_KEY`: API key generated via /v1_0/apiuser endpoint
- `MTN_MERCHANT_CODE`: Your merchant identifier

**API Endpoints Used**:
```
POST /collection/v1_0/requesttopay      # Initiate payment
GET  /collection/v1_0/requesttopay/{ref} # Check status
POST /collection/token/                  # Get OAuth token
```

**Code Location**: `backend/services/mobileMoneyService.js` → `requestMTNPayment()`

#### Airtel Money Integration

**Required Credentials** (from https://developers.airtel.africa):
- `AIRTEL_CLIENT_ID`: Client ID from Airtel Developer Portal
- `AIRTEL_CLIENT_SECRET`: Client secret from portal
- `AIRTEL_MERCHANT_CODE`: Your merchant identifier

**API Endpoints Used**:
```
POST /auth/oauth2/token                      # Get OAuth token
POST /merchant/v1/payments/                  # Initiate payment
GET  /standard/v1/payments/{transactionId}   # Check status
```

**Code Location**: `backend/services/mobileMoneyService.js` → `requestAirtelPayment()`

### 2. Additional Payment Options

#### Flutterwave (Cards, Mobile Money, Bank Transfer)

Flutterwave provides a unified API for multiple payment methods across Africa:

**Setup Steps**:
1. Sign up at https://flutterwave.com
2. Get API keys from Dashboard → Settings → API
3. Add to `.env`:
   ```bash
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK-xxx
   FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
   FLUTTERWAVE_ENCRYPTION_KEY=FLWSECK_TESTxxx
   ```

**Implementation** (create `backend/services/flutterwaveService.js`):
```javascript
const axios = require('axios');

async function initiatePayment(data) {
  try {
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      {
        tx_ref: `PLEDGE-${data.pledgeId}-${Date.now()}`,
        amount: data.amount,
        currency: 'UGX',
        payment_options: 'card,mobilemoneyuganda,ussd',
        customer: {
          email: data.email,
          phonenumber: data.phoneNumber,
          name: data.name
        },
        customizations: {
          title: 'PledgeHub Payment',
          description: `Payment for Pledge #${data.pledgeId}`,
          logo: 'https://yoursite.com/logo.png'
        },
        redirect_url: `${process.env.BACKEND_URL}/api/payments/flutterwave/callback`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
        }
      }
    );

    return {
      success: true,
      paymentUrl: response.data.data.link,
      reference: response.data.data.tx_ref
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { initiatePayment };
```

#### PayPal (International Donations)

For international donors and credit card payments:

**Setup Steps**:
1. Create business account at https://developer.paypal.com
2. Get credentials from Dashboard → REST API apps
3. Add to `.env`:
   ```bash
   PAYPAL_CLIENT_ID=xxx
   PAYPAL_CLIENT_SECRET=xxx
   PAYPAL_MODE=sandbox  # or 'live'
   ```

**Implementation** (create `backend/services/paypalService.js`):
```javascript
const paypal = require('@paypal/checkout-server-sdk');

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  
  return process.env.PAYPAL_MODE === 'live'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function client() {
  return new paypal.core.PayPalHttpClient(environment());
}

async function createOrder(data) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: `PLEDGE-${data.pledgeId}`,
      amount: {
        currency_code: 'USD',
        value: data.amount
      },
      description: `Pledge #${data.pledgeId} - ${data.description}`
    }],
    application_context: {
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
    }
  });

  try {
    const order = await client().execute(request);
    return {
      success: true,
      orderId: order.result.id,
      approvalUrl: order.result.links.find(link => link.rel === 'approve').href
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { createOrder };
```

### 3. Payment Service Architecture

**File**: `backend/services/mobileMoneyService.js` (570 lines)

**Key Functions**:

```javascript
// Unified payment initiation
async function initiatePayment(pledgeId, phoneNumber, amount)

// Check payment status across providers
async function checkPaymentStatus(reference, provider)

// Provider-specific implementations
async function requestMTNPayment(phoneNumber, amount, reference)
async function requestAirtelPayment(phoneNumber, amount, reference)

// Utility functions
function detectProvider(phoneNumber)        // Auto-detect MTN vs Airtel
function generateUSSDInstructions(provider) // Generate USSD steps
function validatePhoneNumber(phoneNumber)   // Validate Uganda format
function encryptData(data)                  // Encrypt sensitive data
```

**Data Encryption**:
```javascript
// Uses AES-256-CBC encryption for sensitive data
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

function encryptData(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
```

---

## Security Architecture

### Security Layers (10+ Protective Measures)

**File**: `backend/services/securityService.js` (520 lines)

```
Request → [Layer 1] → [Layer 2] → ... → [Layer 10] → Application
           ↓ Blocked if threat detected
```

#### Layer 1: Helmet (Secure HTTP Headers)

```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

**Headers Set**:
- `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
- `X-Frame-Options: DENY` (prevent clickjacking)
- `Strict-Transport-Security` (enforce HTTPS)
- `Content-Security-Policy` (prevent XSS)
- `Referrer-Policy: no-referrer` (privacy)

#### Layer 2: Rate Limiting (4 Tiers)

| Tier | Endpoints | Limit | Window | Purpose |
|------|-----------|-------|--------|---------|
| **Auth** | `/api/auth/*` | 5 requests | 15 minutes | Prevent brute force |
| **Payment** | `/api/payments/*`, `/api/simple-payment/*` | 10 requests | 1 hour | Prevent payment abuse |
| **API** | `/api/*` | 100 requests | 15 minutes | Prevent API abuse |
| **Public** | All routes | 200 requests | 15 minutes | Prevent DDoS |

**Configuration**:
```javascript
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per window
  message: 'Too many login attempts. Please try again in 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logSecurityEvent('rate_limit_exceeded', req);
    res.status(429).json({
      success: false,
      error: 'Too many attempts. Please wait 15 minutes.'
    });
  }
});
```

#### Layer 3: SQL Injection Prevention

**Detection Patterns**:
```javascript
const sqlPatterns = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
  /(--|\#|\/\*|\*\/)/,                    // SQL comments
  /(\bOR\b|\bAND\b).*=.*=/i,              // OR 1=1
  /(\'|\").*(\bOR\b|\bAND\b)/i,           // ' OR '1'='1
  /;.*(\bDROP\b|\bDELETE\b)/i            // ; DROP TABLE
];
```

**Middleware**:
```javascript
function preventSQLInjection(req, res, next) {
  const inputs = [
    ...Object.values(req.body || {}),
    ...Object.values(req.query || {}),
    ...Object.values(req.params || {})
  ];

  for (const input of inputs) {
    if (typeof input === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(input)) {
          logSecurityEvent('sql_injection_attempt', req, { input });
          return res.status(400).json({
            success: false,
            error: 'Invalid input detected'
          });
        }
      }
    }
  }
  next();
}
```

#### Layer 4: XSS Protection

**Detection Patterns**:
```javascript
const xssPatterns = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,  // onclick, onload, etc.
  /<img[^>]+src[^>]*>/gi
];
```

**Libraries Used**:
- `xss-clean`: Sanitizes user input
- Custom pattern matching for additional protection

#### Layer 5: CSRF Protection

**Token System**:
```javascript
// Generate token
function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now() + 3600000); // 1 hour expiry
  return token;
}

// Validate token
function validateCSRFToken(token) {
  if (!csrfTokens.has(token)) return false;
  
  const expiry = csrfTokens.get(token);
  if (Date.now() > expiry) {
    csrfTokens.delete(token);
    return false;
  }
  
  return true;
}
```

**Usage**:
```javascript
// Generate token for form
GET /api/csrf-token → { token: 'abc123...' }

// Validate on submission
POST /api/payments
Headers: { 'X-CSRF-Token': 'abc123...' }
```

#### Layer 6: IP Blocking System

**Auto-Block Logic**:
```javascript
// Track suspicious activity per IP
suspiciousActivity.set(ip, {
  count: (activity?.count || 0) + 1,
  lastActivity: Date.now()
});

// Block after 5 violations in 1 hour
if (activity.count >= 5) {
  blockedIPs.set(ip, {
    reason: 'Multiple suspicious activities',
    blockedAt: Date.now(),
    autoUnblockAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  });
}
```

**Manual Control**:
```javascript
// Block IP
POST /api/security/block-ip
{ "ip": "192.168.1.100", "reason": "Manual block" }

// Unblock IP
POST /api/security/unblock-ip
{ "ip": "192.168.1.100" }

// Check if blocked
function isIPBlocked(ip) {
  const block = blockedIPs.get(ip);
  if (!block) return false;
  
  // Auto-unblock after 24 hours
  if (Date.now() > block.autoUnblockAt) {
    blockedIPs.delete(ip);
    return false;
  }
  
  return true;
}
```

#### Layer 7: Intrusion Detection

**Detected Patterns**:
```javascript
const intrusionPatterns = [
  /\.\.[\/\\]/g,                    // Path traversal (../)
  /;.*\|.*&/g,                      // Command injection
  /(\$\{.*\}|\$\(.*\))/g,           // Command substitution
  /\b(\.\.\/){2,}/g,                // Directory traversal
  /(\/etc\/passwd|\/etc\/shadow)/gi, // System file access
  /\b(eval|exec|system|passthru)\b/gi, // Code execution
  /(file:\/\/|php:\/\/)/gi,         // File inclusion
  /(\bldap\b.*\(|\bldap_)/gi        // LDAP injection
];
```

**Bot/Scanner Detection**:
```javascript
const botSignatures = [
  'sqlmap', 'nikto', 'nmap', 'masscan',
  'burpsuite', 'metasploit', 'havij', 'acunetix'
];

function detectBot(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  return botSignatures.some(sig => ua.includes(sig));
}
```

#### Layer 8: Failed Login Tracking

**Auto-Lock System**:
```javascript
// Track failed attempts
failedLogins.set(identifier, {
  count: (attempts?.count || 0) + 1,
  lastAttempt: Date.now()
});

// Lock after 5 failures
if (attempts.count >= 5) {
  return {
    locked: true,
    message: 'Account locked due to multiple failed attempts',
    unlockAt: Date.now() + (15 * 60 * 1000) // 15 minutes
  };
}

// Reset on successful login
function resetFailedLogins(identifier) {
  failedLogins.delete(identifier);
}
```

#### Layer 9: MongoDB Sanitization

**Purpose**: Prevent NoSQL injection (even though we use MySQL)
**Library**: `express-mongo-sanitize`

```javascript
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized key "${key}" in request`);
  }
}));
```

#### Layer 10: HTTP Parameter Pollution Prevention

**Purpose**: Prevent duplicate parameter attacks
**Library**: `hpp`

```javascript
app.use(hpp({
  whitelist: ['sort', 'filter', 'page']  // Allow arrays for these params
}));

// Blocks attacks like:
// ?id=1&id=2&id=3 (tries to confuse application)
```

### Security Monitoring

**Dashboard Endpoint**: `GET /api/security/stats`

```json
{
  "blockedIPs": 3,
  "suspiciousActivities": 12,
  "failedLogins": 8,
  "activeCSRFTokens": 45,
  "recentBlocks": [
    {
      "ip": "192.168.1.100",
      "reason": "Multiple SQL injection attempts",
      "blockedAt": "2025-01-15T10:30:00Z",
      "autoUnblockAt": "2025-01-16T10:30:00Z"
    }
  ]
}
```

**Logging**:
```javascript
function logSecurityEvent(type, req, details = {}) {
  const event = {
    type,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  console.warn(`[SECURITY] ${type}:`, JSON.stringify(event));
  
  // Store in database for audit trail
  // await pool.execute('INSERT INTO security_logs SET ?', [event]);
}
```

---

## Elder-Friendly Design

### Principles

1. **Maximum 5 Steps**: Any action should take ≤5 steps
2. **Large Touch Targets**: Buttons minimum 60px height
3. **Simple Language**: No technical jargon
4. **Clear Feedback**: Immediate visual confirmation
5. **Multiple Channels**: USSD, SMS, Web, Phone
6. **Helpline Always Visible**: 0800-753343

### USSD Payment (Simplest Method)

**For MTN Users** (077, 078):
```
1. Dial *165# on your phone
2. Select option 4: "My Wallet"
3. Select option 3: "My Approvals"
4. Find payment for UGX 50,000
5. Enter your PIN to approve
```

**For Airtel Users** (070, 075):
```
1. Dial *185# on your phone
2. Select option 1: "Airtel Money"
3. Select option 2: "Make Payment"
4. Enter merchant code: 12345
5. Confirm payment of UGX 50,000
6. Enter your PIN
```

### SMS Payment

**Format**: `PAY [PLEDGE_ID] [PHONE_NUMBER]`

**Example**:
```
Send to: 0800-753343
Message: PAY 123 256772345678

Response:
Thank you! Dial *165# to approve payment of UGX 50,000.
Your payment code is PLEDGE-123-ABC.
Need help? Call 0800-753343.
```

**Implementation**: `POST /api/simple-payment/sms-pay`

```javascript
async function processSMSPayment(req, res) {
  const { message, from } = req.body;
  
  // Parse: "PAY 123 256772345678"
  const parts = message.trim().split(/\s+/);
  if (parts[0].toUpperCase() !== 'PAY' || parts.length !== 3) {
    return sendSMS(from, 
      'Invalid format. Send: PAY [PLEDGE_ID] [PHONE]\n' +
      'Example: PAY 123 256772345678\n' +
      'Help: Call 0800-753343'
    );
  }
  
  const pledgeId = parseInt(parts[1]);
  const phoneNumber = parts[2];
  
  // Initiate payment
  const result = await mobileMoneyService.initiatePayment(
    pledgeId, phoneNumber, amount
  );
  
  if (result.success) {
    const provider = mobileMoneyService.detectProvider(phoneNumber);
    const ussdCode = provider === 'MTN' ? '*165#' : '*185#';
    
    return sendSMS(from,
      `Payment started! Dial ${ussdCode} to approve UGX ${amount}.\n` +
      `Code: ${result.reference}\n` +
      `Help: 0800-753343`
    );
  } else {
    return sendSMS(from, `Payment failed. Call 0800-753343 for help.`);
  }
}
```

### Web Interface (Upcoming)

**Design Requirements**:

```jsx
// Large button component
function LargeButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: '60px',
        fontSize: '24px',
        padding: '20px 40px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      {children}
    </button>
  );
}

// Step-by-step wizard
function PaymentWizard() {
  const [step, setStep] = useState(1);
  
  return (
    <div style={{ fontSize: '20px', lineHeight: '1.8' }}>
      {step === 1 && (
        <div>
          <h2>Step 1: Enter Your Phone Number</h2>
          <input
            type="tel"
            placeholder="0772345678"
            style={{ fontSize: '24px', padding: '15px' }}
          />
          <LargeButton onClick={() => setStep(2)}>
            Next →
          </LargeButton>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h2>Step 2: Choose Payment Method</h2>
          <LargeButton onClick={handleMTN}>
            MTN Mobile Money
          </LargeButton>
          <LargeButton onClick={handleAirtel}>
            Airtel Money
          </LargeButton>
        </div>
      )}
      
      {step === 3 && (
        <div>
          <h2>Step 3: Follow These Steps</h2>
          <ol style={{ fontSize: '22px' }}>
            <li>Dial *165# on your phone</li>
            <li>Select "My Wallet"</li>
            <li>Select "My Approvals"</li>
            <li>Approve payment</li>
            <li>Enter your PIN</li>
          </ol>
          <LargeButton onClick={checkStatus}>
            Check Payment Status
          </LargeButton>
        </div>
      )}
    </div>
  );
}

// Voice guidance (Web Speech API)
function VoiceGuide({ text }) {
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;  // Slower for clarity
    utterance.lang = 'en-UG';
    speechSynthesis.speak(utterance);
  };
  
  return (
    <button onClick={speak} style={{ fontSize: '20px' }}>
      🔊 Read Instructions Aloud
    </button>
  );
}
```

**High Contrast Mode**:
```css
/* WCAG AA compliant */
.high-contrast {
  background: #000;
  color: #fff;
  font-size: 20px;
}

.high-contrast button {
  background: #ffff00;
  color: #000;
  border: 3px solid #fff;
  min-height: 70px;
}
```

### Multilingual Support

**Languages**: English, Luganda, Runyankole, Ateso

**Help Endpoint**: `GET /api/simple-payment/help?lang=lg`

```json
{
  "title": "Engeri y'okusasula (How to Pay)",
  "methods": {
    "mtn": {
      "name": "MTN Mobile Money",
      "steps": [
        "Kuba *165# ku ssimu yo",
        "Londa 'My Wallet'",
        "Londa 'My Approvals'",
        "Kakasa okusasula",
        "Yingiza PIN yo"
      ]
    },
    "airtel": {
      "name": "Airtel Money",
      "steps": [
        "Kuba *185# ku ssimu yo",
        "Londa 'Airtel Money'",
        "Londa 'Make Payment'",
        "Yingiza merchant code",
        "Kakasa okusasula"
      ]
    }
  },
  "helpline": {
    "number": "0800-753343",
    "message": "Bw'oba olina ekibuuzo, tubire ku namba eno"
  }
}
```

---

## Setup Instructions

### 1. Install Dependencies

```powershell
cd backend
npm install helmet express-rate-limit xss-clean express-mongo-sanitize hpp --save
```

### 2. Configure Environment Variables

Edit `backend/.env`:

```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=pledgehub_db

# Security
JWT_SECRET=change_this_in_production_min_32_chars
SESSION_SECRET=change_this_too_min_32_chars
ENCRYPTION_KEY=generate_32_byte_hex_with_crypto  # See below

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=http://localhost:5173

# MTN Mobile Money (https://momodeveloper.mtn.com)
MTN_BASE_URL=https://sandbox.momodeveloper.mtn.com
MTN_SUBSCRIPTION_KEY=your_subscription_key_here
MTN_API_USER=generate_uuid_v4_here
MTN_API_KEY=generate_via_api_here
MTN_CALLBACK_URL=https://yoursite.com/api/payments/mtn/callback
MTN_ENVIRONMENT=sandbox  # or 'production'
MTN_MERCHANT_CODE=your_merchant_code

# Airtel Money (https://developers.airtel.africa)
AIRTEL_BASE_URL=https://openapiuat.airtel.africa
AIRTEL_CLIENT_ID=your_client_id_here
AIRTEL_CLIENT_SECRET=your_client_secret_here
AIRTEL_CALLBACK_URL=https://yoursite.com/api/payments/airtel/callback
AIRTEL_ENVIRONMENT=staging  # or 'production'
AIRTEL_MERCHANT_CODE=your_merchant_code

# Helpline
HELPLINE_NUMBER=0800-753343
HELPLINE_SMS=0800753343
```

### 3. Generate Encryption Key

```powershell
# Run in PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to ENCRYPTION_KEY in .env
```

### 4. Initialize Database

```powershell
# Option 1: MySQL command line
mysql -u root -p < init-database.sql

# Option 2: MySQL Workbench
# File → Run SQL Script → Select init-database.sql

# Option 3: PowerShell script
.\scripts\init-db.ps1
```

### 5. Obtain Payment API Credentials

#### MTN Mobile Money Sandbox

1. Go to https://momodeveloper.mtn.com
2. Sign up for developer account
3. Subscribe to "Collections" product (free for sandbox)
4. Get `MTN_SUBSCRIPTION_KEY` from dashboard
5. Generate API User:
   ```bash
   curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser \
     -H "X-Reference-Id: YOUR_UUID_V4" \
     -H "Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY" \
     -H "Content-Type: application/json" \
     -d '{"providerCallbackHost": "yoursite.com"}'
   ```
6. Get API Key:
   ```bash
   curl -X POST https://sandbox.momodeveloper.mtn.com/v1_0/apiuser/YOUR_UUID/apikey \
     -H "Ocp-Apim-Subscription-Key: YOUR_SUBSCRIPTION_KEY"
   ```

#### Airtel Money Sandbox

1. Go to https://developers.airtel.africa
2. Register and verify email
3. Create new app in dashboard
4. Subscribe to "Money" API (free for staging)
5. Get `AIRTEL_CLIENT_ID` and `AIRTEL_CLIENT_SECRET` from app details

### 6. Start Application

```powershell
# Option 1: Full automation
.\scripts\pre-departure-setup.ps1 -QuickStart

# Option 2: Manual
cd backend
npm run dev
# New terminal
cd frontend
npm run dev
```

### 7. Verify Security

```powershell
# Check security status
curl http://localhost:5001/api/security/stats

# Test rate limiting (should block after 5 attempts)
for ($i=1; $i -le 10; $i++) {
  curl http://localhost:5001/api/auth/login -Method POST `
    -Body '{"username":"test","password":"wrong"}' `
    -ContentType "application/json"
}
```

---

## Testing Guide

### 1. Test Payment Flow

#### USSD Instructions
```powershell
# Get USSD instructions
curl "http://localhost:5001/api/simple-payment/ussd-instructions?pledgeId=1&phoneNumber=256772345678"

# Expected response:
{
  "success": true,
  "provider": "MTN",
  "ussdCode": "*165#",
  "steps": [
    "Dial *165# on your MTN phone",
    "Select option 4: 'My Wallet'",
    "Select option 3: 'My Approvals'",
    "Find payment request for UGX 50000",
    "Enter your PIN to approve payment"
  ],
  "helpline": "For help, call 0800-753343 (toll-free)"
}
```

#### Initiate Payment
```powershell
curl http://localhost:5001/api/simple-payment/start -Method POST `
  -Body '{"pledgeId":1,"phoneNumber":"256772345678","amount":50000}' `
  -ContentType "application/json"

# Expected response:
{
  "success": true,
  "message": "Payment request sent! Check your phone to approve.",
  "reference": "PLEDGE-1-abc-def-123",
  "nextSteps": [...],
  "statusCheckUrl": "/api/simple-payment/status/PLEDGE-1-abc-def-123",
  "helpline": "0800-753343"
}
```

#### Check Status
```powershell
curl http://localhost:5001/api/simple-payment/status/PLEDGE-1-abc-def-123

# Expected response (pending):
{
  "success": true,
  "status": "WAITING",
  "message": "Waiting for you to approve payment on your phone",
  "reference": "PLEDGE-1-abc-def-123",
  "nextSteps": "Dial *165# and approve the payment"
}

# Expected response (success):
{
  "success": true,
  "status": "SUCCESS",
  "message": "Payment received! Your pledge is now paid.",
  "reference": "PLEDGE-1-abc-def-123",
  "amount": 50000
}
```

### 2. Test Security Features

#### Rate Limiting
```powershell
# Should block after 5 attempts
for ($i=1; $i -le 10; $i++) {
  Write-Host "Attempt $i"
  curl http://localhost:5001/api/auth/login -Method POST `
    -Body '{"username":"test","password":"wrong"}' `
    -ContentType "application/json"
}

# Attempt 6+ should return:
{
  "success": false,
  "error": "Too many attempts. Please wait 15 minutes."
}
```

#### SQL Injection Prevention
```powershell
# Should be blocked
curl "http://localhost:5001/api/pledges?search=test' OR '1'='1"

# Expected response:
{
  "success": false,
  "error": "Invalid input detected"
}
```

#### XSS Prevention
```powershell
# Should be sanitized
curl http://localhost:5001/api/feedback -Method POST `
  -Body '{"message":"<script>alert(1)</script>"}' `
  -ContentType "application/json"

# Script tags should be removed or escaped
```

#### CSRF Protection
```powershell
# Get token
$token = (curl http://localhost:5001/api/csrf-token).token

# Use token in request
curl http://localhost:5001/api/payments -Method POST `
  -Headers @{"X-CSRF-Token"=$token} `
  -Body '{"pledgeId":1,"amount":50000}' `
  -ContentType "application/json"

# Without token should fail:
curl http://localhost:5001/api/payments -Method POST `
  -Body '{"pledgeId":1,"amount":50000}' `
  -ContentType "application/json"
# → 403 Forbidden
```

#### IP Blocking
```powershell
# Trigger 5 suspicious activities
for ($i=1; $i -le 5; $i++) {
  curl "http://localhost:5001/api/pledges?search='; DROP TABLE users--"
}

# 6th request should be blocked:
# → 403 IP Blocked
```

### 3. Test MTN Integration (Sandbox)

```javascript
// backend/scripts/test-mtn-payment.js
const mobileMoneyService = require('../services/mobileMoneyService');

async function testMTN() {
  // Sandbox test number: 256772123456
  const result = await mobileMoneyService.initiatePayment(
    1, // pledgeId
    '256772123456', // MTN sandbox number
    1000 // UGX 1000
  );
  
  console.log('Initiate:', result);
  
  if (result.success) {
    // Wait 5 seconds
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check status
    const status = await mobileMoneyService.checkPaymentStatus(
      result.reference,
      'MTN'
    );
    console.log('Status:', status);
  }
}

testMTN();
```

Run test:
```powershell
node backend\scripts\test-mtn-payment.js
```

### 4. Load Testing

```powershell
# Install Artillery
npm install -g artillery

# Create test config: artillery-payments.yml
config:
  target: 'http://localhost:5001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: 'Payment flow'
    flow:
      - get:
          url: '/api/simple-payment/ussd-instructions?pledgeId=1&phoneNumber=256772345678'
      - post:
          url: '/api/simple-payment/start'
          json:
            pledgeId: 1
            phoneNumber: '256772345678'
            amount: 50000

# Run load test
artillery run artillery-payments.yml
```

---

## Troubleshooting

### Payment Issues

#### "Provider could not be determined"
**Cause**: Phone number doesn't match known prefixes
**Solution**: Ensure number starts with 256077, 256078 (MTN) or 256070, 256075 (Airtel)

```javascript
// Check detection
const provider = mobileMoneyService.detectProvider('256772345678');
console.log(provider); // Should be 'MTN' or 'Airtel'
```

#### "Failed to get OAuth token"
**Cause**: Invalid API credentials
**Solution**: 
1. Verify `MTN_SUBSCRIPTION_KEY` in .env
2. Check API user and key are correct
3. Ensure environment is set to 'sandbox'

```powershell
# Test MTN credentials
curl https://sandbox.momodeveloper.mtn.com/collection/token/ `
  -Method POST `
  -Headers @{
    "Ocp-Apim-Subscription-Key"="YOUR_KEY"
    "Authorization"="Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("YOUR_API_USER:YOUR_API_KEY"))
  }
```

#### "Payment timeout"
**Cause**: User didn't approve on phone within timeout
**Solution**: Increase timeout or implement polling

```javascript
// Increase timeout in mobileMoneyService.js
const PAYMENT_TIMEOUT = 300000; // 5 minutes (was 2 minutes)
```

### Security Issues

#### Rate limit not working
**Cause**: Using in-memory store, cleared on restart
**Solution**: Use Redis for production

```javascript
// Install redis
npm install redis

// Update securityService.js
const redis = require('redis');
const RedisStore = require('rate-limit-redis');
const client = redis.createClient();

const limiter = rateLimit({
  store: new RedisStore({ client }),
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

#### IP blocking not persisting
**Cause**: In-memory Map cleared on server restart
**Solution**: Store in database

```javascript
// Store blocked IPs in MySQL
async function blockIP(ip, reason) {
  await pool.execute(
    'INSERT INTO blocked_ips (ip, reason, blocked_at, auto_unblock_at) VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR))',
    [ip, reason]
  );
}

async function isIPBlocked(ip) {
  const [rows] = await pool.execute(
    'SELECT * FROM blocked_ips WHERE ip = ? AND auto_unblock_at > NOW()',
    [ip]
  );
  return rows.length > 0;
}
```

#### CSRF token invalid
**Cause**: Token expired or not included
**Solution**: Ensure token is fresh (<1 hour) and in header

```javascript
// Frontend: Get and use token
const getCSRFToken = async () => {
  const response = await fetch('/api/csrf-token');
  const { token } = await response.json();
  localStorage.setItem('csrfToken', token);
  return token;
};

const makeSecureRequest = async (url, data) => {
  let token = localStorage.getItem('csrfToken');
  if (!token) token = await getCSRFToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': token
    },
    body: JSON.stringify(data)
  });
  
  // If token expired, get new one and retry
  if (response.status === 403) {
    token = await getCSRFToken();
    return makeSecureRequest(url, data);
  }
  
  return response.json();
};
```

### Database Issues

#### "Connection refused"
**Cause**: MySQL not running
**Solution**: Start MySQL service

```powershell
# Windows
net start MySQL80

# Or use Services app
services.msc → MySQL80 → Start
```

#### "Database pledgehub_db doesn't exist"
**Cause**: Database not created
**Solution**: Run init-database.sql

```powershell
mysql -u root -p < init-database.sql
```

#### "Table doesn't exist"
**Cause**: Migrations not run
**Solution**: Run migration scripts

```powershell
node backend\scripts\complete-migration.js
```

### General Issues

#### "Module not found: helmet"
**Cause**: Security packages not installed
**Solution**: Install dependencies

```powershell
cd backend
npm install helmet express-rate-limit xss-clean express-mongo-sanitize hpp --save
```

#### "ENCRYPTION_KEY not set"
**Cause**: Missing encryption key in .env
**Solution**: Generate and add key

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output to backend\.env:
# ENCRYPTION_KEY=your_generated_key_here
```

#### High memory usage
**Cause**: In-memory rate limiting and IP blocking
**Solution**: Use Redis for production

```powershell
# Install Redis for Windows
# https://github.com/microsoftarchive/redis/releases

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

---

## Production Checklist

### Before Deployment

- [ ] **Database**
  - [ ] Create production database
  - [ ] Run all migrations
  - [ ] Set up automated backups
  - [ ] Configure connection pooling

- [ ] **Environment Variables**
  - [ ] Change `JWT_SECRET` to strong random value
  - [ ] Change `SESSION_SECRET` to strong random value
  - [ ] Generate new `ENCRYPTION_KEY`
  - [ ] Set `NODE_ENV=production`
  - [ ] Update `CORS_ORIGIN` to production domain

- [ ] **Payment APIs**
  - [ ] Upgrade MTN to production credentials
  - [ ] Upgrade Airtel to production credentials
  - [ ] Update callback URLs to HTTPS
  - [ ] Test with real money (small amounts first)
  - [ ] Set up webhook endpoints
  - [ ] Configure payment reconciliation

- [ ] **Security**
  - [ ] Enable HTTPS (SSL certificate)
  - [ ] Set up Redis for rate limiting
  - [ ] Store blocked IPs in database
  - [ ] Configure firewall rules
  - [ ] Set up intrusion detection alerts
  - [ ] Enable security logging
  - [ ] Run security audit: `npm audit`
  - [ ] Update all dependencies

- [ ] **Monitoring**
  - [ ] Set up application monitoring (PM2, New Relic, or Datadog)
  - [ ] Configure error tracking (Sentry)
  - [ ] Set up uptime monitoring
  - [ ] Configure alert notifications
  - [ ] Enable performance monitoring

- [ ] **Testing**
  - [ ] Run full test suite
  - [ ] Load test payment endpoints
  - [ ] Test rate limiting under load
  - [ ] Verify security headers
  - [ ] Test elder-friendly flows with real users

- [ ] **Documentation**
  - [ ] Update API documentation
  - [ ] Create user guide for elderly users
  - [ ] Document incident response procedures
  - [ ] Create runbook for common issues

### Post-Deployment

- [ ] Verify HTTPS is working
- [ ] Test payment flow end-to-end
- [ ] Check security logs
- [ ] Monitor error rates
- [ ] Test helpline number
- [ ] Send test SMS payment
- [ ] Verify USSD instructions work
- [ ] Check database performance
- [ ] Review rate limiting logs
- [ ] Test backup restoration

---

## Additional Resources

### Official Documentation

- **MTN Mobile Money**: https://momodeveloper.mtn.com/api-documentation
- **Airtel Money**: https://developers.airtel.africa/documentation
- **Helmet.js**: https://helmetjs.github.io/
- **Express Rate Limit**: https://express-rate-limit.mintlify.app/
- **OWASP Security**: https://owasp.org/www-project-top-ten/

### Support

- **PledgeHub Helpline**: 0800-753343 (toll-free)
- **Technical Support**: support@pledgehub.ug
- **Security Issues**: security@pledgehub.ug (report vulnerabilities)

### Code Locations

| Component | File Path |
|-----------|-----------|
| Mobile Money Service | `backend/services/mobileMoneyService.js` |
| Security Service | `backend/services/securityService.js` |
| Simple Payment Routes | `backend/routes/simplePaymentRoutes.js` |
| Server Integration | `backend/server.js` |
| Environment Config | `backend/.env` |
| Git Workflow | `GIT-SETUP-GUIDE.md` |

---

**Last Updated**: January 2025
**Version**: 1.0.0
**Status**: Production Ready (pending API credentials)

