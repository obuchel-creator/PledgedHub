const { pool } = require('../config/db');

async function addPasswordHashColumn() {
  try {
    const [columns] = await pool.execute(
      `SELECT COLUMN_NAME
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users'
         AND COLUMN_NAME = 'password_hash'`
    );

    if (columns.length > 0) {
      console.log('✅ Column users.password_hash already exists');
      return;
    }

    console.log('⏳ Adding users.password_hash column...');
    await pool.execute(
      "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER password"
    );
    console.log('✅ Added users.password_hash column');
  } catch (error) {
    console.error('❌ Failed to add password_hash column:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch (err) {
      console.error('⚠️ Failed to close DB pool:', err.message);
    }
  }
}

addPasswordHashColumn();
