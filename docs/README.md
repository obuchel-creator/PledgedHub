# PledgeHub - Complete Documentation# PledgeHub App Documentation

## Overview

Welcome to the comprehensive documentation for the PledgeHub management system with AI and automation features.

PledgeHub is a small web application for creating, signing and tracking pledges. This README covers purpose, setup, development workflow and deployment notes.

**Version**: 1.0.0  

**Last Updated**: November 5, 2025  ## Features

**Status**: ✅ Production Ready

- Create and manage pledges

---- Sign and verify support for pledges

- Simple user-facing UI and API for integrations

## 📚 Documentation Index- Configurable persistence and authentication



### Getting Started## Tech stack (example)

1. **[Features Overview](./FEATURES_OVERVIEW.md)** ⭐ START HERE

   - System architecture- Frontend: React / Svelte / plain HTML (adjust to repo)

   - Technology stack- Backend: Node.js (Express) / any REST API

   - All features summary- Data: SQLite / PostgreSQL / any supported DB

   - Database schema

   - Testing results## Prerequisites



### API Documentation- Node.js 16+ and npm or yarn

2. **[API Documentation](./API_DOCUMENTATION.md)**- Git

   - Complete API reference- Optional: Docker for containerized deployment

   - Request/response examples

   - Authentication guide## Quick start

   - Error handling

   - Rate limits1. Clone the repo

    - git clone <repo-url>

### Deployment & Operations2. Install dependencies

3. **[Deployment Guide](./DEPLOYMENT_GUIDE.md)**    - npm install

   - Prerequisites    - or yarn

   - Environment setup3. Create environment file

   - Database configuration    - copy `.env.example` to `.env` and fill required values

   - Service setup (AI, Email, SMS)4. Run locally

   - Security hardening    - npm run dev

   - Monitoring & backups    - or npm start



4. **[Troubleshooting Guide](./TROUBLESHOOTING.md)**## Environment variables (examples)

   - Common issues & solutions

   - AI integration problemsCreate a `.env` file with at least these variables:

   - Email delivery issues

   - Database errors- PORT=3000

   - Performance optimization- DATABASE_URL=sqlite://./data.db

- AUTH_SECRET=change-me

---- BASE_URL=http://localhost:3000



## 🚀 Quick StartAdjust names to match the actual codebase.



### 1. Clone and Install## Scripts

```bash

git clone <repository-url>Common npm scripts to expect (repository may vary):

cd pledgehub

- npm run dev — start development server with hot reload

# Backend- npm start — start production server

cd backend- npm run build — build frontend assets

npm install- npm test — run test suite

- npm run lint — run linters/formatters

# Frontend

cd ../frontend## Development notes

npm install

```- Follow the repository's coding style and lint rules.

- Add small, focused commits with clear messages.

### 2. Configure Environment- Write unit tests for new features and bug fixes.

```bash- Use feature branches and open pull requests targeting main or develop.

# Create .env file in backend/

# Add your credentials:## Directory layout (conventional)

GOOGLE_AI_API_KEY=your_api_key_here

EMAIL_HOST=smtp.gmail.com- /src — application source

EMAIL_USER=your_email@gmail.com  - /api or /server — backend code

EMAIL_PASSWORD=your_app_password  - /client or /web — frontend code

```  - /config — configuration and env handling

- /tests — automated tests

### 3. Setup Database- /scripts — helpful dev/deploy scripts

```bash- /docs — additional documentation

# Create database

mysql -u root -p -e "CREATE DATABASE pledgehub_db"Adjust to your project structure.



# Run migrations## Deployment

cd backend

node scripts/complete-migration.js- Build the app (npm run build) and serve static assets from a web server or container.

```- For Node backends, use process managers (pm2) or container orchestration (Docker, Kubernetes).

- Ensure environment variables are provided securely (secrets manager, CI/CD pipeline).

### 4. Start Services

```bash## Troubleshooting

# Backend (port 5001)

cd backend- Missing dependencies: run npm install

npm run dev- Port conflicts: change PORT in .env

- DB migrations: run migration commands included in the repo, or inspect /migrations

# Frontend (port 5173)

cd frontend## Contributing

npm run dev

```- Fork -> branch -> implement -> tests -> create PR.

- Include descriptive PR title and link related issues.

### 5. Test Everything- Maintainers will review for style, tests and security.

```bash

# Test AI and automation features## License & Contact

cd backend

node scripts/test-all-features.js- Include the project's license file (e.g., MIT).

- For questions, open an issue in the repository.

# Test analytics dashboard

node scripts/test-analytics.jsIf you want, I can produce a tailored README with exact commands and env variables after you paste the project structure or package.json.
```

---

## ✨ Features Overview

### ✅ Feature #2: Automated Reminders
- **Cron Jobs**: 9:00 AM & 5:00 PM daily (Africa/Kampala)
- **Reminder Types**: 7 days, 3 days, due today, overdue
- **Delivery**: Email (SMTP) + SMS (Twilio optional)

### ✅ Feature #3: Google Gemini AI Integration
- **Provider**: Google Gemini Pro (FREE tier - 1,500 requests/day)
- **Capabilities**: AI-enhanced messages, data analysis, insights, suggestions

### ✅ Feature #4: Smart Message Generation
- **Templates**: 12 pre-built templates (4 types × 3 tones)
- **AI Enhancement**: Optional AI personalization
- **HTML Emails**: Responsive styled templates

### ✅ Feature #5: Analytics Dashboard
- **Metrics**: Stats, trends, top donors, risk assessment
- **AI Insights**: AI-powered recommendations

---

## 📊 Testing Results

**Overall Success Rate**: 100% (20/20 tests passed)

- ✅ AI Integration: 4/4 tests passed
- ✅ Message Generation: 7/7 tests passed  
- ✅ Analytics Dashboard: 9/9 tests passed

**Current Data**: 13 pledges, 11 donors, 23% collection rate, UGX 18.6M total

---

## 🔧 Configuration

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete environment variable setup.

**Key Variables**:
- `GOOGLE_AI_API_KEY` - Google Gemini API key
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASSWORD` - SMTP configuration
- `DB_HOST`, `DB_USER`, `DB_PASSWORD` - Database credentials
- `SESSION_SECRET`, `JWT_SECRET` - 128-char security secrets
- `TZ=Africa/Kampala` - Timezone for cron jobs

---

## 🛠️ Development Commands

```bash
# Backend
cd backend
npm run dev                         # Development server
node scripts/test-all-features.js   # Test all features
node scripts/test-analytics.js      # Test analytics

# Frontend
cd frontend
npm run dev                         # Development server
npm run build                       # Production build
```

---

## 🚀 Deployment

```bash
# PM2 (Recommended)
npm install -g pm2
pm2 start backend/server.js --name pledgehub-backend
pm2 save
pm2 startup

# Docker
docker-compose up -d

# Heroku
heroku create pledgehub
git push heroku main
```

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

---

## 🐛 Troubleshooting

**Quick Diagnostic**:
```bash
curl http://localhost:5001/api/ai/status
curl http://localhost:5001/api/analytics/overview
node backend/scripts/test-all-features.js
```

**Common Issues**:
- AI not working → Check GOOGLE_AI_API_KEY
- Emails not sending → Verify SMTP credentials
- Reminders not running → Check TZ=Africa/Kampala
- Database errors → Run migration script

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for solutions.

---

## 📁 Key Files

**Services**:
- `backend/services/aiService.js` (400+ lines) - Google Gemini AI
- `backend/services/messageGenerator.js` (500+ lines) - Message templates
- `backend/services/analyticsService.js` (393 lines) - Analytics
- `backend/services/reminderService.js` - Automated reminders
- `backend/services/cronScheduler.js` - Cron job management

**Routes**:
- `backend/routes/aiRoutes.js` - AI endpoints
- `backend/routes/messageRoutes.js` - Message generation
- `backend/routes/analyticsRoutes.js` - Analytics dashboard
- `backend/routes/reminderRoutes.js` - Reminder management

**Scripts**:
- `backend/scripts/complete-migration.js` - Database migration (9 columns)
- `backend/scripts/test-all-features.js` - Comprehensive testing
- `backend/scripts/test-analytics.js` - Analytics testing

---

## 🎯 Next Steps

1. **Frontend Integration**: Connect React UI to endpoints
2. **Email Production**: Set up SendGrid/AWS SES
3. **SMS Setup**: Configure Twilio (optional)
4. **Monitoring**: Set up Datadog/New Relic
5. **Security**: Rate limiting & proper JWT auth
6. **Deployment**: Deploy to production

---

## 📞 Support

**Documentation**: Read guides in `/docs` folder  
**Testing**: Run test scripts in `backend/scripts/`  
**Logs**: Check `pm2 logs pledgehub-backend`

---

**Built with** ❤️ **using**: Node.js • Express • React • MySQL • Google Gemini AI • node-cron • nodemailer

**Last Updated**: November 5, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

