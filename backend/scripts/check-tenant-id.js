const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

(async () => {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
  });

  try {
    const [users] = await pool.execute(
      'SELECT id, email, name, tenant_id FROM users WHERE email = ? ORDER BY created_at DESC LIMIT 1',
      ['namevalidation.test@example.com']
    );

    if (users.length > 0) {
      const user = users[0];
      console.log('User found:');
      console.log(`  ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Tenant ID: ${user.tenant_id} (type: ${typeof user.tenant_id})`);
      console.log(`  Tenant ID is null: ${user.tenant_id === null}`);
      console.log(`  Tenant ID value: '${user.tenant_id}'`);
    } else {
      console.log('User not found');
    }
  } finally {
    pool.end();
  }
})();
