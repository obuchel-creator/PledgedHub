// Migration script to add goal_amount column to campaigns table
const path = require('path');
const { pool } = require(path.resolve(__dirname, '../config/db'));

async function migrate() {
  try {
    console.log('🔵 Adding goal_amount column to campaigns table...');
    await pool.execute(`
      ALTER TABLE campaigns 
      ADD COLUMN goal_amount DECIMAL(15,2) NOT NULL DEFAULT 0;
    `);
    console.log('✅ goal_amount column added successfully!');
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('⚠️ goal_amount column already exists. No changes made.');
    } else {
      console.error('❌ Migration failed:', error);
    }
  } finally {
    pool.end();
  }
}

migrate();
