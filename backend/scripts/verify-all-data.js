/**
 * Verify all pledges and payments in the database
 * Show exact data that's being returned by the API
 */

require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function verifyData() {
  try {
    console.log('🔍 Verifying all data in database...\n');
    
    // Check all pledges
    console.log('📋 ALL PLEDGES:');
    const [pledges] = await pool.execute('SELECT id, donor_name, donor_email, amount, purpose, created_at, status FROM pledges WHERE deleted = 0 ORDER BY id DESC');
    
    if (pledges.length === 0) {
      console.log('  (No pledges found)');
    } else {
      pledges.forEach(p => {
        console.log(`  Pledge #${p.id}: ${p.donor_name} (${p.donor_email})`);
        console.log(`    Amount: ${p.amount} UGX`);
        console.log(`    Purpose: ${p.purpose}`);
        console.log(`    Created: ${p.created_at}`);
        console.log(`    Status: ${p.status}`);
      });
    }
    
    console.log('\n📋 ALL PAYMENTS:');
    const [payments] = await pool.execute(`
      SELECT 
        p.id, 
        p.pledge_id, 
        p.amount, 
        p.payment_method, 
        p.verification_status,
        p.payment_date,
        p.created_at,
        pl.donor_name,
        pl.donor_email
      FROM payments p
      JOIN pledges pl ON p.pledge_id = pl.id
      WHERE p.deleted = 0
      ORDER BY p.id DESC
    `);
    
    if (payments.length === 0) {
      console.log('  (No payments found)');
    } else {
      payments.forEach(p => {
        console.log(`  Payment #${p.id}: Pledge #${p.pledge_id}`);
        console.log(`    Donor: ${p.donor_name} (${p.donor_email})`);
        console.log(`    Amount: ${p.amount} UGX`);
        console.log(`    Method: ${p.payment_method}`);
        console.log(`    Status: ${p.verification_status}`);
        console.log(`    Payment Date: ${p.payment_date}`);
        console.log(`    Created: ${p.created_at}`);
      });
    }
    
    console.log('\n✓ Data verification complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

verifyData();
