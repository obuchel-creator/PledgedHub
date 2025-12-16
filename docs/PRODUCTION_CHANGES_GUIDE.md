# Production Changes & Updates Guide

**How to Make Changes to Your Live Application Safely**

---

## 🎯 Overview

When your application is live and users are accessing it, you **CANNOT** make changes directly on the production server like you do in development. You need a proper workflow to ensure:

1. **Zero downtime** - Users don't experience interruptions
2. **No bugs** - Changes are tested before going live
3. **Easy rollback** - Can undo changes if something breaks
4. **Data safety** - Database changes don't corrupt data

---

## 📋 Table of Contents

1. [Understanding Environments](#understanding-environments)
2. [The Safe Deployment Workflow](#the-safe-deployment-workflow)
3. [Making Code Changes](#making-code-changes)
4. [Database Changes](#database-changes)
5. [Using Git for Version Control](#using-git-for-version-control)
6. [CI/CD Automation](#cicd-automation)
7. [Emergency Rollback](#emergency-rollback)
8. [Best Practices](#best-practices)

---

## 🌍 Understanding Environments

### You Need 3 Separate Environments

```
┌─────────────────────────────────────────────────────────┐
│  1. DEVELOPMENT (Your Local Computer)                   │
│     - Where you make changes and test                   │
│     - Database: Local MySQL on your computer            │
│     - Port: 5001 (backend), 5173 (frontend)             │
│     - Purpose: Safe place to experiment                 │
└─────────────────────────────────────────────────────────┘
                         ↓
                    (Test & Commit)
                         ↓
┌─────────────────────────────────────────────────────────┐
│  2. STAGING (Test Server - Optional but Recommended)    │
│     - Exact copy of production                          │
│     - Database: Staging database (copy of production)   │
│     - Purpose: Final testing before going live          │
│     - Users: Internal team only                         │
└─────────────────────────────────────────────────────────┘
                         ↓
                  (Final Testing)
                         ↓
┌─────────────────────────────────────────────────────────┐
│  3. PRODUCTION (Live Server - Public)                   │
│     - Real users access this                            │
│     - Database: Production database (real data)         │
│     - Domain: https://omukwano.yourdomain.com           │
│     - Purpose: Serve real users                         │
│     - ⚠️ NEVER make direct changes here!               │
└─────────────────────────────────────────────────────────┘
```

### Why You Can't Change Production Directly

**In Development (Now)**:
- ✅ You edit code → changes apply immediately
- ✅ Server auto-restarts
- ✅ If something breaks, only you are affected
- ✅ You can experiment freely

**In Production (Live)**:
- ❌ Direct edits = server might crash
- ❌ Untested code = users see bugs
- ❌ No rollback = can't undo mistakes
- ❌ Database changes = might corrupt real data
- ⚠️ **100s or 1000s of users affected if something breaks**

---

## 🔄 The Safe Deployment Workflow

### Step-by-Step Process

```
┌────────────────────────────────────────────────────────────┐
│ STEP 1: Make Changes Locally (Development)                 │
├────────────────────────────────────────────────────────────┤
│ 1. Edit code on your computer                              │
│ 2. Test thoroughly (run test scripts)                      │
│ 3. Make sure everything works                              │
│ 4. No bugs, no errors                                      │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│ STEP 2: Commit to Git (Version Control)                    │
├────────────────────────────────────────────────────────────┤
│ 1. Save changes to Git                                      │
│ 2. Write clear commit message                              │
│ 3. Push to GitHub/GitLab/Bitbucket                         │
│ 4. Code is now versioned and backed up                     │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│ STEP 3: Deploy to Staging (Optional)                       │
├────────────────────────────────────────────────────────────┤
│ 1. Pull latest code on staging server                      │
│ 2. Run tests on staging                                    │
│ 3. Test with team members                                  │
│ 4. Fix any issues found                                    │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│ STEP 4: Deploy to Production (Live)                        │
├────────────────────────────────────────────────────────────┤
│ 1. Connect to production server (SSH)                      │
│ 2. Pull latest code from Git                               │
│ 3. Install new dependencies (if any)                       │
│ 4. Run database migrations (if any)                        │
│ 5. Restart server with PM2                                 │
│ 6. Monitor logs for errors                                 │
│ 7. Test critical features                                  │
└────────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────────┐
│ STEP 5: Monitor & Verify                                   │
├────────────────────────────────────────────────────────────┤
│ 1. Check server logs (pm2 logs)                            │
│ 2. Test main features on live site                         │
│ 3. Monitor error tracking (Sentry)                         │
│ 4. Check analytics for issues                              │
│ 5. If problems: ROLLBACK immediately                       │
└────────────────────────────────────────────────────────────┘
```

---

## 💻 Making Code Changes

### Example: Adding a New API Endpoint

#### 1. **Development (Your Computer)**

```bash
# On your local computer
cd C:\Users\HP\pledgehub\backend

# Create new feature
# Edit backend/routes/newFeatureRoutes.js
# Add new endpoint
```

**Create file**: `backend/routes/donorPortalRoutes.js`
```javascript
const express = require('express');
const router = express.Router();

// New feature: Donor self-service portal
router.get('/api/donor-portal/my-pledges', async (req, res) => {
    // Your code here
    res.json({ message: 'New feature!' });
});

module.exports = router;
```

**Test locally**:
```bash
# Start local server
npm run dev

# Test new endpoint
curl http://localhost:5001/api/donor-portal/my-pledges

# Run test suite
node scripts/test-all-features.js
```

#### 2. **Commit to Git**

```bash
# Stage changes
git add backend/routes/donorPortalRoutes.js

# Commit with clear message
git commit -m "Add donor self-service portal API endpoint"

# Push to GitHub
git push origin main
```

#### 3. **Deploy to Production**

```bash
# SSH into production server
ssh user@your-production-server.com

# Navigate to project directory
cd /var/www/pledgehub

# Pull latest code
git pull origin main

# Install any new dependencies
cd backend
npm install

# Restart server with zero downtime
pm2 reload omukwano-backend

# Check logs
pm2 logs omukwano-backend --lines 50

# Verify endpoint works
curl https://omukwano.yourdomain.com/api/donor-portal/my-pledges
```

---

## 🗄️ Database Changes

### Example: Adding a New Column

#### ⚠️ Database Changes Are DANGEROUS - Follow This Process

#### 1. **Create Migration Script Locally**

**Create file**: `backend/scripts/migrations/add_donor_rating_column.js`

```javascript
const db = require('../config/db');

async function migrate() {
    try {
        console.log('📊 Starting migration: Add donor_rating column...');
        
        // Check if column already exists (idempotent migration)
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'pledges' 
            AND COLUMN_NAME = 'donor_rating'
        `);
        
        if (columns.length > 0) {
            console.log('✅ Column donor_rating already exists. Skipping.');
            return;
        }
        
        // Add new column
        await db.execute(`
            ALTER TABLE pledges 
            ADD COLUMN donor_rating INT DEFAULT NULL 
            COMMENT 'Rating from 1-5 stars'
        `);
        
        console.log('✅ Column donor_rating added successfully!');
        
        // Log migration
        await db.execute(`
            INSERT INTO migration_history (migration_name, executed_at)
            VALUES ('add_donor_rating_column', NOW())
        `);
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        process.exit(0);
    }
}

migrate();
```

#### 2. **Test Migration Locally**

```bash
# Backup local database first
mysqldump -u root -p pledgehub_db > backup_before_migration.sql

# Run migration
node backend/scripts/migrations/add_donor_rating_column.js

# Verify column was added
mysql -u root -p -e "USE pledgehub_db; DESCRIBE pledges;"

# Test application still works
node scripts/test-all-features.js
```

#### 3. **Commit Migration Script**

```bash
git add backend/scripts/migrations/add_donor_rating_column.js
git commit -m "Migration: Add donor_rating column to pledges table"
git push origin main
```

#### 4. **Deploy to Production (Careful!)**

```bash
# SSH into production
ssh user@your-production-server.com
cd /var/www/pledgehub

# 🚨 BACKUP PRODUCTION DATABASE FIRST 🚨
mysqldump -u omukwano_user -p pledgehub_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Pull latest code
git pull origin main

# Run migration
node backend/scripts/migrations/add_donor_rating_column.js

# Restart server
pm2 reload omukwano-backend

# Verify everything works
pm2 logs omukwano-backend --lines 50
```

---

## 📚 Using Git for Version Control

### Setting Up Git (First Time)

```bash
# Initialize Git in your project
cd C:\Users\HP\pledgehub
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: PledgeHub with AI features"

# Create GitHub repository (on GitHub.com)
# Then link it:
git remote add origin https://github.com/yourusername/pledgehub.git
git branch -M main
git push -u origin main
```

### Daily Git Workflow

```bash
# 1. Before making changes: Pull latest code
git pull origin main

# 2. Make your changes (edit files)

# 3. Check what changed
git status

# 4. Add changed files
git add backend/routes/newFeature.js
# OR add all changes
git add .

# 5. Commit with clear message
git commit -m "Add new donor rating feature"

# 6. Push to GitHub
git push origin main
```

### Git Best Practices

**Good Commit Messages**:
```bash
✅ git commit -m "Add donor rating system to pledges"
✅ git commit -m "Fix analytics top donors query parameter binding"
✅ git commit -m "Update AI service to handle quota exceeded errors"
✅ git commit -m "Database migration: Add donor_rating column"

❌ git commit -m "changes"
❌ git commit -m "fix"
❌ git commit -m "stuff"
```

**When to Commit**:
- ✅ After completing a feature
- ✅ After fixing a bug
- ✅ Before making risky changes (so you can undo)
- ✅ At least once per day
- ✅ Before deploying to production

---

## 🤖 CI/CD Automation (Advanced)

### What is CI/CD?

**CI/CD = Continuous Integration / Continuous Deployment**

Instead of manually deploying, automate it so:
1. You push code to GitHub
2. Tests run automatically
3. If tests pass, code deploys to production automatically
4. If tests fail, deployment is blocked

### Setting Up GitHub Actions (Recommended)

**Create file**: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: |
          cd backend
          npm install
      
      - name: Run tests
        run: |
          cd backend
          node scripts/test-all-features.js
          node scripts/test-analytics.js
      
      - name: Tests passed
        run: echo "✅ All tests passed!"
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/pledgehub
            git pull origin main
            cd backend
            npm install
            pm2 reload omukwano-backend
            echo "✅ Deployed successfully!"
```

**Setup GitHub Secrets**:
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add secrets:
   - `PRODUCTION_HOST`: your-server.com
   - `PRODUCTION_USER`: your-username
   - `SSH_PRIVATE_KEY`: Your SSH private key

**Now**: Every time you push to `main` branch, code automatically tests and deploys! 🚀

---

## 🚨 Emergency Rollback

### If Something Goes Wrong in Production

#### Option 1: Git Rollback (Recommended)

```bash
# SSH into production
ssh user@your-production-server.com
cd /var/www/pledgehub

# View recent commits
git log --oneline -10

# Example output:
# abc1234 Add donor rating feature (CURRENT - BROKEN)
# def5678 Fix analytics query (LAST WORKING)
# ghi9012 Add AI insights

# Rollback to last working version
git checkout def5678

# Restart server
pm2 reload omukwano-backend

# Check logs
pm2 logs omukwano-backend
```

#### Option 2: PM2 Rollback

```bash
# PM2 keeps previous versions
pm2 list
pm2 reload omukwano-backend --update-env

# If that doesn't work, restart from backup
pm2 delete omukwano-backend
pm2 start ecosystem.config.js
```

#### Option 3: Database Rollback

```bash
# If database migration broke something
# Restore from backup taken before migration

mysql -u omukwano_user -p pledgehub_db < backup_20251105_090000.sql

# Restart server
pm2 reload omukwano-backend
```

---

## ✅ Best Practices Summary

### Development Workflow

1. **Always work on your local computer first**
2. **Test thoroughly before committing**
3. **Use Git for every change**
4. **Write clear commit messages**
5. **Never edit files directly on production server**

### Deployment Workflow

1. **Backup database before every deployment**
2. **Use PM2 reload (zero downtime) not restart**
3. **Monitor logs immediately after deployment**
4. **Test critical features on live site**
5. **Have rollback plan ready**

### Database Changes

1. **Always create migration scripts**
2. **Make migrations idempotent (safe to run multiple times)**
3. **Test migrations on local database first**
4. **Backup production database before running migration**
5. **Never manually edit production database with MySQL commands**

### Safety Checklist

Before deploying to production:

- [ ] Code tested locally
- [ ] All tests passing
- [ ] Committed to Git with clear message
- [ ] Production database backed up (if database changes)
- [ ] Team notified of deployment
- [ ] Monitoring tools ready (logs, Sentry)
- [ ] Rollback plan prepared
- [ ] Low-traffic time chosen (e.g., 2 AM)

---

## 🛠️ Tools You'll Need

### Essential Tools

1. **Git** - Version control
   - Download: https://git-scm.com/
   - Learn: https://learngitbranching.js.org/

2. **GitHub/GitLab/Bitbucket** - Code hosting
   - GitHub: https://github.com (recommended)
   - Free for public and private repositories

3. **SSH Client** - Connect to production server
   - Windows: Built into PowerShell 7+
   - PuTTY: https://www.putty.org/ (alternative)

4. **PM2** - Process manager
   - Installed on production server
   - Handles zero-downtime deployments

### Recommended Tools

5. **GitHub Actions** - CI/CD automation (free)
6. **Sentry** - Error tracking (free tier)
7. **DataDog/New Relic** - Monitoring (paid)
8. **Postman** - API testing
9. **VS Code Remote SSH** - Edit files on server (use carefully!)

---

## 📖 Learning Resources

### Git & Version Control
- **Git Basics**: https://www.atlassian.com/git/tutorials
- **GitHub Flow**: https://guides.github.com/introduction/flow/
- **Interactive Git**: https://learngitbranching.js.org/

### Deployment
- **PM2 Guide**: https://pm2.keymetrics.io/docs/usage/quick-start/
- **Digital Ocean Deployment**: https://www.digitalocean.com/community/tutorials
- **GitHub Actions**: https://docs.github.com/en/actions

### DevOps Best Practices
- **The Twelve-Factor App**: https://12factor.net/
- **DevOps Roadmap**: https://roadmap.sh/devops

---

## 🎯 Quick Reference

### Common Commands

**Local Development**:
```bash
git pull                    # Get latest code
npm run dev                 # Start dev server
node scripts/test-all.js    # Run tests
git add .                   # Stage changes
git commit -m "message"     # Commit
git push                    # Push to GitHub
```

**Production Deployment**:
```bash
ssh user@server             # Connect to server
cd /var/www/pledgehub # Navigate to project
git pull                    # Pull latest code
npm install                 # Install dependencies
pm2 reload app              # Restart (zero downtime)
pm2 logs app                # Check logs
```

**Emergency**:
```bash
git log --oneline           # View commits
git checkout <commit-id>    # Rollback
pm2 reload app              # Restart
mysqldump > backup.sql      # Backup database
mysql < backup.sql          # Restore database
```

---

## 💡 Real-World Example

### Scenario: You want to add a "Donor Ratings" feature

**Step 1: Local Development**
```bash
# On your computer
cd C:\Users\HP\pledgehub\backend

# Create migration script
# Create new API routes
# Create service functions
# Test everything locally

node scripts/test-all-features.js  # ✅ All tests pass
```

**Step 2: Git Commit**
```bash
git add .
git commit -m "Add donor rating system with 5-star ratings"
git push origin main
```

**Step 3: Production Deployment**
```bash
# SSH to production
ssh yourserver

# Pull code
cd /var/www/pledgehub
git pull origin main

# Backup database
mysqldump -u user -p pledgehub_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migration
node backend/scripts/migrations/add_donor_rating.js

# Install dependencies (if any new packages)
cd backend
npm install

# Restart with zero downtime
pm2 reload omukwano-backend

# Monitor logs
pm2 logs omukwano-backend --lines 100

# Test on live site
curl https://yourdomain.com/api/analytics/overview
```

**Step 4: Verify**
- ✅ Check logs for errors
- ✅ Test rating feature on live site
- ✅ Monitor Sentry for errors
- ✅ Check with test users

**If Problems**:
```bash
# Rollback immediately
git log --oneline
git checkout <previous-working-commit>
pm2 reload omukwano-backend
```

---

## 🎓 Summary

### Key Takeaways

1. **NEVER edit files directly on production server**
2. **Always use Git for version control**
3. **Test locally → Commit → Deploy → Monitor**
4. **Backup database before every deployment**
5. **Use PM2 reload for zero-downtime deployments**
6. **Have rollback plan ready**
7. **Automate with CI/CD when possible**

### The Golden Rule

> **"If you're not comfortable rolling it back, don't deploy it."**

### Questions to Ask Before Deploying

1. ✅ Did I test this locally?
2. ✅ Did I backup the database?
3. ✅ Do I know how to rollback?
4. ✅ Is this a low-traffic time?
5. ✅ Am I monitoring logs?

If answer to any question is "No", **DON'T DEPLOY YET**.

---

**Last Updated**: November 5, 2025  
**Version**: 1.0.0

**Remember**: Production is sacred. Treat it with respect. Always have a backup plan. 🛡️

