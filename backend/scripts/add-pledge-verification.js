/**
 * Migration: Add email verification to pledges
 * Adds verification_token and is_verified columns
 */

const { pool } = require('../config/db');

async function migrate() {
  try {
    console.log('🔧 Starting migration: Add pledge email verification...');

    // Check if column already exists
    const [cols] = await pool.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='pledges' AND COLUMN_NAME='verification_token'"
    );

    if (cols.length > 0) {
      console.log('✅ Columns already exist, skipping migration');
      process.exit(0);
    }

    // Add verification_token column
    await pool.execute(`
      ALTER TABLE pledges ADD COLUMN verification_token VARCHAR(255) NULL UNIQUE
    `);
    console.log('✅ Added verification_token column');

    // Add is_verified column
    await pool.execute(`
      ALTER TABLE pledges ADD COLUMN is_verified BOOLEAN DEFAULT FALSE
    `);
    console.log('✅ Added is_verified column');

    // Add verified_at column
    await pool.execute(`
      ALTER TABLE pledges ADD COLUMN verified_at TIMESTAMP NULL
    `);
    console.log('✅ Added verified_at column');

    console.log('✅ Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
