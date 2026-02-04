const db = require('../config/db');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    const [users] = await db.pool.execute(
      'SELECT id, name, username, phone_number, email, role, tenant_id, password FROM users WHERE password IS NOT NULL ORDER BY id DESC LIMIT 50'
    );
    
    console.log(`Checking ${users.length} users for password match...`);
    
    for (const user of users) {
      try {
        const match = await bcrypt.compare('COMp092u@80', user.password);
        if (match) {
          console.log('\n✅ FOUND YOUR ACCOUNT:');
          console.log(JSON.stringify({
            id: user.id,
            name: user.name,
            username: user.username,
            phone_number: user.phone_number,
            email: user.email,
            role: user.role,
            tenant_id: user.tenant_id
          }, null, 2));
        }
      } catch (e) {
        // Skip users with invalid password hashes
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
