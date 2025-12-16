# PledgeHub - Setup & Running Guide (Fixed Version)

## What's Changed

This version includes critical bug fixes and code quality improvements:

✅ **Fixed Authentication** - Session and Passport.js now properly enabled  
✅ **Fixed Database Queries** - Changed from `pool.query()` to `pool.execute()`  
✅ **Fixed CORS** - Restricted to known origins instead of open policy  
✅ **Added Input Validation** - New request validator utility  
✅ **Improved Error Handling** - Consistent error response format  
✅ **Cleaned Up Logging** - Removed excessive debug statements  

## Prerequisites

- **Node.js** v18+ 
- **MySQL** v5.7+ (or MariaDB)
- **npm** v9+

## Quick Start

### 1. Clone and Install Dependencies

```bash
cd c:\Users\HP\PledgeHub
npm install

cd backend
npm install

cd ../frontend  
npm install

cd ..
```

### 2. Configure Environment

Create `backend/.env`:
```bash
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=your_password
DB_NAME=pledgehub_db

# Security
JWT_SECRET=your_jwt_secret_key_change_in_production
SESSION_SECRET=your_session_secret_key_change_in_production
NODE_ENV=development

# API
PORT=5001
FRONTEND_URL=http://localhost:5173

# Email (Optional)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# AI (Optional)
GOOGLE_AI_API_KEY=your_google_ai_key

# OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/oauth/google/callback

FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/oauth/facebook/callback
```

Create `frontend/.env.local`:
```bash
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_MAPS_API_KEY=optional_for_maps
```

### 3. Initialize Database

```bash
# Start MySQL
# Windows: Open Services > MySQL80 or run: net start MySQL80
# Mac: brew services start mysql
# Linux: sudo systemctl start mysql

# Create database and user
mysql -u root -p
> CREATE DATABASE pledgehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> CREATE USER 'pledgehub'@'localhost' IDENTIFIED BY 'pledgehub_password';
> GRANT ALL PRIVILEGES ON pledgehub_db.* TO 'pledgehub'@'localhost';
> FLUSH PRIVILEGES;
> EXIT;

# OR Run the initialization script
mysql -u root -p pledgehub_db < init-database.sql
```

### 4. Run Backend

```bash
cd backend
npm run dev
```

Expected output:
```
╔════════════════════════════════════════╗
║     PledgeHub Backend Server Ready     ║
╠════════════════════════════════════════╣
║ Server: http://localhost:5001
║ Node Env: development
║ Database: pledgehub_db
║ Time: 2025-12-16T10:00:00.000Z
╚════════════════════════════════════════╝

✅ Cron scheduler initialized
```

### 5. Run Frontend

In a new terminal:
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v5.0.0  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **API**: http://localhost:5001
- **Health Check**: http://localhost:5001/api/health

## Common Issues & Solutions

### Issue: "Database connection failed"
```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify credentials in .env
# Update DB_HOST, DB_USER, DB_PASS, DB_NAME
```

### Issue: "CORS error" or "Cannot POST /api/..."
```bash
# Restart backend server
cd backend
npm run dev

# Check CORS configuration in server.js
# Ensure FRONTEND_URL is correct in .env
```

### Issue: "Cannot find module 'mysql2'"
```bash
cd backend
npm install mysql2
npm install
```

### Issue: "Port 5001 already in use"
```bash
# Kill the process using port 5001
# Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5001
kill -9 <PID>

# Or change PORT in .env
PORT=5002
```

### Issue: "OAuth not working"
```bash
# Check credentials are set in .env:
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# FACEBOOK_APP_ID, FACEBOOK_APP_SECRET

# Verify callback URLs match your provider settings:
# Google Console: http://localhost:5001/api/oauth/google/callback
# Facebook App: http://localhost:5001/api/oauth/facebook/callback
```

## Testing the API

### 1. Health Check
```bash
curl http://localhost:5001/api/health
# Expected: { "status": "healthy", "uptime": X, "timestamp": "..." }
```

### 2. Register User
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "name": "Test User",
    "phone": "+256700000000"
  }'
```

### 3. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123!"
  }'
# Response will include: { "success": true, "token": "jwt_token_here", "user": {...} }
```

### 4. Create Pledge (Requires Auth)
```bash
curl -X POST http://localhost:5001/api/pledges \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Education Fund",
    "amount": 50000,
    "donor_name": "John Donor",
    "donor_email": "john@example.com",
    "donor_phone": "+256700000000",
    "purpose": "School fees",
    "collection_date": "2025-12-31"
  }'
```

### 5. Get Pledges (Requires Auth)
```bash
curl http://localhost:5001/api/pledges \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Key Features

### Authentication
- ✅ JWT-based authentication
- ✅ OAuth2 (Google + Facebook)
- ✅ Password reset via email
- ✅ Two-factor authentication (2FA)
- ✅ Role-based access control (Admin, Staff, Donor)

### Core Features
- ✅ Pledge management (Create, Read, Update, Delete)
- ✅ Campaign management
- ✅ Payment tracking (partial & full payments)
- ✅ SMS/Email notifications
- ✅ Analytics & reporting
- ✅ User management (Admin)

### AI Features
- ✅ AI-powered message generation
- ✅ Smart reminders
- ✅ Analytics insights
- ✅ Chatbot integration (WhatsApp)

### Payment Integration
- ✅ MTN Mobile Money
- ✅ Airtel Money
- ✅ PayPal
- ✅ PaymentTracker for partial payments

### Advanced Features
- ✅ Accounting (Double-entry bookkeeping)
- ✅ Financial reports
- ✅ Campaign analytics
- ✅ Donor management
- ✅ Subscription tiers
- ✅ Social sharing

## Development Commands

```bash
# Backend
cd backend
npm run dev              # Start development server
npm test                # Run tests
npm run coverage        # Test coverage report
npm run load:test       # Load testing

# Frontend
cd frontend
npm run dev            # Start development server
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run linter

# Root level
npm install            # Install all dependencies
```

## Project Structure

```
PledgeHub/
├── backend/
│   ├── config/        # Database, Passport, Security config
│   ├── controllers/   # Request handlers
│   ├── middleware/    # Auth, validation, security
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic, AI, Payments
│   ├── utils/         # Helpers (validators, logger)
│   ├── scripts/       # Database migrations, tests
│   ├── server.js      # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── screens/      # Page components
│   │   ├── contexts/     # React context (Auth, etc)
│   │   ├── utils/        # Frontend helpers
│   │   ├── App.jsx       # Main app
│   │   └── main.jsx      # Entry point
│   ├── vite.config.js    # Vite config
│   └── package.json
│
└── docs/              # Documentation
    ├── API_DOCUMENTATION.md
    ├── DEPLOYMENT_GUIDE.md
    └── ...
```

## Important Notes

### Security
1. **Change JWT_SECRET** before deploying to production
2. **Change SESSION_SECRET** before deploying to production
3. **Enable HTTPS** in production
4. **Use environment variables** for sensitive data
5. **Update CORS** to your production domain

### Database
1. MySQL must be running before starting backend
2. Database will NOT auto-initialize on first run
3. Run `init-database.sql` to create tables
4. Keep backups of your database

### Performance
1. Frontend is optimized with Vite (fast rebuild)
2. Backend uses MySQL connection pooling
3. Cron jobs run in background (no manual intervention needed)
4. All database queries use parameterized statements (SQL injection safe)

### Logging
Set `LOG_LEVEL` environment variable:
```bash
# Show all logs
LOG_LEVEL=TRACE

# Show only important logs
LOG_LEVEL=INFO

# Show only errors
LOG_LEVEL=ERROR
```

## Production Deployment

### Before Deploying:
- [ ] All environment variables set
- [ ] Database backed up
- [ ] HTTPS certificate installed
- [ ] CORS whitelist updated
- [ ] JWT_SECRET changed
- [ ] Passwords are strong (min 8 chars, uppercase, number)
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error monitoring setup (Sentry, etc)
- [ ] Backup strategy defined

### Deployment Checklist:
See `DEPLOYMENT_CHECKLIST.md` for detailed instructions.

## Support & Troubleshooting

### For Issues:
1. Check `CODE_QUALITY_REPORT.md` for known issues
2. Check logs: `tail -f backend/server.log`
3. Verify database connection
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check console for errors (F12 in browser)

### For Feature Requests:
- See `FEATURES_OVERVIEW.md` for available features
- Check `NEW_FEATURES_PLAN.md` for planned features

## Next Steps

1. **Test Authentication**
   - Register a new user
   - Login via email/password
   - Test OAuth (Google/Facebook)

2. **Create Sample Data**
   - Create 2-3 campaigns
   - Create 5-10 pledges
   - Record some payments

3. **Explore Features**
   - View analytics
   - Run reports
   - Test notifications

4. **Customize**
   - Update branding
   - Adjust validation rules
   - Configure email/SMS

## Additional Resources

- **API Documentation**: See `docs/API_DOCUMENTATION.md`
- **OAuth Setup**: See `OAUTH_SETUP_GUIDE.md`
- **Payment Integration**: See `PAYMENT_INTEGRATION_COMPLETE.md`
- **Database Schema**: See `backend/scripts/complete-migration.js`
- **Environment Variables**: See `backend/.env.example`

---

**Happy coding! 🚀**

For questions, check the documentation files or open an issue in GitHub.
