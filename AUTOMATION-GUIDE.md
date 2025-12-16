# 🎯 COMPLETE AUTOMATION GUIDE

## For Users Away From Computer - 2 Day Automation

This guide sets up EVERYTHING automatically. Just run one command and come back in 2 days!

---

## 🚀 QUICKEST START (Recommended)

### Step 1: Open PowerShell as Administrator
```powershell
# Right-click PowerShell and select "Run as Administrator"
```

### Step 2: Enable Script Execution (One-time setup)
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### Step 3: Run Master Launcher
```powershell
cd c:\Users\HP\PledgeHub
.\LAUNCH.bat
```

Select Option 1 for "Full Automated Setup"

---

## ⚡ ULTRA-FAST ONE-COMMAND SETUP

If you want to run everything in one command and walk away:

```powershell
cd c:\Users\HP\PledgeHub
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\full-automation.ps1" -SkipTests
```

This will:
- ✅ Setup all environment files
- ✅ Install all dependencies (backend + frontend)
- ✅ Initialize MySQL database
- ✅ Run all migrations
- ✅ Seed test data
- ✅ Start both servers
- ✅ Everything ready when you return!

---

## 📋 WHAT HAPPENS AUTOMATICALLY

### Phase 1: Environment Setup (2 minutes)
- Creates backend\.env from template
- Creates frontend\.env from template  
- Adds all necessary configuration keys

### Phase 2: Dependencies (5-10 minutes)
- Installs backend packages (npm install)
- Installs frontend packages (npm install)
- Resolves all dependency conflicts

### Phase 3: Database (2-3 minutes)
- Creates database if missing
- Runs all migrations
- Creates all tables (pledges, users, campaigns, payments, feedback)

### Phase 4: Test Data (1 minute)
- Creates 3 sample campaigns
- Creates 10 sample pledges (various statuses)
- Creates sample payment records
- Creates test users

### Phase 5: Services (Ongoing)
- Starts backend server on port 5001
- Starts frontend server on port 5173
- Both run continuously

**Total Time: ~15-20 minutes, then runs indefinitely**

---

## 🎮 AFTER AUTOMATION COMPLETES

### Access The Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health

### Test Login Credentials
```
Email: testuser@example.com
Password: testpass123
```

### Stop The Servers
```powershell
# Press Ctrl+C in each PowerShell window
# OR close the PowerShell windows
# OR run:
Get-Process node | Stop-Process -Force
```

---

## 🔧 CONFIGURATION (Optional - Do This Later)

After automation completes, you can enhance with these optional services:

### 1. AI Features (Google Gemini)
Edit `backend\.env`:
```bash
GOOGLE_AI_API_KEY=your_free_api_key_here
```
Get key: https://makersuite.google.com/app/apikey (FREE)

### 2. Email Notifications
Edit `backend\.env`:
```bash
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
```

### 3. SMS Notifications (Twilio)
Edit `backend\.env`:
```bash
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📊 VERIFY EVERYTHING WORKS

### Check Backend Health
```powershell
curl http://localhost:5001/health
# Should return: {"status":"ok"}
```

### Check Frontend
Open browser: http://localhost:5173
Should see login page

### Check Database
```powershell
cd backend
node -e "const {pool}=require('./config/db'); pool.execute('SELECT COUNT(*) FROM pledges').then(r=>console.log('Pledges:',r[0][0])).then(()=>process.exit(0))"
```

---

## 🔄 START/STOP COMMANDS

### Start Everything
```batch
.\LAUNCH.bat
# Select Option 2 (Quick Start)
```

OR

```batch
.\start-dev.bat
```

### Stop Everything
```powershell
Get-Process node | Stop-Process -Force
```

### Restart
```powershell
# Kill processes
Get-Process node | Stop-Process -Force

# Wait 3 seconds
Start-Sleep -Seconds 3

# Restart
.\start-dev.bat
```

---

## 🐛 TROUBLESHOOTING

### Problem: "Script cannot be loaded"
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
```

### Problem: "Port 5001 already in use"
```powershell
# Find and kill process
Get-Process -Id (Get-NetTCPConnection -LocalPort 5001).OwningProcess | Stop-Process -Force
```

### Problem: "Database connection failed"
1. Check MySQL is running:
   ```powershell
   Get-Service MySQL*
   ```

2. Start MySQL if stopped:
   ```powershell
   Start-Service MySQL80  # Or your MySQL service name
   ```

3. Update `backend\.env` with correct credentials

### Problem: "Dependencies won't install"
```powershell
# Clean install
.\LAUNCH.bat
# Select Option 3 (Clean Install)
```

### Problem: "Need to reset everything"
```powershell
.\LAUNCH.bat
# Select Option 6 (Reset Database)
```

---

## 📁 PROJECT STRUCTURE

```
PledgeHub/
├── LAUNCH.bat                    # 👈 START HERE - Master launcher
├── start-dev.bat                 # Quick start (after setup)
├── backend/
│   ├── .env                      # Backend configuration
│   ├── server.js                 # Main server file
│   ├── config/                   # Database, Passport, etc.
│   ├── services/                 # Business logic (17 services)
│   ├── routes/                   # API endpoints (20+ routes)
│   ├── models/                   # Database models
│   └── scripts/                  # Migration & test scripts
├── frontend/
│   ├── .env                      # Frontend configuration
│   ├── App.jsx                   # Main React app
│   ├── src/screens/              # All page components
│   └── vite.config.js            # Vite configuration
├── scripts/
│   ├── full-automation.ps1       # Complete automation script
│   ├── complete-setup.ps1        # Setup only
│   ├── auto-monitor.ps1          # Health monitoring
│   ├── dev.ps1                   # Start dev servers
│   └── README.md                 # Scripts documentation
└── docs/
    ├── API_DOCUMENTATION.md      # API reference
    ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
    └── TROUBLESHOOTING.md        # Detailed troubleshooting
```

---

## 🎯 FOR 2-DAY ABSENCE

### Before You Leave

1. **Run Full Automation**
   ```powershell
   cd c:\Users\HP\PledgeHub
   powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\full-automation.ps1" -SkipTests -Monitor
   ```

2. **Verify It's Running**
   - Open http://localhost:5173 in browser
   - Should see login page
   - Leave browser open

3. **Enable Auto-Recovery** (Optional)
   The `-Monitor` flag enables automatic service restart if anything crashes

### When You Return

1. **Check Status**
   - Open http://localhost:5173
   - Should still be running

2. **View Logs**
   ```powershell
   Get-Content logs\automation-*.log -Tail 50
   Get-Content logs\monitor.log -Tail 50
   ```

3. **Everything Should Be Running!**
   - Backend: ✅
   - Frontend: ✅
   - Database: ✅
   - Test data: ✅

---

## 🎉 SUCCESS CHECKLIST

After automation, you should have:

- [x] MySQL database created and migrated
- [x] 3 test campaigns in database
- [x] 10 test pledges in database
- [x] Backend server running on port 5001
- [x] Frontend server running on port 5173
- [x] Can login with test credentials
- [x] Can view dashboard with data
- [x] All features working (pledges, campaigns, analytics)

---

## 🆘 NEED HELP?

### Quick Reset
```powershell
.\LAUNCH.bat
# Select Option 3 (Clean Install) - Fixes most issues
```

### View Documentation
```powershell
.\LAUNCH.bat
# Select Option 8 (View Documentation)
```

### Check Logs
```powershell
dir logs\*.log | sort LastWriteTime -Descending | select -First 1 | Get-Content -Tail 100
```

---

## 📞 SUPPORT

### Documentation Files
- `scripts\README.md` - All script documentation
- `docs\README.md` - Main documentation
- `docs\TROUBLESHOOTING.md` - Common problems & solutions
- `.github\copilot-instructions.md` - AI agent instructions

### Log Files
- `logs\automation-*.log` - Setup & automation logs
- `logs\monitor.log` - Health monitoring logs
- `backend\server.log` - Backend server logs

---

**TL;DR: Run `.\LAUNCH.bat`, choose option 1, wait 20 minutes, come back to fully working application!**

---

*Last Updated: January 2025*
*For PledgeHub v1.0*
