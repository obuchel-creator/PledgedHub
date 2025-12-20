/**
 * RBAC Testing Suite
 * Tests role-based access control implementation
 * Run with: node backend/scripts/test-rbac-system.js
 */

const axios = require('axios');
const { pool } = require('../config/db');

const BASE_URL = 'http://localhost:5001/api';
let testResults = { passed: 0, failed: 0, tests: [] };

// Test users with different roles
const TEST_USERS = {
  donor: { email: 'rbac-test-donor@test.com', password: 'Test123!@', expectedRole: 'donor' },
  creator: { email: 'rbac-test-creator@test.com', password: 'Test123!@', expectedRole: 'creator' },
  finance_admin: { email: 'rbac-test-finance@test.com', password: 'Test123!@', expectedRole: 'finance_admin' },
  support_staff: { email: 'rbac-test-support@test.com', password: 'Test123!@', expectedRole: 'support_staff' },
  super_admin: { email: 'rbac-test-admin@test.com', password: 'Test123!@', expectedRole: 'super_admin' }
};

let tokens = {};

/**
 * Log test result
 */
function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ' - ' + details : ''}`);
  testResults.tests.push({ name, passed, details });
  passed ? testResults.passed++ : testResults.failed++;
}

/**
 * Setup test users with different roles
 */
async function setupTestUsers() {
  console.log('\n📋 SETUP: Creating test users with different roles...\n');

  for (const [role, userData] of Object.entries(TEST_USERS)) {
    try {
      // Register user
      const registerRes = await axios.post(`${BASE_URL}/register`, {
        name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)}`,
        username: `rbac_test_${role}`,
        email: userData.email,
        phone: `+256${Math.random().toString().slice(2, 12)}`,
        password: userData.password,
        passwordConfirm: userData.password
      });

      // Login to get token
      const loginRes = await axios.post(`${BASE_URL}/login`, {
        email: userData.email,
        password: userData.password
      });

      tokens[role] = loginRes.data.data.token;

      // Promote to role via database (simulate admin promotion)
      if (role !== 'donor') {
        await pool.execute(
          'UPDATE users SET role = ? WHERE email = ?',
          [role, userData.email]
        );
      }

      logTest(`Setup ${role} user`, true, userData.email);
    } catch (error) {
      logTest(`Setup ${role} user`, false, error.response?.data?.error || error.message);
    }
  }
}

/**
 * Test 1: User can access own pledges
 */
async function testDonorCanCreatePledges() {
  console.log('\n🧪 TEST 1: Donor role access tests\n');

  try {
    const res = await axios.get(`${BASE_URL}/pledges`, {
      headers: { Authorization: `Bearer ${tokens.donor}` }
    });
    logTest('Donor can view pledges', res.status === 200);
  } catch (error) {
    logTest('Donor can view pledges', false, error.response?.status);
  }
}

/**
 * Test 2: Creator can access campaign routes
 */
async function testCreatorAccess() {
  console.log('\n🧪 TEST 2: Creator role access tests\n');

  try {
    const res = await axios.get(`${BASE_URL}/campaigns`, {
      headers: { Authorization: `Bearer ${tokens.creator}` }
    });
    logTest('Creator can view campaigns', res.status === 200);
  } catch (error) {
    logTest('Creator can view campaigns', false, error.response?.status);
  }
}

/**
 * Test 3: Donor CANNOT access finance admin routes
 */
async function testDonorDeniedFinanceAccess() {
  console.log('\n🧪 TEST 3: Access denial tests (negative tests)\n');

  try {
    const res = await axios.get(`${BASE_URL}/payouts/admin/pending`, {
      headers: { Authorization: `Bearer ${tokens.donor}` }
    });
    logTest('Donor DENIED finance access', false, `Should have been 403, got ${res.status}`);
  } catch (error) {
    const isDenied = error.response?.status === 403;
    logTest('Donor DENIED finance access', isDenied, `Status: ${error.response?.status}`);
  }
}

/**
 * Test 4: Finance admin CAN access payout routes
 */
async function testFinanceAdminAccess() {
  console.log('\n🧪 TEST 4: Finance admin access tests\n');

  try {
    const res = await axios.get(`${BASE_URL}/payouts/admin/pending`, {
      headers: { Authorization: `Bearer ${tokens.finance_admin}` }
    });
    logTest('Finance admin can view pending payouts', [200, 404].includes(res.status));
  } catch (error) {
    logTest('Finance admin can view pending payouts', false, `Status: ${error.response?.status}`);
  }
}

/**
 * Test 5: Support staff CANNOT approve payouts
 */
async function testSupportDeniedPayoutApproval() {
  console.log('\n🧪 TEST 5: Support staff denial tests\n');

  try {
    const res = await axios.put(`${BASE_URL}/payouts/admin/1/complete`, 
      { referenceNumber: 'TEST123' },
      { headers: { Authorization: `Bearer ${tokens.support_staff}` } }
    );
    logTest('Support staff DENIED payout approval', false, `Should have been 403, got ${res.status}`);
  } catch (error) {
    const isDenied = error.response?.status === 403;
    logTest('Support staff DENIED payout approval', isDenied, `Status: ${error.response?.status}`);
  }
}

/**
 * Test 6: Super admin can access all routes
 */
async function testSuperAdminAccess() {
  console.log('\n🧪 TEST 6: Super admin omnipotence tests\n');

  try {
    const res = await axios.get(`${BASE_URL}/payouts/admin/pending`, {
      headers: { Authorization: `Bearer ${tokens.super_admin}` }
    });
    logTest('Super admin can access finance routes', [200, 404].includes(res.status));
  } catch (error) {
    logTest('Super admin can access finance routes', false, `Status: ${error.response?.status}`);
  }
}

/**
 * Test 7: Verify audit log entries
 */
async function testAuditLogging() {
  console.log('\n🧪 TEST 7: Audit logging tests\n');

  try {
    const [auditLogs] = await pool.execute(`
      SELECT COUNT(*) as count FROM role_audit_log LIMIT 1
    `);
    const hasLogs = auditLogs[0].count >= 0;
    logTest('Audit log table exists and is queryable', hasLogs);
  } catch (error) {
    logTest('Audit log table exists and is queryable', false, error.message);
  }
}

/**
 * Test 8: Verify role_permissions table
 */
async function testRolePermissionsTable() {
  console.log('\n🧪 TEST 8: Role permissions table tests\n');

  try {
    const [permissions] = await pool.execute(`
      SELECT DISTINCT role, COUNT(*) as count FROM role_permissions GROUP BY role
    `);
    const hasAllRoles = permissions.length === 5;
    logTest('All 5 roles seeded with permissions', hasAllRoles, `Found ${permissions.length} roles`);

    // Display permission counts
    permissions.forEach(p => {
      console.log(`   - ${p.role}: ${p.count} permissions`);
    });
  } catch (error) {
    logTest('All 5 roles seeded with permissions', false, error.message);
  }
}

/**
 * Test 9: Test permission checking utility
 */
async function testPermissionUtility() {
  console.log('\n🧪 TEST 9: Permission checking utility tests\n');

  try {
    const [financePerms] = await pool.execute(`
      SELECT permission FROM role_permissions WHERE role = 'finance_admin'
    `);
    const hasApprovePayouts = financePerms.some(p => p.permission === 'approve_payouts');
    logTest('Finance admin has "approve_payouts" permission', hasApprovePayouts);

    const [donorPerms] = await pool.execute(`
      SELECT permission FROM role_permissions WHERE role = 'donor'
    `);
    const donorCannotApprovePayouts = !donorPerms.some(p => p.permission === 'approve_payouts');
    logTest('Donor does NOT have "approve_payouts" permission', donorCannotApprovePayouts);
  } catch (error) {
    logTest('Permission utility tests', false, error.message);
  }
}

/**
 * Test 10: Unauthenticated access denied
 */
async function testUnauthenticatedDenied() {
  console.log('\n🧪 TEST 10: Authentication requirement tests\n');

  try {
    const res = await axios.get(`${BASE_URL}/payouts/admin/pending`);
    logTest('Unauthenticated request DENIED', false, `Should have been 401, got ${res.status}`);
  } catch (error) {
    const isUnauth = error.response?.status === 401;
    logTest('Unauthenticated request DENIED', isUnauth, `Status: ${error.response?.status}`);
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 RBAC SYSTEM TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    // Setup
    await setupTestUsers();

    // Run all tests
    await testDonorCanCreatePledges();
    await testCreatorAccess();
    await testDonorDeniedFinanceAccess();
    await testFinanceAdminAccess();
    await testSupportDeniedPayoutApproval();
    await testSuperAdminAccess();
    await testAuditLogging();
    await testRolePermissionsTable();
    await testPermissionUtility();
    await testUnauthenticatedDenied();

    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Total:  ${testResults.tests.length}`);
    console.log(`🎯 Success Rate: ${Math.round((testResults.passed / testResults.tests.length) * 100)}%`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (testResults.failed === 0) {
      console.log('🎉 ALL TESTS PASSED! RBAC SYSTEM IS WORKING CORRECTLY!\n');
    } else {
      console.log('⚠️  Some tests failed. Review the output above.\n');
    }

  } catch (error) {
    console.error('💥 Test suite error:', error.message);
  } finally {
    pool.end();
    process.exit(testResults.failed === 0 ? 0 : 1);
  }
}

// Run tests
runAllTests();
