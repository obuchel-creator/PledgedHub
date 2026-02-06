const { pool } = require('../config/db');
require('dotenv').config();

async function fixRole() {
  try {
    console.log('🔍 Checking current role and middleware requirements...\n');
    
    // Check current role
    const [users] = await pool.execute(
      'SELECT id, name, email, role FROM users WHERE email = ?',
      ['zigocut.tech@gmail.com']
    );
    
    if (users.length === 0) {
      console.log('❌ User not found');
      pool.end();
      return;
    }
    
    const user = users[0];
    console.log('Current status:');
    console.log('  Name:', user.name);
    console.log('  Email:', user.email);
    console.log('  Current Role:', user.role);
    console.log('');
    
    // Check what enum values are allowed
    const [columns] = await pool.execute(
      "SHOW COLUMNS FROM users WHERE Field = 'role'"
    );
    console.log('Database allowed roles:', columns[0].Type);
    console.log('');
    
    console.log('⚠️  ISSUE FOUND:');
    console.log('  Your role is "admin"');
    console.log('  But payment routes require: support_staff, finance_admin, or super_admin');
    console.log('');
    
    // Update to super_admin
    console.log('🔧 Updating role to "super_admin"...');
    await pool.execute(
      'UPDATE users SET role = ? WHERE email = ?',
      ['super_admin', 'zigocut.tech@gmail.com']
    );
    
    // Verify update
    const [updated] = await pool.execute(
      'SELECT role FROM users WHERE email = ?',
      ['zigocut.tech@gmail.com']
    );
    
    console.log('✅ Role updated to:', updated[0].role);
    console.log('');
    console.log('⚠️  IMPORTANT: You MUST logout and login again!');
    console.log('');
    console.log('Steps:');
    console.log('1. Click your profile/name in the top-right corner');
    console.log('2. Click "Logout"');
    console.log('3. Go to http://localhost:5173/login');
    console.log('4. Login again with your credentials');
    console.log('5. Try recording the payment again');
    console.log('');
    console.log('After login, your new token will have super_admin role and payment recording will work!');
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
  }
}

fixRole();
