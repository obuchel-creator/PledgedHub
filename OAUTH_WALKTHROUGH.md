# 🎯 OAuth Configuration - Simple Walkthrough

**Time needed:** 30 minutes total (15 min Google + 15 min Facebook)

---

## 📋 Before You Start

Make sure you have:
- ✅ A Google account
- ✅ A Facebook account  
- ✅ Backend and frontend servers running
- ✅ VS Code open with your project

---

# 🔵 GOOGLE OAUTH (15 minutes)

## Step 1: Create Google Project (2 minutes)

1. **Open:** https://console.cloud.google.com/
2. **Sign in** with your Google account
3. Click **project dropdown** at top → Click **"NEW PROJECT"**
4. **Project name:** Type `PledgeHub`
5. Click **"CREATE"** → Wait for it to finish → Click **"SELECT PROJECT"**

✅ **Checkpoint:** You should see "PledgeHub" at the top of the page

---

## Step 2: Enable Google+ API (2 minutes)

1. Click **"APIs & Services"** in left menu → **"Library"**
2. **Search for:** `Google+ API`
3. Click on **"Google+ API"** result
4. Click **"ENABLE"** button
5. Wait a few seconds

✅ **Checkpoint:** You'll see "API enabled" confirmation

---

## Step 3: Configure OAuth Consent (5 minutes)

1. Click **"OAuth consent screen"** in left menu
2. Choose **"External"** → Click **"CREATE"**

### Fill the form:

**Page 1 - OAuth consent screen:**
```
App name: PledgeHub
User support email: [Select your email]
Developer contact email: [Your email]
```
Click **"SAVE AND CONTINUE"**

**Page 2 - Scopes:**
1. Click **"ADD OR REMOVE SCOPES"**
2. Check these boxes:
   - ✅ `.../auth/userinfo.email`
   - ✅ `.../auth/userinfo.profile`
3. Click **"UPDATE"**
4. Click **"SAVE AND CONTINUE"**

**Page 3 - Test users:**
1. Click **"+ ADD USERS"**
2. Enter your email address
3. Click **"ADD"**
4. Click **"SAVE AND CONTINUE"**

**Page 4 - Summary:**
1. Click **"BACK TO DASHBOARD"**

✅ **Checkpoint:** OAuth consent screen is configured

---

## Step 4: Create Credentials (3 minutes)

1. Click **"Credentials"** in left menu
2. Click **"+ CREATE CREDENTIALS"** → Select **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** Type `PledgeHub Web Client`

### Add URIs:

**Authorized JavaScript origins:**
1. Click **"+ ADD URI"**
2. Paste: `http://localhost:5173`
3. Click **"+ ADD URI"** again
4. Paste: `http://localhost:5001`

**Authorized redirect URIs:**
1. Click **"+ ADD URI"**
2. Paste: `http://localhost:5001/api/auth/google/callback`
   ⚠️ **IMPORTANT:** No trailing slash! Must be exact!

5. Click **"CREATE"**

✅ **Checkpoint:** A popup appears with your credentials

---

## Step 5: Copy Credentials to .env (3 minutes)

### In the popup, you'll see:

```
Client ID: 123456789-abcdefgh.apps.googleusercontent.com
Client secret: GOCSPX-AbCdEfGh1234567890
```

### Now in VS Code:

1. Open file: `backend/.env`
2. Find these lines:
```env
GOOGLE_CLIENT_ID=your_google_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

3. Replace with YOUR actual credentials:
```env
GOOGLE_CLIENT_ID=123456789-abcdefgh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-AbCdEfGh1234567890
```

4. **Save the file** (Ctrl + S or Cmd + S)

✅ **Google OAuth Complete!**

---

# 🔵 FACEBOOK OAUTH (15 minutes)

## Step 1: Create Facebook App (3 minutes)

1. **Open:** https://developers.facebook.com/
2. **Sign in** with your Facebook account
3. Click **"My Apps"** (top right) → **"Create App"**
4. Choose **"Other"** → Click **"Next"**
5. Choose **"Consumer"** → Click **"Next"**
6. Fill in:
```
App name: PledgeHub
App contact email: [Your email]
```
7. Click **"Create app"**
8. Complete security check if shown

✅ **Checkpoint:** You're on the app dashboard

---

## Step 2: Add Facebook Login (2 minutes)

1. Scroll down to **"Add products to your app"**
2. Find **"Facebook Login"** card
3. Click **"Set up"**
4. Choose **"Web"** platform
5. Site URL: Type `http://localhost:5173`
6. Click **"Save"** → Click **"Continue"**
7. Skip the rest (click "Continue" or close quickstart)

✅ **Checkpoint:** Facebook Login is added to your app

---

## Step 3: Configure Facebook Login (3 minutes)

1. In left menu, click **"Facebook Login"** → **"Settings"**
2. Find **"Valid OAuth Redirect URIs"**
3. In the text box, paste:
```
http://localhost:5001/api/auth/facebook/callback
```
⚠️ **IMPORTANT:** No trailing slash! Must be exact!

4. Scroll to bottom → Click **"Save Changes"**

✅ **Checkpoint:** Redirect URI saved

---

## Step 4: Configure App Settings (2 minutes)

1. In left menu, click **"Settings"** → **"Basic"**
2. Find **"App Domains"**
3. Type: `localhost`
4. Scroll to bottom → Click **"+ Add Platform"**
5. Choose **"Website"**
6. Site URL: `http://localhost:5173`
7. Click **"Save Changes"** at bottom

✅ **Checkpoint:** App domains configured

---

## Step 5: Get App Credentials (2 minutes)

Still on **"Settings" → "Basic"** page:

1. You'll see **"App ID"** - Copy it
2. Find **"App Secret"** → Click **"Show"** button
3. Enter your Facebook password if prompted
4. Copy the App Secret

Example:
```
App ID: 1234567890123456
App Secret: abc123def456ghi789jkl012mno345pq
```

✅ **Checkpoint:** You have both ID and Secret copied

---

## Step 6: Add Credentials to .env (3 minutes)

### In VS Code:

1. Open file: `backend/.env`
2. Find these lines:
```env
FACEBOOK_APP_ID=your_facebook_app_id_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
```

3. Replace with YOUR actual credentials:
```env
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abc123def456ghi789jkl012mno345pq
```

4. **Save the file** (Ctrl + S or Cmd + S)

✅ **Facebook OAuth Complete!**

---

# 🧪 TESTING (5 minutes)

## Step 1: Restart Backend Server

```powershell
# In your backend terminal, press Ctrl+C to stop
# Then restart:
cd backend
npm run dev
```

**Look for these messages:**
```
✓ Server running on port 5001
✓ Google OAuth credentials configured
✓ Facebook OAuth credentials configured
```

If you don't see the ✓ messages, check your .env file for typos!

---

## Step 2: Test Google Login

1. Open browser: `http://localhost:5173/login`
2. Click **"Continue with Google"** button
3. You should see Google's sign-in page
4. Sign in with your Google account
5. Click **"Continue"** on permission screen
6. You should be redirected back and logged in! 🎉

**What to check:**
- ✅ Your name appears in navbar (top right)
- ✅ You can access dashboard
- ✅ No error messages

---

## Step 3: Test Facebook Login

1. Log out (click your name → Logout)
2. Go to: `http://localhost:5173/login`
3. Click **"Continue with Facebook"** button
4. Sign in with Facebook
5. Click **"Continue"** on permissions screen
6. You should be redirected back and logged in! 🎉

**What to check:**
- ✅ Your name appears in navbar
- ✅ You can access dashboard
- ✅ No error messages

---

# ❌ Troubleshooting

## Google Login Not Working?

**Error: "redirect_uri_mismatch"**
→ Go back to Google Console → Credentials → Edit your OAuth client
→ Make sure redirect URI is EXACTLY: `http://localhost:5001/api/auth/google/callback`

**Error: "access_denied"**
→ Make sure you added your email as a test user in OAuth consent screen

**Button does nothing**
→ Open browser console (F12) → Check for errors
→ Make sure backend is running
→ Check credentials in .env file have no extra spaces

---

## Facebook Login Not Working?

**Error: "Can't Load URL"**
→ Go to Facebook App → Settings → Basic
→ Make sure `localhost` is in App Domains
→ Make sure redirect URI is saved: `http://localhost:5001/api/auth/facebook/callback`

**Error: "App is in development mode"**
→ This is normal! Use the Facebook account that owns the app
→ OR add yourself as a test user (Roles → Test Users)

**Button does nothing**
→ Check backend console for errors
→ Make sure App ID and Secret are correct in .env
→ No extra quotes or spaces around credentials

---

## Still Having Issues?

### Check Your .env File Format

Should look like this (no quotes, no spaces):

```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abc123def456789
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/auth/facebook/callback
```

### Restart Everything

```powershell
# Stop both servers (Ctrl+C in each terminal)

# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

# ✅ Success Checklist

- [ ] Google project created
- [ ] Google+ API enabled
- [ ] OAuth consent screen configured
- [ ] Google credentials created and added to .env
- [ ] Facebook app created
- [ ] Facebook Login product added
- [ ] Facebook redirect URI configured
- [ ] Facebook credentials added to .env
- [ ] Backend restarted with OAuth messages showing
- [ ] Google login button works
- [ ] Facebook login button works
- [ ] Can log in and see my name in navbar

---

**🎉 If all boxes are checked, you're done!**

Your OAuth integration is complete and working.

