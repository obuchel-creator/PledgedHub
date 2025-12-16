const { pool } = require('../config/db');

const email = process.argv[2] || 'testuser@example.com';

async function makeAdmin() {
  try {
    const [result] = await pool.query('UPDATE users SET role = ? WHERE email = ?', ['admin', email]);
    
    if (result.affectedRows === 0) {
      console.log('⚠️  No user found with email:', email);
    } else {
      console.log('✅ User', email, 'updated to admin role!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    process.exit(0);
  }
}

makeAdmin();
