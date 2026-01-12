const { pool } = require('../config/db');

async function runMigration() {
  try {
    // Check if campaign_id column exists
    const [columns] = await pool.execute(`SHOW COLUMNS FROM pledges LIKE 'campaign_id'`);
    if (columns.length === 0) {
      console.log('Adding campaign_id column to pledges table...');
      await pool.execute(`ALTER TABLE pledges ADD COLUMN campaign_id INT NULL AFTER id`);
      console.log('campaign_id column added.');
    } else {
      console.log('campaign_id column already exists.');
    }

    // Check if foreign key exists
    const [fk] = await pool.execute(`SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'pledges' AND COLUMN_NAME = 'campaign_id' AND REFERENCED_TABLE_NAME = 'campaigns'`);
    if (fk.length === 0) {
      console.log('Adding foreign key constraint to campaign_id...');
      await pool.execute(`ALTER TABLE pledges ADD CONSTRAINT fk_campaign_id FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE SET NULL ON UPDATE CASCADE`);
      console.log('Foreign key constraint added.');
    } else {
      console.log('Foreign key constraint already exists.');
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
