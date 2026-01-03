const path = require('path');
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('passport');

require('dotenv').config({ path: path.join(__dirname, '.env') });

// Database initialization
let db;
try {
  db = require('./config/db');
  console.log('✅ Database connection initialized');
} catch (dbError) {
  console.error('❌ Database connection failed:', dbError.message);
  process.exit(1);
}


const authRoutes = require('./routes/auth');
const campaignRoutes = require('./routes/campaignRoutes');
const registerRoute = require('./routes/register');

// Import all route modules
const feedbackRoutes = require('./routes/feedbackRoutes');
const adminFeedbackRoutes = require('./routes/adminFeedbackRoutes');
const userRoutes = require('./routes/userRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const reminderRoutes = require('./routes/reminderRoutes');
const aiRoutes = require('./routes/aiRoutes');
const messageRoutes = require('./routes/messageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const advancedAnalyticsRoutes = require('./routes/advancedAnalyticsRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentSettingsRoutes = require('./routes/paymentSettingsRoutes');
const pledgeRoutes = require('./routes/pledgeRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const accountingRoutes = require('./routes/accountingRoutes');
const securityRoutes = require('./routes/securityRoutes');
const simplePaymentRoutes = require('./routes/simplePaymentRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const publicRoutes = require('./routes/publicRoutes');
const bankSettingsRoutes = require('./routes/bankSettingsRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const cashPaymentRoutes = require('./routes/cashPaymentRoutes');
const deploymentRoutes = require('./routes/deploymentRoutes');

// Import middleware
const { authenticateToken, requireAdmin, requireStaff } = require('./middleware/authMiddleware');

// Import services
const securityService = require('./services/securityService');
const cronScheduler = require('./services/advancedCronScheduler');

const app = express();
const PORT = process.env.PORT || 5001;

// ========================================
// MIDDLEWARE STACK (Security First)
// ========================================

// Security middleware
app.use(securityService.helmetConfig);
app.use(securityService.securityHeaders);
app.use(securityService.intrusionDetection);
app.use(securityService.checkBlockedIP);
app.use(securityService.xssClean);
app.use(securityService.mongoSanitize);
app.use(securityService.hpp);
app.use(securityService.preventSQLInjection);
app.use(securityService.preventXSS);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://pledgehub.com'
    : ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session management (REQUIRED for OAuth)
app.use(session({
  secret: process.env.SESSION_SECRET || 'pledgehub-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport initialization (REQUIRED for OAuth)
app.use(passport.initialize());
app.use(passport.session());

// ========================================
// HEALTH CHECKS & SYSTEM ROUTES
// ========================================

app.get('/', (req, res) => res.json({
  message: 'PledgeHub API Running',
  status: 'OK',
  version: '1.0.0',
  timestamp: new Date().toISOString()
}));

app.get('/api/health', (req, res) => res.json({
  status: 'healthy',
  uptime: process.uptime(),
  timestamp: new Date().toISOString()
}));

app.get('/api/test', (req, res) => res.json({ 
  message: 'API is operational',
  timestamp: new Date().toISOString()
}));

// ========================================
// API ROUTES
// ========================================

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/register', registerRoute);
app.use('/api/oauth', oauthRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/simple-payment', securityService.rateLimiters.payment, simplePaymentRoutes);
app.use('/api/public', publicRoutes); // Guest fundraising routes (NO AUTH)
app.use('/api/deployment', deploymentRoutes); // Monetization phase info (PUBLIC)

// Protected routes (authentication required)
app.use('/api/pledges', pledgeRoutes);
app.use('/pledges', pledgeRoutes); // Legacy alias

// Staff/Admin protected routes
app.use('/api/payments', 
  securityService.rateLimiters.payment, 
  authenticateToken, 
  requireStaff, 
  paymentRoutes
);

app.use('/api/payment-settings',
  authenticateToken,
  requireAdmin,
  paymentSettingsRoutes
);

app.use('/api/commissions',
  authenticateToken,
  requireAdmin,
  securityService.rateLimiters.api,
  commissionRoutes
);

app.use('/api/users', 
  authenticateToken, 
  requireAdmin, 
  userRoutes
);

app.use('/api/password', 
  authenticateToken, 
  passwordRoutes
);

app.use('/api/2fa', 
  authenticateToken, 
  twoFactorRoutes
);

app.use('/api/notifications', 
  authenticateToken, 
  requireStaff, 
  notificationRoutes
);

app.use('/api/reminders', 
  authenticateToken, 
  requireAdmin, 
  reminderRoutes
);

app.use('/api/ai', 
  authenticateToken, 
  requireStaff, 
  aiRoutes
);

app.use('/api/messages', 
  authenticateToken, 
  requireStaff, 
  messageRoutes
);

app.use('/api/analytics', 
  authenticateToken, 
  requireStaff, 
  analyticsRoutes
);

app.use('/api/advanced-analytics', 
  authenticateToken, 
  advancedAnalyticsRoutes
);

app.use('/api/whatsapp', whatsappRoutes);

app.use('/api/accounting', 
  authenticateToken, 
  requireStaff, 
  accountingRoutes
);

app.use('/api/security',
  authenticateToken,
  securityRoutes
);

app.use('/api/bank-settings', bankSettingsRoutes);

app.use('/api/payouts',
  authenticateToken,
  payoutRoutes
);

app.use('/api/cash-payments',
  authenticateToken,
  cashPaymentRoutes
);

// Campaigns routes
app.use('/api/campaigns', campaignRoutes);

// ========================================
// COMPLIANCE & UTILITY ROUTES
// ========================================

app.get('/privacy', (req, res) => {
  res.json({
    title: 'Privacy Policy - PledgeHub',
    lastUpdated: '2024-12-16',
    content: {
      introduction: 'PledgeHub is committed to protecting your privacy and personal information.',
      dataCollection: 'We collect only essential information needed for pledge management: name, email, and pledge details.',
      dataUsage: 'Your information is used solely for managing your pledges and sending automated reminders.',
      dataSharing: 'We do not share your personal information with third parties except as required by law.',
      dataSecurity: 'We implement appropriate security measures to protect your personal information.',
      yourRights: 'You have the right to access, update, or delete your personal information at any time.',
      contact: 'For privacy concerns, contact us through the application.'
    }
  });
});

app.get('/terms', (req, res) => {
  res.json({
    title: 'Terms of Service - PledgeHub',
    lastUpdated: '2024-12-16',
    content: {
      acceptance: 'By using PledgeHub, you agree to these terms of service.',
      description: 'PledgeHub is a pledge management system for tracking donations and commitments.',
      userResponsibilities: 'Users are responsible for providing accurate information and honoring their pledges.',
      serviceAvailability: 'We strive to maintain service availability but cannot guarantee 100% uptime.',
      modifications: 'We reserve the right to modify these terms with appropriate notice to users.',
      termination: 'Users may terminate their account at any time by contacting support.',
      liability: 'Our liability is limited to the extent permitted by applicable law.',
      contact: 'For questions about these terms, contact us through the application.'
    }
  });
});

// ========================================
// ERROR HANDLING (MUST BE LAST)
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled Error:', {
    message: err.message,
    status: err.status || err.statusCode || 500,
    method: req.method,
    url: req.url,
    ip: req.ip
  });

  const statusCode = err.status || err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString()
  });
});

// ========================================
// SERVER INITIALIZATION
// ========================================

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║     PledgeHub Backend Server Ready     ║
╠════════════════════════════════════════╣
║ Server: http://localhost:${PORT}
║ Node Env: ${process.env.NODE_ENV || 'development'}
║ Database: ${process.env.DB_NAME || 'pledgehub'}
║ Time: ${new Date().toISOString()}
╚════════════════════════════════════════╝
    `);

    // Initialize cron jobs
    try {
      cronScheduler.initializeJobs();
      cronScheduler.startJobs();
      console.log('✅ Cron scheduler initialized');
    } catch (cronError) {
      console.error('❌ Failed to initialize cron jobs:', cronError.message);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('📛 SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('📛 SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

module.exports = app;
