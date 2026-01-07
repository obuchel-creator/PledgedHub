// Debug server with comprehensive error handling
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');

// Enhanced error logging
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

require('dotenv').config({ path: path.join(__dirname, '.env') });

logger.info('🔄 Starting server initialization...');

// Try to ensure DB connection (non-blocking)
try {
  require('./config/db');
  logger.info('✅ Database module loaded');
} catch (dbError) {
  logger.warn('⚠️  Database connection failed:', dbError.message);
  logger.warn('💡 OAuth functionality will still work without database');
}

// Initialize passport
let passport;
try {
  passport = require('./config/passport');
  logger.info('✅ Passport module loaded');
} catch (passportError) {
  console.error('❌ Passport loading failed:', passportError.message);
}

// Load routes with error handling
let pledgeRoutes, paymentRoutes, userRoutes, notificationRoutes, oauthRoutes, reminderRoutes, aiRoutes, messageRoutes, analyticsRoutes;

try {
  pledgeRoutes = require('./routes/pledgeRoutes');
  logger.info('✅ Pledge routes loaded');
} catch (e) { console.error('❌ Failed to load pledge routes:', e.message); }

try {
  paymentRoutes = require('./routes/paymentRoutes');
  logger.info('✅ Payment routes loaded');
} catch (e) { console.error('❌ Failed to load payment routes:', e.message); }

try {
  userRoutes = require('./routes/userRoutes');
  logger.info('✅ User routes loaded');
} catch (e) { console.error('❌ Failed to load user routes:', e.message); }

try {
  notificationRoutes = require('./routes/notificationRoutes');
  logger.info('✅ Notification routes loaded');
} catch (e) { console.error('❌ Failed to load notification routes:', e.message); }

try {
  oauthRoutes = require('./routes/oauthRoutes');
  logger.info('✅ OAuth routes loaded');
} catch (e) { console.error('❌ Failed to load OAuth routes:', e.message); }

try {
  reminderRoutes = require('./routes/reminderRoutes');
  logger.info('✅ Reminder routes loaded');
} catch (e) { console.error('❌ Failed to load reminder routes:', e.message); }

try {
  aiRoutes = require('./routes/aiRoutes');
  logger.info('✅ AI routes loaded');
} catch (e) { console.error('❌ Failed to load AI routes:', e.message); }

try {
  messageRoutes = require('./routes/messageRoutes');
  logger.info('✅ Message routes loaded');
} catch (e) { console.error('❌ Failed to load message routes:', e.message); }

try {
  analyticsRoutes = require('./routes/analyticsRoutes');
  logger.info('✅ Analytics routes loaded');
} catch (e) { console.error('❌ Failed to load analytics routes:', e.message); }

// Initialize cron scheduler for automated reminders
let cronScheduler;
try {
  cronScheduler = require('./services/cronScheduler');
  logger.info('✅ Cron scheduler loaded');
} catch (e) { console.error('❌ Failed to load cron scheduler:', e.message); }

const app = express();
const PORT = process.env.PORT || 5001;

logger.info('🔧 Setting up middleware...');

// middlewares with error handling
try {
  app.use(morgan(process.env.LOG_FORMAT || 'dev'));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  logger.info('✅ Basic middleware configured');
} catch (e) {
  console.error('❌ Failed to configure basic middleware:', e.message);
}

// Session middleware (required for OAuth)
try {
  app.use(session({
    secret: process.env.SESSION_SECRET || 'omukwano-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));
  logger.info('✅ Session middleware configured');
} catch (e) {
  console.error('❌ Failed to configure session middleware:', e.message);
}

// Initialize Passport
if (passport) {
  try {
    app.use(passport.initialize());
    app.use(passport.session());
    logger.info('✅ Passport middleware configured');
  } catch (e) {
    console.error('❌ Failed to configure passport middleware:', e.message);
  }
}

// Basic routes with error handling
app.get('/', (req, res) => {
  try {
    res.json({ message: 'Pledge API Running', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('❌ Error in / route:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/test', (req, res) => {
  try {
    logger.info('📡 Test endpoint called');
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('❌ Error in /api/test route:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount routes with error handling
logger.info('🔗 Mounting routes...');

if (pledgeRoutes) {
  try {
    logger.info('Mounting pledge routes at /api/pledges');
    app.use('/api/pledges', pledgeRoutes);
    logger.info('Mounting pledge routes at /pledges (legacy alias)');
    app.use('/pledges', pledgeRoutes);
  } catch (e) { console.error('❌ Failed to mount pledge routes:', e.message); }
}

if (paymentRoutes) {
  try {
    logger.info('Mounting payment routes at /api/payments');
    app.use('/api/payments', paymentRoutes);
  } catch (e) { console.error('❌ Failed to mount payment routes:', e.message); }
}

if (userRoutes) {
  try {
    logger.info('Mounting auth routes at /api/auth');
    app.use('/api/auth', userRoutes);
  } catch (e) { console.error('❌ Failed to mount user routes:', e.message); }
}

if (notificationRoutes) {
  try {
    logger.info('Mounting notification routes at /api/notifications');
    app.use('/api/notifications', notificationRoutes);
  } catch (e) { console.error('❌ Failed to mount notification routes:', e.message); }
}

if (oauthRoutes) {
  try {
    logger.info('Mounting OAuth routes at /api/auth');
    app.use('/api/auth', oauthRoutes);
  } catch (e) { console.error('❌ Failed to mount OAuth routes:', e.message); }
}

if (reminderRoutes) {
  try {
    logger.info('Mounting reminder routes at /api/reminders');
    app.use('/api/reminders', reminderRoutes);
  } catch (e) { console.error('❌ Failed to mount reminder routes:', e.message); }
}

if (aiRoutes) {
  try {
    logger.info('Mounting AI routes at /api/ai');
    app.use('/api/ai', aiRoutes);
  } catch (e) { console.error('❌ Failed to mount AI routes:', e.message); }
}

if (messageRoutes) {
  try {
    logger.info('Mounting message routes at /api/messages');
    app.use('/api/messages', messageRoutes);
  } catch (e) { console.error('❌ Failed to mount message routes:', e.message); }
}

if (analyticsRoutes) {
  try {
    logger.info('Mounting analytics routes at /api/analytics');
    app.use('/api/analytics', analyticsRoutes);
  } catch (e) { console.error('❌ Failed to mount analytics routes:', e.message); }
}

// Enhanced 404 handler
app.use((req, res) => {
  logger.info(`❓ 404: ${req.method} ${req.url}`);
  res.status(404).json({ 
    message: 'Not Found',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
});

// Enhanced error handler
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled error in request:', err);
  console.error('Request:', req.method, req.url);
  console.error('Stack:', err.stack);
  res.status(err.status || 500).json({ 
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
});

// Start server with comprehensive error handling
if (require.main === module) {
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info('');
    logger.info('🚀 =================================');
    logger.info(`🚀 Server running on port ${PORT}`);
    logger.info(`🚀 Local: http://localhost:${PORT}`);
    logger.info('🚀 =================================');
    logger.info('');
    
    // Start automated reminders
    if (cronScheduler) {
      try {
        cronScheduler.startJobs();
      } catch (e) {
        console.error('❌ Failed to start cron jobs:', e.message);
      }
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      logger.info('💡 Try: taskkill /F /IM node.exe');
    } else {
      console.error('❌ Server error:', err);
    }
  });

  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    logger.info('\n🛑 Received SIGINT, shutting down gracefully');
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    logger.info('\n🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      logger.info('✅ Server closed');
      process.exit(0);
    });
  });
}

module.exports = app;