const { pool } = require('../config/db');

async function addTwoFactorColumns() {
    try {
        console.log('Adding two-factor authentication columns to users table...');
        
        // Check if columns already exist
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('two_factor_enabled', 'two_factor_secret')
        `);
        
        const existingColumns = columns.map(c => c.COLUMN_NAME);
        
        if (!existingColumns.includes('two_factor_enabled')) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0 AFTER email_verified
            `);
            console.log('✓ Added two_factor_enabled column');
        } else {
            console.log('✓ two_factor_enabled column already exists');
        }
        
        if (!existingColumns.includes('two_factor_secret')) {
            await pool.query(`
                ALTER TABLE users 
                ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL AFTER two_factor_enabled
            `);
            console.log('✓ Added two_factor_secret column');
        } else {
            console.log('✓ two_factor_secret column already exists');
        }
        
        console.log('✓ Two-factor authentication setup complete');
        process.exit(0);
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addTwoFactorColumns();
