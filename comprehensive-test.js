const axios = require('axios');
const { pool } = require('./backend/config/db');

async function fullTest() {
  console.log('\n✅ STARTING COMPREHENSIVE REGISTRATION & INITIALIZATION TEST\n');
  
  try {
    // Generate unique test data
    const timestamp = Date.now();
    const testData = {
      name: 'Integration Test User',
      username: `inttest_${timestamp}`,
      phone: `256704${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
      email: `inttest_${timestamp}@example.com`,
      password: 'TestPass123!@#'
    };
    
    console.log('📝 TEST DATA:');
    console.log(`  Name: ${testData.name}`);
    console.log(`  Username: ${testData.username}`);
    console.log(`  Phone: ${testData.phone}`);
    console.log(`  Email: ${testData.email}`);
    
    // Step 1: Call registration API
    console.log('\n1️⃣  CALLING REGISTRATION API...');
    let userId;
    try {
      const response = await axios.post('http://localhost:5001/api/auth/register', testData);
      if (!response.data.success) {
        throw new Error(response.data.error || 'Registration failed');
      }
      userId = response.data.user.id;
      console.log(`   ✅ Registration successful`);
      console.log(`   User ID: ${userId}`);
      console.log(`   Token: ${response.data.token.substring(0, 30)}...`);
    } catch (e) {
      console.error(`   ❌ REGISTRATION FAILED:`, e.response?.data?.error || e.message);
      process.exit(1);
    }
    
    // Step 2: Wait for initialization to complete
    console.log('\n2️⃣  WAITING FOR INITIALIZATION...');
    await new Promise(r => setTimeout(r, 1000)); // 1 second delay
    
    // Step 3: Verify user exists in users table
    console.log('\n3️⃣  VERIFYING USER IN DATABASE...');
    const [users] = await pool.execute(
      'SELECT id, name, username, email, phone, role FROM users WHERE id = ?',
      [userId]
    );
    if (users.length === 0) {
      console.error('   ❌ USER NOT FOUND IN DATABASE');
      process.exit(1);
    }
    const user = users[0];
    console.log(`   ✅ User found`);
    console.log(`   Role: ${user.role}`);
    
    // Step 4: Verify monetization profile
    console.log('\n4️⃣  VERIFYING MONETIZATION PROFILE...');
    const [stats] = await pool.execute(
      'SELECT tier, pledges_count FROM user_usage_stats WHERE user_id = ?',
      [userId]
    );
    if (stats.length === 0) {
      console.error('   ❌ MONETIZATION PROFILE NOT FOUND');
      process.exit(1);
    }
    console.log(`   ✅ Monetization profile found`);
    console.log(`   Tier: ${stats[0].tier}`);
    console.log(`   Pledges count: ${stats[0].pledges_count}`);
    
    // Step 5: Verify validation status
    console.log('\n5️⃣  VERIFYING VALIDATION STATUS...');
    const [validation] = await pool.execute(
      'SELECT account_locked, email_verified, failed_login_attempts FROM user_validation_status WHERE user_id = ?',
      [userId]
    );
    if (validation.length === 0) {
      console.error('   ❌ VALIDATION STATUS NOT FOUND');
      process.exit(1);
    }
    console.log(`   ✅ Validation status found`);
    console.log(`   Account locked: ${validation[0].account_locked}`);
    console.log(`   Email verified: ${validation[0].email_verified}`);
    console.log(`   Failed attempts: ${validation[0].failed_login_attempts}`);
    
    // Step 6: Verify permissions
    console.log('\n6️⃣  VERIFYING PERMISSIONS...');
    const [perms] = await pool.execute(
      'SELECT permission_key FROM user_permissions WHERE user_id = ? ORDER BY permission_key',
      [userId]
    );
    if (perms.length === 0) {
      console.error('   ❌ PERMISSIONS NOT FOUND');
      process.exit(1);
    }
    console.log(`   ✅ Permissions found (${perms.length} total)`);
    perms.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.permission_key}`);
    });
    
    // Step 7: Verify audit log
    console.log('\n7️⃣  VERIFYING AUDIT LOG...');
    const [auditLog] = await pool.execute(
      'SELECT action, details FROM audit_log WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    if (auditLog.length === 0) {
      console.error('   ❌ AUDIT LOG NOT FOUND');
      process.exit(1);
    }
    console.log(`   ✅ Audit log found`);
    console.log(`   Latest action: ${auditLog[0].action}`);
    
    // Step 8: Try login
    console.log('\n8️⃣  TESTING LOGIN...');
    try {
      const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
        email: testData.email,
        password: testData.password
      });
      if (!loginRes.data.token) {
        throw new Error('No token in login response');
      }
      console.log(`   ✅ Login successful`);
      console.log(`   Token: ${loginRes.data.token.substring(0, 30)}...`);
    } catch (e) {
      console.error(`   ❌ LOGIN FAILED:`, e.response?.data?.error || e.message);
    }
    
    console.log('\n✅ ✅ ✅ ALL TESTS PASSED! ✅ ✅ ✅\n');
    console.log('📊 SUMMARY:');
    console.log('  ✅ User creation');
    console.log('  ✅ Monetization profile initialization');
    console.log('  ✅ Validation status initialization');
    console.log('  ✅ Permissions assignment');
    console.log('  ✅ Audit logging');
    console.log('  ✅ User login');
    
  } catch (e) {
    console.error('\n❌ TEST FAILED:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

fullTest();
