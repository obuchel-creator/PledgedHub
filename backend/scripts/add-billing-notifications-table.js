const { pool } = require('../config/db');

/**
 * Migration: Create billing_notifications table
 * Stores email addresses for launch/monetization notifications
 */

async function ensureTableExists(DB_NAME, tableName, createSQL) {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?`,
    [DB_NAME, tableName]
  );

  if (tables && tables.length > 0) {
    console.log(`✅ ${tableName} table already exists`);
    return false;
  }

  console.log(`📋 Creating ${tableName} table...`);
  await pool.execute(createSQL);
  console.log(`✅ ${tableName} table created successfully`);
  return true;
}

async function ensureColumn(DB_NAME, tableName, columnName, definition) {
  const [cols] = await pool.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [DB_NAME, tableName, columnName]
  );

  if (cols && cols.length > 0) {
    return false;
  }

  console.log(`➕ Adding column ${columnName} to ${tableName}`);
  await pool.execute(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
  return true;
}

async function ensureIndex(DB_NAME, tableName, indexName, definition) {
  const [indexes] = await pool.execute(
    `SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND INDEX_NAME = ?`,
    [DB_NAME, tableName, indexName]
  );

  if (indexes && indexes.length > 0) {
    return false;
  }

  console.log(`➕ Adding index ${indexName} to ${tableName}`);
  await pool.execute(`ALTER TABLE ${tableName} ADD ${definition}`);
  return true;
}

async function runMigration() {
  console.log('🔄 Ensuring billing notification tables...\n');
  
  try {
    const DB_NAME = process.env.DB_NAME || 'pledgehub_db';

    // Primary table for notification signups
    await ensureTableExists(DB_NAME, 'billing_notifications', `
      CREATE TABLE billing_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        activation_date DATETIME,
        notified BOOLEAN DEFAULT FALSE,
        notified_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_notified (notified)
      )
    `);

    // Ensure helpful columns exist for linking to users and tracking state changes
    await ensureColumn(DB_NAME, 'billing_notifications', 'user_id', 'INT NULL');
    await ensureColumn(DB_NAME, 'billing_notifications', 'last_status_change_at', 'DATETIME NULL');
    await ensureColumn(DB_NAME, 'billing_notifications', 'last_status_change_type', "ENUM('upgrade','downgrade') NULL");
    await ensureColumn(DB_NAME, 'billing_notifications', 'last_notification_reason', 'VARCHAR(255) NULL');
    await ensureIndex(DB_NAME, 'billing_notifications', 'idx_user_id', 'INDEX idx_user_id (user_id)');

    // Event table to track upgrades/downgrades to suppress duplicate notifications
    await ensureTableExists(DB_NAME, 'billing_notification_events', `
      CREATE TABLE billing_notification_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        email VARCHAR(255) NOT NULL,
        event_type ENUM('upgrade','downgrade','notification_sent') NOT NULL,
        from_tier VARCHAR(50) NULL,
        to_tier VARCHAR(50) NULL,
        note VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        INDEX idx_email (email),
        INDEX idx_event (event_type)
      )
    `);

    // Verify main table
    const [columns] = await pool.execute(`DESCRIBE billing_notifications`);
    console.log('📊 billing_notifications structure:');
    console.table(columns);

    const [eventColumns] = await pool.execute(`DESCRIBE billing_notification_events`);
    console.log('📊 billing_notification_events structure:');
    console.table(eventColumns);

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
