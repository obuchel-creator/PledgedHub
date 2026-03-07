# PledgeHub - Deployment Guide

Complete guide for deploying the PledgeHub system with AI and automation features to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Service Configuration](#service-configuration)
5. [Security Hardening](#security-hardening)
6. [Deployment Options](#deployment-options)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup Strategy](#backup-strategy)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: v16.x or higher
- **MySQL**: v8.0 or higher
- **npm**: v8.x or higher
- **Git**: Latest version

### Recommended Tools
- **PM2**: Process manager for Node.js
- **Nginx**: Reverse proxy and load balancer
- **Let's Encrypt**: Free SSL certificates
- **Docker** (optional): Containerization

### Cloud Provider Options
- **AWS**: EC2, RDS, SES
- **DigitalOcean**: Droplets, Managed Databases
- **Heroku**: Easy deployment with add-ons
- **Azure**: App Service, SQL Database
- **Google Cloud**: Compute Engine, Cloud SQL

---

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd pledgehub
```

### 2. Install Dependencies

**Backend**:
```bash
cd backend
npm install
```

**Frontend**:
```bash
cd frontend
npm install
```

### 3. Environment Variables

Create `backend/.env`:

```env
# Server Configuration
NODE_ENV=production
PORT=5001
FRONTEND_URL=https://yourdomain.com

# Database Configuration (Production)
DB_HOST=your-db-host.com
DB_USER=omukwano_user
DB_PASSWORD=your_secure_password_here
DB_NAME=pledgehub_db
DB_PORT=3306

# Security Secrets (Generate new ones!)
SESSION_SECRET=generate_128_character_random_string_for_session_security
JWT_SECRET=generate_128_character_random_string_for_jwt_security

# Google AI Configuration (FREE Tier)
GOOGLE_AI_API_KEY=your_google_gemini_api_key_here
AI_PROVIDER=gemini
AI_MODEL=gemini-pro

# Email Configuration (Production SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_specific_password
EMAIL_FROM="PledgeHub <no-reply@yourdomain.com>"

# SMS Configuration (Optional - Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# OAuth (Optional - if using)
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Timezone
TZ=Africa/Kampala
```

**Generate Secure Secrets**:
```bash
# Generate 128-character SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate 128-character JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Database Configuration

### 1. Create Production Database

```sql
CREATE DATABASE pledgehub_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER 'omukwano_user'@'%' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON pledgehub_db.* TO 'omukwano_user'@'%';
FLUSH PRIVILEGES;
```

### 2. Run Initial Schema

```bash
cd backend
mysql -h your-db-host -u omukwano_user -p pledgehub_db < sql/init.sql
```

### 3. Run Migrations

```bash
node scripts/complete-migration.js
```

**Expected Output**:
```
✅ Migration completed successfully!
📊 Summary:
   • Donor tracking columns added
   • Reminder system columns added
   • Collection date tracking added
   • Payment method and notes fields added
   • Status column updated
```

### 4. Verify Database

```bash
mysql -h your-db-host -u omukwano_user -p -e "USE pledgehub_db; DESCRIBE pledges;"
```

Should show 23 columns including:
- donor_name, donor_email, donor_phone
- purpose, collection_date
- last_reminder_sent, reminder_count
- payment_method, notes

---

## Service Configuration

### 1. Google Gemini AI Setup

**Get API Key** (FREE tier - 1,500 requests/day):
1. Visit: https://makersuite.google.com/app/apikey
2. Create new API key
3. Copy key to `GOOGLE_AI_API_KEY` in `.env`

**Test AI Connection**:
```bash
node scripts/quick-ai-test.js
```

### 2. Email (SMTP) Setup

**Option A: Gmail**
1. Enable 2-factor authentication on Google account
2. Generate App Password:
   - Account Settings → Security → 2-Step Verification
   - App Passwords → Select "Mail" → Generate
3. Use generated password in `EMAIL_PASSWORD`

**Option B: SendGrid** (Recommended for production)
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your_sendgrid_api_key
```

**Option C: AWS SES** (Cost-effective)
```env
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USER=your_ses_smtp_username
EMAIL_PASSWORD=your_ses_smtp_password
```

**Test Email**:
```bash
node -e "
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
transport.sendMail({
  from: process.env.EMAIL_FROM,
  to: 'your_email@example.com',
  subject: 'Test Email',
  text: 'If you receive this, SMTP is working!'
}).then(console.log).catch(console.error);
"
```

### 3. SMS (Twilio) Setup (Optional)

1. Create Twilio account: https://www.twilio.com/try-twilio
2. Get Account SID and Auth Token
3. Purchase phone number
4. Add credentials to `.env`

**Test SMS**:
```bash
node -e "
const twilio = require('twilio');
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);
client.messages.create({
  body: 'Test SMS from PledgeHub',
  from: process.env.TWILIO_PHONE_NUMBER,
  to: '+256700000000'
}).then(console.log).catch(console.error);
"
```

### 4. Cron Jobs

Cron jobs are automatically started with the server:
- **9:00 AM** (Africa/Kampala): All reminders
- **5:00 PM** (Africa/Kampala): Due today + overdue

**Verify Cron Status**:
```bash
curl http://localhost:5001/api/reminders/status
```

---

## Security Hardening

### 1. Environment Variables

**NEVER commit `.env` to Git**:
```bash
echo ".env" >> .gitignore
```

**Use Secrets Management** (Production):
- AWS Secrets Manager
- Azure Key Vault
- Google Secret Manager
- HashiCorp Vault

### 2. Database Security

**Restrict Database Access**:
```sql
-- Allow only from application server IP
REVOKE ALL PRIVILEGES ON *.* FROM 'omukwano_user'@'%';
GRANT ALL PRIVILEGES ON pledgehub_db.* TO 'omukwano_user'@'your.server.ip';
FLUSH PRIVILEGES;
```

**Enable SSL Connections**:
```env
DB_SSL=true
DB_SSL_CA=/path/to/ca-cert.pem
```

### 3. API Security

**Enable Rate Limiting**:
```javascript
// backend/server.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

**Enable CORS** (restrict to your domain):
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

**Helmet for Security Headers**:
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### 4. JWT Authentication

**Replace simpleAuth with proper JWT**:
```javascript
// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}
```

### 5. Input Validation

**Use Joi or Express-Validator**:
```javascript
const { body, validationResult } = require('express-validator');

app.post('/api/messages/reminder',
  body('pledgeId').isInt().toInt(),
  body('tone').isIn(['friendly', 'professional', 'urgent']),
  body('reminderType').isIn(['7_days', '3_days', 'due_today', 'overdue']),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // ... handle request
  }
);
```

---

## Deployment Options

### Option 1: PM2 (Recommended)

**Install PM2**:
```bash
npm install -g pm2
```

**Create Ecosystem File** (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [
    {
      name: 'omukwano-backend',
      script: './backend/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};
```

**Start Application**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Auto-start on server reboot
```

**Monitor**:
```bash
pm2 status
pm2 logs omukwano-backend
pm2 monit
```

### Option 2: Docker

**Create Dockerfile** (`Dockerfile`):
```dockerfile
FROM node:16-alpine

WORKDIR /app

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend code
COPY backend ./backend

# Install frontend dependencies and build
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci
COPY frontend ./frontend
RUN cd frontend && npm run build

EXPOSE 5001

CMD ["node", "backend/server.js"]
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5001:5001"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
    depends_on:
      - db
    restart: always

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=rootpassword
      - MYSQL_DATABASE=pledgehub_db
      - MYSQL_USER=omukwano_user
      - MYSQL_PASSWORD=userpassword
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always

volumes:
  mysql_data:
```

**Deploy**:
```bash
docker-compose up -d
```

### Option 3: Heroku

**Install Heroku CLI**:
```bash
npm install -g heroku
```

**Deploy**:
```bash
heroku login
heroku create pledgehub
heroku addons:create cleardb:ignite  # MySQL database
heroku config:set GOOGLE_AI_API_KEY=your_key
heroku config:set SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
git push heroku main
heroku run node backend/scripts/complete-migration.js
```

---

## Monitoring & Logging

### 1. Application Logging

**Winston Logger** (recommended):
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 2. Health Checks

**Add Health Endpoint**:
```javascript
app.get('/health', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: 'up',
        ai: aiService.isAIAvailable() ? 'up' : 'down',
        cronJobs: 'up'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

### 3. Monitoring Tools

**Recommended Services**:
- **Datadog**: Full-stack monitoring
- **New Relic**: APM and infrastructure monitoring
- **Sentry**: Error tracking
- **LogDNA**: Log management
- **UptimeRobot**: Uptime monitoring (free)

---

## Backup Strategy

### 1. Database Backups

**Daily Automated Backup** (cron job):
```bash
# Add to crontab
0 2 * * * /usr/bin/mysqldump -h your-db-host -u omukwano_user -p'password' pledgehub_db > /backups/omukwano_$(date +\%Y\%m\%d).sql
```

**Backup Script** (`scripts/backup-db.sh`):
```bash
#!/bin/bash

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="omukwano_$DATE.sql"

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > "$BACKUP_DIR/$FILENAME"

# Compress
gzip "$BACKUP_DIR/$FILENAME"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://your-bucket/backups/

# Keep only last 7 days
find $BACKUP_DIR -name "omukwano_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $FILENAME.gz"
```

### 2. Code Backups

**Git Repository** (already done)
**Automated Deployments** with GitHub Actions

---

## Troubleshooting

### Issue: AI Not Working

**Check**:
```bash
curl http://localhost:5001/api/ai/status
```

**Solutions**:
1. Verify `GOOGLE_AI_API_KEY` in `.env`
2. Check daily quota (1,500 requests)
3. Test API key at https://makersuite.google.com

### Issue: Emails Not Sending

**Check**:
```bash
node -e "console.log(process.env.EMAIL_HOST, process.env.EMAIL_USER)"
```

**Solutions**:
1. Verify SMTP credentials
2. Check firewall allows port 587
3. Test with `node scripts/test-email.js`
4. Check spam folder

### Issue: Cron Jobs Not Running

**Check**:
```bash
curl http://localhost:5001/api/reminders/status
```

**Solutions**:
1. Verify server timezone: `TZ=Africa/Kampala`
2. Check server logs: `pm2 logs`
3. Test reminder service: `node scripts/test-reminders.js`

### Issue: Database Connection Failed

**Solutions**:
1. Verify DB credentials in `.env`
2. Check database server is running
3. Test connection: `mysql -h $DB_HOST -u $DB_USER -p`
4. Check firewall allows MySQL port (3306)

### Issue: High Memory Usage

**Solutions**:
1. Increase PM2 instances: `pm2 scale omukwano-backend 4`
2. Add memory limits: `max_memory_restart: '500M'` in ecosystem.config.js
3. Monitor with: `pm2 monit`

---

## Post-Deployment Checklist

- [ ] Database migrated successfully
- [ ] All environment variables set
- [ ] AI API key configured and tested
- [ ] Email SMTP configured and tested
- [ ] SMS configured (if using)
- [ ] Cron jobs running (verify status endpoint)
- [ ] SSL certificate installed
- [ ] Firewall configured (only ports 80, 443, 22 open)
- [ ] Rate limiting enabled
- [ ] Authentication working
- [ ] Health checks returning success
- [ ] Monitoring set up
- [ ] Backups automated
- [ ] Error tracking configured
- [ ] Documentation updated with production URLs

---

**Last Updated**: November 5, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

