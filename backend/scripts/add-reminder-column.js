const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function addReminderColumn() {
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            database: process.env.DB_NAME || 'omukwano_db'
        });

        console.log('✓ Connected to database');

        // Check if column already exists
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'pledges'
        `, [process.env.DB_NAME || 'omukwano_db']);

        const existingColumns = columns.map(row => row.COLUMN_NAME);
        
        // Add last_reminder_sent column if it doesn't exist
        if (!existingColumns.includes('last_reminder_sent')) {
            console.log('Adding last_reminder_sent column...');
            await connection.query(`
                ALTER TABLE pledges 
                ADD COLUMN last_reminder_sent DATETIME DEFAULT NULL 
                COMMENT 'Timestamp of last reminder sent'
            `);
            console.log('✓ Added last_reminder_sent column');
        } else {
            console.log('ℹ last_reminder_sent column already exists');
        }

        console.log('\n✅ Reminder system database migration completed successfully!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run migration
addReminderColumn();
