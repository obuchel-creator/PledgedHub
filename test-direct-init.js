const { pool } = require('./backend/config/db');
const { initializeNewUser } = require('./backend/services/userInitializationService');

async function testDirectly() {
  try {
    // Create a test user first
    console.log('1️⃣ Creating test user...');
    const username = `directinit_${Date.now()}`;
    const [result] = await pool.execute(
      'INSERT INTO users (name, username, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['Direct Init Test', username, '256706666666', `${username}@test.com`, 'hashedpass', 'user']
    );
    const userId = result.insertId;
    console.log(`✅ User created with ID: ${userId}`);
    
    // Now initialize directly
    console.log('\n2️⃣ Calling initializeNewUser directly...');
    const initResult = await initializeNewUser(userId, { name: 'Direct Init Test' });
    console.log('✅ Initialization result:', initResult);
    
    // Check tables
    console.log('\n3️⃣ Verifying initialization...');
    const [stats] = await pool.execute('SELECT * FROM user_usage_stats WHERE user_id = ?', [userId]);
    const [validation] = await pool.execute('SELECT * FROM user_validation_status WHERE user_id = ?', [userId]);
    const [perms] = await pool.execute('SELECT * FROM user_permissions WHERE user_id = ?', [userId]);
    
    console.log(`✅ Monetization: ${stats.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ Validation: ${validation.length > 0 ? 'EXISTS' : 'MISSING'}`);
    console.log(`✅ Permissions: ${perms.length} rows`);
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.stack) console.error(e.stack);
  } finally {
    await pool.end();
  }
}

testDirectly();
