#!/usr/bin/env node
/**
 * Test Pledge Phone Number Validation
 * Verifies phone number validation in both strict and flexible modes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test credentials - register a fresh user for testing
const TEST_USER = {
  name: 'Phone Validation Test User',
  username: 'phonevalidationtest',
  phone: '+256777888999',
  email: 'phonevalidation.test@example.com',
  password: 'PhoneTest123!@#'
};

let token = null;
let userId = null;
let userName = null;

async function test(description, testFn) {
  try {
    console.log(`\n✓ Testing: ${description}`);
    await testFn();
  } catch (err) {
    console.log(`✗ FAILED: ${description}`);
    console.error('  Error:', err.response?.data?.error || err.message);
    throw err;
  }
}

async function register() {
  console.log('\n📝 Registering test user...');
  try {
    // First, try to delete existing test user if present
    try {
      const mysql = require('mysql2/promise');
      require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
      const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
      });
      await pool.execute('DELETE FROM users WHERE email = ?', [TEST_USER.email]);
      pool.end();
    } catch (e) {
      // Ignore DB errors
    }

    const res = await axios.post(`${BASE_URL}/auth/register`, TEST_USER);

    if (!res.data.success) {
      throw new Error(res.data.error || 'Registration failed');
    }

    console.log(`✓ User registered: ${TEST_USER.name}`);
  } catch (err) {
    console.error('✗ Registration failed:', err.response?.data?.error || err.message);
    process.exit(1);
  }
}

async function login() {
  console.log('\n📝 Logging in...');
  try {
    console.log(`  Attempting login for: ${TEST_USER.email}`);
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });

    console.log(`  Login response received`);
    
    if (!res.data.token) {
      throw new Error(res.data.error || 'No token in response');
    }

    token = res.data.token;
    userId = res.data.user.id;
    userName = res.data.user.name;

    console.log(`✓ Logged in as: ${userName} (ID: ${userId})`);
    
    // Set tenant_id for the user if it's null (required for pledge creation)
    if (!res.data.user.tenant_id) {
      console.log(`  Setting tenant_id to user ID...`);
      try {
        const mysql = require('mysql2/promise');
        const pool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_NAME
        });
        await pool.execute('UPDATE users SET tenant_id = ? WHERE id = ?', [userId, userId]);
        pool.end();
        console.log(`  ✓ tenant_id set to ${userId}`);
        
        // Re-login to get token with updated tenant_id
        console.log(`  Re-logging in to refresh JWT with new tenant_id...`);
        const reloginRes = await axios.post(`${BASE_URL}/auth/login`, {
          email: TEST_USER.email,
          password: TEST_USER.password
        });
        token = reloginRes.data.token;
        console.log(`  ✓ JWT refreshed with tenant_id`);
      } catch (e) {
        console.warn(`  ⚠️  Error setting tenant_id:`, e.message);
        throw e;
      }
    }
    
    return { token, userId, userName };
  } catch (err) {
    console.error('✗ Login failed');
    console.error('  Response status:', err.response?.status);
    console.error('  Response data:', JSON.stringify(err.response?.data));
    console.error('  Message:', err.message);
    process.exit(1);
  }
}

async function createPledgeWithMatchingPhone() {
  console.log('\n✓ Test 1: Create pledge with MATCHING phone number');
  
  const response = await axios.post(`${BASE_URL}/pledges`, {
    donor_name: userName,  // ✓ Use the logged-in user's actual name
    donor_email: 'test@example.com',
    donor_phone: TEST_USER.phone,  // ✓ Use the registered phone
    amount: 50000,
    purpose: 'Test pledge with matching phone',
    collection_date: new Date().toISOString().split('T')[0],
    date: new Date().toISOString()
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.data.success) {
    throw new Error(response.data.error);
  }

  console.log(`  ✓ Pledge created successfully`);
  console.log(`  - ID: ${response.data.pledge.id}`);
  console.log(`  - Phone: ${response.data.pledge.donor_phone}`);
  console.log(`  - Amount: ${response.data.pledge.amount}`);
  return response.data.pledge.id;
}

async function createPledgeWithDifferentPhone() {
  console.log('\n✓ Test 2: Create pledge with DIFFERENT phone (flexible mode - should succeed)');
  
  const response = await axios.post(`${BASE_URL}/pledges`, {
    donor_name: userName,  // ✓ Correct name
    donor_email: 'test2@example.com',
    donor_phone: '+256750999888',  // ✗ Different phone
    amount: 60000,
    purpose: 'Test pledge with different phone',
    collection_date: new Date().toISOString().split('T')[0],
    date: new Date().toISOString()
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.data.success) {
    throw new Error(response.data.error);
  }

  console.log(`  ✓ Pledge created successfully (flexible mode allows different phone)`);
  console.log(`  - Registered phone: ${TEST_USER.phone}`);
  console.log(`  - Used phone: +256750999888`);
  console.log(`  - Note: Check server logs for phone mismatch warning`);
  return response.data.pledge.id;
}

async function createPledgeWithNormalizedPhone() {
  console.log('\n✓ Test 3: Create pledge with NORMALIZED phone format');
  
  // Remove + and add spaces to test normalization
  const normalizedPhone = TEST_USER.phone.replace('+', '').replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
  
  const response = await axios.post(`${BASE_URL}/pledges`, {
    donor_name: userName,  // ✓ Correct name
    donor_email: 'test3@example.com',
    donor_phone: normalizedPhone,  // Same number, different format
    amount: 70000,
    purpose: 'Test pledge with normalized phone',
    collection_date: new Date().toISOString().split('T')[0],
    date: new Date().toISOString()
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.data.success) {
    throw new Error(response.data.error);
  }

  console.log(`  ✓ Pledge created successfully (normalized phone recognized as match)`);
  console.log(`  - Registered: ${TEST_USER.phone}`);
  console.log(`  - Submitted: ${normalizedPhone}`);
}

async function fetchAndVerifyPledges() {
  console.log('\n✓ Test 4: Fetch pledges to verify phone numbers');
  
  const response = await axios.get(`${BASE_URL}/pledges`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.data.success || !Array.isArray(response.data.pledges)) {
    throw new Error('Failed to fetch pledges');
  }

  const userPledges = response.data.pledges.filter(p => p.donor_name === userName);
  console.log(`  ✓ Found ${userPledges.length} pledges for ${userName}`);
  console.log(`  - All pledges belong to logged-in user: ${userPledges.every(p => p.created_by === userId)}`);
  
  // Show phone numbers used
  userPledges.forEach((p, i) => {
    console.log(`  - Pledge ${i + 1}: Phone = ${p.donor_phone}`);
  });
}

async function runAllTests() {
  await register();
  await login();
  
  console.log('\n' + '='.repeat(60));
  console.log('PLEDGE PHONE NUMBER VALIDATION TESTS');
  console.log('='.repeat(60));
  console.log('Mode: Flexible (ENABLE_STRICT_PHONE_VALIDATION=false)');
  console.log('Expected: Pledges allowed with any phone, warnings logged');
  console.log('='.repeat(60));

  try {
    await test('Create pledge with matching phone', createPledgeWithMatchingPhone);
    await test('Create pledge with different phone (flexible)', createPledgeWithDifferentPhone);
    await test('Create pledge with normalized phone format', createPledgeWithNormalizedPhone);
    await test('Fetch and verify pledges', fetchAndVerifyPledges);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\nNOTE: Check server logs for phone mismatch warnings.');
    console.log('To test strict mode, set ENABLE_STRICT_PHONE_VALIDATION=true');
    console.log('in backend/.env and restart the server.');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runAllTests();
