const { pool } = require('../config/db');

async function addResetTokenColumns() {
    try {
        console.log('🔧 Adding password reset token columns...');

        // Check if columns already exist
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('reset_token', 'reset_token_expiry')
        `);

        const existingColumns = columns.map(col => col.COLUMN_NAME);

        // Add reset_token column if it doesn't exist
        if (!existingColumns.includes('reset_token')) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL 
                COMMENT 'Hashed password reset token'
            `);
            console.log('✅ Added reset_token column');
        } else {
            console.log('ℹ️  reset_token column already exists');
        }

        // Add reset_token_expiry column if it doesn't exist
        if (!existingColumns.includes('reset_token_expiry')) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL 
                COMMENT 'Reset token expiration timestamp'
            `);
            console.log('✅ Added reset_token_expiry column');
        } else {
            console.log('ℹ️  reset_token_expiry column already exists');
        }

        // Add index for faster lookups
        const [indexes] = await pool.query(`
            SHOW INDEXES FROM users WHERE Key_name = 'idx_reset_token'
        `);

        if (indexes.length === 0) {
            await pool.query(`
                CREATE INDEX idx_reset_token 
                ON users(reset_token, reset_token_expiry)
            `);
            console.log('✅ Added index for reset token lookups');
        } else {
            console.log('ℹ️  Reset token index already exists');
        }

        console.log('✅ Password reset columns migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

addResetTokenColumns();
