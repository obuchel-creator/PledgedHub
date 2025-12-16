# 🎯 PledgeHub - Complete Pledge Management System

> **AUTOMATED & READY TO USE** - Just run `LAUNCH.bat` and you're done!

A comprehensive pledge management system with AI automation, SMS/email reminders, OAuth integration, and analytics. Built for Windows with full PowerShell automation.

[![Status](https://img.shields.io/badge/Status-Production%20Ready-success)]()
[![Build](https://img.shields.io/badge/Build-Automated-blue)]()
[![License](https://img.shields.io/badge/License-MIT-green)]()

---

## 🚀 QUICKEST START (2 Minutes)

```batch
# 1. Open PowerShell as Administrator
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force

# 2. Run Master Launcher
cd c:\Users\HP\PledgeHub
.\LAUNCH.bat

# 3. Choose Option 1 (Full Automated Setup)
# ✅ Done! Application will be ready in 15-20 minutes
```

**That's it!** Everything else is automated.

---

## 📋 What You Get

### ✅ Complete Application Stack
- **Backend**: Node.js + Express + MySQL (17 services, 20+ routes)
- **Frontend**: React + Vite (30+ screens, React Router v7)
- **Database**: MySQL with complete schema and test data
- **Authentication**: JWT + OAuth (Google/Facebook)
- **AI**: Google Gemini Pro integration (optional)
- **Automation**: Cron jobs for reminders (Africa/Kampala timezone)

### ✅ Features Out of the Box
- Pledge management (CRUD)
- Campaign management
- Payment tracking with partial payments
- Analytics dashboard
- Automated reminders (daily 9AM & 5PM)
- Email notifications (SMTP)
- SMS notifications (Twilio)
- OAuth login (Google/Facebook)
- Role-based access (User/Staff/Admin)

### ✅ Complete Automation
- One-command setup
- Automated dependency installation
- Database initialization & migrations
- Test data seeding
- Auto-start servers
- Health monitoring & auto-recovery

---

## 🎯 For Users Away From Computer

### Run This Before You Leave:
```powershell
cd c:\Users\HP\PledgeHub
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts\full-automation.ps1" -Monitor
```

### When You Return (After 2 Days):
- ✅ Application still running at http://localhost:5173
- ✅ All services operational
- ✅ Ready to use

See **[AUTOMATION-GUIDE.md](AUTOMATION-GUIDE.md)** for complete details.

---

## 📚 Key Documentation

| Document | Purpose |
|----------|---------|
| **[AUTOMATION-GUIDE.md](AUTOMATION-GUIDE.md)** | Complete automation & setup guide |
| **[BUILD-COMPLETE.md](BUILD-COMPLETE.md)** | Build verification & status |
| **[scripts/README.md](scripts/README.md)** | All scripts explained |
| **[docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)** | API reference |
| **[docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)** | Production deployment |
| **[docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** | Common issues |
| **[.github/copilot-instructions.md](.github/copilot-instructions.md)** | AI agent instructions |

---

## 🎮 Quick Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health

### Test Credentials
```
Email: testuser@example.com
Password: testpass123
```

---

## 🔧 Helper Scripts

- `LAUNCH.bat` - Interactive menu launcher
- `start-dev.bat` - Quick start development servers
- `run-tests.bat` - Run all tests
- `scripts\full-automation.ps1` - Complete automation
- `scripts\auto-monitor.ps1` - Health monitoring
- `scripts\reset-database.ps1` - Reset database

---

## 🏗️ Tech Stack

**Backend**: Node.js, Express, MySQL, JWT, Passport.js, Google Gemini Pro  
**Frontend**: React 18, Vite 4, React Router v7, Recharts  
**DevOps**: PowerShell automation, Jest testing, Health monitoring

---

## 📦 Project Structure

```
PledgeHub/
├── LAUNCH.bat                  # 👈 START HERE
├── AUTOMATION-GUIDE.md         # Complete guide
├── BUILD-COMPLETE.md           # Build status
├── backend/                    # Node.js + Express + MySQL
├── frontend/                   # React + Vite
├── scripts/                    # PowerShell automation
└── docs/                       # Complete documentation
```

---

## 🎉 What's Included

After running automation, you get:
- 3 sample campaigns
- 10 sample pledges (various statuses)
- Automated cron jobs (9AM, 5PM, 10AM)
- Complete API (50+ endpoints)
- Full authentication (JWT + OAuth)
- Analytics dashboard
- Health monitoring

---

## 🐛 Troubleshooting

**Servers not responding?**
```powershell
Get-Process node | Stop-Process -Force
.\start-dev.bat
```

**Database issues?**
```powershell
.\scripts\reset-database.ps1
```

**More help**: See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

---

## 🆘 Support

1. Check [AUTOMATION-GUIDE.md](AUTOMATION-GUIDE.md)
2. Check [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
3. Review logs in `logs/` directory
4. Open GitHub issue

---

## 📄 License

MIT License

---

**TL;DR**: Run `LAUNCH.bat`, wait 20 minutes, get a fully working system.  
**Last Updated**: January 2025 | **Version**: 1.0.0
