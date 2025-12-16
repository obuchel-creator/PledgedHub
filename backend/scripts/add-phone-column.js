/**
 * Migration script to add phone_number column to users table
 * Run this script: node backend/scripts/add-phone-column.js
 */

const db = require('../config/db');

async function addPhoneColumn() {
    try {
        console.log('🔧 Checking if phone_number column exists...');

        // Check if column already exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'phone_number'
        `);

        if (columns.length > 0) {
            console.log('✅ phone_number column already exists!');
            process.exit(0);
        }

        console.log('➕ Adding phone_number column to users table...');

        // Add phone_number column
        await db.execute(`
            ALTER TABLE users 
            ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL 
            COMMENT 'User phone number for SMS/WhatsApp notifications' 
            AFTER email
        `);

        console.log('✅ Successfully added phone_number column!');

        // Verify the column was added
        const [verify] = await db.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'phone_number'
        `);

        if (verify.length > 0) {
            console.log('📋 Column details:');
            console.log(verify[0]);
        }

        console.log('\n✨ Migration complete! Users can now have phone numbers for multi-channel notifications.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the migration
addPhoneColumn();
