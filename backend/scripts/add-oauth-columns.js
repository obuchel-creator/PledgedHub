const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function addOAuthColumns() {
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

        // Check if columns already exist
        const [columns] = await connection.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [process.env.DB_NAME || 'omukwano_db']);

        const existingColumns = columns.map(row => row.COLUMN_NAME);
        
        // Add oauth_provider column if it doesn't exist
        if (!existingColumns.includes('oauth_provider')) {
            console.log('Adding oauth_provider column...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN oauth_provider VARCHAR(20) DEFAULT NULL 
                COMMENT 'OAuth provider (google, facebook, etc.)'
            `);
            console.log('✓ Added oauth_provider column');
        } else {
            console.log('ℹ oauth_provider column already exists');
        }

        // Add oauth_id column if it doesn't exist
        if (!existingColumns.includes('oauth_id')) {
            console.log('Adding oauth_id column...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN oauth_id VARCHAR(255) DEFAULT NULL 
                COMMENT 'OAuth provider user ID'
            `);
            console.log('✓ Added oauth_id column');
        } else {
            console.log('ℹ oauth_id column already exists');
        }

        // Add email_verified column if it doesn't exist
        if (!existingColumns.includes('email_verified')) {
            console.log('Adding email_verified column...');
            await connection.query(`
                ALTER TABLE users 
                ADD COLUMN email_verified BOOLEAN DEFAULT FALSE 
                COMMENT 'Whether email has been verified'
            `);
            console.log('✓ Added email_verified column');
        } else {
            console.log('ℹ email_verified column already exists');
        }

        // Create index on oauth_provider and oauth_id for faster lookups
        try {
            const [indexes] = await connection.query(`
                SHOW INDEXES FROM users WHERE Key_name = 'idx_oauth'
            `);
            
            if (indexes.length === 0) {
                console.log('Creating index on oauth columns...');
                await connection.query(`
                    CREATE INDEX idx_oauth ON users(oauth_provider, oauth_id)
                `);
                console.log('✓ Created index on oauth columns');
            } else {
                console.log('ℹ Index on oauth columns already exists');
            }
        } catch (indexError) {
            console.log('ℹ Could not create index (may already exist)');
        }

        console.log('\n✅ OAuth columns migration completed successfully!');

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
addOAuthColumns();
