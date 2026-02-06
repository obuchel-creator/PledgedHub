const axios = require('axios');
const { pool } = require('./backend/config/db');

(async () => {
  try {
    // Verify the table exists from this connection
    const [check] = await pool.execute(`SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_NAME = 'user_usage_stats' AND TABLE_SCHEMA = 'pledgehub_db'`);
    console.log('Table check from main connection:', check[0].cnt > 0 ? '✅ EXISTS' : '❌ MISSING');
    
    // Try registration
    const res = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Direct Test',
      username: 'directtest_' + Date.now(),
      phone: '256703333333',
      email: 'direct_' + Date.now() + '@test.com',
      password: 'TestPass123'
    });
    console.log('✅ Registration succeeded');
    console.log('User ID:', res.data.user.id);
  } catch (e) {
    console.error('❌ Error:', e.response?.data?.error || e.message);
  } finally {
    await pool.end();
  }
})();
