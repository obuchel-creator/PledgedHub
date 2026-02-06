// Quick Backend Validation Test
// Tests database connection and basic functionality

const mysql = require('mysql2/promise');
require('dotenv').config();

async function quickTest() {
  console.log('\n🧪 PledgeHub Quick Test\n');
  console.log('━'.repeat(50));
  
  const results = { passed: 0, failed: 0 };
  
  // Test 1: Environment Variables
  try {
    console.log('📋 Test 1: Environment Variables');
    const required = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.log(`   ❌ Missing: ${missing.join(', ')}`);
      results.failed++;
    } else {
      console.log('   ✅ All required env vars present');
      results.passed++;
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.failed++;
  }
  
  // Test 2: Database Connection
  let pool;
  try {
    console.log('\n📋 Test 2: Database Connection');
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'pledgehub_db',
      waitForConnections: true,
      connectionLimit: 10
    });
    
    const [rows] = await pool.execute('SELECT 1 as test');
    if (rows[0].test === 1) {
      console.log('   ✅ Database connection successful');
      results.passed++;
    }
  } catch (error) {
    console.log('   ❌ Database error:', error.message);
    results.failed++;
  }
  
  // Test 3: Database Tables
  try {
    console.log('\n📋 Test 3: Core Tables Exist');
    const tables = ['users', 'pledges', 'campaigns', 'payments'];
    let allExist = true;
    
    for (const table of tables) {
      const [rows] = await pool.execute(`SHOW TABLES LIKE '${table}'`);
      if (rows.length === 0) {
        console.log(`   ❌ Table missing: ${table}`);
        allExist = false;
      }
    }
    
    if (allExist) {
      console.log('   ✅ All core tables exist');
      results.passed++;
    } else {
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ Error checking tables:', error.message);
    results.failed++;
  }
  
  // Test 4: Services Load
  try {
    console.log('\n📋 Test 4: Core Services Load');
    require('./services/analyticsService');
    require('./services/emailService');
    require('./services/paymentTrackingService');
    console.log('   ✅ Core services load successfully');
    results.passed++;
  } catch (error) {
    console.log('   ❌ Service load error:', error.message);
    results.failed++;
  }
  
  // Test 5: Bug Fixes Verification
  try {
    console.log('\n📋 Test 5: Bug Fixes Applied');
    const fs = require('fs');
    const path = require('path');
    
    // Check for pool.execute usage (not pool.query)
    const registerPath = path.join(__dirname, 'routes', 'register.js');
    const registerContent = fs.readFileSync(registerPath, 'utf8');
    const hasPoolExecute = registerContent.includes('pool.execute');
    const hasPoolQuery = registerContent.includes('pool.query');
    
    if (hasPoolExecute && !hasPoolQuery) {
      console.log('   ✅ SQL injection fixes applied (pool.execute)');
      results.passed++;
    } else {
      console.log('   ⚠️  Some files may still use pool.query');
      results.failed++;
    }
  } catch (error) {
    console.log('   ❌ Error verifying fixes:', error.message);
    results.failed++;
  }
  
  // Summary
  console.log('\n' + '━'.repeat(50));
  console.log(`\n📊 Results: ${results.passed} passed, ${results.failed} failed`);
  
  if (results.failed === 0) {
    console.log('\n✅ All tests passed! System is ready.\n');
    console.log('Next steps:');
    console.log('  1. Start backend: npm run dev');
    console.log('  2. Run full tests: node scripts/test-all-features.js');
    console.log('  3. Run unit tests: npm test\n');
  } else {
    console.log('\n⚠️  Some tests failed. Check configuration.\n');
  }
  
  if (pool) await pool.end();
  process.exit(results.failed === 0 ? 0 : 1);
}

quickTest().catch(err => {
  console.error('\n💥 Fatal error:', err.message);
  process.exit(1);
});
