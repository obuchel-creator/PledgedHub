const { pool } = require('../config/db');

async function testPaymentQuery() {
  try {
    console.log('🔍 Testing Payment Query for User #18 (super_admin)\n');
    
    // Get user 18 data
    const [user] = await pool.execute(`
      SELECT id, email, name, role FROM users WHERE id = 18
    `);
    
    if (!user.length) {
      console.log('User #18 not found!');
      process.exit(1);
    }
    
    const currentUser = user[0];
    console.log('User Details:');
    console.log(`  ID: ${currentUser.id}`);
    console.log(`  Email: ${currentUser.email}`);
    console.log(`  Name: ${currentUser.name}`);
    console.log(`  Role: ${currentUser.role}`);
    console.log('');
    
    // Test 1: Admin query (no filters)
    console.log('=== TEST 1: Admin Query (Show ALL payments) ===');
    const [adminQuery] = await pool.execute(`
      SELECT 
        p.id, 
        p.pledge_id,
        p.amount, 
        p.payment_method,
        p.created_at,
        pl.donor_name,
        pl.donor_email,
        pl.created_by
      FROM payments p
      JOIN pledges pl ON p.pledge_id = pl.id
      WHERE p.deleted = 0
      ORDER BY p.created_at DESC
      LIMIT 50
    `);
    
    console.log(`Found ${adminQuery.length} payments (no filter)`);
    adminQuery.forEach(p => {
      console.log(`  Payment #${p.id}: Pledge #${p.pledge_id}, Amount: ${p.amount}, Created By: ${p.created_by}`);
    });
    console.log('');
    
    // Test 2: User-specific query (with filters)
    console.log('=== TEST 2: User Query (filtered by created_by OR donor_email) ===');
    const [userQuery] = await pool.execute(`
      SELECT 
        p.id, 
        p.pledge_id,
        p.amount, 
        p.payment_method,
        p.created_at,
        pl.donor_name,
        pl.donor_email,
        pl.created_by
      FROM payments p
      JOIN pledges pl ON p.pledge_id = pl.id
      WHERE p.deleted = 0
        AND (pl.created_by = ? OR pl.donor_email = ?)
      ORDER BY p.created_at DESC
      LIMIT 50
    `, [currentUser.id, currentUser.email]);
    
    console.log(`Found ${userQuery.length} payments (with filter)`);
    userQuery.forEach(p => {
      console.log(`  Payment #${p.id}: Pledge #${p.pledge_id}, Amount: ${p.amount}`);
    });
    console.log('');
    
    // Test 3: Check if role is 'super_admin' or something else
    console.log('=== TEST 3: Role check ===');
    console.log(`Is super_admin? ${currentUser.role === 'super_admin'}`);
    console.log(`Role value: "${currentUser.role}" (type: ${typeof currentUser.role})`);
    console.log(`Role length: ${currentUser.role ? currentUser.role.length : 'null'}`);
    
    if (currentUser.role !== 'super_admin' && currentUser.role !== 'finance_admin') {
      console.log('⚠️  Role is NOT admin! Using filtered query');
    } else {
      console.log('✓ Role is admin! Should use unfiltered query');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPaymentQuery();
