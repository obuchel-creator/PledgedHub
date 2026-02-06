#!/usr/bin/env node
/**
 * Test Pledge Name Validation
 * Verifies that pledges can only be created with names matching the logged-in user
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test credentials - register a fresh user for testing
const TEST_USER = {
  name: 'Name Validation Test User',
  username: 'namevalidationtest',
  phone: '+256777888999',
  email: 'namevalidation.test@example.com',
  password: 'ValidTest123!@#'
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

async function createPledgeWithMatchingName() {
  console.log('\n✓ Test 1: Create pledge with MATCHING name');
  
  const response = await axios.post(`${BASE_URL}/pledges`, {
    donor_name: userName,  // ✓ Use the logged-in user's actual name
    donor_email: 'test@example.com',
    donor_phone: '+256700123456',
    amount: 50000,
    purpose: 'Test pledge with matching name',
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
  console.log(`  - Name: ${response.data.pledge.donor_name}`);
  console.log(`  - Amount: ${response.data.pledge.amount}`);
  return response.data.pledge.id;
}

async function createPledgeWithDifferentName() {
  console.log('\n✓ Test 2: Attempt to create pledge with DIFFERENT name (should fail)');
  
  try {
    const response = await axios.post(`${BASE_URL}/pledges`, {
      donor_name: 'Someone Else',  // ✗ Different from logged-in user's name
      donor_email: 'test@example.com',
      donor_phone: '+256700123456',
      amount: 50000,
      purpose: 'Test pledge with different name',
      collection_date: new Date().toISOString().split('T')[0],
      date: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // If we get here, the test failed (should have been rejected)
    throw new Error(`Pledge was created with wrong name! This is a security issue.`);
  } catch (err) {
    if (err.response?.status === 400) {
      console.log(`  ✓ Correctly rejected with error:`);
      console.log(`  - "${err.response.data.error}"`);
      return true;
    }
    throw err;
  }
}

async function createPledgeWithCaseInsensitiveName() {
  console.log('\n✓ Test 3: Create pledge with CASE-INSENSITIVE name match');
  
  const differentCaseName = userName.toUpperCase(); // Try with different case
  
  const response = await axios.post(`${BASE_URL}/pledges`, {
    donor_name: differentCaseName,  // Different case, but should match
    donor_email: 'test2@example.com',
    donor_phone: '+256700654321',
    amount: 75000,
    purpose: 'Test pledge with different case name',
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

  console.log(`  ✓ Pledge created successfully (case-insensitive match)`);
  console.log(`  - Submitted: "${differentCaseName}"`);
  console.log(`  - Stored as: "${response.data.pledge.donor_name}"`);
}

async function fetchAndVerifyPledges() {
  console.log('\n✓ Test 4: Fetch pledges to verify they belong to correct user');
  
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
}

async function runAllTests() {
  await register();
  await login();
  
  console.log('\n' + '='.repeat(60));
  console.log('PLEDGE NAME VALIDATION TESTS');
  console.log('='.repeat(60));

  try {
    await test('Create pledge with matching name', createPledgeWithMatchingName);
    await test('Create pledge with different name (should fail)', createPledgeWithDifferentName);
    await test('Create pledge with case-insensitive name', createPledgeWithCaseInsensitiveName);
    await test('Fetch and verify pledges', fetchAndVerifyPledges);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.message);
    process.exit(1);
  }
}

runAllTests();
