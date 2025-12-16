/**
 * Add Social Sharing Tables Migration
 * Creates tables for tracking shares and referrals
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pledgehub_db',
};

async function createShareEventsTable(connection) {
  const checkTableQuery = `
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = ? AND table_name = 'share_events'
  `;
  
  const [rows] = await connection.query(checkTableQuery, [dbConfig.database]);
  
  if (rows[0].count > 0) {
    console.log('✓ share_events table already exists');
    return;
  }

  const createTableQuery = `
    CREATE TABLE share_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      content_type VARCHAR(50) NOT NULL COMMENT 'campaign, pledge, achievement, milestone, referral',
      content_id INT NULL COMMENT 'ID of the campaign/pledge being shared',
      channel VARCHAR(50) NOT NULL COMMENT 'whatsapp, sms, facebook, twitter, email, copy, native',
      shared_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_content_type (content_type),
      INDEX idx_channel (channel),
      INDEX idx_shared_at (shared_at),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await connection.query(createTableQuery);
  console.log('✓ Created share_events table');
}

async function addReferredByColumn(connection) {
  const checkColumnQuery = `
    SELECT COUNT(*) as count 
    FROM information_schema.columns 
    WHERE table_schema = ? 
      AND table_name = 'users' 
      AND column_name = 'referred_by'
  `;
  
  const [rows] = await connection.query(checkColumnQuery, [dbConfig.database]);
  
  if (rows[0].count > 0) {
    console.log('✓ referred_by column already exists in users table');
    return;
  }

  const addColumnQuery = `
    ALTER TABLE users 
    ADD COLUMN referred_by INT NULL COMMENT 'User ID who referred this user',
    ADD INDEX idx_referred_by (referred_by)
  `;

  await connection.query(addColumnQuery);
  console.log('✓ Added referred_by column to users table');
}

async function runMigration() {
  let connection;

  try {
    console.log('\n🚀 Starting social sharing migration...\n');

    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to database:', dbConfig.database);

    await createShareEventsTable(connection);
    await addReferredByColumn(connection);

    console.log('\n✅ Social sharing migration completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed\n');
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };
