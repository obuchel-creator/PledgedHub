# OAuth Integration Setup Guide

## 🔐 Real OAuth Authentication Setup

This guide explains how to set up Google and Facebook OAuth authentication for your PledgeHub application.

## ✅ What's Already Done

The following have been implemented and are ready to use:

1. ✅ OAuth packages installed (`passport`, `passport-google-oauth20`, `passport-facebook`)
2. ✅ Passport configuration (`backend/config/passport.js`)
3. ✅ OAuth routes (`backend/routes/oauthRoutes.js`)
4. ✅ Server integration (`backend/server.js`)
5. ✅ Frontend OAuth callback handler (`frontend/src/screens/OAuthCallbackScreen.jsx`)
6. ✅ Login screen OAuth buttons (linked to real endpoints)

## 📋 Setup Steps

### Step 1: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth credentials:
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Configure consent screen if prompted
   - Application type: "Web application"
   - Name: "PledgeHub App"
   - Authorized redirect URIs:
     - `http://localhost:5001/api/auth/google/callback`
     - Add your production URL when deploying
5. Copy your **Client ID** and **Client Secret**

### Step 2: Get Facebook OAuth Credentials

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Choose "Consumer" as app type
4. Fill in app details and create
5. Add Facebook Login:
   - Dashboard → "Add a Product" → "Facebook Login" → "Set Up"
6. Configure settings:
   - Facebook Login → Settings
   - Valid OAuth Redirect URIs:
     - `http://localhost:5001/api/auth/facebook/callback`
     - Add your production URL when deploying
7. Get credentials:
   - Settings → Basic
   - Copy **App ID** and **App Secret**

### Step 3: Update Backend .env File

Add these variables to `backend/.env`:

```bash
# Session Secret (for OAuth)
SESSION_SECRET=your_random_session_secret_here

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/auth/facebook/callback
```

**Important:** Replace the placeholder values with your actual credentials!

### Step 4: Add OAuth Callback Route to Frontend

Add this route to your frontend routing configuration (e.g., `App.jsx` or routing file):

```jsx
import OAuthCallbackScreen from './screens/OAuthCallbackScreen';

// Add this route
<Route path="/auth/callback" element={<OAuthCallbackScreen />} />
```

### Step 5: Restart Backend Server

After updating the `.env` file, restart your backend server:

```powershell
# Stop current server (Ctrl+C)
cd c:\Users\HP\pledgehub\backend
npm run dev
```

## 🧪 Testing OAuth

### Test Google Sign-In:
1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. You'll be redirected to Google's login page
4. Sign in with your Google account
5. You'll be redirected back to your app and logged in

### Test Facebook Sign-In:
1. Go to http://localhost:5173/login
2. Click "Continue with Facebook"
3. You'll be redirected to Facebook's login page
4. Sign in with your Facebook account
5. You'll be redirected back to your app and logged in

## 🔧 How It Works

### Backend Flow:
1. User clicks "Continue with Google" → redirects to `/api/auth/google`
2. Passport redirects to Google's OAuth page
3. User authenticates with Google
4. Google redirects back to `/api/auth/google/callback`
5. Passport verifies the response and creates/finds user
6. Backend generates JWT token
7. Backend redirects to frontend: `/auth/callback?token=...&provider=google`

### Frontend Flow:
1. `OAuthCallbackScreen` receives token from URL params
2. Stores token in localStorage
3. Updates auth context
4. Redirects to dashboard

## 📝 Database Changes Needed

The User model needs to support OAuth users who don't have passwords. Update your users table:

```sql
ALTER TABLE users 
ADD COLUMN oauth_provider VARCHAR(50) NULL,
ADD COLUMN oauth_id VARCHAR(255) NULL,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE,
MODIFY password_hash VARCHAR(255) NULL;
```

## 🚀 Production Deployment

When deploying to production:

1. Update redirect URIs in Google Cloud Console and Facebook Developer Console
2. Update `.env` with production URLs:
   ```bash
   GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
   FACEBOOK_CALLBACK_URL=https://yourdomain.com/api/auth/facebook/callback
   ```
3. Enable HTTPS (required for OAuth in production)
4. Update session cookie settings:
   ```javascript
   cookie: { 
     secure: true,  // Requires HTTPS
     sameSite: 'lax',
     domain: 'yourdomain.com'
   }
   ```

## ⚠️ Troubleshooting

### "Google OAuth credentials not configured"
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are in `.env`
- Restart the backend server after adding credentials

### "Redirect URI mismatch" error
- Ensure the callback URL in Google/Facebook console matches exactly
- Check for http vs https
- Check for trailing slashes

### "Email not provided" error
- Ensure you've requested the `email` scope
- Some users may not have email in their profile

### Token not saving
- Check browser console for errors
- Verify OAuthCallbackScreen is properly routed
- Check localStorage permissions

## 📚 Additional Resources

- [Passport.js Documentation](http://www.passportjs.org/docs/)
- [Google OAuth 2.0 Guide](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)

## 🎉 Success!

Once configured, users can:
- ✅ Sign in with Google (one click)
- ✅ Sign in with Facebook (one click)
- ✅ Sign in with email/password (traditional)
- ✅ Seamlessly switch between methods

All authentication methods use the same JWT system for consistent authorization!

