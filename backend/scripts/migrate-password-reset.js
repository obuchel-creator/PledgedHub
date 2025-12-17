const db = require('../config/db');

async function migrate() {
    try {
        console.log('Running password reset migration...');
        
        // Check if columns already exist
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'pledgehub_db' 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('password_reset_token', 'password_reset_expires')
        `);
        
        const existingColumns = columns.map(col => col.COLUMN_NAME);
        
        if (existingColumns.length === 2) {
            console.log('✓ Migration already complete - columns already exist!');
            process.exit(0);
            return;
        }
        
        // Add password_reset_token column if not exists
        if (!existingColumns.includes('password_reset_token')) {
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN password_reset_token VARCHAR(255)
            `);
            console.log('✓ Added password_reset_token column');
        }
        
        // Add password_reset_expires column if not exists
        if (!existingColumns.includes('password_reset_expires')) {
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN password_reset_expires BIGINT
            `);
            console.log('✓ Added password_reset_expires column');
        }
        
        console.log('✓ Migration completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
