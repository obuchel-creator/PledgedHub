require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

// Test credentials
const TEST_USERS = {
  regularUser: {
    username: 'regular_user_test',
    email: 'regular@test.com',
    password: 'test123',
    name: 'Regular User',
    phone: '+256700000001'
  },
  financeAdmin: {
    username: 'finance_admin_test',
    email: 'finance@test.com',
    password: 'test123',
    name: 'Finance Admin',
    phone: '+256700000002'
  },
  admin: {
    username: 'admin_test',
    email: 'admin@test.com',
    password: 'test123',
    name: 'Admin User',
    phone: '+256700000003'
  }
};

let tokens = {};
let results = { passed: 0, failed: 0 };

function success(msg) {
  console.log(`✅ ${msg}`);
  results.passed++;
}

function failure(msg, error) {
  console.log(`❌ ${msg}`);
  if (error) console.log(`   Error: ${error}`);
  results.failed++;
}

async function test(name, fn) {
  try {
    await fn();
    success(name);
  } catch (error) {
    failure(name, error.message);
  }
}

async function registerAndLogin(userKey, role = 'user') {
  const user = TEST_USERS[userKey];
  
  try {
    // Register - ignore 400 errors (user might exist)
    await axios.post(`${BASE_URL}/register`, user);
  } catch (err) {
    // Ignore duplicate user errors
    if (!err.response || err.response.status !== 400) {
      console.log(`Warning: Registration error for ${userKey}:`, err.message);
    }
  }

  // Login - retry if needed
  try {
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: user.email,
      password: user.password
    });
    
    tokens[userKey] = loginRes.data.token;
    const userId = loginRes.data.user.id;

    // Update role if needed
    if (role !== 'user') {
      const { pool } = require('../config/db');
      await pool.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    }

    return tokens[userKey];
  } catch (loginErr) {
    console.error(`Login failed for ${userKey}:`, loginErr.response?.data || loginErr.message);
    throw loginErr;
  }
}

function authHeaders(userKey) {
  return {
    headers: { Authorization: `Bearer ${tokens[userKey]}` }
  };
}

(async () => {
  console.log('\n🧪 ACCOUNTING RBAC TEST SUITE\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Setup test users
  console.log('🔑 Setting up test users...\n');
  await registerAndLogin('regularUser', 'user');
  await registerAndLogin('financeAdmin', 'finance_admin');
  await registerAndLogin('admin', 'admin');
  console.log('✅ Test users created and authenticated\n');

  // Test 1: Regular user should be DENIED
  console.log('📦 Test #1: Regular User (Should be DENIED)\n');
  
  await test('Regular user GET /accounts (should fail with 403)', async () => {
    try {
      await axios.get(`${BASE_URL}/accounting/accounts`, authHeaders('regularUser'));
      throw new Error('Should have been denied');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return; // Expected 403
      }
      throw error;
    }
  });

  await test('Regular user GET /journal-entries (should fail with 403)', async () => {
    try {
      await axios.get(`${BASE_URL}/accounting/journal-entries`, authHeaders('regularUser'));
      throw new Error('Should have been denied');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return; // Expected 403
      }
      throw error;
    }
  });

  await test('Regular user GET /reports/balance-sheet (should fail with 403)', async () => {
    try {
      await axios.get(`${BASE_URL}/accounting/reports/balance-sheet`, authHeaders('regularUser'));
      throw new Error('Should have been denied');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return; // Expected 403
      }
      throw error;
    }
  });

  await test('Regular user GET /reports/income-statement (should fail with 403)', async () => {
    try {
      await axios.get(`${BASE_URL}/accounting/reports/income-statement`, authHeaders('regularUser'));
      throw new Error('Should have been denied');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return; // Expected 403
      }
      throw error;
    }
  });

  // Test 2: Finance Admin should have ACCESS
  console.log('\n📦 Test #2: Finance Admin (Should have ACCESS)\n');

  await test('Finance admin GET /accounts (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/accounts`, authHeaders('financeAdmin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Finance admin GET /journal-entries (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/journal-entries`, authHeaders('financeAdmin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Finance admin GET /reports/balance-sheet (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/reports/balance-sheet`, authHeaders('financeAdmin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Finance admin GET /reports/income-statement (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/reports/income-statement?startDate=2025-01-01&endDate=2025-12-31`, authHeaders('financeAdmin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Finance admin GET /reports/trial-balance (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/reports/trial-balance`, authHeaders('financeAdmin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Finance admin GET /reports/cash-flow (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/reports/cash-flow?startDate=2025-01-01&endDate=2025-12-31`, authHeaders('financeAdmin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 3: Admin should have ACCESS
  console.log('\n📦 Test #3: Admin User (Should have ACCESS)\n');

  await test('Admin GET /accounts (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/accounts`, authHeaders('admin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Admin GET /journal-entries (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/journal-entries`, authHeaders('admin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  await test('Admin GET /reports/balance-sheet (should succeed)', async () => {
    const res = await axios.get(`${BASE_URL}/accounting/reports/balance-sheet`, authHeaders('admin'));
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
  });

  // Test 4: Create journal entry with finance admin
  console.log('\n📦 Test #4: Create Journal Entry (Finance Admin)\n');

  await test('Finance admin can create journal entry', async () => {
    const entry = {
      date: '2026-02-04',
      description: 'Test entry from RBAC test',
      reference: `TEST-${Date.now()}`,
      lines: [
        { accountId: 1, debit: 100, credit: 0, description: 'Test debit' },
        { accountId: 2, debit: 0, credit: 100, description: 'Test credit' }
      ]
    };
    
    const res = await axios.post(`${BASE_URL}/accounting/journal-entries`, entry, authHeaders('financeAdmin'));
    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    if (!res.data.success) throw new Error('Entry creation failed');
  });

  await test('Regular user CANNOT create journal entry', async () => {
    const entry = {
      date: '2026-02-04',
      description: 'Test entry - should fail',
      reference: `TEST-FAIL-${Date.now()}`,
      lines: [
        { accountId: 1, debit: 100, credit: 0, description: 'Test debit' },
        { accountId: 2, debit: 0, credit: 100, description: 'Test credit' }
      ]
    };
    
    try {
      await axios.post(`${BASE_URL}/accounting/journal-entries`, entry, authHeaders('regularUser'));
      throw new Error('Should have been denied');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        return; // Expected 403
      }
      throw error;
    }
  });

  // Summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`\n💯 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! RBAC is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.\n');
  }

  process.exit(results.failed > 0 ? 1 : 0);
})();
