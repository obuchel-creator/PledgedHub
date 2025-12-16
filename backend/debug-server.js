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

console.log('🔄 Starting server initialization...');

// Try to ensure DB connection (non-blocking)
try {
  require('./config/db');
  console.log('✅ Database module loaded');
} catch (dbError) {
  console.warn('⚠️  Database connection failed:', dbError.message);
  console.warn('💡 OAuth functionality will still work without database');
}

// Initialize passport
let passport;
try {
  passport = require('./config/passport');
  console.log('✅ Passport module loaded');
} catch (passportError) {
  console.error('❌ Passport loading failed:', passportError.message);
}

// Load routes with error handling
let pledgeRoutes, paymentRoutes, userRoutes, notificationRoutes, oauthRoutes, reminderRoutes, aiRoutes, messageRoutes, analyticsRoutes;

try {
  pledgeRoutes = require('./routes/pledgeRoutes');
  console.log('✅ Pledge routes loaded');
} catch (e) { console.error('❌ Failed to load pledge routes:', e.message); }

try {
  paymentRoutes = require('./routes/paymentRoutes');
  console.log('✅ Payment routes loaded');
} catch (e) { console.error('❌ Failed to load payment routes:', e.message); }

try {
  userRoutes = require('./routes/userRoutes');
  console.log('✅ User routes loaded');
} catch (e) { console.error('❌ Failed to load user routes:', e.message); }

try {
  notificationRoutes = require('./routes/notificationRoutes');
  console.log('✅ Notification routes loaded');
} catch (e) { console.error('❌ Failed to load notification routes:', e.message); }

try {
  oauthRoutes = require('./routes/oauthRoutes');
  console.log('✅ OAuth routes loaded');
} catch (e) { console.error('❌ Failed to load OAuth routes:', e.message); }

try {
  reminderRoutes = require('./routes/reminderRoutes');
  console.log('✅ Reminder routes loaded');
} catch (e) { console.error('❌ Failed to load reminder routes:', e.message); }

try {
  aiRoutes = require('./routes/aiRoutes');
  console.log('✅ AI routes loaded');
} catch (e) { console.error('❌ Failed to load AI routes:', e.message); }

try {
  messageRoutes = require('./routes/messageRoutes');
  console.log('✅ Message routes loaded');
} catch (e) { console.error('❌ Failed to load message routes:', e.message); }

try {
  analyticsRoutes = require('./routes/analyticsRoutes');
  console.log('✅ Analytics routes loaded');
} catch (e) { console.error('❌ Failed to load analytics routes:', e.message); }

// Initialize cron scheduler for automated reminders
let cronScheduler;
try {
  cronScheduler = require('./services/cronScheduler');
  console.log('✅ Cron scheduler loaded');
} catch (e) { console.error('❌ Failed to load cron scheduler:', e.message); }

const app = express();
const PORT = process.env.PORT || 5001;

console.log('🔧 Setting up middleware...');

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
  console.log('✅ Basic middleware configured');
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
  console.log('✅ Session middleware configured');
} catch (e) {
  console.error('❌ Failed to configure session middleware:', e.message);
}

// Initialize Passport
if (passport) {
  try {
    app.use(passport.initialize());
    app.use(passport.session());
    console.log('✅ Passport middleware configured');
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
    console.log('📡 Test endpoint called');
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
  } catch (e) {
    console.error('❌ Error in /api/test route:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount routes with error handling
console.log('🔗 Mounting routes...');

if (pledgeRoutes) {
  try {
    console.log('Mounting pledge routes at /api/pledges');
    app.use('/api/pledges', pledgeRoutes);
    console.log('Mounting pledge routes at /pledges (legacy alias)');
    app.use('/pledges', pledgeRoutes);
  } catch (e) { console.error('❌ Failed to mount pledge routes:', e.message); }
}

if (paymentRoutes) {
  try {
    console.log('Mounting payment routes at /api/payments');
    app.use('/api/payments', paymentRoutes);
  } catch (e) { console.error('❌ Failed to mount payment routes:', e.message); }
}

if (userRoutes) {
  try {
    console.log('Mounting auth routes at /api/auth');
    app.use('/api/auth', userRoutes);
  } catch (e) { console.error('❌ Failed to mount user routes:', e.message); }
}

if (notificationRoutes) {
  try {
    console.log('Mounting notification routes at /api/notifications');
    app.use('/api/notifications', notificationRoutes);
  } catch (e) { console.error('❌ Failed to mount notification routes:', e.message); }
}

if (oauthRoutes) {
  try {
    console.log('Mounting OAuth routes at /api/auth');
    app.use('/api/auth', oauthRoutes);
  } catch (e) { console.error('❌ Failed to mount OAuth routes:', e.message); }
}

if (reminderRoutes) {
  try {
    console.log('Mounting reminder routes at /api/reminders');
    app.use('/api/reminders', reminderRoutes);
  } catch (e) { console.error('❌ Failed to mount reminder routes:', e.message); }
}

if (aiRoutes) {
  try {
    console.log('Mounting AI routes at /api/ai');
    app.use('/api/ai', aiRoutes);
  } catch (e) { console.error('❌ Failed to mount AI routes:', e.message); }
}

if (messageRoutes) {
  try {
    console.log('Mounting message routes at /api/messages');
    app.use('/api/messages', messageRoutes);
  } catch (e) { console.error('❌ Failed to mount message routes:', e.message); }
}

if (analyticsRoutes) {
  try {
    console.log('Mounting analytics routes at /api/analytics');
    app.use('/api/analytics', analyticsRoutes);
  } catch (e) { console.error('❌ Failed to mount analytics routes:', e.message); }
}

// Enhanced 404 handler
app.use((req, res) => {
  console.log(`❓ 404: ${req.method} ${req.url}`);
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
    console.log('');
    console.log('🚀 =================================');
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 Local: http://localhost:${PORT}`);
    console.log('🚀 =================================');
    console.log('');
    
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
      console.log('💡 Try: taskkill /F /IM node.exe');
    } else {
      console.error('❌ Server error:', err);
    }
  });

  // Graceful shutdown handlers
  process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });
}

module.exports = app;