# 🔵 Google OAuth Setup - Step-by-Step Guide

**Date**: November 5, 2025  
**Time Required**: 15-30 minutes  
**Status**: Backend Already Coded ✅ - Just Need Credentials

---

## 🎯 What We're Doing

Setting up Google OAuth so users can login with "Sign in with Google" button.

**Good News**: The code is already built! We just need to get credentials from Google.

---

## 📋 Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Open your browser
2. Go to: https://console.cloud.google.com/
3. Sign in with your Google account

---

### Step 2: Create a Project (if you don't have one)

1. Click the project dropdown at the top (next to "Google Cloud")
2. Click "**NEW PROJECT**"
3. Fill in:
   - **Project name**: `PledgeHub` (or any name)
   - **Organization**: Leave default
4. Click "**CREATE**"
5. Wait a few seconds for project creation
6. Select your new project from the dropdown

---

### Step 3: Enable Google+ API (Required for OAuth)

1. In the left sidebar, click "**APIs & Services**" → "**Library**"
2. Search for: `Google+ API`
3. Click on "**Google+ API**"
4. Click "**ENABLE**"
5. Wait for it to enable (takes a few seconds)

---

### Step 4: Configure OAuth Consent Screen

1. Go to "**APIs & Services**" → "**OAuth consent screen**" (left sidebar)

2. Choose user type:
   - Select "**External**" (for public users)
   - Click "**CREATE**"

3. Fill in App Information:
   - **App name**: `PledgeHub`
   - **User support email**: Your email address
   - **App logo**: (Optional - skip for now)
   - **Application home page**: `http://localhost:5173` (for development)
   - **Application privacy policy link**: (Optional - skip for now)
   - **Application terms of service link**: (Optional - skip for now)
   - **Authorized domains**: (Leave empty for development)

4. Developer contact information:
   - **Email addresses**: Your email address

5. Click "**SAVE AND CONTINUE**"

6. Scopes (Step 2):
   - Click "**ADD OR REMOVE SCOPES**"
   - Find and select:
     * `email` - See your email address
     * `profile` - See your personal info
     * `openid` - Associate you with your personal info on Google
   - Click "**UPDATE**"
   - Click "**SAVE AND CONTINUE**"

7. Test users (Step 3):
   - Click "**+ ADD USERS**"
   - Add your email address (so you can test)
   - Click "**ADD**"
   - Click "**SAVE AND CONTINUE**"

8. Summary (Step 4):
   - Review everything
   - Click "**BACK TO DASHBOARD**"

---

### Step 5: Create OAuth 2.0 Credentials

1. Go to "**APIs & Services**" → "**Credentials**" (left sidebar)

2. Click "**+ CREATE CREDENTIALS**" (at the top)

3. Select "**OAuth client ID**"

4. Fill in the form:
   - **Application type**: Select "**Web application**"
   - **Name**: `PledgeHub Web Client`

5. **Authorized JavaScript origins**:
   - Click "**+ ADD URI**"
   - Add: `http://localhost:5173` (frontend)
   - Click "**+ ADD URI**" again
   - Add: `http://localhost:5001` (backend)

6. **Authorized redirect URIs**:
   - Click "**+ ADD URI**"
   - Add: `http://localhost:5001/api/auth/google/callback`
   - Click "**+ ADD URI**" again (for production later)
   - Add: `https://yourdomain.com/api/auth/google/callback` (replace with your domain when ready)

7. Click "**CREATE**"

---

### Step 6: Copy Your Credentials

You'll see a popup with your credentials:

```
Your Client ID
1234567890-abcdefghijklmnop.apps.googleusercontent.com

Your Client Secret
GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
```

**IMPORTANT**: Copy both of these! You'll need them in the next step.

If you closed the popup:
- Go back to "**Credentials**" page
- Find your OAuth 2.0 Client ID in the list
- Click the name or the pencil icon (✏️) to see credentials
- Copy Client ID and Client Secret

---

### Step 7: Update Your Backend .env File

1. Open your project folder: `C:\Users\HP\pledgehub\backend`

2. Open the `.env` file in a text editor

3. Find these lines (or add them if missing):

```env
# Google OAuth (UPDATE THESE!)
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

4. Replace with your actual credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=1234567890-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback
```

5. Save the file

---

### Step 8: Restart Your Backend Server

The backend needs to reload the new environment variables.

**If backend is running**:
1. Go to the terminal running backend
2. Press `Ctrl+C` to stop it
3. Restart: `npm run dev`

**Expected output**:
```
✓ Google OAuth initialized
✓ Facebook OAuth initialized  
Server running on port 5001
```

---

### Step 9: Test Google OAuth Login

1. Make sure both backend and frontend are running:
   - Backend: `http://localhost:5001`
   - Frontend: `http://localhost:5173`

2. Open frontend in browser: `http://localhost:5173`

3. Go to Login page

4. Click "**Sign in with Google**" button

5. You should see Google's login screen

6. Sign in with your Google account (the one you added as test user)

7. Google will ask for permissions (email, profile) - Click "**Continue**"

8. You should be redirected back to your app, now logged in!

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] Google Cloud Console project created
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 credentials created
- [ ] Client ID and Client Secret copied
- [ ] Backend `.env` file updated with credentials
- [ ] Backend server restarted
- [ ] "Sign in with Google" button works
- [ ] Can login with Google account
- [ ] Redirected to dashboard after login
- [ ] User info displayed correctly

---

## 🐛 Troubleshooting

### Problem: "Error 400: redirect_uri_mismatch"

**Cause**: Redirect URI in Google Console doesn't match backend URL

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Check "Authorized redirect URIs"
4. Make sure it EXACTLY matches: `http://localhost:5001/api/auth/google/callback`
5. No trailing slash, correct port number

---

### Problem: "Access blocked: This app's request is invalid"

**Cause**: OAuth consent screen not properly configured

**Solution**:
1. Go to "OAuth consent screen"
2. Make sure status is not "Testing" or add your email to test users
3. Verify all required scopes are added (email, profile, openid)

---

### Problem: Backend shows "GOOGLE_CLIENT_ID is not defined"

**Cause**: Environment variables not loaded

**Solution**:
1. Check `.env` file has the credentials
2. Make sure there are no extra spaces or quotes
3. Restart backend server completely
4. Check backend logs for "Google OAuth initialized"

---

### Problem: "Sign in with Google" button does nothing

**Cause**: Backend route not working

**Solution**:
1. Test backend endpoint directly: `http://localhost:5001/api/auth/google`
2. Should redirect to Google login
3. Check backend logs for errors
4. Verify passport.js is configured correctly

---

### Problem: Login works but no user data saved

**Cause**: Database user insertion failing

**Solution**:
1. Check backend logs for database errors
2. Verify `users` table has `google_id` column
3. Check MySQL connection is working
4. Try logging in again and check logs

---

## 📱 For Production Deployment

When deploying to production, update these settings:

### 1. Google Cloud Console

1. Go to OAuth 2.0 Client ID settings
2. Add production URLs:
   - **Authorized JavaScript origins**:
     * `https://yourdomain.com`
   - **Authorized redirect URIs**:
     * `https://yourdomain.com/api/auth/google/callback`

### 2. Backend .env (Production)

```env
GOOGLE_CLIENT_ID=same_as_development
GOOGLE_CLIENT_SECRET=same_as_development
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

### 3. OAuth Consent Screen

Consider publishing your app:
1. Go to "OAuth consent screen"
2. Click "**PUBLISH APP**"
3. This removes the "unverified app" warning
4. Note: Requires verification if requesting sensitive scopes

---

## 🎉 What Happens After Setup?

Once Google OAuth is configured, users can:

✅ Click "Sign in with Google" on login page  
✅ Use their existing Google account (no password needed)  
✅ One-click login (faster than email/password)  
✅ More secure (Google handles authentication)  
✅ See their Google profile picture in app  

The backend automatically:
- Creates a user account on first login
- Stores Google ID for future logins
- Generates JWT token for session
- No password stored (Google handles it)

---

## 📊 Status After This Feature

### Before:
- ✅ Facebook OAuth working
- ❌ Google OAuth not configured

### After:
- ✅ Facebook OAuth working
- ✅ Google OAuth working
- ✅ Users have 3 login options:
  1. Email/Password (traditional)
  2. Facebook (social)
  3. Google (social)

---

## 🚀 Next Feature

After Google OAuth is working, we'll move to:

**Advanced Charts with Chart.js** 📊
- Beautiful line charts for trends
- Pie charts for categories
- Bar charts for top donors
- Visual analytics dashboard

Time estimate: 3-4 hours

---

## 📋 Quick Reference Commands

```powershell
# Restart backend
cd C:\Users\HP\pledgehub\backend
npm run dev

# Check if backend is running
curl http://localhost:5001/api/auth/google

# View backend logs
# (Just watch the terminal where backend is running)

# Test OAuth flow
# Open: http://localhost:5173/login
# Click: "Sign in with Google"
```

---

## 🆘 Need Help?

If you get stuck:

1. **Check backend logs** - Look for error messages
2. **Check browser console** - Press F12, look at Console tab
3. **Verify .env file** - Make sure credentials are correct
4. **Check Google Console** - Verify redirect URIs match exactly
5. **Try incognito mode** - Sometimes browser cache causes issues

---

**Ready to set this up?** Follow the steps above! It takes about 15-30 minutes. Let me know when you're done or if you get stuck! 🚀

---

**Created**: November 5, 2025  
**Status**: ⏳ Waiting for Google Credentials  
**Next**: Update backend/.env → Restart server → Test login

