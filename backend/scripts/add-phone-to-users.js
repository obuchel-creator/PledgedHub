// Migration script to ensure users table has phone_number column (required, unique)
// Run: node backend/scripts/add-phone-to-users.js

const db = require('../config/db');

async function addPhoneToUsers() {
  try {
    // Check if phone_number column exists
    const [cols] = await db.pool.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone_number'
    `);
    if (cols.length === 0) {
      await db.pool.execute(`
        ALTER TABLE users 
        ADD COLUMN phone_number VARCHAR(20) NOT NULL AFTER username,
        ADD UNIQUE INDEX idx_phone_unique (phone_number)
      `);
      console.log('✅ Added phone_number column to users table (required, unique)');
    } else {
      console.log('ℹ️  phone_number column already exists');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
  process.exit(0);
}

addPhoneToUsers();
