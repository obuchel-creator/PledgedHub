# 🚀 OAuth Implementation - Complete Working Guide

## Current Status
✅ OAuth database columns are set up  
✅ OAuth backend code is implemented  
✅ Facebook OAuth has real credentials  
✅ Server starts successfully with OAuth routes  
❌ Google OAuth needs real credentials  

## What's Working Now

### ✅ Backend Infrastructure Complete
- **OAuth Routes**: `/api/auth/google`, `/api/auth/facebook`, `/api/auth/status`
- **Database Schema**: Users table has `oauth_provider`, `oauth_id`, `email_verified` columns
- **Passport.js**: Google and Facebook strategies configured
- **JWT Tokens**: Session-less authentication with unique token tracking
- **User Auto-creation**: Email-based linking, OAuth users don't need passwords

### ✅ Facebook OAuth Ready
- App ID: `1136457435355910` (configured)
- App Secret: Configured in `.env`
- Callback URL: `http://localhost:5001/api/auth/facebook/callback`

## Step 1: Get Google OAuth Credentials

### Quick Setup (15 minutes)

1. **Go to Google Cloud Console**
   - Open: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create/Select Project**
   - Create new project: "PledgeHub"
   - Or select existing project

3. **Enable APIs**
   - Go to "APIs & Services" → "Library"
   - Search and enable: "Google+ API"

4. **Configure OAuth Consent Screen**
   - Go to "OAuth consent screen"
   - Choose "External" → Fill in:
     - App name: `PledgeHub`
     - User support email: Your email
     - Developer contact: Your email

5. **Create Credentials**
   - Go to "Credentials" → "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Type: "Web application"
   - Name: "PledgeHub Web"
   - Authorized redirect URIs: `http://localhost:5001/api/auth/google/callback`

6. **Update .env File**
   ```bash
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your_client_secret_here
   ```

## Step 2: Test OAuth Backend (5 minutes)

### Start Server
```bash
cd backend
node server.js
```

### Test Endpoints
```bash
# Test OAuth status
curl http://localhost:5001/api/auth/status

# Test Google OAuth (should redirect to Google)
curl -L http://localhost:5001/api/auth/google

# Test Facebook OAuth (should redirect to Facebook)  
curl -L http://localhost:5001/api/auth/facebook
```

Expected: Redirects to Google/Facebook login pages

## Step 3: Create Frontend OAuth Buttons

### 3.1 Create OAuth Component
```javascript
// frontend/src/components/OAuthButtons.jsx
import React from 'react';

const OAuthButtons = () => {
    const handleGoogleLogin = () => {
        window.location.href = 'http://localhost:5001/api/auth/google';
    };

    const handleFacebookLogin = () => {
        window.location.href = 'http://localhost:5001/api/auth/facebook';
    };

    return (
        <div className="oauth-buttons">
            <button 
                onClick={handleGoogleLogin}
                className="oauth-btn google-btn"
            >
                <span>🔵</span> Sign in with Google
            </button>
            
            <button 
                onClick={handleFacebookLogin} 
                className="oauth-btn facebook-btn"
            >
                <span>📘</span> Sign in with Facebook
            </button>
        </div>
    );
};

export default OAuthButtons;
```

### 3.2 Create OAuth Callback Handler
```javascript
// frontend/src/components/AuthCallback.jsx
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const token = urlParams.get('token');
        const provider = urlParams.get('provider');

        if (token) {
            // Save token to localStorage
            localStorage.setItem('authToken', token);
            
            // Verify token with backend
            fetch('http://localhost:5001/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    console.log(`✅ Logged in via ${provider}:`, data.user);
                    navigate('/dashboard');
                } else {
                    console.error('❌ Token verification failed');
                    navigate('/login?error=verification_failed');
                }
            })
            .catch(err => {
                console.error('❌ Auth callback error:', err);
                navigate('/login?error=callback_error');
            });
        } else {
            navigate('/login?error=no_token');
        }
    }, [location, navigate]);

    return (
        <div className="auth-callback">
            <h2>🔄 Processing login...</h2>
            <p>Please wait while we complete your authentication.</p>
        </div>
    );
};

export default AuthCallback;
```

### 3.3 Add Routes to App
```javascript
// frontend/src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OAuthButtons from './components/OAuthButtons';
import AuthCallback from './components/AuthCallback';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<OAuthButtons />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}
```

## Step 4: Test Complete OAuth Flow

### 4.1 Start Both Servers
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 4.2 Test OAuth Flow
1. Go to: `http://localhost:5173/login`
2. Click "Sign in with Google" or "Sign in with Facebook"
3. Complete OAuth flow on provider's site
4. Should redirect back to: `http://localhost:5173/auth/callback?token=...`
5. Should then redirect to dashboard with user logged in

## Step 5: Add OAuth User Management

### 5.1 Create Auth Context
```javascript
// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            // Verify token and get user info
            fetch('http://localhost:5001/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setUser(data.user);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
```

## Troubleshooting

### Common Issues

1. **"OAuth not configured" error**
   - Check `.env` has real Google credentials
   - Restart server after updating .env

2. **"Not found" on OAuth routes**
   - Ensure server is running on port 5001
   - Check server logs for route mounting

3. **OAuth redirect doesn't work**
   - Verify callback URLs in Google/Facebook console
   - Check CORS settings allow frontend domain

4. **Token verification fails**
   - Check JWT_SECRET is set
   - Verify backend auth middleware

### Debug Commands
```bash
# Test OAuth configuration
node backend/scripts/test-oauth.js

# Test all features
node backend/scripts/test-all-features.js

# Check server logs
tail -f backend/logs/server.log
```

## Production Checklist

Before deploying:
- [ ] OAuth app configs have production callback URLs
- [ ] All environment variables set with production values
- [ ] HTTPS enabled (required by OAuth providers)
- [ ] CORS configured for production frontend domain
- [ ] Error handling for OAuth failures
- [ ] User data privacy compliance

## Next Steps

1. ✅ Get Google OAuth credentials (Step 1)
2. ✅ Test backend OAuth endpoints (Step 2)  
3. ✅ Implement frontend OAuth buttons (Step 3)
4. ✅ Test complete OAuth flow (Step 4)
5. ✅ Add auth state management (Step 5)
6. 🎯 Deploy to production with HTTPS

**Current Priority**: Complete Step 1 (Google OAuth credentials) to unlock full OAuth functionality!
