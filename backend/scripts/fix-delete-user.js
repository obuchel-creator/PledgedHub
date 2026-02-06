// Quick fix script to add deleted_at column to users table
const mysql = require('mysql2/promise');

async function fixDeleteUser() {
    let connection;
    try {
        // Use hardcoded values first, fallback to env vars
        const dbConfig = {
            host: '127.0.0.1',
            user: 'root',
            password: '',
            database: 'pledgehub_db',
            port: 3306
        };
        
        console.log(`🔐 Connecting to database...`);
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Port: ${dbConfig.port}`);
        console.log(`   Database: ${dbConfig.database}`);
        console.log(`   User: ${dbConfig.user}\n`);
        
        connection = await mysql.createConnection(dbConfig);

        console.log('✅ Connected to database\n');

        // 1. Add deleted_at column if it doesn't exist
        console.log('📋 Checking deleted_at column...');
        try {
            const [result] = await connection.query(
                `ALTER TABLE users ADD COLUMN deleted_at DATETIME DEFAULT NULL COMMENT 'Timestamp when user was soft deleted'`
            );
            console.log('✅ Added deleted_at column');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  deleted_at column already exists');
            } else {
                throw err;
            }
        }

        // 2. Add index on deleted_at
        console.log('\n📋 Adding index on deleted_at...');
        try {
            await connection.query('CREATE INDEX idx_deleted_at ON users(deleted_at)');
            console.log('✅ Created index on deleted_at');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Index already exists');
            } else {
                throw err;
            }
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('\nYou can now:');
        console.log('  - Edit users (PUT /api/users/{id})');
        console.log('  - Delete users (DELETE /api/users/{id})');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixDeleteUser();
