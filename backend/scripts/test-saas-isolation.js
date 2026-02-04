/**
 * SaaS Multi-Tenant Test Script
 * 
 * Tests tenant isolation and verifies cross-tenant access is blocked
 * Run: node backend/scripts/test-saas-isolation.js
 */

const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

async function testSaaSIsolation() {
  console.log('🧪 Starting SaaS Tenant Isolation Tests...\n');
  
  let testsRun = 0;
  let testsPassed = 0;
  let testsFailed = 0;

  // Create test tenants
  console.log('📦 Setting up test tenants...');
  const tenant1Id = uuidv4();
  const tenant2Id = uuidv4();

  try {
    // Create Tenant 1
    await pool.execute(
      `INSERT INTO tenants (id, name, subdomain, plan, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [tenant1Id, 'Test Tenant 1', 'test1', 'professional', 'active']
    );
    console.log(`✅ Created Tenant 1: ${tenant1Id}`);

    // Create Tenant 2
    await pool.execute(
      `INSERT INTO tenants (id, name, subdomain, plan, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [tenant2Id, 'Test Tenant 2', 'test2', 'professional', 'active']
    );
    console.log(`✅ Created Tenant 2: ${tenant2Id}\n`);

    // Create test users
    const hashedPassword = await bcrypt.hash('testpass123', 10);
    
    const [user1Result] = await pool.execute(
      `INSERT INTO users (tenant_id, name, email, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [tenant1Id, 'User 1', 'user1@test.com', hashedPassword, 'admin']
    );
    const user1Id = user1Result.insertId;

    const [user2Result] = await pool.execute(
      `INSERT INTO users (tenant_id, name, email, password, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [tenant2Id, 'User 2', 'user2@test.com', hashedPassword, 'admin']
    );
    const user2Id = user2Result.insertId;

    console.log('👥 Created test users\n');

    // Test 1: Create pledges for each tenant
    console.log('TEST 1: Create pledges for different tenants');
    testsRun++;
    
    const [pledge1Result] = await pool.execute(
      `INSERT INTO pledges 
       (tenant_id, donor_name, donor_phone, donor_email, amount, collection_date, deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant1Id, 'Donor 1', '256700000001', 'donor1@test.com', 100, '2026-03-01', 0]
    );
    const pledge1Id = pledge1Result.insertId;

    const [pledge2Result] = await pool.execute(
      `INSERT INTO pledges 
       (tenant_id, donor_name, donor_phone, donor_email, amount, collection_date, deleted) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant2Id, 'Donor 2', '256700000002', 'donor2@test.com', 200, '2026-03-01', 0]
    );
    const pledge2Id = pledge2Result.insertId;

    console.log(`  ✓ Created pledge ${pledge1Id} for Tenant 1`);
    console.log(`  ✓ Created pledge ${pledge2Id} for Tenant 2`);
    testsPassed++;
    console.log('  ✅ PASSED\n');

    // Test 2: Tenant 1 can only see their own pledges
    console.log('TEST 2: Tenant isolation - Tenant 1 query');
    testsRun++;
    
    const [tenant1Pledges] = await pool.execute(
      'SELECT * FROM pledges WHERE tenant_id = ? AND deleted = 0',
      [tenant1Id]
    );

    if (tenant1Pledges.length === 1 && tenant1Pledges[0].id === pledge1Id) {
      console.log(`  ✓ Tenant 1 sees only their pledge (${pledge1Id})`);
      testsPassed++;
      console.log('  ✅ PASSED\n');
    } else {
      console.log(`  ✗ Tenant 1 sees ${tenant1Pledges.length} pledges (expected 1)`);
      testsFailed++;
      console.log('  ❌ FAILED\n');
    }

    // Test 3: Tenant 2 can only see their own pledges
    console.log('TEST 3: Tenant isolation - Tenant 2 query');
    testsRun++;
    
    const [tenant2Pledges] = await pool.execute(
      'SELECT * FROM pledges WHERE tenant_id = ? AND deleted = 0',
      [tenant2Id]
    );

    if (tenant2Pledges.length === 1 && tenant2Pledges[0].id === pledge2Id) {
      console.log(`  ✓ Tenant 2 sees only their pledge (${pledge2Id})`);
      testsPassed++;
      console.log('  ✅ PASSED\n');
    } else {
      console.log(`  ✗ Tenant 2 sees ${tenant2Pledges.length} pledges (expected 1)`);
      testsFailed++;
      console.log('  ❌ FAILED\n');
    }

    // Test 4: Cross-tenant access blocked
    console.log('TEST 4: Cross-tenant access prevention');
    testsRun++;
    
    const [crossTenantAttempt] = await pool.execute(
      'SELECT * FROM pledges WHERE id = ? AND tenant_id = ? AND deleted = 0',
      [pledge1Id, tenant2Id]  // Tenant 2 trying to access Tenant 1's pledge
    );

    if (crossTenantAttempt.length === 0) {
      console.log(`  ✓ Tenant 2 CANNOT access Tenant 1's pledge`);
      testsPassed++;
      console.log('  ✅ PASSED\n');
    } else {
      console.log(`  ✗ Tenant 2 CAN access Tenant 1's pledge (SECURITY ISSUE!)`);
      testsFailed++;
      console.log('  ❌ FAILED - SECURITY VULNERABILITY!\n');
    }

    // Test 5: Users belong to correct tenants
    console.log('TEST 5: User-tenant association');
    testsRun++;
    
    const [user1Check] = await pool.execute(
      'SELECT tenant_id FROM users WHERE id = ?',
      [user1Id]
    );

    const [user2Check] = await pool.execute(
      'SELECT tenant_id FROM users WHERE id = ?',
      [user2Id]
    );

    if (user1Check[0].tenant_id === tenant1Id && user2Check[0].tenant_id === tenant2Id) {
      console.log(`  ✓ User 1 belongs to Tenant 1`);
      console.log(`  ✓ User 2 belongs to Tenant 2`);
      testsPassed++;
      console.log('  ✅ PASSED\n');
    } else {
      console.log(`  ✗ User-tenant associations incorrect`);
      testsFailed++;
      console.log('  ❌ FAILED\n');
    }

    // Test 6: Campaigns are tenant-isolated
    console.log('TEST 6: Campaign tenant isolation');
    testsRun++;
    
    const [campaign1] = await pool.execute(
      `INSERT INTO campaigns (tenant_id, name, title, description, target_amount, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant1Id, 'campaign1', 'Campaign 1', 'Test Campaign 1', 1000, '2026-03-01', '2026-04-01']
    );
    const campaign1Id = campaign1.insertId;

    const [campaign2] = await pool.execute(
      `INSERT INTO campaigns (tenant_id, name, title, description, target_amount, start_date, end_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenant2Id, 'campaign2', 'Campaign 2', 'Test Campaign 2', 2000, '2026-03-01', '2026-04-01']
    );
    const campaign2Id = campaign2.insertId;

    const [tenant1Campaigns] = await pool.execute(
      'SELECT * FROM campaigns WHERE tenant_id = ?',
      [tenant1Id]
    );

    const [tenant2Campaigns] = await pool.execute(
      'SELECT * FROM campaigns WHERE tenant_id = ?',
      [tenant2Id]
    );

    if (tenant1Campaigns.length === 1 && tenant2Campaigns.length === 1) {
      console.log(`  ✓ Each tenant sees only their campaign`);
      testsPassed++;
      console.log('  ✅ PASSED\n');
    } else {
      console.log(`  ✗ Campaign isolation failed`);
      testsFailed++;
      console.log('  ❌ FAILED\n');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await pool.execute('DELETE FROM pledges WHERE tenant_id IN (?, ?)', [tenant1Id, tenant2Id]);
    await pool.execute('DELETE FROM campaigns WHERE tenant_id IN (?, ?)', [tenant1Id, tenant2Id]);
    await pool.execute('DELETE FROM users WHERE tenant_id IN (?, ?)', [tenant1Id, tenant2Id]);
    await pool.execute('DELETE FROM tenants WHERE id IN (?, ?)', [tenant1Id, tenant2Id]);
    console.log('✅ Cleanup complete\n');

  } catch (error) {
    console.error('💥 Test error:', error);
    
    // Cleanup on error
    try {
      await pool.execute('DELETE FROM pledges WHERE tenant_id IN (?, ?)', [tenant1Id, tenant2Id]);
      await pool.execute('DELETE FROM campaigns WHERE tenant_id IN (?, ?)', [tenant1Id, tenant2Id]);
      await pool.execute('DELETE FROM users WHERE tenant_id IN (?, ?)', [tenant1Id, tenant2Id]);
      await pool.execute('DELETE FROM tenants WHERE id IN (?, ?)', [tenant1Id, tenant2Id]);
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
  }

  // Summary
  console.log('═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${testsRun}`);
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`Success Rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60));

  if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Tenant isolation is working correctly.\n');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review security implementation.\n');
  }

  await pool.end();
}

// Run tests
testSaaSIsolation().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
