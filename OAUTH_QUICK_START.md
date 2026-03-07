# 🔐 OAuth Integration - Quick Reference

## ✅ What's Done

1. **Backend Configuration** ✓
   - OAuth routes set up (`/api/auth/google`, `/api/auth/facebook`)
   - Passport strategies configured
   - User model supports OAuth fields
   - Database columns added (oauth_provider, oauth_id, email_verified)

2. **Frontend Integration** ✓
   - Google login button on LoginScreen
   - Facebook login button on LoginScreen
   - OAuth callback handling

3. **Database** ✓
   - OAuth columns created
   - Index added for performance
   - Migration successful

## 📋 Next Steps - Get OAuth Credentials

### For Google OAuth (15 minutes)

1. **Go to:** https://console.cloud.google.com/
2. **Create project** → Name it "PledgeHub"
3. **Enable Google+ API** (APIs & Services → Library)
4. **Configure OAuth consent screen:**
   - External user type
   - Add app name, support email
   - Add scopes: email, profile
5. **Create credentials:**
   - OAuth client ID → Web application
   - Authorized origins: `http://localhost:5173`, `http://localhost:5001`
   - Redirect URI: `http://localhost:5001/api/auth/google/callback`
6. **Copy credentials** and update `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_actual_secret_here
   ```

### For Facebook OAuth (15 minutes)

1. **Go to:** https://developers.facebook.com/apps
2. **Create app** → Consumer or Other
3. **Add Facebook Login product**
4. **Configure settings:**
   - Valid OAuth Redirect URIs: `http://localhost:5001/api/auth/facebook/callback`
   - Allowed domains: `localhost`
5. **Get credentials** (Settings → Basic):
   - Copy App ID
   - Copy App Secret (click Show)
6. **Update `.env`:**
   ```env
   FACEBOOK_APP_ID=your_actual_app_id
   FACEBOOK_APP_SECRET=your_actual_secret_here
   ```

## 🚀 Test It

After adding credentials:

```powershell
# Restart backend server
cd backend
npm run dev

# In another terminal - frontend
cd frontend
npm run dev
```

Visit: http://localhost:5173/login

Click "Continue with Google" or "Continue with Facebook" - you should be redirected to authenticate!

## 📁 Files Modified Today

- ✅ `backend/.env` - Added OAuth credential placeholders
- ✅ `backend/models/User.js` - Updated to support OAuth users
- ✅ `backend/scripts/add-oauth-columns.js` - Migration script (executed)
- ✅ Database: `users` table now has oauth_provider, oauth_id, email_verified columns

## 📚 Documentation

See `OAUTH_CREDENTIALS_SETUP.md` for detailed step-by-step instructions with screenshots guidance.

## 🔒 Security Notes

- Never commit actual credentials to git
- `.env` file is in `.gitignore` ✓
- Use different credentials for development vs production
- OAuth tokens are handled securely by Passport.js

---

**Current Status:** OAuth infrastructure is ready! Just need to add the actual credentials from Google and Facebook.

