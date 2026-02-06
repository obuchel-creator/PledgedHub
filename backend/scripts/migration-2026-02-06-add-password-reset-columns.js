const { pool } = require('../config/db');

async function runMigration() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Starting migration: Add password reset columns to users table...');
    
    // Check if columns already exist to avoid errors
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'users' AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry', 'reset_code', 'reset_code_expiry')"
    );
    
    if (columns.length > 0) {
      console.log('✅ Password reset columns already exist. Skipping migration.');
      return;
    }

    // Add reset_token column for email-based reset
    console.log('  📝 Adding reset_token column...');
    await connection.execute(
      "ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) NULL DEFAULT NULL"
    );
    
    // Add reset_token_expiry column for email-based reset
    console.log('  📝 Adding reset_token_expiry column...');
    await connection.execute(
      "ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME NULL DEFAULT NULL"
    );
    
    // Add reset_code column for SMS-based reset
    console.log('  📝 Adding reset_code column...');
    await connection.execute(
      "ALTER TABLE users ADD COLUMN reset_code VARCHAR(10) NULL DEFAULT NULL"
    );
    
    // Add reset_code_expiry column for SMS-based reset
    console.log('  📝 Adding reset_code_expiry column...');
    await connection.execute(
      "ALTER TABLE users ADD COLUMN reset_code_expiry DATETIME NULL DEFAULT NULL"
    );

    console.log('✅ Migration completed successfully!');
    console.log('✅ Added columns:');
    console.log('   - reset_token (VARCHAR 255)');
    console.log('   - reset_token_expiry (DATETIME)');
    console.log('   - reset_code (VARCHAR 10)');
    console.log('   - reset_code_expiry (DATETIME)');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    connection.release();
    pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\n✨ All migrations completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
