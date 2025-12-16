const { pool } = require('./config/db');

async function checkSchema() {
  try {
    console.log('\n📋 Users Table Schema:');
    const [columns] = await pool.execute('DESCRIBE users');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'NO' ? 'NOT NULL' : 'NULLABLE'}`);
    });
    
    console.log('\n👥 Sample Users:');
    const [users] = await pool.execute('SELECT id, name, email, username, created_at FROM users LIMIT 5');
    if (users.length > 0) {
      users.forEach(u => {
        console.log(`  - ${u.name} (${u.email}) - ${u.username}`);
      });
    } else {
      console.log('  (no users found)');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  process.exit(0);
}

checkSchema();
