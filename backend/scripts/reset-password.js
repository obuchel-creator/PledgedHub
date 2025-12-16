require('dotenv').config();
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const email = 'zigocut.tech@gmail.com';
  const newPassword = 'COMp0$ition'; // Your new password
  
  try {
    console.log(`\n🔄 Resetting password for: ${email}`);
    
    // Hash the new password
    const hash = await bcrypt.hash(newPassword, 10);
    console.log(`✅ Password hashed (length: ${hash.length})`);
    
    // Update the password in database
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE email = ?',
      [hash, email]
    );
    
    if (result.affectedRows === 0) {
      console.log('❌ User not found with that email');
    } else {
      console.log(`✅ Password updated successfully!`);
      console.log(`\n📝 Login credentials:`);
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${newPassword}`);
    }
    
    // Verify by querying the user
    const [users] = await pool.execute('SELECT id, email, username FROM users WHERE email = ?', [email]);
    if (users.length > 0) {
      console.log(`\n✓ User verified:`, users[0]);
    }
    
    await pool.end();
    console.log('\n✅ Done!\n');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

resetPassword();
