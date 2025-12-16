# PledgeHub Automation Scripts

This directory contains comprehensive automation scripts to build, test, deploy, and monitor the PledgeHub application.

## 🚀 Quick Start

For a complete automated setup from scratch:

```powershell
.\scripts\full-automation.ps1
```

This will:
- Configure environment files
- Install all dependencies
- Initialize and migrate database
- Seed test data
- Run tests
- Start both servers
- Monitor health

## 📋 Available Scripts

### Complete Automation

#### `full-automation.ps1` - Master Automation Script
Complete setup, build, test, and deployment automation.

```powershell
# Standard automation
.\scripts\full-automation.ps1

# Clean install (removes node_modules)
.\scripts\full-automation.ps1 -CleanInstall

# Skip tests
.\scripts\full-automation.ps1 -SkipTests

# Production build
.\scripts\full-automation.ps1 -Production

# With monitoring
.\scripts\full-automation.ps1 -Monitor

# Combined options
.\scripts\full-automation.ps1 -CleanInstall -Production -Monitor -MonitorInterval 60
```

#### `complete-setup.ps1` - Initial Setup
Sets up the application for first-time use.

```powershell
.\scripts\complete-setup.ps1

# Skip tests
.\scripts\complete-setup.ps1 -SkipTests

# Skip seeding
.\scripts\complete-setup.ps1 -SkipSeeding

# Production mode
.\scripts\complete-setup.ps1 -Production
```

### Development Scripts

#### `dev.ps1` - Start Development Servers
Opens both frontend and backend in separate windows.

```powershell
.\scripts\dev.ps1
```

#### `dev-backend.ps1` - Backend Only
```powershell
.\scripts\dev-backend.ps1
```

#### `dev-frontend.ps1` - Frontend Only
```powershell
.\scripts\dev-frontend.ps1
```

### Database Scripts

#### `init-db.ps1` - Initialize Database
```powershell
.\scripts\init-db.ps1
```

#### `reset-database.ps1` - Reset Database
**WARNING**: Destroys all data and resets to fresh state.

```powershell
.\scripts\reset-database.ps1
```

### Testing Scripts

#### `run-tests.ps1` - Run Test Suite
```powershell
.\scripts\run-tests.ps1
```

### Monitoring Scripts

#### `auto-monitor.ps1` - Health Monitoring
Continuously monitors application health and auto-restarts failed services.

```powershell
# Default (30 second intervals)
.\scripts\auto-monitor.ps1

# Custom interval (60 seconds)
.\scripts\auto-monitor.ps1 -CheckInterval 60

# With email alerts
.\scripts\auto-monitor.ps1 -EmailAlerts -AlertEmail "admin@example.com"
```

### Maintenance Scripts

#### `backup-db.ps1` - Database Backup
```powershell
.\scripts\backup-db.ps1
```

#### `restart-server.ps1` - Restart Servers
```powershell
.\scripts\restart-server.ps1
```

## 🎯 Common Scenarios

### First Time Setup

```powershell
# 1. Clone the repository
git clone <repo-url>
cd PledgeHub

# 2. Run complete automation
.\scripts\full-automation.ps1

# 3. Update backend\.env with your credentials
# Edit: backend\.env

# 4. Application is now running!
# Frontend: http://localhost:5173
# Backend: http://localhost:5001
```

### Daily Development

```powershell
# Start both servers
.\scripts\dev.ps1

# OR use the batch file
.\start-dev.bat
```

### Before Committing Code

```powershell
# Run all tests
.\scripts\run-tests.ps1

# OR run backend tests only
cd backend
npm test
```

### Deployment to Production

```powershell
# Build and prepare for production
.\scripts\full-automation.ps1 -Production -SkipTests

# Start production servers
.\start-production.bat
```

### Troubleshooting

```powershell
# Clean install (fixes dependency issues)
.\scripts\full-automation.ps1 -CleanInstall

# Reset database (fixes data issues)
.\scripts\reset-database.ps1

# Start with monitoring
.\scripts\full-automation.ps1 -Monitor
```

## 🔧 Configuration

### Environment Files

After running automation scripts, configure these files:

#### `backend\.env`
```bash
# Required
DB_USER=root
DB_PASS=your_password
DB_NAME=pledgehub_db
JWT_SECRET=your_secret_min_32_chars
SESSION_SECRET=your_session_secret_min_32_chars

# Optional (for features)
GOOGLE_AI_API_KEY=your_gemini_key
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
```

#### `frontend\.env`
```bash
VITE_API_URL=http://localhost:5001/api
```

## 📊 Health Monitoring

The `auto-monitor.ps1` script provides:

- Automatic health checks every 30 seconds (configurable)
- Auto-restart of failed services after 3 consecutive failures
- Detailed logging to `monitor.log`
- Email alerts (optional)

## 🔍 Logs

All automation scripts create logs in the `logs/` directory:

- `automation-YYYYMMDD-HHmmss.log` - Full automation logs
- `monitor.log` - Health monitoring logs
- `backend/server.log` - Backend server logs

## ⚙️ Advanced Options

### Custom Test User

Default test credentials:
```
Email: testuser@example.com
Password: testpass123
```

### Port Configuration

Default ports:
- Backend: 5001
- Frontend: 5173

Change in:
- `backend\.env` - PORT=5001
- `frontend\vite.config.js` - port: 5173

### Cron Job Configuration

Automated reminders configured for Africa/Kampala timezone:
- Daily reminders: 9:00 AM
- Evening reminders: 5:00 PM
- Balance reminders: 10:00 AM

Disable in `backend\.env`:
```bash
ENABLE_CRON_JOBS=false
```

## 🐛 Troubleshooting

### "npm install failed"
```powershell
# Clean install
.\scripts\full-automation.ps1 -CleanInstall
```

### "Database connection failed"
1. Ensure MySQL is running
2. Check credentials in `backend\.env`
3. Run `.\scripts\init-db.ps1`

### "Port already in use"
```powershell
# Kill all node processes
Get-Process node | Stop-Process -Force

# Restart
.\scripts\dev.ps1
```

### "Tests failing"
```powershell
# Reset database
.\scripts\reset-database.ps1

# Run tests again
cd backend
npm test
```

## 📚 Additional Resources

- API Documentation: `docs\API_DOCUMENTATION.md`
- Deployment Guide: `docs\DEPLOYMENT_GUIDE.md`
- Troubleshooting Guide: `docs\TROUBLESHOOTING.md`
- AI Setup: `docs\AI_PROMPT_CUSTOMIZATION_GUIDE.md`

## 🎉 Helper Batch Files

After running automation, these batch files are created:

- `start-dev.bat` - Start development servers
- `run-tests.bat` - Run test suite
- `start-production.bat` - Start in production mode (if built)

## 🔐 Security Notes

1. Never commit `.env` files to version control
2. Use strong secrets (min 32 characters) for JWT_SECRET and SESSION_SECRET
3. Use app-specific passwords for Gmail SMTP
4. Keep API keys secure

## 📝 Notes

- All PowerShell scripts require execution policy: `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
- Scripts are Windows-optimized (PowerShell 5.1+)
- For Linux/Mac, see equivalent bash scripts in `scripts/unix/` (if available)
- Automation scripts are idempotent - safe to run multiple times

---

**Last Updated**: January 2025
