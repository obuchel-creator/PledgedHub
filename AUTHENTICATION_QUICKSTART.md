# Quick Start: Testing Authentication

## 🚀 Start the Application

### 1. Start Backend
```powershell
cd backend
npm start
```
Backend will run on: `http://localhost:5001`

### 2. Start Frontend
```powershell
cd frontend
npm run dev
```
Frontend will run on: `http://localhost:5174`

---

## 🔐 Default Admin Credentials

**Email**: `admin@pledgehub.com`  
**Password**: `Admin@2024`

⚠️ **Important**: Change this password immediately after first login!

---

## ✅ Testing Checklist

### Test 1: Admin Login ✅
1. Go to: `http://localhost:5174/login`
2. Enter admin credentials above
3. Click "Sign In"
4. **Expected**: Redirected to home page, logged in

### Test 2: Access Admin Dashboard ✅
1. After logging in, go to: `http://localhost:5174/admin`
2. **Expected**: See admin dashboard with stats
3. Logout and try accessing `/admin`
4. **Expected**: Redirected to `/login`

### Test 3: Create Campaign (Admin Only) ✅
1. Login as admin
2. Go to: `http://localhost:5174/create-campaign`
3. **Expected**: See campaign creation form
4. Fill out form and submit
5. **Expected**: Campaign created successfully

### Test 4: Unauthorized Access ✅
1. Create a non-admin user (staff or donor)
2. Login with non-admin credentials
3. Try to access: `http://localhost:5174/admin`
4. **Expected**: Redirected to `/unauthorized` with 403 error

### Test 5: Protected Routes ✅
1. Without logging in, try:
   - `/admin` → **Expected**: Redirect to `/login`
   - `/create-campaign` → **Expected**: Redirect to `/login`
   - `/create` → **Expected**: Redirect to `/login`
   - `/profile` → **Expected**: Redirect to `/login`

---

## 🐛 Troubleshooting

### Issue: "Cannot read property 'role' of undefined"
**Fix**: Make sure you're logged in. Check localStorage for `authToken`.

### Issue: Login returns 401
**Fix**: Check if database migration ran successfully. Verify user exists in database.

### Issue: "Authorization header missing"
**Fix**: Check that AuthContext is providing token in API requests.

### Issue: Import errors in LoginScreen
**Fix**: Update import path from `context/AuthContext` to `contexts/AuthContext`

---

## 📊 Database Verification

### Check if admin user exists:
```sql
SELECT id, email, role FROM users WHERE role = 'admin';
```

### Check table structure:
```sql
DESCRIBE users;
```

Should show `role` column with ENUM('admin', 'staff', 'donor')

---

## 🔄 Reset Admin Password

If you forgot the admin password:

```powershell
cd backend
node scripts/add-user-roles.js
```

This will recreate the admin user with default password.

---

## ✨ What's Working

✅ Database migration completed  
✅ Backend authentication middleware  
✅ Protected campaign routes  
✅ Frontend AuthContext with role helpers  
✅ ProtectedRoute component  
✅ Unauthorized error page  
✅ App.jsx routes protected  

## ⏳ What Needs Testing

⏳ End-to-end login flow  
⏳ Role-based access control  
⏳ Token expiration handling  
⏳ Logout functionality  
⏳ Protected route redirects  

---

## 📝 Quick Reference

### User Roles:
- **admin**: Full access (campaigns, pledges, analytics, admin dashboard)
- **staff**: Create pledges, view analytics (no campaigns, no admin dashboard)
- **donor**: View own pledges only (no create, no admin access)

### Protected Routes:
- `/admin` - Admin only
- `/create-campaign` - Admin only
- `/create` - Staff/Admin
- `/campaigns/:id` - Authenticated
- `/pledges/:id` - Authenticated
- `/profile` - Authenticated
- `/settings` - Authenticated

---

Ready to test! Start with Test 1 above. 🚀

