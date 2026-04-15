# PledgeHub - System Architecture & Design Document

**Version**: 2.0  
**Last Updated**: December 19, 2025  
**Status**: Production-Ready

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Security Architecture](#security-architecture)
8. [Scalability & Performance](#scalability--performance)
9. [Deployment Architecture](#deployment-architecture)
10. [Mobile Architecture (Planned)](#mobile-architecture-planned)

---

## 🏗️ System Overview

PledgeHub is a **comprehensive pledge management system** built with:
- **Frontend**: React 18 with React Router 7
- **Backend**: Node.js + Express + MySQL
- **Architecture Pattern**: Service-oriented with layered architecture
- **Data Model**: Relational database with double-entry accounting

### Key Characteristics
- **Multi-tenant capable** with role-based access control
- **AI-powered** with Google Gemini integration
- **Mobile money ready** (MTN, Airtel integration)
- **Accounting-grade** with QuickBooks-style features
- **Analytics-rich** with conversion tracking
- **Internationalized** with multi-language support

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  React SPA   │  │  Mobile App  │  │   Web Admin  │           │
│  │   (5173)     │  │  (Future)    │  │              │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                   │                   │
│         └─────────────────┼───────────────────┘                   │
│                           │                                       │
│                      HTTPS / REST / JSON                         │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                      APPLICATION LAYER                          │
│                   Express.js Server (5001)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    ROUTING LAYER                         │   │
│  │  • AuthRoutes          • PaymentRoutes                   │   │
│  │  • PledgeRoutes        • AnalyticsRoutes                │   │
│  │  • CampaignRoutes      • AccountingRoutes               │   │
│  │  • NotificationRoutes  • WebhookRoutes                  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MIDDLEWARE LAYER                       │   │
│  │  • Authentication (JWT)                                  │   │
│  │  • Authorization (Role-based)                            │   │
│  │  • Rate Limiting (Security)                              │   │
│  │  • CORS / Headers                                        │   │
│  │  • Logging                                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SERVICE LAYER                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Core Services                                    │   │   │
│  │  │ • PledgeService  • CampaignService              │   │   │
│  │  │ • PaymentService • UserService                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Advanced Services                                │   │   │
│  │  │ • AIService       • AnalyticsService             │   │   │
│  │  │ • AccountingService • MonetizationService        │   │   │
│  │  │ • ReminderService • MessageService              │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Integration Services                             │   │   │
│  │  │ • MTNService     • AirtelService                │   │   │
│  │  │ • TwilioService  • EmailService                 │   │   │
│  │  │ • ChatbotService                                │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   MODEL LAYER                           │   │
│  │  • Pledge      • Campaign    • Payment                  │   │
│  │  • User        • Feedback    • Account (Accounting)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
├─────────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                            │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │             MySQL Database Connection Pool              │   │
│  │  • 10 connections • Multi-statement enabled             │   │
│  │  • Parameterized queries (SQL injection safe)           │   │
│  │  • Connection pooling for performance                   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
├─────────────────────────────────────────────────────────────────┤
│                    DATABASE LAYER                               │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MySQL 8.0 Database                         │   │
│  │                                                          │   │
│  │  Core Tables:      Analytics:       Accounting:         │   │
│  │  • pledges         • analytics_data • accounts          │   │
│  │  • users           • trends         • journal_entries   │   │
│  │  • campaigns       • insights       • journal_lines     │   │
│  │  • payments        • metrics        • trial_balance     │   │
│  │  • feedback                                             │   │
│  │                                                          │   │
│  │  Additional Tables:                                      │   │
│  │  • subscriptions   • payment_fees   • sessions          │   │
│  │  • credit_balances • payouts        • audit_logs        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│                   EXTERNAL INTEGRATIONS                         │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Google Gemini  │  │ MTN MoMo       │  │ Twilio/Email   │    │
│  │ (AI Service)   │  │ Payment API    │  │ (Notifications)│    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                   │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Airtel Money   │  │ WhatsApp API   │  │ Africa Talking │    │
│  │ Payment API    │  │ (Messages)     │  │ (SMS)          │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🧩 Component Architecture

### Frontend Component Hierarchy

```
App (Root)
├── Auth Flows
│   ├── LoginScreen
│   ├── RegisterScreen
│   ├── PasswordRecovery
│   └── OAuthCallbackScreen
│
├── Main Dashboard
│   ├── DashboardScreen
│   │   ├── SummaryCards
│   │   ├── TrendChart
│   │   └── QuickActions
│   └── NavBar (All pages)
│
├── Pledge Management
│   ├── CreatePledgeScreen
│   ├── PledgesListScreen
│   └── PledgeDetailScreen
│
├── Campaign Management
│   ├── CampaignsScreen
│   ├── CampaignDetailScreen
│   └── CreateCampaignScreen
│
├── Analytics & Reporting
│   ├── AnalyticsDashboard (6 improvements)
│   ├── AdvancedAnalyticsScreen
│   └── ReportGeneratorScreen
│
├── Accounting System
│   ├── AccountingScreen
│   ├── AccountingDashboardScreen
│   ├── ChartOfAccountsScreen
│   ├── JournalEntryScreen
│   └── FinancialReportsScreen
│
├── User Management
│   ├── UserListScreen
│   ├── UserEditScreen
│   └── RoleManagementScreen
│
└── Settings
    ├── SettingsScreen
    ├── ProfileScreen
    └── PreferencesScreen
```

### Backend Service Architecture

```
services/
├── Core Services
│   ├── pledgeService.js
│   ├── campaignService.js
│   ├── paymentTrackingService.js
│   ├── userService.js
│   └── feedbackService.js
│
├── Advanced Services
│   ├── analyticsService.js
│   ├── advancedAnalyticsService.js
│   ├── accountingService.js
│   ├── monetizationService.js
│   ├── reminderService.js
│   └── advancedCronScheduler.js
│
├── AI & Chat
│   ├── aiService.js
│   ├── chatbotService.js
│   └── messageGenerator.js
│
├── Notifications
│   ├── emailService.js
│   ├── smsService.js
│   └── reminderService.js
│
├── Payment Integration
│   ├── mtnService.js
│   ├── airtelService.js
│   ├── mobileMoneyService.js
│   ├── paypalService.js
│   └── paymentTrackingService.js
│
├── Security & Auth
│   ├── securityService.js
│   ├── authService.js
│   └── twoFactorService.js
│
└── Automation
    ├── cronScheduler.js
    ├── advancedCronScheduler.js
    └── webhookHandler.js
```

---

## 🔄 Data Flow

### Create Pledge Flow

```
User Input (CreatePledgeScreen)
        ↓
Form Validation (Client-side)
        ↓
POST /api/pledges (Axios)
        ↓
Backend Route Handler
        ↓
authenticateToken Middleware
        ↓
pledgeService.createPledge()
        ↓
Validate Business Rules
        ↓
SQL: INSERT into pledges
        ↓
Create Journal Entries (Accounting)
        ↓
Schedule Reminder Cron Jobs
        ↓
Emit Analytics Update
        ↓
Return { success: true, data: pledge }
        ↓
Frontend State Update (useState)
        ↓
UI Re-render with Success Message
        ↓
Redirect to Pledge Detail
```

### Payment Processing Flow

```
User Initiates Payment
        ↓
Select Payment Method (MTN/Airtel/Bank/Cash)
        ↓
POST /api/payments (Axios)
        ↓
paymentTrackingService.recordPayment()
        ↓
Validate Amount & Pledge
        ↓
Is Mobile Money?
    ├─ Yes → mtnService/airtelService.requestPayment()
    │         ↓
    │         Request Payment via Provider API
    │         ↓
    │         Webhook Callback (async)
    │         ↓
    │         Update Payment Status
    │
    └─ No → Process Locally
            ↓
            Record in payments table
            ↓
Update Pledge Status
        ↓
Create Accounting Journal Entry
        ↓
Send Confirmation SMS/Email
        ↓
Update Analytics
        ↓
Return Success Response
```

### Analytics Data Collection Flow

```
User Views Analytics Page
        ↓
fetchAnalyticsData() useEffect
        ↓
Promise.all() - Parallelize 8 API calls:
├─ GET /api/analytics/summary
├─ GET /api/analytics/trends
├─ GET /api/analytics/payment-methods (NEW)
├─ GET /api/analytics/credit-metrics (NEW)
├─ GET /api/analytics/at-risk (NEW)
├─ GET /api/analytics/top-donors
├─ GET /api/analytics/purpose-breakdown
└─ GET /api/analytics/insights
        ↓
Backend: Each endpoint runs SQL aggregation
        ↓
Data Aggregation in Services
        ↓
Format Response JSON
        ↓
Frontend: Update useState
        ↓
Re-render Components with Data
        ↓
Display Cards, Charts, Tables
```

---

## 💾 Database Schema

### Core Tables

```sql
-- Users Table
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  phone VARCHAR(20),
  role ENUM('user', 'staff', 'admin') DEFAULT 'user',
  subscription_tier ENUM('free', 'pay_as_you_go', 'campaign', 'premium') DEFAULT 'free',
  credits_balance DECIMAL(15,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Pledges Table (Core)
CREATE TABLE pledges (
  id INT PRIMARY KEY AUTO_INCREMENT,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255),
  donor_phone VARCHAR(20),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'UGX',
  description VARCHAR(500),
  status ENUM('pending', 'active', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  collection_date DATE,
  campaign_id INT,
  user_id INT,
  payment_method VARCHAR(50),
  reminder_frequency INT DEFAULT 7,
  last_reminder_sent DATETIME,
  ai_optimized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_collection_date (collection_date),
  INDEX idx_user_id (user_id)
);

-- Campaigns Table
CREATE TABLE campaigns (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2),
  current_amount DECIMAL(15,2) DEFAULT 0,
  status ENUM('draft', 'active', 'completed', 'archived') DEFAULT 'draft',
  user_id INT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Payments Table
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  pledge_id INT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR(50),
  status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
  transaction_id VARCHAR(255),
  processed_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (pledge_id) REFERENCES pledges(id)
);

-- Accounting: Accounts Table
CREATE TABLE accounts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'),
  parent_id INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES accounts(id)
);

-- Accounting: Journal Entries
CREATE TABLE journal_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_number VARCHAR(50) UNIQUE,
  date DATE NOT NULL,
  description TEXT,
  reference VARCHAR(100),
  status ENUM('draft', 'posted', 'void') DEFAULT 'posted',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Accounting: Journal Entry Lines
CREATE TABLE journal_entry_lines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  entry_id INT NOT NULL,
  account_id INT NOT NULL,
  debit DECIMAL(15,2) DEFAULT 0,
  credit DECIMAL(15,2) DEFAULT 0,
  description TEXT,
  FOREIGN KEY (entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Subscriptions Table
CREATE TABLE subscriptions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  tier VARCHAR(50) NOT NULL,
  status ENUM('active', 'suspended', 'cancelled') DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Usage Stats Table
CREATE TABLE usage_stats (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  month_year DATE,
  pledges_count INT DEFAULT 0,
  campaigns_count INT DEFAULT 0,
  sms_sent INT DEFAULT 0,
  emails_sent INT DEFAULT 0,
  ai_requests INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔌 API Design

### RESTful Principles Applied

- **Versioning**: `/api/v1/*` (currently `/api/*`)
- **Resource-based URLs**: `/pledges`, `/campaigns`, `/payments`
- **Standard HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Response Format**: JSON with `{ success: boolean, data: object, error?: string }`
- **Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)

### API Endpoint Categories

#### Authentication Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/verify
POST   /api/oauth/google
POST   /api/oauth/facebook
```

#### Pledge Endpoints
```
GET    /api/pledges                    (List all pledges)
POST   /api/pledges                    (Create pledge)
GET    /api/pledges/:id                (Get pledge detail)
PUT    /api/pledges/:id                (Update pledge)
DELETE /api/pledges/:id                (Soft delete pledge)
GET    /api/pledges/:id/payments       (Get payments for pledge)
```

#### Payment Endpoints
```
POST   /api/payments                   (Create payment)
GET    /api/payments/:id               (Get payment detail)
POST   /api/payments/mtn/request       (MTN payment request)
POST   /api/payments/mtn/callback      (MTN webhook)
POST   /api/payments/airtel/request    (Airtel payment request)
POST   /api/payments/airtel/callback   (Airtel webhook)
```

#### Analytics Endpoints
```
GET    /api/analytics/summary          (Overall metrics)
GET    /api/analytics/trends           (Trend data)
GET    /api/analytics/payment-methods  (Payment breakdown) [NEW]
GET    /api/analytics/credit-metrics   (Subscription metrics) [NEW]
GET    /api/analytics/at-risk          (At-risk pledges) [NEW]
GET    /api/analytics/top-donors       (Top donors)
GET    /api/analytics/purpose-breakdown (By purpose)
GET    /api/analytics/insights         (AI insights)
```

#### Accounting Endpoints
```
GET    /api/accounting/accounts                (Chart of accounts)
POST   /api/accounting/journal-entries         (Create journal entry)
GET    /api/accounting/journal-entries/:id     (Get entry)
GET    /api/accounting/reports/balance-sheet   (Financial report)
GET    /api/accounting/reports/income-statement
GET    /api/accounting/reports/trial-balance
```

#### Campaign Endpoints
```
GET    /api/campaigns                  (List campaigns)
POST   /api/campaigns                  (Create campaign)
GET    /api/campaigns/:id              (Get campaign)
PUT    /api/campaigns/:id              (Update campaign)
POST   /api/campaigns/:id/pledges      (Get pledges in campaign)
```

#### User Endpoints
```
GET    /api/users                      (List users) [Admin]
POST   /api/users                      (Create user) [Admin]
GET    /api/users/:id                  (Get user)
PUT    /api/users/:id                  (Update user)
DELETE /api/users/:id                  (Delete user) [Admin]
```

---

## 🔐 Security Architecture

### Authentication & Authorization

```
User Input
  ↓
Validate Credentials
  ↓
Generate JWT Token (24hr expiry)
  ↓
Store in AuthContext
  ↓
Include in API Requests: Authorization: Bearer {token}
  ↓
Backend: authenticateToken Middleware
  ↓
Verify JWT Signature
  ↓
Check Token Expiry
  ↓
Extract User Info from Claims
  ↓
Attach User to req.user
  ↓
Check Role Permissions (if required)
  ↓
Proceed or Deny Access
```

### Role-Based Access Control (RBAC)

```
User Roles:
├── user (default)
│   └── Can create/manage own pledges
│
├── staff
│   ├── Can view analytics
│   ├── Can manage campaigns
│   └── Can send reminders
│
└── admin
    ├── Full access to all features
    ├── Can manage users
    ├── Can manage accounting
    ├── Can view all analytics
    └── Can generate reports
```

### Security Layers

1. **Transport Security**
   - HTTPS in production
   - TLS 1.2+

2. **Application Security**
   - JWT tokens for stateless auth
   - CORS enabled for localhost:5173
   - CSRF protection on state-changing operations
   - Rate limiting (4 tiers based on endpoint sensitivity)

3. **Database Security**
   - Parameterized queries (no SQL injection)
   - Password hashing (bcrypt)
   - Sensitive data encryption
   - Connection pooling

4. **API Security**
   - Input validation on all endpoints
   - Output encoding
   - Error messages don't expose schema
   - API keys for third-party integrations

---

## ⚡ Scalability & Performance

### Database Optimization

```
Indexing Strategy:
├── Primary Keys (id)
├── Foreign Keys (user_id, pledge_id, campaign_id)
├── Status Fields (status, deleted)
├── Date Fields (created_at, collection_date)
└── Query Filters (email, phone)

Query Optimization:
├── Connection Pooling (10 connections)
├── Prepared Statements
├── Batch Operations
└── Caching (Redis ready)
```

### Frontend Performance

```
Optimization Techniques:
├── Code Splitting (React Router)
├── Lazy Loading (screens on demand)
├── Memoization (useMemo, useCallback)
├── API Caching (useState with refetch logic)
├── Bundle Optimization (Vite)
└── Mobile Responsive Design
```

### Backend Performance

```
Optimization Techniques:
├── Service Layer Caching
├── Database Query Optimization
├── API Response Compression
├── Async/Await for I/O
├── Promise.all() for parallel requests
└── Rate Limiting to prevent abuse
```

---

## 🚀 Deployment Architecture

### Development Environment
```
localhost:5173  → React Dev Server (Vite)
localhost:5001  → Express Backend
localhost:3306  → MySQL Database

Database: pledgehub_db
Authentication: JWT (dev secret)
Environment: development
```

### Staging Environment (Optional)
```
staging.pledgedhub.com
  ├── React Frontend (Vite build)
  ├── Express Backend
  └── MySQL Database
```

### Production Environment
```
pledgedhub.com
  ├── Frontend: AWS S3 + CloudFront
  ├── Backend: AWS EC2 or App Runner
  ├── Database: AWS RDS (MySQL)
  ├── SSL: Let's Encrypt
  ├── CDN: CloudFront
  └── Monitoring: CloudWatch
```

---

## 📱 Mobile Architecture (Planned)

### Technology Stack (Recommended)

```
Framework:    React Native / Expo
State:        Redux Toolkit or Zustand
Navigation:   React Navigation
UI Kit:       Native Base or React Native Paper
API Client:   Axios
Authentication: JWT (same backend)
Storage:      AsyncStorage + SecureStore
```

### Mobile Features to Support

```
Phase 1 - MVP:
├── User Authentication
├── View Pledges (Read-only)
├── Create Pledges
├── View Campaigns
├── Receive Notifications (Push)
└── View Dashboard (Summary)

Phase 2 - Enhanced:
├── Payment Recording (Simple)
├── Reminder Management
├── Basic Analytics View
└── Offline Support

Phase 3 - Advanced:
├── Full Payment Integration (Mobile Money)
├── Offline Sync
├── Advanced Analytics
├── Camera for Receipt Scanning
└── Biometric Authentication
```

### Mobile Data Sync Strategy

```
Mobile Device
  ↓
Local SQLite Database
  ↓
Background Sync Service
  ↓
Queue for network requests
  ↓
API Calls (when online)
  ↓
Backend Processing
  ↓
Conflict Resolution (if offline changes conflict)
  ↓
Update Local DB
  ↓
UI Refresh
```

### Mobile API Considerations

```
Optimize for Mobile:
├── Pagination (100 items max per request)
├── Minimal Response Size (only needed fields)
├── Compression (gzip enabled)
├── Caching Headers (Cache-Control)
├── Throttling (429 Too Many Requests)
└── Offline-first design
```

---

## 🔄 System Design Patterns Used

### 1. **Service-Oriented Architecture**
Business logic separated into services, making it testable and reusable.

### 2. **Repository Pattern**
Data access abstracted through models, enabling database abstraction.

### 3. **Middleware Chain Pattern**
Express middleware for cross-cutting concerns (auth, logging, validation).

### 4. **Factory Pattern**
Service creation and configuration (messageGenerator, aiService).

### 5. **Observer Pattern**
Event emitters for cron jobs and webhooks.

### 6. **Singleton Pattern**
Database connection pool, AI service instance, crypto utilities.

### 7. **Decorator Pattern**
Middleware decorates routes with authentication/authorization.

### 8. **Strategy Pattern**
Multiple payment strategies (MTN, Airtel, PayPal, Cash).

---

## 📊 Data Model Relationships

```
users (1) ──── (N) pledges
         │
         ├─ (N) campaigns
         ├─ (N) sessions
         ├─ (N) journal_entries (created_by)
         └─ (N) subscriptions

campaigns (1) ──── (N) pledges

pledges (1) ──── (N) payments
       │
       └─ (N) feedback

payments (N) ──── (1) pledge

feedback (N) ──── (1) pledge

accounts (N) ──── (1) accounts (parent)

journal_entries (1) ──── (N) journal_entry_lines

journal_entry_lines (N) ──── (1) accounts

subscriptions (1) ──── (1) users
```

---

## 🎯 System Characteristics

| Aspect | Implementation |
|--------|-----------------|
| **Architecture** | Layered + Service-Oriented |
| **API Style** | REST |
| **Database** | Relational (MySQL) |
| **Auth** | JWT Tokens |
| **Caching** | In-memory (Redis-ready) |
| **Async Processing** | Node.js Event Loop + Cron |
| **Scalability** | Horizontal (stateless backend) |
| **Deployment** | Docker-ready, Cloud-native |
| **Monitoring** | Logging to console (production: external) |
| **Testing** | Jest + integration tests |
| **Documentation** | Inline + external guides |

---

## 📈 System Metrics

### Current Capacity
- **Concurrent Users**: 100+ (single instance)
- **Daily Active Users**: 50+
- **API Requests/Day**: 10,000+
- **Storage**: 1GB (scalable)
- **Database Connections**: 10 pooled
- **Response Time**: <200ms average

### Scaling Strategy
1. **Horizontal Scaling**: Multiple backend instances + load balancer
2. **Database Scaling**: Read replicas for analytics, write master for transactional
3. **Caching Layer**: Redis for frequently accessed data
4. **CDN**: CloudFront for static assets
5. **API Gateway**: AWS API Gateway for rate limiting

---

## 🔍 Quality Assurance

### Testing Strategy
```
Unit Tests:      Services, utilities, helpers
Integration Tests: API endpoints, database operations
E2E Tests:       User workflows (future with Cypress/Playwright)
Manual Testing:  Critical user paths before release
Load Testing:    Performance benchmarks
Security Testing: OWASP Top 10 scanning
```

### Code Quality
- ESLint for code style
- Prettier for formatting
- Jest for unit/integration tests
- Manual code review before merge

---

## 📚 Documentation

- **API Docs**: See docs/API_DOCUMENTATION.md
- **Deployment**: See docs/DEPLOYMENT_GUIDE.md
- **Troubleshooting**: See docs/TROUBLESHOOTING.md
- **Architecture**: This document
- **Code Comments**: Inline in source files

---

## 🎓 Key Design Decisions

1. **No ORM**: Raw SQL for full control and performance
2. **Single Database**: MySQL for simplicity and ACID compliance
3. **JWT over Sessions**: Stateless scaling
4. **Service Layer**: Business logic reusability
5. **Accounting Built-in**: From day 1 for compliance
6. **AI Optional**: Graceful degradation if unavailable
7. **Mobile-ready API**: Designed for native app consumption

---

**Document Version**: 2.0  
**Last Updated**: December 19, 2025  
**Status**: Current & Complete
