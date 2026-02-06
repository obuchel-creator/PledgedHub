const { pool } = require('./backend/config/db');

async function listAllUsers() {
  try {
    const [users] = await pool.execute(`
      SELECT id, name, username, email, phone, role, created_at
      FROM users 
      ORDER BY id DESC 
      LIMIT 10
    `);
    
    console.log('\n📋 LATEST USERS:\n');
    for (const user of users) {
      const [stats] = await pool.execute('SELECT * FROM user_usage_stats WHERE user_id = ?', [user.id]);
      const [validation] = await pool.execute('SELECT * FROM user_validation_status WHERE user_id = ?', [user.id]);
      const [perms] = await pool.execute('SELECT COUNT(*) as cnt FROM user_permissions WHERE user_id = ?', [user.id]);
      
      console.log(`User #${user.id}: ${user.name}`);
      console.log(`  Phone: ${user.phone}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Created: ${user.created_at}`);
      console.log(`  Init: ${stats.length > 0 && validation.length > 0 && perms[0].cnt > 0 ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
      console.log(`    - Monetization: ${stats.length > 0 ? '✅' : '❌'}`);
      console.log(`    - Validation: ${validation.length > 0 ? '✅' : '❌'}`);
      console.log(`    - Permissions: ${perms[0].cnt > 0 ? `✅ (${perms[0].cnt})` : '❌'}`);
      console.log();
    }
  } finally {
    await pool.end();
  }
}

listAllUsers();
