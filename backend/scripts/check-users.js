const { pool } = require('../config/db');

async function checkCurrentUser() {
  try {
    console.log('🔍 Checking Users with Email: zigocut.tech@gmail.com\n');
    
    const [users] = await pool.execute(`
      SELECT id, email, name, role FROM users WHERE email LIKE '%zigocut%'
    `);
    
    console.log(`Found ${users.length} user(s) with zigocut email:`);
    users.forEach(u => {
      console.log(`  User #${u.id}: ${u.email} (Name: ${u.name}, Role: ${u.role})`);
    });
    
    // Get user 18 specifically
    console.log('\n=== USER #18 DETAILS ===');
    const [user18] = await pool.execute(`
      SELECT id, email, name, role, created_at FROM users WHERE id = 18
    `);
    
    if (user18.length > 0) {
      const u = user18[0];
      console.log(`ID: ${u.id}`);
      console.log(`Email: ${u.email}`);
      console.log(`Name: ${u.name}`);
      console.log(`Role: ${u.role}`);
      console.log(`Created: ${u.created_at}`);
    } else {
      console.log('User #18 not found');
    }
    
    // Check pledges and payments for user 18
    console.log('\n=== PLEDGES FOR USER #18 ===');
    const [pledges] = await pool.execute(`
      SELECT id, donor_name, donor_email, status, amount FROM pledges WHERE created_by = 18
    `);
    
    console.log(`Found ${pledges.length} pledges created by User #18`);
    pledges.forEach(p => {
      console.log(`  Pledge #${p.id}: ${p.donor_name} (${p.donor_email}) - ${p.status} - ${p.amount} UGX`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCurrentUser();
