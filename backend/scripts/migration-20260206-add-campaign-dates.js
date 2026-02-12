// Migration: Add start_date and end_date to campaigns table and backfill values
const { pool } = require('../config/db');

async function runMigration() {
  try {
    console.log('🔵 Adding start_date and end_date columns to campaigns table...');

    const [startExists] = await pool.execute(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'campaigns'
        AND COLUMN_NAME = 'start_date'
    `);

    if (startExists[0].count === 0) {
      await pool.execute(`
        ALTER TABLE campaigns
        ADD COLUMN start_date DATE NULL
      `);
      console.log('✅ start_date column added.');
    } else {
      console.log('ℹ️ start_date column already exists.');
    }

    const [endExists] = await pool.execute(`
      SELECT COUNT(*) AS count
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'campaigns'
        AND COLUMN_NAME = 'end_date'
    `);

    if (endExists[0].count === 0) {
      await pool.execute(`
        ALTER TABLE campaigns
        ADD COLUMN end_date DATE NULL
      `);
      console.log('✅ end_date column added.');
    } else {
      console.log('ℹ️ end_date column already exists.');
    }

    console.log('🔵 Backfilling missing campaign dates...');

    await pool.execute(`
      UPDATE campaigns
      SET start_date = DATE(created_at)
      WHERE start_date IS NULL
    `);

    await pool.execute(`
      UPDATE campaigns
      SET end_date = DATE_ADD(COALESCE(start_date, DATE(created_at)), INTERVAL 30 DAY)
      WHERE end_date IS NULL
    `);

    await pool.execute(`
      UPDATE campaigns
      SET end_date = DATE_ADD(start_date, INTERVAL 30 DAY)
      WHERE start_date IS NOT NULL
        AND end_date IS NOT NULL
        AND end_date < start_date
    `);

    console.log('✅ Campaign date migration complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
