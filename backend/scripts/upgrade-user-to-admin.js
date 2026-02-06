const { pool } = require('../config/db');

async function upgradeUserToAdmin() {
  try {
    const email = 'zigocut.tech@gmail.com';
    
    // Check current role
    const [users] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('Current account status:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Current Role:', user.role);
    console.log('');
    
    // Upgrade to admin
    await pool.execute(
      'UPDATE users SET role = ? WHERE id = ?',
      ['admin', user.id]
    );
    
    console.log('✅ Account upgraded to ADMIN role!');
    console.log('');
    console.log('You can now:');
    console.log('  ✓ Record payments');
    console.log('  ✓ Access all admin features');
    console.log('  ✓ Manage system settings');
    console.log('  ✓ View all financial data');
    console.log('');
    console.log('⚠️  Please logout and login again for changes to take effect.');
    
    pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

upgradeUserToAdmin();
