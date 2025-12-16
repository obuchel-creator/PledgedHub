// Complete OAuth Implementation Test
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testOAuthImplementation() {
    log('cyan', '🚀 OAuth Implementation Test - Complete Check\n');

    // Test 1: Environment Configuration
    log('blue', '📋 Step 1: Environment Configuration');
    
    const googleConfigured = process.env.GOOGLE_CLIENT_ID && 
                              process.env.GOOGLE_CLIENT_SECRET &&
                              process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here.apps.googleusercontent.com';
    
    const facebookConfigured = process.env.FACEBOOK_APP_ID && 
                               process.env.FACEBOOK_APP_SECRET &&
                               process.env.FACEBOOK_APP_ID !== 'your_facebook_app_id_here';

    log(googleConfigured ? 'green' : 'red', `  Google OAuth: ${googleConfigured ? '✅ Configured' : '❌ Needs real credentials'}`);
    log(facebookConfigured ? 'green' : 'red', `  Facebook OAuth: ${facebookConfigured ? '✅ Configured' : '❌ Needs real credentials'}`);
    log(process.env.JWT_SECRET ? 'green' : 'red', `  JWT Secret: ${process.env.JWT_SECRET ? '✅ Set' : '❌ Missing'}`);

    // Test 2: Database Schema
    log('blue', '\n📋 Step 2: Database Schema');
    try {
        const db = require('../config/db');
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [process.env.DB_NAME || 'omukwano_db']);

        const columnNames = columns.map(row => row.COLUMN_NAME);
        const hasOAuthProvider = columnNames.includes('oauth_provider');
        const hasOAuthId = columnNames.includes('oauth_id');
        const hasEmailVerified = columnNames.includes('email_verified');

        log(hasOAuthProvider ? 'green' : 'red', `  oauth_provider column: ${hasOAuthProvider ? '✅ Exists' : '❌ Missing'}`);
        log(hasOAuthId ? 'green' : 'red', `  oauth_id column: ${hasOAuthId ? '✅ Exists' : '❌ Missing'}`);
        log(hasEmailVerified ? 'green' : 'red', `  email_verified column: ${hasEmailVerified ? '✅ Exists' : '❌ Missing'}`);

        if (!hasOAuthProvider || !hasOAuthId || !hasEmailVerified) {
            log('yellow', '  💡 Run: node backend/scripts/add-oauth-columns.js');
        }
    } catch (error) {
        log('red', `  ❌ Database connection failed: ${error.message}`);
    }

    // Test 3: Passport Configuration
    log('blue', '\n📋 Step 3: Passport Configuration');
    try {
        const passport = require('../config/passport');
        
        const hasGoogleStrategy = !!passport._strategy('google');
        const hasFacebookStrategy = !!passport._strategy('facebook');

        log(hasGoogleStrategy ? 'green' : 'red', `  Google Strategy: ${hasGoogleStrategy ? '✅ Loaded' : '❌ Not loaded'}`);
        log(hasFacebookStrategy ? 'green' : 'red', `  Facebook Strategy: ${hasFacebookStrategy ? '✅ Loaded' : '❌ Not loaded'}`);
    } catch (error) {
        log('red', `  ❌ Passport configuration error: ${error.message}`);
    }

    // Test 4: Routes
    log('blue', '\n📋 Step 4: OAuth Routes');
    try {
        const oauthRoutes = require('../routes/oauthRoutes');
        log('green', '  ✅ OAuth routes module loads successfully');
    } catch (error) {
        log('red', `  ❌ OAuth routes error: ${error.message}`);
    }

    // Test 5: Frontend Files
    log('blue', '\n📋 Step 5: Frontend Components');
    const fs = require('fs');
    const path = require('path');

    const frontendPath = path.join(__dirname, '../../frontend/src');
    const componentsPath = path.join(frontendPath, 'components');
    const contextsPath = path.join(frontendPath, 'contexts');

    const oauthButtonsExists = fs.existsSync(path.join(componentsPath, 'OAuthButtons.jsx'));
    const authCallbackExists = fs.existsSync(path.join(componentsPath, 'AuthCallback.jsx'));
    const authContextExists = fs.existsSync(path.join(contextsPath, 'AuthContext.jsx'));
    const appWithOAuthExists = fs.existsSync(path.join(frontendPath, 'App-with-oauth.jsx'));

    log(oauthButtonsExists ? 'green' : 'red', `  OAuthButtons.jsx: ${oauthButtonsExists ? '✅ Created' : '❌ Missing'}`);
    log(authCallbackExists ? 'green' : 'red', `  AuthCallback.jsx: ${authCallbackExists ? '✅ Created' : '❌ Missing'}`);
    log(authContextExists ? 'green' : 'red', `  AuthContext.jsx: ${authContextExists ? '✅ Created' : '❌ Missing'}`);
    log(appWithOAuthExists ? 'green' : 'red', `  App-with-oauth.jsx: ${appWithOAuthExists ? '✅ Created' : '❌ Missing'}`);

    // Summary and Next Steps
    log('cyan', '\n🎯 Summary and Next Steps');
    
    const allBackendReady = googleConfigured && facebookConfigured && process.env.JWT_SECRET;
    const allFrontendReady = oauthButtonsExists && authCallbackExists && authContextExists;

    if (allBackendReady && allFrontendReady) {
        log('green', '✅ OAuth Implementation: READY TO TEST!');
        log('cyan', '\n🚀 To test OAuth flow:');
        log('cyan', '1. Start backend: cd backend && node server.js');
        log('cyan', '2. Start frontend: cd frontend && npm run dev');
        log('cyan', '3. Replace App.js with App-with-oauth.jsx content');
        log('cyan', '4. Go to http://localhost:5173/login');
        log('cyan', '5. Test Google/Facebook login');
    } else {
        log('yellow', '⚠️  OAuth Implementation: NEEDS CONFIGURATION');
        
        if (!googleConfigured) {
            log('cyan', '\n📝 To configure Google OAuth:');
            log('cyan', '1. Go to: https://console.cloud.google.com/');
            log('cyan', '2. Create OAuth credentials');
            log('cyan', '3. Update GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
        }

        if (!allFrontendReady) {
            log('cyan', '\n📝 Frontend components are ready!');
            log('cyan', '1. Replace App.js content with App-with-oauth.jsx');
            log('cyan', '2. Install react-router-dom if not already installed');
        }
    }

    log('cyan', '\n📚 Documentation:');
    log('cyan', '  - Full guide: OAUTH_IMPLEMENTATION_GUIDE.md');
    log('cyan', '  - Google setup: GOOGLE_OAUTH_SETUP.md');
    log('cyan', '  - OAuth walkthrough: OAUTH_WALKTHROUGH.md');
}

testOAuthImplementation().catch(console.error);