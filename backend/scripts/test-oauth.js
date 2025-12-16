// Quick OAuth Configuration Test
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

console.log('🔍 OAuth Configuration Test\n');

// Check Google OAuth Configuration
console.log('📱 GOOGLE OAUTH:');
console.log('  GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '❌ NOT SET');
console.log('  GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('  GOOGLE_CALLBACK_URL:', process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/auth/google/callback (default)');

// Check Facebook OAuth Configuration
console.log('\n📘 FACEBOOK OAUTH:');
console.log('  FACEBOOK_APP_ID:', process.env.FACEBOOK_APP_ID || '❌ NOT SET');
console.log('  FACEBOOK_APP_SECRET:', process.env.FACEBOOK_APP_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('  FACEBOOK_CALLBACK_URL:', process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5001/api/auth/facebook/callback (default)');

// Check JWT Configuration
console.log('\n🔑 JWT CONFIGURATION:');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET');
console.log('  JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN || '1h (default)');

// Check Frontend URL
console.log('\n🌐 FRONTEND CONFIGURATION:');
console.log('  FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:5173 (default)');

// Test OAuth availability
console.log('\n🧪 OAUTH AVAILABILITY:');
const googleConfigured = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
                          process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here.apps.googleusercontent.com';
const facebookConfigured = process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET &&
                           process.env.FACEBOOK_APP_ID !== 'your_facebook_app_id_here';

console.log('  Google OAuth Ready:', googleConfigured ? '✅ YES' : '❌ NO (needs real credentials)');
console.log('  Facebook OAuth Ready:', facebookConfigured ? '✅ YES' : '❌ NO (needs real credentials)');

if (!googleConfigured && !facebookConfigured) {
    console.log('\n⚠️  NEXT STEPS:');
    console.log('  1. Get Google OAuth credentials: https://console.cloud.google.com/apis/credentials');
    console.log('  2. Get Facebook OAuth credentials: https://developers.facebook.com/apps');
    console.log('  3. Update .env file with real credentials');
    console.log('  4. Test OAuth flow in browser');
}

console.log('\n🎯 OAuth Test Complete');