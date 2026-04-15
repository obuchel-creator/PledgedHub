/**
 * PledgeHub DB Migration Template
 *
 * Copy this file into: backend/scripts/migration-YYYYMMDD-your-change.js
 * Then edit the MIGRATION_NAME and apply your DDL changes.
 *
 * Run:
 *   node backend/scripts/migration-YYYYMMDD-your-change.js
 */

const { pool } = require('../config/db');

const MIGRATION_NAME = 'migration-YYYYMMDD-your-change';

// Optional safety guard for destructive operations
// Set ALLOW_DESTRUCTIVE_MIGRATIONS=true only when you intentionally drop/rename.
const ALLOW_DESTRUCTIVE = process.env.ALLOW_DESTRUCTIVE_MIGRATIONS === 'true';

async function run() {
  const connection = await pool.getConnection();

  try {
    console.log(`\n🧱 Starting DB migration: ${MIGRATION_NAME}`);

    // If your migration has multiple dependent steps, prefer a transaction.
    await connection.beginTransaction();

    // Example (safe, additive): create table
    // await connection.execute(`
    //   CREATE TABLE IF NOT EXISTS example_table (
    //     id INT PRIMARY KEY AUTO_INCREMENT,
    //     name VARCHAR(255) NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   );
    // `);

    // Example (safe-ish): add column if missing (works across MySQL versions)
    // const [cols] = await connection.execute(
    //   `SELECT COUNT(*) AS cnt
    //    FROM INFORMATION_SCHEMA.COLUMNS
    //    WHERE TABLE_SCHEMA = DATABASE()
    //      AND TABLE_NAME = 'pledges'
    //      AND COLUMN_NAME = 'new_column'`
    // );
    // if ((cols?.[0]?.cnt || 0) === 0) {
    //   await connection.execute(`ALTER TABLE pledges ADD COLUMN new_column VARCHAR(255) NULL`);
    // }

    // Example (destructive): drop table
    // if (!ALLOW_DESTRUCTIVE) {
    //   throw new Error('Refusing to run destructive migration without ALLOW_DESTRUCTIVE_MIGRATIONS=true');
    // }
    // await connection.execute('DROP TABLE IF EXISTS old_table');

    await connection.commit();
    console.log(`✅ Migration complete: ${MIGRATION_NAME}`);
  } catch (error) {
    try {
      await connection.rollback();
    } catch {
      // ignore rollback errors
    }

    console.error(`❌ Migration failed: ${MIGRATION_NAME}`);
    console.error(error);
    process.exitCode = 1;
  } finally {
    connection.release();
  }
}

run();
