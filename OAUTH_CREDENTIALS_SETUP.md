# OAuth Credentials Setup Guide

This guide will help you obtain the actual Google and Facebook OAuth credentials for your application.

---

## 🔵 Google OAuth Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name: `PledgeHub` (or your preferred name)
4. Click **"Create"**

### Step 2: Enable Google+ API

1. In your project, go to **APIs & Services** → **Library**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (unless you have a Google Workspace account)
3. Fill in required fields:
   - **App name:** `PledgeHub`
   - **User support email:** Your email
   - **Developer contact:** Your email
4. Click **"Save and Continue"**
5. **Scopes:** Click "Add or Remove Scopes"
   - Select: `userinfo.email`
   - Select: `userinfo.profile`
6. Click **"Save and Continue"**
7. **Test users:** Add your email for testing
8. Click **"Save and Continue"**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Application type: **"Web application"**
4. Name: `PledgeHub Web Client`
5. **Authorized JavaScript origins:**
   ```
   http://localhost:5173
   http://localhost:5001
   ```
6. **Authorized redirect URIs:**
   ```
   http://localhost:5001/api/auth/google/callback
   ```
7. Click **"Create"**
8. **Copy your credentials:**
   - Client ID: `xxxxxxxxxx.apps.googleusercontent.com`
   - Client Secret: `xxxxxxxxxxxxxxxxxxxx`

### Step 5: Update .env File

```env
GOOGLE_CLIENT_ID=paste_your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

---

## 🔵 Facebook OAuth Setup

### Step 1: Create a Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Click **"Create App"**
3. Choose use case: **"Consumer"** or **"Other"**
4. Click **"Next"**
5. Fill in:
   - **App name:** `PledgeHub`
   - **Contact email:** Your email
6. Click **"Create App"**

### Step 2: Add Facebook Login Product

1. In your app dashboard, find **"Facebook Login"**
2. Click **"Set Up"**
3. Choose **"Web"** platform
4. Enter site URL: `http://localhost:5173`
5. Click **"Save"** and **"Continue"**

### Step 3: Configure Facebook Login Settings

1. In the left sidebar, click **"Facebook Login"** → **"Settings"**
2. **Valid OAuth Redirect URIs:** Add:
   ```
   http://localhost:5001/api/auth/facebook/callback
   ```
3. **Allowed Domains for the JavaScript SDK:**
   ```
   localhost
   ```
4. Click **"Save Changes"**

### Step 4: Get App Credentials

1. Go to **Settings** → **Basic** (in left sidebar)
2. You'll see:
   - **App ID:** Copy this
   - **App Secret:** Click **"Show"** and copy
3. **App Domains:** Add `localhost`
4. Click **"Save Changes"**

### Step 5: Configure App for Development

1. At the top, toggle **"App Mode"** from "Development" to enable testing
2. For development, add test users:
   - Go to **Roles** → **Test Users**
   - Add your Facebook account

### Step 6: Update .env File

```env
FACEBOOK_APP_ID=paste_your_app_id_here
FACEBOOK_APP_SECRET=paste_your_app_secret_here
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/auth/facebook/callback
```

---

## 🚀 Testing OAuth Integration

### Start Your Servers

```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Test Google Login

1. Navigate to `http://localhost:5173/login`
2. Click **"Continue with Google"** button
3. You should be redirected to Google's consent screen
4. After authorizing, you'll be redirected back and logged in

### Test Facebook Login

1. Navigate to `http://localhost:5173/login`
2. Click **"Continue with Facebook"** button
3. You should be redirected to Facebook's login/consent screen
4. After authorizing, you'll be redirected back and logged in

---

## 🔧 Database Schema for OAuth

Your User model already supports OAuth. Make sure your `users` table has these columns:

```sql
ALTER TABLE users ADD COLUMN oauth_provider VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN oauth_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
```

---

## 🛡️ Production Deployment

When deploying to production, update your credentials:

### Google Cloud Console
- Add production domain to **Authorized JavaScript origins**
- Add production callback URL to **Authorized redirect URIs**
  ```
  https://yourdomain.com/api/auth/google/callback
  ```

### Facebook Developers
- Switch app from **"Development"** to **"Live"** mode
- Add production domain to **Valid OAuth Redirect URIs**
  ```
  https://yourdomain.com/api/auth/facebook/callback
  ```

### Production .env
```env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/auth/facebook/callback
FRONTEND_URL=https://yourdomain.com
```

---

## 🐛 Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- Check that callback URL in Google Console matches exactly: `http://localhost:5001/api/auth/google/callback`
- No trailing slashes
- Correct protocol (http/https)

**Error: "access_denied"**
- Make sure user is added as test user in OAuth consent screen
- Check that scopes (email, profile) are configured

### Facebook OAuth Issues

**Error: "Can't Load URL"**
- Verify redirect URI in Facebook Login Settings
- Make sure app is in Development mode for testing
- Add localhost to App Domains

**Error: "App Not Set Up"**
- Ensure Facebook Login product is added to your app
- Check that redirect URI is configured correctly

---

## 📝 Notes

- OAuth credentials are **sensitive** - never commit them to git
- Use different credentials for development and production
- Regularly rotate secrets in production
- Monitor OAuth usage in respective consoles
- Keep your `.env` file secure and backed up

---

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Google OAuth credentials obtained
- [ ] Google credentials added to `.env`
- [ ] Facebook app created  
- [ ] Facebook Login configured
- [ ] Facebook credentials added to `.env`
- [ ] Database columns for OAuth exist
- [ ] Backend server restarted with new credentials
- [ ] Tested Google login flow
- [ ] Tested Facebook login flow

---

**Need Help?**

- Google OAuth: [Documentation](https://developers.google.com/identity/protocols/oauth2)
- Facebook Login: [Documentation](https://developers.facebook.com/docs/facebook-login)
- Passport.js: [Google Strategy](http://www.passportjs.org/packages/passport-google-oauth20/) | [Facebook Strategy](http://www.passportjs.org/packages/passport-facebook/)

