# 🚀 PledgeHub Quick Developer Reference

**Last Updated**: December 17, 2025  
**Purpose**: Fast reference for developers getting started with PledgeHub

---

## ⚡ 5-Minute Setup

```bash
# 1. Clone
git clone <repo-url>
cd pledgehub

# 2. Install
cd backend && npm install && cd ../frontend && npm install

# 3. Env
# Copy .env.example to .env in both backend/ and frontend/
# Update with your database credentials

# 4. Database
mysql -u root -p pledgehub_db < backend/scripts/initial-schema.sql

# 5. Run
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
# Visit http://localhost:5173
```

---

## 📁 Directory Structure at a Glance

```
pledgehub/
├── backend/
│   ├── config/              # Database, Passport
│   ├── middleware/          # Auth, validation
│   ├── routes/              # API endpoints (23 files)
│   ├── services/            # Business logic (22+ files)
│   ├── scripts/             # Migrations, tests, seeders
│   ├── server.js            # Entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI
│   │   ├── screens/         # Pages
│   │   ├── context/         # React Context
│   │   ├── services/        # API client
│   │   ├── styles/          # CSS
│   │   └── i18n/            # Translations
│   ├── index.html
│   └── .env.example
├── docs/                    # Complete documentation
└── README.md                # Setup guide
```

---

## 🔑 Key Commands

### Backend

```bash
npm run dev               # Start with hot-reload
npm test                  # Run unit tests
npm run lint              # ESLint check
npm run format            # Prettier format

# Testing
node scripts/test-all-features.js          # Integration tests
node scripts/test-analytics.js             # Analytics tests
node backend/scripts/seed-data.js          # Seed database
```

### Frontend

```bash
npm run dev               # Vite dev server (port 5173)
npm run build             # Production bundle
npm run preview           # Preview production build
npm run test              # Jest tests
npm run lint              # ESLint
npm run format            # Prettier
```

---

## 🗄️ Database Quick Reference

### Connection
```javascript
const { pool } = require('../config/db');
const [rows] = await pool.execute('SELECT * FROM pledges WHERE id = ?', [id]);
```

### Key Tables
```sql
-- Pledges (core)
pledges: id, donor_name, amount, balance_remaining, status, collection_date

-- Users (auth)
users: id, email, password_hash, role, created_at

-- Campaigns (grouping)
campaigns: id, title, description, goal_amount

-- Payments (transactions)
payments: id, pledge_id, amount, method, status

-- Feedback (user input)
feedback: id, user_id, message, rating
```

### Common Queries
```sql
-- All active pledges
SELECT * FROM pledges WHERE deleted_at IS NULL AND status = 'active';

-- Total collected
SELECT SUM(amount_paid) FROM pledges WHERE deleted_at IS NULL;

-- Overdue pledges
SELECT * FROM pledges WHERE collection_date < NOW() AND status != 'paid';
```

---

## 🔐 Authentication

### Get Token
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "pass"}'
```

### Use Token
```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### Roles
- **admin**: Full access
- **staff**: Campaign & analytics
- **donor**: View own pledges

---

## 📡 API Quick Reference

### Pledges
```bash
GET    /api/pledges              # List (paginated)
POST   /api/pledges              # Create
GET    /api/pledges/:id          # Get one
PUT    /api/pledges/:id          # Update
DELETE /api/pledges/:id          # Soft delete
```

### Analytics
```bash
GET /api/analytics/summary       # Dashboard numbers
GET /api/analytics/trends        # Historical trends
GET /api/analytics/donors/top    # Top donors list
```

### AI
```bash
POST /api/ai/message             # Generate message
GET  /api/ai/status              # Check availability
```

### Payments
```bash
POST /api/payments/mtn/request   # MTN payment
POST /api/payments/airtel/request # Airtel payment
POST /api/payments/paypal        # PayPal
POST /api/payments/cash          # Cash recording
```

---

## 🎨 Frontend Component Pattern

### Standard Component
```javascript
import React, { useState } from 'react';

export default function MyComponent({ pledgeId }) {
  const [data, setData] = useState(null);
  
  React.useEffect(() => {
    // Load data
  }, [pledgeId]);
  
  return (
    <div>
      {data && <p>{data.title}</p>}
    </div>
  );
}
```

### With Context
```javascript
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';

export default function Dashboard() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  
  return <h1>{t('dashboard')}</h1>;
}
```

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `Cannot find module 'react'` | `npm install` in that directory |
| Database connection failed | Check `DB_HOST`, `DB_USER`, `DB_PASS` in .env |
| Port 5001 already in use | `lsof -i :5001` then kill process |
| CORS error | Check `VITE_API_URL` in frontend .env |
| "Unknown database" | Update to `pledgehub_db` (not `omukwano_db`) |
| 401 Unauthorized | Check JWT token in Authorization header |

---

## 📝 Environment Variables

### Required (Backend)
```bash
DB_HOST=localhost
DB_USER=pledgehub_user
DB_PASS=password
DB_NAME=pledgehub_db
JWT_SECRET=random_string_here
SESSION_SECRET=random_string_here
```

### Required (Frontend)
```bash
VITE_API_URL=http://localhost:5001/api
```

### Optional (Features)
```bash
# AI
GOOGLE_AI_API_KEY=your_key

# Email
SMTP_USER=your@gmail.com
SMTP_PASS=app_password

# SMS
TWILIO_ACCOUNT_SID=sid
TWILIO_AUTH_TOKEN=token

# OAuth
GOOGLE_CLIENT_ID=id
GOOGLE_CLIENT_SECRET=secret
```

---

## 🧪 Testing

### Write a Test
```javascript
// backend/tests/mytest.test.js
const request = require('supertest');
const app = require('../server');

test('GET /api/pledges returns list', async () => {
  const res = await request(app)
    .get('/api/pledges')
    .set('Authorization', `Bearer ${token}`);
  
  expect(res.status).toBe(200);
  expect(res.body.success).toBe(true);
});
```

### Run Tests
```bash
npm test                    # All tests
npm test -- mytest.test     # Specific test
npm run test:coverage       # With coverage
jest --watch                # Watch mode
```

---

## 🔍 Debugging

### Check API
```bash
# Simple test
curl http://localhost:5001/api/health

# With auth
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5001/api/pledges
```

### Check Database
```bash
mysql -u pledgehub_user -p pledgehub_db
SELECT * FROM pledges LIMIT 5;
SHOW TABLE STATUS;
```

### Check Logs
```bash
# Backend console output (running npm run dev)
# Look for ✓ Server running, ✓ Connected, errors

# Frontend console (F12 in browser)
# Check for JavaScript errors, network issues

# PM2 logs (production)
pm2 logs pledgehub-backend
```

---

## 🚀 Deployment Quick Checklist

- [ ] Update all environment variables
- [ ] Run migrations: `node scripts/complete-migration.js`
- [ ] Build frontend: `npm run build`
- [ ] Install PM2: `npm install -g pm2`
- [ ] Start: `pm2 start backend/server.js --name pledgehub-backend`
- [ ] Check status: `pm2 status`
- [ ] View logs: `pm2 logs pledgehub-backend`

---

## 📚 Documentation Map

| Document | Purpose |
|----------|---------|
| README.md | Setup guide, features, tech stack |
| docs/API_DOCUMENTATION.md | Complete API reference |
| docs/TROUBLESHOOTING.md | Problem solutions |
| DEPLOYMENT_VERIFICATION_CHECKLIST.md | Step-by-step deployment |
| CODE_AUDIT_AND_CLEANUP_SUMMARY.md | Technical audit details |
| FINAL_AUDIT_EXECUTIVE_SUMMARY.md | High-level overview |

---

## 💡 Pro Tips

1. **Use Test Mode**: Set `NODE_ENV=test` to bypass auth during development
2. **Database Migrations**: Always create a script in `scripts/` for schema changes
3. **API Responses**: Always return `{ success: true/false, data?, error? }`
4. **Error Handling**: Never expose database details in error messages
5. **Environment**: Never commit real .env to git (use .env.example)
6. **Component Reuse**: Check `src/components/` before creating duplicates
7. **Translations**: Add new strings to `src/i18n/translations.js`
8. **Styling**: Use CSS variables from `src/styles/theme.css`

---

## 🎯 Next Steps

1. **Start Development**
   ```bash
   npm run dev  # Both frontend and backend
   ```

2. **Make Changes**
   - Edit files in `backend/` or `frontend/src/`
   - Auto-reload happens via nodemon/Vite

3. **Test Changes**
   ```bash
   npm test
   node scripts/test-all-features.js
   ```

4. **Commit Code**
   ```bash
   git add .
   git commit -m "Add feature X"
   git push origin main
   ```

5. **Deploy**
   - Follow DEPLOYMENT_VERIFICATION_CHECKLIST.md
   - Use PM2 for production
   - Monitor logs with `pm2 logs`

---

## 📞 Quick Help

**Need Help?** Check in this order:
1. This guide (you are here!)
2. `docs/TROUBLESHOOTING.md`
3. `README.md` for setup
4. `docs/API_DOCUMENTATION.md` for endpoints
5. Code comments in `backend/services/` and `frontend/src/`

**Still Stuck?**
- Check browser console (F12)
- Check backend logs (npm run dev)
- Check database directly (mysql)
- Review error message carefully
- Google the error + "pledgehub" or "react"/"express"

---

## 🎉 Welcome to PledgeHub!

You now have everything needed to develop on PledgeHub. Good luck! 🚀

**Key Takeaway**: The app is well-structured, well-documented, and ready to go. Follow the commands above and you'll be productive immediately.

---

**Happy Coding! 💻**
