# 🚀 Staging Deployment Checklist & Guide

## Pre-Deployment Verification

### Database Status ✅
- [x] RBAC schema complete (5 tables)
- [x] 47 role-permission mappings seeded
- [x] 2FA support tables created
- [x] Audit logging tables ready
- [x] All indexes added for performance

### Backend Implementation ✅
- [x] authMiddleware enhanced with RBAC
- [x] 9 high-priority routes updated
- [x] payoutRoutes using finance_admin role
- [x] All admin routes use requireRole
- [x] Test scripts passing (100% success)

### Frontend Implementation ✅
- [x] RBAC utilities created (rbac.js)
- [x] Navigation config implemented
- [x] RBACNavBar component created
- [x] ProtectedRoute with role support
- [x] Menu generation by role

### Security Infrastructure ✅
- [x] 2FA database columns added
- [x] Recovery codes table ready
- [x] Audit log table for compliance
- [x] Enforcement policies configured
- [x] Grace period system ready

---

## Staging Deployment Steps

### Phase 1: Pre-Deployment (Local Testing)

```bash
# 1. Verify database migrations
node backend/scripts/test-rbac-direct.js
# Expected: 12/12 tests passing (100%)

# 2. Verify 2FA setup
node backend/scripts/enforce-2fa-for-high-privilege.js
# Expected: Schema verified, policies configured

# 3. Check route classification
node backend/scripts/analyze-routes-rbac.js
# Expected: All routes categorized, 30 files analyzed

# 4. Start local servers
.\scripts\dev.ps1
# Frontend: http://localhost:5173
# Backend:  http://localhost:5001
```

### Phase 2: Deploy to Staging

#### 2.1 Database
```bash
# Backup production database FIRST
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME > backup-$(date +%Y%m%d).sql

# Run migrations on staging
node backend/scripts/migration-expanded-roles.js
node backend/scripts/migration-add-2fa-support.js

# Verify migrations
SELECT COUNT(*) FROM role_permissions;     # Should be 47
SELECT COUNT(*) FROM two_fa_policy;        # Should be 5
```

#### 2.2 Backend Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
cd backend
npm install

# Clear Node cache
npm cache clean --force

# Restart backend server
npm run dev
# or in production:
pm2 restart pledgehub-backend
```

#### 2.3 Frontend Deployment
```bash
# Pull latest code
git pull origin main

# Install dependencies
cd frontend
npm install

# Build for production
npm run build

# Deploy to hosting
# Copy dist/ folder to web server
# or use:
npm run preview
```

### Phase 3: Post-Deployment Validation

#### 3.1 Authentication Test
```bash
# Test login endpoint
curl -X POST http://staging.pledgehub.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'
# Expected: 200 with JWT token
```

#### 3.2 RBAC Test
```bash
# Test donor access (should succeed)
curl -X GET http://staging.pledgehub.com/api/pledges \
  -H "Authorization: Bearer DONOR_TOKEN"
# Expected: 200

# Test donor access to finance routes (should fail)
curl -X GET http://staging.pledgehub.com/api/payouts/admin/pending \
  -H "Authorization: Bearer DONOR_TOKEN"
# Expected: 403 Forbidden
```

#### 3.3 Route Protection Test
```bash
# Test protected route without auth (should fail)
curl -X GET http://staging.pledgehub.com/api/pledges
# Expected: 401 Unauthorized

# Test protected route with invalid token (should fail)
curl -X GET http://staging.pledgehub.com/api/pledges \
  -H "Authorization: Bearer INVALID_TOKEN"
# Expected: 401 or 403
```

#### 3.4 Database Test
```sql
-- Check role distribution
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check audit log (should be empty or have setup logs)
SELECT COUNT(*) FROM role_audit_log;

-- Check permissions
SELECT role, COUNT(*) as perm_count FROM role_permissions GROUP BY role;
```

---

## Staging Test Scenarios

### Scenario 1: Donor User Workflow
```
1. Register as donor
2. Login → Should see: Dashboard, My Pledges, Create Pledge, Profile
3. Try to access /admin/payouts → Should be redirected/denied
4. Create a pledge → Should succeed
5. View pledge details → Should succeed
```

### Scenario 2: Creator User Workflow
```
1. Register as donor
2. Admin promotes to creator
3. Login again → Should see creator menu
4. Create campaign → Should succeed
5. Request payout → Should succeed
6. Try to approve payout → Should fail (finance_admin only)
```

### Scenario 3: Finance Admin Workflow
```
1. Admin creates finance_admin user
2. Finance admin logs in → Should see finance menu
3. View pending payouts → Should succeed
4. Try to create user → Should fail (super_admin only)
5. Try to change system settings → Should fail
```

### Scenario 4: Super Admin Workflow
```
1. Super admin logs in → Should see all menus
2. Access any route → Should always succeed
3. Change user roles → Should succeed
4. Modify system settings → Should succeed
5. View audit logs → Should see activity history
```

---

## Monitoring & Logging

### What to Monitor
```javascript
// In staging logs, look for:

// ✅ Successful authentication
"[AUTH] User logged in: user@example.com, role: creator"

// ✅ Successful authorization
"[RBAC] User 123 (creator) accessing /campaigns - ALLOWED"

// ⚠️ Denied access (expected in tests)
"[RBAC] User 456 (donor) accessing /admin/payouts - DENIED"

// ❌ Errors to investigate
"[ERROR] RBAC middleware: Missing requireRole in route"
"[ERROR] 2FA validation failed for user 789"
```

### Performance Metrics
```sql
-- Check middleware performance
SELECT AVG(response_time) FROM request_logs 
WHERE endpoint LIKE '/api/%' AND contains_rbac = true;
-- Expected: < 50ms additional overhead
```

---

## Rollback Plan

If issues occur in staging:

### Quick Rollback
```bash
# Revert last commit
git revert HEAD

# Restart backend
npm run dev

# Clear browser cache
# (User should do Ctrl+Shift+Del)
```

### Database Rollback
```bash
# Restore from backup
mysql -h $DB_HOST -u $DB_USER -p$DB_PASS $DB_NAME < backup-YYYYMMDD.sql

# Or remove new tables (if needed)
DROP TABLE IF EXISTS role_audit_log, role_permissions, 
                     two_fa_recovery_codes, two_fa_audit_log, two_fa_policy;
```

### Complete Rollback
```bash
# 1. Revert code
git reset --hard HEAD~1

# 2. Restore database
mysql ... < backup.sql

# 3. Restart services
npm run dev
```

---

## Success Criteria

### Before moving to production, verify:

✅ Database Checks
- [ ] All 9 RBAC and 2FA tables exist
- [ ] 47 permission mappings seeded
- [ ] No SQL errors in migration logs
- [ ] Indexes created for performance

✅ API Checks
- [ ] All endpoints respond to requests
- [ ] Authentication works (login/logout)
- [ ] RBAC enforcement active (tested)
- [ ] Error responses correct (401/403)

✅ Frontend Checks
- [ ] Navigation shows correct menu per role
- [ ] Protected routes blocked for unauthorized users
- [ ] No console errors in browser
- [ ] Forms submit successfully

✅ Performance Checks
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database queries < 100ms
- [ ] No memory leaks after 1 hour use

✅ Security Checks
- [ ] CSRF tokens present on forms
- [ ] Passwords never logged
- [ ] Sensitive data encrypted
- [ ] Audit logs recording activity

---

## Common Issues & Solutions

### Issue: 403 Forbidden on valid route
**Cause**: Role middleware not applied to route
**Solution**:
1. Check route file has `requireRole` import
2. Add `requireRole('role')` to route
3. Restart backend

### Issue: Menu not showing for role
**Cause**: navigationConfig.js not updated
**Solution**:
1. Add role to MENU_CONFIG in navigationConfig.js
2. Clear browser cache (Ctrl+Shift+Del)
3. Reload page

### Issue: 2FA column errors
**Cause**: Migration didn't run
**Solution**:
1. Check migration-add-2fa-support.js ran
2. Verify columns: `DESC users;`
3. Run migration manually if needed

### Issue: Token not working after deployment
**Cause**: JWT_SECRET changed or mismatched
**Solution**:
1. Verify JWT_SECRET in .env
2. Users need to login again
3. Check token format (Bearer <token>)

---

## Post-Deployment Communication

### For Users
```
📢 UPDATE: We've enhanced security with role-based access control

What's new:
• Improved access controls by user role
• Better permission management
• Enhanced security for financial operations

What you need to do:
• Your role is now: [role]
• You can access: [menu items]
• High-privilege users will need to enable 2FA soon
```

### For Admins
```
⚙️  DEPLOYMENT: RBAC System Active

Database Changes:
• role_permissions table (47 mappings)
• two_fa_recovery_codes table
• two_fa_audit_log table
• two_fa_policy table

What to monitor:
• Check role_audit_log for access attempts
• Monitor two_fa_audit_log for 2FA activities
• Review error logs for RBAC denials

Action items:
• Assign roles to users
• Enable 2FA for high-privilege users
• Brief support team on new roles
```

---

## Next Steps After Staging

1. ✅ All tests pass → Move to production
2. ✅ Performance acceptable → Scale if needed
3. ✅ Security verified → Enable audit logging
4. ✅ Users notified → Begin 2FA rollout
5. ✅ Monitoring active → Monitor for 24 hours

---

## Contacts & Support

- **Database Issues**: Check DB logs in `/var/log/mysql/`
- **Backend Issues**: Check Node logs in `backend/logs/`
- **Frontend Issues**: Check browser console (F12)
- **2FA Issues**: Check `two_fa_audit_log` table
- **RBAC Issues**: Check `role_audit_log` table

---

**Deployment Date**: December 20, 2025  
**Status**: READY FOR STAGING  
**Success Rate**: 100% (All tests passing)  
**Estimated Deployment Time**: 30 minutes  
**Estimated Rollback Time**: 5 minutes
