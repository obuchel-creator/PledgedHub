const db = require('../config/db');

async function addPhoneToPledges() {
    try {
        console.log('Adding phone and email columns to pledges table...');
        
        // Check if phone column exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'pledges' 
            AND COLUMN_NAME IN ('phone', 'email')
        `);
        
        const existingColumns = columns.map(row => row.COLUMN_NAME);
        
        // Add phone column if it doesn't exist
        if (!existingColumns.includes('phone')) {
            await db.execute(`
                ALTER TABLE pledges 
                ADD COLUMN phone VARCHAR(20) AFTER name
            `);
            console.log('✓ Phone column added successfully to pledges table');
        } else {
            console.log('ℹ Phone column already exists');
        }
        
        // Add email column if it doesn't exist
        if (!existingColumns.includes('email')) {
            await db.execute(`
                ALTER TABLE pledges 
                ADD COLUMN email VARCHAR(255) AFTER phone
            `);
            console.log('✓ Email column added successfully to pledges table');
        } else {
            console.log('ℹ Email column already exists');
        }
        
        console.log('\n✓ Migration completed successfully');
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error('✗ Error adding columns:', error.message);
        console.error(error);
        await db.close();
        process.exit(1);
    }
}

addPhoneToPledges();
