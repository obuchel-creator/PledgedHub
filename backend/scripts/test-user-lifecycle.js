/**
 * Comprehensive User Lifecycle Test
 * Tests: Registration → Initialization → Login → Access Control
 * 
 * This verifies that users are fully initialized and can login with correct rights
 */

const axios = require('axios');
const { pool } = require('../config/db');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5001/api';
const TEST_USER = {
  name: 'Lifecycle Test User',
  username: `test_user_${Date.now()}`,
  phone: `256700${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
  email: `test_${Date.now()}@example.com`,
  password: 'TestPass123!@#'
};

let testResults = {
  passed: 0,
  failed: 0,
  errors: []
};

/**
 * Test helper
 */
async function test(name, fn) {
  try {
    process.stdout.write(`⏳ ${name}... `);
    await fn();
    console.log(`✅`);
    testResults.passed++;
  } catch (error) {
    console.log(`❌`);
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
    console.error(`   └─ ${error.message}`);
  }
}

/**
 * Verify database tables exist
 */
async function verifyDatabaseTables() {
  console.log('\n🔍 CHECKING DATABASE TABLES\n');

  const tables = [
    'users',
    'user_usage_stats',
    'user_validation_status',
    'login_history',
    'user_permissions',
    'audit_log',
    'session_tokens'
  ];

  for (const table of tables) {
    await test(`Table ${table} exists`, async () => {
      const [rows] = await pool.execute(
        `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [table]
      );
      if (rows.length === 0) {
        throw new Error(`Table ${table} does not exist`);
      }
    });
  }
}

/**
 * Test user registration
 */
async function testRegistration() {
  console.log('\n📝 TESTING USER REGISTRATION\n');

  let userId;

  await test('Register new user via API', async () => {
    const response = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Registration failed');
    }

    if (!response.data.user || !response.data.user.id) {
      throw new Error('No user ID returned');
    }

    userId = response.data.user.id;
    TEST_USER.id = userId;
    console.log(`\n   User ID: ${userId}`);
  });

  return userId;
}

/**
 * Test user initialization
 */
async function testInitialization(userId) {
  console.log('\n⚙️ TESTING USER INITIALIZATION\n');

  await test('Monetization profile exists', async () => {
    const [rows] = await pool.execute(
      'SELECT id, tier FROM user_usage_stats WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('No monetization profile created');
    }

    if (rows[0].tier !== 'free') {
      throw new Error(`Expected tier "free", got "${rows[0].tier}"`);
    }
    console.log(`\n   Tier: ${rows[0].tier}`);
  });

  await test('Validation status initialized', async () => {
    const [rows] = await pool.execute(
      'SELECT user_id, account_locked FROM user_validation_status WHERE user_id = ?',
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('No validation status created');
    }

    if (rows[0].account_locked !== 0) {
      throw new Error('Account should not be locked');
    }
  });

  await test('Default permissions assigned', async () => {
    const [rows] = await pool.execute(
      'SELECT permission_key FROM user_permissions WHERE user_id = ? LIMIT 5',
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('No permissions assigned');
    }

    console.log(`\n   Permissions: ${rows.map(r => r.permission_key).join(', ')}`);
  });

  await test('Audit log created', async () => {
    const [rows] = await pool.execute(
      'SELECT action FROM audit_log WHERE user_id = ? AND action = ?',
      [userId, 'USER_CREATED']
    );

    if (rows.length === 0) {
      throw new Error('No USER_CREATED audit log');
    }
  });
}

/**
 * Test login flow
 */
async function testLogin(userId) {
  console.log('\n🔐 TESTING LOGIN FLOW\n');

  let token;

  await test('Login with registered credentials', async () => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Login failed');
    }

    if (!response.data.token) {
      throw new Error('No JWT token returned');
    }

    token = response.data.token;
    console.log(`\n   Token: ${token.substring(0, 20)}...`);
  });

  await test('Login also works with username', async () => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.username,  // Use username as email field
      password: TEST_USER.password
    });

    if (!response.data.success) {
      throw new Error('Username login failed');
    }

    if (!response.data.token) {
      throw new Error('No token for username login');
    }
  });

  await test('Login also works with phone', async () => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.phone,  // Use phone as email field
      password: TEST_USER.password
    });

    if (!response.data.success) {
      throw new Error('Phone login failed');
    }

    if (!response.data.token) {
      throw new Error('No token for phone login');
    }
  });

  await test('Login history is recorded', async () => {
    // Give it a moment to record
    await new Promise(r => setTimeout(r, 500));

    const [rows] = await pool.execute(
      'SELECT success FROM login_history WHERE user_id = ? ORDER BY login_time DESC LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('No login history recorded');
    }

    if (!rows[0].success) {
      throw new Error('Login not marked as successful');
    }
  });

  return token;
}

/**
 * Test access control
 */
async function testAccessControl(token) {
  console.log('\n🔑 TESTING ACCESS CONTROL\n');

  const headers = { Authorization: `Bearer ${token}` };

  await test('Can access protected route with valid token', async () => {
    try {
      const response = await axios.get(`${BASE_URL}/pledges`, { headers });
      // May return empty, that's ok
      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
    } catch (error) {
      // 401 means token rejected, anything else is ok
      if (error.response?.status === 401) {
        throw new Error('Token rejected on protected route');
      }
    }
  });

  await test('Cannot access without token', async () => {
    try {
      await axios.get(`${BASE_URL}/pledges`);
      throw new Error('Should have been rejected');
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error(`Expected 401, got ${error.response?.status}`);
      }
    }
  });

  await test('User has correct role in token', async () => {
    // Decode JWT (not verifying signature, just checking payload)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    if (!payload.role) {
      throw new Error('No role in token');
    }

    if (payload.role !== 'user') {
      throw new Error(`Expected role "user", got "${payload.role}"`);
    }

    console.log(`\n   Token role: ${payload.role}`);
  });
}

/**
 * Test failed login attempts
 */
async function testFailedLogins(userId) {
  console.log('\n⚠️ TESTING FAILED LOGIN ATTEMPTS\n');

  await test('Failed login is logged', async () => {
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: 'WrongPassword123!@#'
      });
    } catch (error) {
      if (error.response?.status !== 401) {
        throw new Error('Login should fail with wrong password');
      }
    }

    // Give it a moment
    await new Promise(r => setTimeout(r, 500));

    const [rows] = await pool.execute(
      'SELECT success FROM login_history WHERE user_id = ? AND success = 0 LIMIT 1',
      [userId]
    );

    if (rows.length === 0) {
      throw new Error('Failed login not recorded');
    }
  });

  await test('Multiple failed attempts tracked', async () => {
    // Get current count
    const [before] = await pool.execute(
      'SELECT failed_login_attempts FROM user_validation_status WHERE user_id = ?',
      [userId]
    );

    const beforeCount = before[0].failed_login_attempts;

    // Try one more wrong password
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: 'AnotherWrong123!@#'
      });
    } catch (error) {
      // Expected
    }

    await new Promise(r => setTimeout(r, 500));

    const [after] = await pool.execute(
      'SELECT failed_login_attempts FROM user_validation_status WHERE user_id = ?',
      [userId]
    );

    if (after[0].failed_login_attempts <= beforeCount) {
      throw new Error('Failed attempt count not incremented');
    }

    console.log(`\n   Attempts tracked: ${after[0].failed_login_attempts}`);
  });
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║          USER LIFECYCLE INTEGRATION TEST SUITE              ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Phase 1: Database
    await verifyDatabaseTables();

    // Phase 2: Registration
    const userId = await testRegistration();

    // Phase 3: Initialization
    await testInitialization(userId);

    // Phase 4: Login
    const token = await testLogin(userId);

    // Phase 5: Access Control
    await testAccessControl(token);

    // Phase 6: Failed Logins
    await testFailedLogins(userId);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                      TEST SUMMARY                           ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);

    if (testResults.errors.length > 0) {
      console.log('\n📋 Errors:');
      testResults.errors.forEach(err => {
        console.log(`   • ${err.test}`);
        console.log(`     └─ ${err.error}`);
      });
    }

    const success = testResults.failed === 0;
    console.log(`\n${success ? '🎉 ALL TESTS PASSED!' : '💥 SOME TESTS FAILED'}\n`);

    process.exit(success ? 0 : 1);

  } catch (error) {
    console.error('\n💥 Test suite error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
runAllTests().catch(console.error);
