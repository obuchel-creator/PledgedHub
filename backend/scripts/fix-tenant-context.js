const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    const [users] = await pool.execute(
      'SELECT id, name, email, tenant_id FROM users WHERE email = ?',
      ['zigocut.tech@gmail.com']
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('\n📋 Current user info:');
      console.log('  ID:', user.id);
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Tenant ID:', user.tenant_id);
      console.log('  Tenant ID type:', typeof user.tenant_id);

      if (!user.tenant_id || user.tenant_id != user.id) {
        console.log('\n🔧 Fixing tenant_id...');
        await pool.execute('UPDATE users SET tenant_id = ? WHERE id = ?', [user.id, user.id]);
        console.log('✅ Updated tenant_id to:', user.id);
        console.log('\n⚠️  IMPORTANT: You MUST logout and login again for changes to take effect!');
        console.log('   Your JWT token needs to be refreshed with the new tenant_id.\n');
      } else {
        console.log('\n✅ tenant_id is already set correctly');
        console.log('   If you still get errors, try logout/login to refresh your JWT token.\n');
      }
    } else {
      console.log('\n❌ User not found with email: zigocut.tech@gmail.com\n');
    }
  } finally {
    pool.end();
  }
})();
