const { pool } = require('../config/db');

async function debugPayments() {
  try {
    console.log('🔍 Debugging Recent Payments Issue\n');
    
    // Get all payments
    console.log('=== ALL PAYMENTS ===');
    const [allPayments] = await pool.execute(`
      SELECT p.id, p.pledge_id, p.amount, p.payment_method, p.created_at
      FROM payments p
      WHERE p.deleted = 0
      ORDER BY p.created_at DESC
    `);
    console.log(`Total payments: ${allPayments.length}`);
    allPayments.forEach(p => {
      console.log(`  Payment #${p.id}: Pledge #${p.pledge_id}, Amount: ${p.amount}, Method: ${p.payment_method}`);
    });
    
    // Get all pledges for these payments
    console.log('\n=== PLEDGE DETAILS FOR PAYMENTS ===');
    const [pledgeDetails] = await pool.execute(`
      SELECT DISTINCT 
        p.id, 
        p.donor_name, 
        p.donor_email, 
        p.created_by, 
        p.amount,
        p.status,
        pm.pledge_id,
        COUNT(pm.id) as payment_count
      FROM pledges p
      LEFT JOIN payments pm ON p.id = pm.pledge_id
      WHERE pm.id IS NOT NULL
      GROUP BY p.id
    `);
    
    pledgeDetails.forEach(p => {
      console.log(`\nPledge #${p.id}:`);
      console.log(`  Donor Name: ${p.donor_name}`);
      console.log(`  Donor Email: ${p.donor_email}`);
      console.log(`  Created By (User ID): ${p.created_by}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Amount: ${p.amount}`);
      console.log(`  Payment Count: ${p.payment_count}`);
    });
    
    // Check users table to see what emails exist
    console.log('\n=== USERS IN SYSTEM ===');
    const [users] = await pool.execute(`
      SELECT id, email, name FROM users LIMIT 10
    `);
    users.forEach(u => {
      console.log(`  User #${u.id}: ${u.email} (${u.name})`);
    });
    
    // Test the exact query that listPayments uses
    console.log('\n=== TESTING LISTPAYMENTS QUERY ===');
    const testUserId = 1;
    const testUserEmail = users.length > 0 ? users[0].email : 'test@example.com';
    
    console.log(`Testing with User ID: ${testUserId}, Email: ${testUserEmail}`);
    
    const [testResults] = await pool.execute(`
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
    `, [testUserId, testUserEmail]);
    
    console.log(`\nQuery returned ${testResults.length} payments`);
    testResults.forEach(p => {
      console.log(`  Payment #${p.id}: Pledge #${p.pledge_id}, Amount: ${p.amount}`);
      console.log(`    Donor: ${p.donor_name} (${p.donor_email})`);
      console.log(`    Pledge Created By: ${p.created_by}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugPayments();
