const { pool } = require('./backend/config/db');

async function fixUser() {
  try {
    // Fix the invalid role
    const [result] = await pool.execute(
      'UPDATE users SET role = ? WHERE id = 1',
      ['user']
    );
    console.log('✅ Fixed user #1 role to "user"');
    
    // Show updated user
    const [user] = await pool.execute('SELECT id, name, phone, role FROM users WHERE id = 1');
    console.log('📋 Updated user:', user[0]);
  } finally {
    await pool.end();
  }
}

fixUser();
