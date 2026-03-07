# PledgeHub

A modern, accessible pledge management platform with AI-powered insights, advanced analytics, and professional accounting tools. Built with React, Node.js, Express, and MySQL.

## ✨ Features

### Core Pledge Management
- Create, track, and manage pledges
- Real-time pledge status updates
- Multiple payment collection methods
- Automated payment reminders (SMS, Email)
- Donor portal and public sharing

### AI & Analytics
- AI-powered insights using Google Gemini Pro
- Advanced analytics dashboard
- Predictive analytics for pledge success
- Smart message generation for reminders
- Trend analysis and forecasting

### Payment Integration
- Mobile Money (MTN, Airtel)
- PayPal integration
- Cash payment tracking
- Multi-currency support
- Secure payment processing

### Admin Features
- User role management (Admin, Staff, Donor)
- Campaign management
- Financial reporting and accounting
- Audit trails and compliance
- Performance analytics

## 📋 Tech Stack

**Frontend:**
- React 18+ with React Router v7
- Vite (build tool)
- Recharts (data visualization)
- Responsive design (mobile-first)

**Backend:**
- Node.js (>= 14) with Express.js
- MySQL/MariaDB database
- JWT authentication + OAuth (Google, Facebook)
- Google Gemini Pro API for AI features

**DevOps:**
- PM2 process manager
- Docker & Docker Compose (optional)
- Git for version control
- Automated cron jobs for reminders

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 14 and npm
- **MySQL** >= 5.7 (with UTF-8 support)
- **Git**
- **.env file** with required variables

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/your-org/pledgehub.git
cd pledgehub
```

2. **Install dependencies:**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. **Configure environment variables:**

Create `backend/.env`:
```bash
# Database
DB_HOST=localhost
DB_USER=pledgehub_user
DB_PASS=your_secure_password
DB_NAME=pledgehub_db

# Authentication
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# AI Features (Google Gemini Pro)
GOOGLE_AI_API_KEY=your_api_key_from_makersuite

# Email (Gmail SMTP)
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password

# Optional: Twilio SMS
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Mobile Money (MTN)
MTN_SUBSCRIPTION_KEY=your_key
MTN_ENVIRONMENT=sandbox

# Optional: Mobile Money (Airtel)
AIRTEL_CLIENT_ID=your_id
AIRTEL_CLIENT_SECRET=your_secret
```

Create `frontend/.env`:
```bash
VITE_API_URL=http://localhost:5001/api
```

4. **Initialize database:**
```bash
mysql -u pledgehub_user -p pledgehub_db < backend/scripts/initial-schema.sql
```

5. **Start development servers:**
```bash
# Terminal 1: Backend (port 5001)
cd backend
npm run dev

# Terminal 2: Frontend (port 5173)
cd frontend
npm run dev
```

Visit http://localhost:5173 in your browser.

## 📝 Development

### Scripts

**Backend:**
```bash
npm run dev          # Start with hot-reload (nodemon)
npm test             # Run integration tests
npm run coverage     # Run with coverage report
npm run lint         # ESLint
npm run format       # Prettier formatting
```

**Frontend:**
```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Jest tests
npm run lint         # ESLint
npm run format       # Prettier formatting
```

### API Endpoints

All API routes are under `/api` prefix:

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/oauth/google` - Google OAuth
- `GET /api/oauth/facebook` - Facebook OAuth

**Pledges:**
- `GET /api/pledges` - List pledges (paginated)
- `POST /api/pledges` - Create pledge
- `GET /api/pledges/:id` - Get pledge details
- `PUT /api/pledges/:id` - Update pledge
- `DELETE /api/pledges/:id` - Soft delete pledge

**Analytics:**
- `GET /api/analytics/summary` - Dashboard summary
- `GET /api/analytics/trends` - Historical trends
- `GET /api/analytics/donors/top` - Top donors
- `GET /api/analytics/advanced` - Advanced insights

**Payments:**
- `POST /api/payments/mtn/request` - MTN Mobile Money request
- `POST /api/payments/airtel/request` - Airtel Money request
- `POST /api/payments/paypal` - PayPal payment
- `POST /api/payments/cash` - Record cash payment

See [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md) for complete endpoint reference.

### File Structure

```
pledgehub/
├── backend/
│   ├── config/           # Database, Passport config
│   ├── controllers/      # Route handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/           # Database models
│   ├── routes/           # API routes (23 route files)
│   ├── services/         # Business logic (22+ services)
│   ├── scripts/          # Migrations, seeders, tests
│   ├── server.js         # Express app entry
│   └── .env.example      # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable React components
│   │   ├── screens/      # Page components
│   │   ├── context/      # React context (Auth, Language)
│   │   ├── hooks/        # Custom React hooks
│   │   ├── services/     # API client
│   │   ├── styles/       # CSS files
│   │   ├── i18n/         # Translations (EN, LG, SW, etc.)
│   │   ├── App.jsx       # Main Router
│   │   └── index.jsx     # Entry point
│   ├── public/           # Static assets
│   ├── index.html        # HTML template
│   ├── vite.config.js    # Vite configuration
│   └── .env.example      # Environment template
├── docs/                 # Documentation
├── scripts/              # PowerShell dev scripts (Windows)
└── docker-compose.yml    # Docker configuration
```

## 🧪 Testing

### Integration Tests
```bash
cd backend
node scripts/test-all-features.js   # Full API test suite
```

### Unit Tests
```bash
cd backend
npm test                             # Run Jest tests
npm run test:coverage              # With coverage report
```

### Frontend Tests
```bash
cd frontend
npm test                            # Jest React tests
```

## 🔐 Authentication & Authorization

### User Roles
- **Admin**: Full system access, user management
- **Staff**: Campaign management, analytics, reporting
- **Donor**: Create pledges, view own pledges

### JWT Authentication
All protected endpoints require `Authorization: Bearer {token}` header:
```javascript
// Example API request
fetch('/api/pledges', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
})
```

### Test Mode
For development, bypass auth with environment variable:
```bash
NODE_ENV=test npm run dev
```

## 📊 Database Schema

### Key Tables
- **pledges** - Core pledge data (23 columns)
- **users** - User accounts with roles
- **campaigns** - Pledge campaigns
- **payments** - Payment transactions
- **feedback** - User feedback
- **sessions** - OAuth sessions

See `backend/scripts/complete-migration.js` for full DDL.

## 🚀 Deployment

### Production Checklist
- [ ] Update all `.env` variables
- [ ] Set `NODE_ENV=production`
- [ ] Run database migrations
- [ ] Build frontend: `npm run build`
- [ ] Install PM2: `npm install -g pm2`
- [ ] Start backend: `pm2 start backend/server.js --name pledgehub-backend`
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up monitoring and logging

See [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for complete instructions.

## 🐛 Troubleshooting

### Database Connection Failed
```bash
# Check MySQL is running
mysql -u pledgehub_user -p
# Verify credentials in .env
# Run migrations: node backend/scripts/complete-migration.js
```

### AI Features Not Working
```bash
# Check API key and availability
curl http://localhost:5001/api/ai/status
# Provides graceful fallback if key missing
```

### OAuth Not Working
- Verify callback URLs in Google/Facebook console
- Check `SESSION_SECRET` is set
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more solutions.

## 📚 Documentation

- [API Documentation](docs/API_DOCUMENTATION.md) - Complete API reference
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md) - Production setup
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues
- [Features Overview](docs/FEATURES_OVERVIEW.md) - Feature guide
- [AI Customization](docs/QUICK_AI_CUSTOMIZATION.md) - AI settings
- [Accessibility Guide](docs/ACCESSIBILITY_GUIDE.md) - WCAG compliance

## 🤝 Contributing

1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes with clear commit messages
3. Run linting: `npm run lint && npm run format`
4. Run tests: `npm test`
5. Open pull request with description

### Code Standards
- **Naming**: camelCase for variables, PascalCase for components
- **Comments**: JSDoc for functions, inline for complex logic
- **Error Handling**: Standardized `{ success, data?, error? }` response format
- **Testing**: Unit tests required for services, integration tests for APIs
- **Security**: No hardcoded secrets, parameterized SQL queries, input validation

## 📄 License

MIT License - See `LICENSE` file for details.

## 📧 Support

For issues, questions, or feature requests:
1. Check [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)
2. Search existing GitHub issues
3. Open a new issue with detailed description
4. Contact maintainers at pledgehub@yourdomain.com

---

**Last Updated**: December 17, 2025

