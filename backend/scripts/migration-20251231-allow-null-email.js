// Migration script: allow NULL for email in users table
const { pool } = require('../config/db');

async function migrate() {
  try {
    await pool.query("ALTER TABLE users MODIFY COLUMN email VARCHAR(255) NULL;");
    console.log('✅ Migration complete: email column now allows NULL');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
