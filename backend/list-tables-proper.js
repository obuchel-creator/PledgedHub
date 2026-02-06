require('dotenv').config({ path: './backend/.env' });
const mysql = require('mysql2/promise');

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    console.log('Connected to:', process.env.DB_NAME);
    
    const [tables] = await conn.query('SHOW TABLES');
    console.log(`\nTotal tables: ${tables.length}\n`);
    
    tables.forEach((t, i) => {
      const tableName = Object.values(t)[0];
      console.log(`${(i+1).toString().padStart(2)}. ${tableName}`);
    });
    
    // Check for our new tables specifically
    const ourTables = ['user_usage_stats', 'user_validation_status', 'login_history', 'user_permissions', 'audit_log', 'session_tokens'];
    console.log('\n🔍 Checking for initialization tables:');
    for (const table of ourTables) {
      const exists = tables.some(t => Object.values(t)[0] === table);
      console.log(`  ${exists ? '✅' : '❌'} ${table}`);
    }
    
    await conn.end();
  } catch (error) {
    console.error('ERROR:', error.message);
  }
})();
