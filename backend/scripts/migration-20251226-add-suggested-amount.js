// Migration: Add suggested_amount column to campaigns table and set default value
const { pool } = require('../config/db');

async function runMigration() {
  try {
    // Add suggested_amount column if it doesn't exist
    await pool.execute(`
      ALTER TABLE campaigns 
      ADD COLUMN suggested_amount DECIMAL(15,2) DEFAULT 10000
    `);
    console.log('✅ suggested_amount column added to campaigns table.');
  } catch (error) {
    if (error.message && error.message.includes('Duplicate column name')) {
      console.log('ℹ️ suggested_amount column already exists.');
    } else {
      console.error('❌ Error adding suggested_amount column:', error);
      process.exit(1);
    }
  }

  try {
    // Set default value for all existing campaigns
    const [result] = await pool.execute(
      'UPDATE campaigns SET suggested_amount = 10000 WHERE suggested_amount IS NULL OR suggested_amount <= 0'
    );
    console.log(`✅ Updated ${result.affectedRows} campaigns with default suggested_amount.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating suggested_amount:', error);
    process.exit(1);
  }
}

runMigration();
