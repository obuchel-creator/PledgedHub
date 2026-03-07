# PledgeHub - Troubleshooting Guide

Common issues and solutions for the PledgeHub system with AI and automation features.

---

## Table of Contents

1. [AI Integration Issues](#ai-integration-issues)
2. [Message Generation Problems](#message-generation-problems)
3. [Analytics Dashboard Errors](#analytics-dashboard-errors)
4. [Automated Reminders Not Working](#automated-reminders-not-working)
5. [Database Issues](#database-issues)
6. [Email Delivery Problems](#email-delivery-problems)
7. [Server & Deployment Issues](#server--deployment-issues)
8. [Performance Problems](#performance-problems)

---

## AI Integration Issues

### Problem: AI Status Returns "unavailable"

**Symptoms**:
```json
{
  "available": false,
  "error": "AI service not configured"
}
```

**Solutions**:

1. **Check API Key Configuration**:
```bash
# Verify .env file
cat backend/.env | grep GOOGLE_AI_API_KEY
```

2. **Test API Key Directly**:
```bash
node -e "
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('YOUR_API_KEY_HERE');
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
model.generateContent('Hello').then(r => console.log('✅ Working')).catch(e => console.error('❌ Error:', e.message));
"
```

3. **Verify Package Installation**:
```bash
cd backend
npm ls @google/generative-ai
# If not found:
npm install @google/generative-ai
```

4. **Restart Server**:
```bash
pm2 restart omukwano-backend
# or
npm run dev
```

---

### Problem: "Quota Exceeded" Error

**Symptoms**:
```json
{
  "error": "AI quota exceeded",
  "details": "Daily limit of 1,500 requests reached"
}
```

**Solutions**:

1. **Check Quota at Google AI Studio**:
   - Visit: https://makersuite.google.com/app/apikey
   - View usage dashboard

2. **Implement Request Caching**:
```javascript
// backend/services/aiService.js
const cache = new Map();

async function generateWithCache(prompt, cacheKey) {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const result = await generateContent(prompt);
  cache.set(cacheKey, result);
  setTimeout(() => cache.delete(cacheKey), 3600000); // 1 hour cache
  
  return result;
}
```

3. **Fallback to Templates**:
```javascript
// Already implemented in messageGenerator.js
// AI failures automatically fall back to templates
```

4. **Upgrade to Paid Tier** (if needed):
   - Visit: https://cloud.google.com/vertex-ai/pricing

---

### Problem: AI Responses Are Slow

**Symptoms**:
- API calls taking 5-10+ seconds
- Timeout errors

**Solutions**:

1. **Implement Async Processing**:
```javascript
// Queue AI requests instead of real-time processing
const Queue = require('bull');
const aiQueue = new Queue('ai-processing');

aiQueue.process(async (job) => {
  return await aiService.generateEnhancedReminderMessage(job.data);
});
```

2. **Set Shorter Timeouts**:
```javascript
// backend/services/aiService.js
const axios = require('axios');

const client = axios.create({
  timeout: 5000 // 5 second timeout
});
```

3. **Use Smaller Prompts**:
```javascript
// Reduce prompt complexity for faster responses
const shortPrompt = `Generate brief reminder for ${donorName} - ${amount}`;
```

---

## Message Generation Problems

### Problem: "Pledge not found" Error

**Symptoms**:
```json
{
  "success": false,
  "error": "Pledge not found",
  "pledgeId": 999
}
```

**Solutions**:

1. **Verify Pledge Exists**:
```sql
SELECT id, donor_name, amount, status FROM pledges WHERE id = 999;
```

2. **Check for Soft Deletes**:
```sql
-- Pledge might be marked as deleted
SELECT id, donor_name, deleted FROM pledges WHERE id = 999;
```

3. **Use Correct pledgeId**:
```bash
# Get valid pledge IDs
curl http://localhost:5001/api/analytics/overview
```

---

### Problem: Messages Missing Placeholders

**Symptoms**:
- {name}, {amount} appear literally in message
- "Hi {name}" instead of "Hi John Doe"

**Solutions**:

1. **Check Pledge Data**:
```sql
SELECT donor_name, amount, purpose, collection_date 
FROM pledges 
WHERE id = YOUR_PLEDGE_ID;
```

2. **Verify replacePlaceholders Function**:
```javascript
// backend/services/messageGenerator.js
console.log('Pledge data:', pledgeData);
console.log('After replacement:', replacePlaceholders(template, pledgeData));
```

3. **Ensure Data is Present**:
```javascript
// Missing donor_name? Add fallback
const donorName = pledgeData.donor_name || pledgeData.name || 'Donor';
```

---

### Problem: HTML Emails Not Rendering

**Symptoms**:
- Recipients see HTML tags in plain text
- No styling applied

**Solutions**:

1. **Check Email Client Settings**:
```javascript
// backend/services/emailService.js
await transporter.sendMail({
  from: process.env.EMAIL_FROM,
  to: recipient,
  subject: subject,
  text: message.text,  // ← Must provide both
  html: message.html   // ← Both text and HTML
});
```

2. **Test HTML Rendering**:
```bash
# Send test email
node -e "
const emailService = require('./backend/services/emailService');
emailService.sendEmail(
  'your@email.com',
  'Test HTML',
  'Plain text version',
  '<h1>HTML Version</h1><p>This is <strong>bold</strong></p>'
);
"
```

3. **Simplify HTML** (some clients block complex CSS):
```html
<!-- Use inline styles only -->
<div style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #333;">Hello!</h1>
</div>
```

---

## Analytics Dashboard Errors

### Problem: "Incorrect arguments to mysqld_stmt_execute"

**Symptoms**:
```json
{
  "error": "Failed to get top donors",
  "details": "Incorrect arguments to mysqld_stmt_execute"
}
```

**Solutions**:

1. **This was already fixed!** (Literal LIMIT instead of parameter binding)
```javascript
// backend/services/analyticsService.js
// OLD (broken):
LIMIT ?`, [limit]

// NEW (working):
LIMIT ${safeLimit}`  // No parameter array
```

2. **Verify Fix is Applied**:
```bash
curl http://localhost:5001/api/analytics/top-donors?limit=5
```

3. **Restart Server**:
```bash
pm2 restart pledgehub-backend
```

---

### Problem: "Unknown column" Error

**Symptoms**:
```json
{
  "error": "Unknown column 'updated_at' in 'field list'"
}
```

**Solutions**:

1. **Run Migration**:
```bash
cd backend
node scripts/complete-migration.js
```

2. **Verify Column Exists**:
```sql
DESCRIBE pledges;
-- Should show: donor_name, donor_email, donor_phone, purpose, collection_date, etc.
```

3. **Check Query Uses Correct Columns**:
```javascript
// WRONG:
SELECT updated_at, name FROM pledges

// RIGHT:
SELECT last_reminder_sent, donor_name FROM pledges
```

---

### Problem: Analytics Returns Empty/Null Data

**Symptoms**:
```json
{
  "totalPledges": 0,
  "uniqueDonors": 0
}
```

**Solutions**:

1. **Check Database Has Data**:
```sql
SELECT COUNT(*) FROM pledges WHERE deleted = 0;
```

2. **Verify Column Names**:
```sql
-- Old code might use wrong column names
SELECT donor_name FROM pledges LIMIT 1;  -- Should work
SELECT name FROM pledges LIMIT 1;        -- Legacy column
```

3. **Check Filters**:
```sql
-- Too restrictive filter?
SELECT COUNT(*) FROM pledges WHERE deleted = 0 AND donor_name IS NOT NULL;
```

---

## Automated Reminders Not Working

### Problem: Cron Jobs Not Running

**Symptoms**:
- No reminders sent at 9 AM or 5 PM
- `/api/reminders/status` shows jobs not initialized

**Solutions**:

1. **Check Cron Scheduler Loaded**:
```bash
# backend/server.js should have:
grep "cronScheduler" backend/server.js
```

2. **Verify Timezone**:
```bash
# Check server timezone
echo $TZ
# Should be: Africa/Kampala

# Set timezone in .env
echo "TZ=Africa/Kampala" >> backend/.env
```

3. **Manual Test**:
```bash
# Test reminder service directly
node -e "
const reminderService = require('./backend/services/reminderService');
reminderService.runDailyReminders().then(() => console.log('✅ Done')).catch(console.error);
"
```

4. **Check node-cron is Running**:
```javascript
// backend/services/cronScheduler.js
console.log('Cron job scheduled:', dailyReminderJob.options);
```

---

### Problem: Reminders Sent Too Frequently

**Symptoms**:
- Same pledge gets multiple reminders per day
- reminder_count increasing rapidly

**Solutions**:

1. **Check last_reminder_sent Logic**:
```javascript
// backend/services/reminderService.js
const hoursSinceLastReminder = (Date.now() - new Date(lastReminder)) / 3600000;
if (hoursSinceLastReminder < 24) {
  console.log('Skipping - too soon since last reminder');
  return;
}
```

2. **Add Rate Limiting**:
```sql
-- Only send if last reminder was >24 hours ago
UPDATE pledges 
SET last_reminder_sent = NOW(), reminder_count = reminder_count + 1
WHERE id = ? 
  AND (last_reminder_sent IS NULL OR last_reminder_sent < DATE_SUB(NOW(), INTERVAL 24 HOUR));
```

3. **Check Cron Schedule**:
```javascript
// Should be once per day:
'0 9 * * *'  // ✅ Correct (9 AM daily)
'*/5 * * * *' // ❌ Wrong (every 5 minutes!)
```

---

### Problem: No Pledges Need Reminders

**Symptoms**:
```json
{
  "7_days": 0,
  "3_days": 0,
  "due_today": 0,
  "overdue": 0
}
```

**Solutions**:

1. **Check Collection Dates**:
```sql
SELECT id, donor_name, collection_date, 
       DATEDIFF(collection_date, CURDATE()) as days_until
FROM pledges 
WHERE status IN ('pending', 'active')
ORDER BY collection_date;
```

2. **Add Test Data**:
```sql
-- Create pledge due in 3 days
INSERT INTO pledges (
  donor_name, donor_email, donor_phone,
  amount, purpose, collection_date, status
) VALUES (
  'Test Donor', 'test@example.com', '+256700000000',
  100000, 'Test pledge', DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'active'
);
```

3. **Verify Reminder Logic**:
```javascript
// backend/services/reminderService.js
console.log('Checking pledges for reminders...');
const pledges = await getPledgesNeedingReminder();
console.log('Found', pledges.length, 'pledges needing reminders');
```

---

## Database Issues

### Problem: "ER_ACCESS_DENIED_ERROR"

**Symptoms**:
```
Error: Access denied for user 'pledgehub_user'@'localhost'
```

**Solutions**:

1. **Check Credentials**:
```bash
# Test MySQL connection
mysql -h $DB_HOST -u $DB_USER -p
# Enter password from .env
```

2. **Grant Permissions**:
```sql
GRANT ALL PRIVILEGES ON pledgehub_db.* TO 'pledgehub_user'@'%';
FLUSH PRIVILEGES;
```

3. **Verify .env Variables**:
```bash
cat backend/.env | grep DB_
```

---

### Problem: "ECONNREFUSED" Database Connection

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solutions**:

1. **Check MySQL is Running**:
```bash
# Windows
Get-Service MySQL*

# Linux
sudo systemctl status mysql
```

2. **Start MySQL**:
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql
```

3. **Check Port**:
```bash
# Verify MySQL listening on 3306
netstat -an | findstr 3306  # Windows
netstat -tuln | grep 3306   # Linux
```

---

### Problem: "Too many connections"

**Symptoms**:
```
Error: Too many connections
```

**Solutions**:

1. **Increase MySQL Connections**:
```sql
SET GLOBAL max_connections = 200;
```

2. **Use Connection Pooling**:
```javascript
// backend/config/db.js
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});
```

3. **Close Connections Properly**:
```javascript
// Always release connections
const [results] = await db.execute(query);
// Connection auto-released with promise/pool
```

---

## Email Delivery Problems

### Problem: Emails Not Being Sent

**Symptoms**:
- No emails received
- No errors in logs

**Solutions**:

1. **Check Email Service is Configured**:
```bash
node -e "console.log('Host:', process.env.EMAIL_HOST, 'User:', process.env.EMAIL_USER)"
```

2. **Test SMTP Connection**:
```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

transporter.verify()
  .then(() => console.log('✅ SMTP connection successful'))
  .catch(err => console.error('❌ SMTP error:', err.message));
```

3. **Check Firewall**:
```bash
# Port 587 must be open for SMTP
telnet smtp.gmail.com 587
```

4. **Enable "Less Secure Apps"** (Gmail):
- Account → Security → Less secure app access: ON
- OR use App Password (recommended)

---

### Problem: Emails Go to Spam

**Symptoms**:
- Emails sent successfully
- Recipients find them in spam folder

**Solutions**:

1. **Set Proper Headers**:
```javascript
// backend/services/emailService.js
await transporter.sendMail({
  from: '"PledgeHub" <no-reply@yourdomain.com>',
  replyTo: 'support@yourdomain.com',
  to: recipient,
  subject: subject,
  text: textVersion,
  html: htmlVersion,
  headers: {
    'X-Priority': '3',
    'X-Mailer': 'PledgeHub System'
  }
});
```

2. **Configure SPF Record** (DNS):
```
TXT @ "v=spf1 include:_spf.google.com ~all"
```

3. **Configure DKIM** (if using SendGrid/SES):
- Follow provider's DKIM setup guide

4. **Avoid Spam Trigger Words**:
- Don't use: FREE, URGENT, ACT NOW, etc.
- Keep subject lines professional

---

### Problem: "EAUTH" Authentication Error

**Symptoms**:
```
Error: Invalid login: 535-5.7.8 Username and Password not accepted
```

**Solutions**:

1. **Use App Password** (Gmail):
```bash
# Generate at: https://myaccount.google.com/apppasswords
# Use generated password in EMAIL_PASSWORD
```

2. **Enable 2FA First** (Gmail requires 2FA for app passwords)

3. **Check Credentials**:
```bash
echo "User: $(cat backend/.env | grep EMAIL_USER)"
echo "Pass: $(cat backend/.env | grep EMAIL_PASSWORD | cut -c1-20)..."
```

---

## Server & Deployment Issues

### Problem: "Port 5001 already in use"

**Symptoms**:
```
Error: listen EADDRINUSE: address already in use :::5001
```

**Solutions**:

1. **Kill Process on Port**:
```bash
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5001 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }

# Linux
lsof -ti:5001 | xargs kill -9
```

2. **Use Different Port**:
```bash
# backend/.env
PORT=5002
```

3. **Find and Stop Server**:
```bash
pm2 stop pledgehub-backend
# or
pkill -f "node server.js"
```

---

### Problem: Server Crashes on Startup

**Symptoms**:
- Server starts then immediately exits
- PM2 shows "errored" status

**Solutions**:

1. **Check Logs**:
```bash
pm2 logs pledgehub-backend --lines 100
```

2. **Run in Debug Mode**:
```bash
cd backend
NODE_ENV=development node server.js
```

3. **Common Startup Issues**:
```javascript
// Missing .env file
if (!process.env.DB_HOST) {
  console.error('❌ .env file not found or incomplete');
  process.exit(1);
}

// Database connection failed
try {
  await db.execute('SELECT 1');
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  process.exit(1);
}
```

---

### Problem: Changes Not Reflecting

**Symptoms**:
- Code changes don't appear in running server
- Old version still running

**Solutions**:

1. **Restart Server**:
```bash
pm2 restart pledgehub-backend
```

2. **Clear Node Cache**:
```bash
rm -rf node_modules
npm install
```

3. **Check Correct File Being Run**:
```bash
pm2 describe pledgehub-backend | grep script
```

---

## Performance Problems

### Problem: Slow API Responses

**Symptoms**:
- API calls taking 2-5+ seconds
- Frontend feels sluggish

**Solutions**:

1. **Enable Query Logging**:
```javascript
// Log slow queries
const startTime = Date.now();
const [results] = await db.execute(query);
const duration = Date.now() - startTime;
if (duration > 1000) {
  console.warn(`Slow query (${duration}ms):`, query);
}
```

2. **Add Database Indexes**:
```sql
-- Speed up common queries
CREATE INDEX idx_donor_name ON pledges(donor_name);
CREATE INDEX idx_collection_date ON pledges(collection_date);
CREATE INDEX idx_status ON pledges(status);
CREATE INDEX idx_deleted ON pledges(deleted);
```

3. **Cache Analytics Data**:
```javascript
let dashboardCache = null;
let cacheTime = null;

async function getDashboardSummary() {
  const now = Date.now();
  if (dashboardCache && (now - cacheTime) < 300000) { // 5 min cache
    return dashboardCache;
  }
  
  dashboardCache = await generateDashboardData();
  cacheTime = now;
  return dashboardCache;
}
```

4. **Use PM2 Cluster Mode**:
```javascript
// ecosystem.config.js
instances: 'max',  // Use all CPU cores
exec_mode: 'cluster'
```

---

### Problem: High Memory Usage

**Symptoms**:
- Server using 500MB+ RAM
- PM2 restarting due to memory limit

**Solutions**:

1. **Monitor Memory**:
```bash
pm2 monit
```

2. **Set Memory Limit**:
```javascript
// ecosystem.config.js
max_memory_restart: '500M'
```

3. **Clear Caches Periodically**:
```javascript
// Clear AI cache every hour
setInterval(() => {
  aiCache.clear();
  console.log('Cache cleared');
}, 3600000);
```

4. **Check for Memory Leaks**:
```bash
node --inspect backend/server.js
# Use Chrome DevTools to profile memory
```

---

## Getting Help

If you can't resolve an issue:

1. **Check Logs First**:
```bash
# PM2 logs
pm2 logs omukwano-backend --lines 100

# Application logs
tail -f backend/logs/*.log
```

2. **Enable Debug Mode**:
```bash
DEBUG=* node backend/server.js
```

3. **Test Individual Components**:
```bash
# Test AI
node backend/scripts/quick-ai-test.js

# Test analytics
node backend/scripts/test-analytics.js

# Test all features
node backend/scripts/test-all-features.js
```

4. **Contact Support**:
- GitHub Issues: <repository-url>/issues
- Email: support@yourdomain.com
- Documentation: See /docs folder

---

**Last Updated**: November 5, 2025  
**Version**: 1.0.0

