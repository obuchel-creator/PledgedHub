const axios = require('axios');
const { pool } = require('./backend/config/db');

async function simpleTest() {
  try {
    const timestamp = Date.now();
    console.log(`\n📝 Attempting registration at ${new Date().toISOString()}`);
    
    const res = await axios.post('http://localhost:5001/api/auth/register', {
      name: 'Simple Test',
      username: `simple_${timestamp}`,
      phone: `256705${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      email: `simple_${timestamp}@test.com`,
      password: 'TestPass123'
    });
    
    const userId = res.data.user.id;
    console.log(`✅ Registration successful. User ID: ${userId}`);
    console.log(`\nNow checking database in 2 seconds...`);
    
    await new Promise(r => setTimeout(r, 2000));
    
    const [stats] = await pool.execute('SELECT * FROM user_usage_stats WHERE user_id = ?', [userId]);
    const [validation] = await pool.execute('SELECT * FROM user_validation_status WHERE user_id = ?', [userId]);
    const [perms] = await pool.execute('SELECT COUNT(*) as cnt FROM user_permissions WHERE user_id = ?', [userId]);
    
    console.log(`\n📊 Initialization check:`);
    console.log(`  Monetization profile: ${stats.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`  Validation status: ${validation.length > 0 ? '✅ YES' : '❌ NO'}`);
    console.log(`  Permissions: ${perms[0].cnt > 0 ? `✅ YES (${perms[0].cnt})` : '❌ NO'}`);
    
  } catch (e) {
    console.error('❌ Error:', e.response?.data?.error || e.message);
  } finally {
    await pool.end();
  }
}

simpleTest();
