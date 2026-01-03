/**
 * Integration test for login API (email, username, phone)
 * Usage: node backend/scripts/test-login-feature.js
 */
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/auth/login';

// Test credentials (ensure this user exists in your DB)
const TEST_USERS = [
  { label: 'Email', email: 'testuser@example.com', password: 'testpass123' },
  { label: 'Username', email: 'testuser', password: 'testpass123' },
  { label: 'Phone', email: '256771234567', password: 'testpass123' }
];

(async () => {
  for (const user of TEST_USERS) {
    try {
      console.log(`\n[Login Test] Attempting login with ${user.label}: ${user.email}`);
      const res = await axios.post(BASE_URL, {
        email: user.email,
        password: user.password
      }, { validateStatus: () => true });

      if (res.status === 200 && res.data.token && res.data.user) {
        console.log(`[Login Test] ✅ Success: Token received for ${user.label}`);
      } else {
        console.error(`[Login Test] ❌ Failed:`, res.data.error || res.data);
      }
    } catch (err) {
      console.error(`[Login Test] ❌ Exception:`, err.response?.data?.error || err.message);
    }
  }
  console.log('\n[Login Test] Done.');
})();
