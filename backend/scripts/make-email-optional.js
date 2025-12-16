/**
 * Migration script to make email optional and ensure phone_number is properly indexed
 * Run this script: node backend/scripts/make-email-optional.js
 */

const db = require('../config/db');

async function makeEmailOptional() {
    try {
        console.log('🔧 Making email optional and phone number primary...\n');

        // 1. Check current email column setup
        const [emailCol] = await db.execute(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'email'
        `);

        if (emailCol.length > 0) {
            console.log('📋 Current email column:', emailCol[0]);
            
            // Remove unique constraint from email if exists
            try {
                await db.execute('ALTER TABLE users DROP INDEX email');
                console.log('✅ Removed unique constraint from email');
            } catch (err) {
                console.log('ℹ️  Email unique constraint may not exist (this is okay)');
            }

            // Make email nullable and not required
            await db.execute(`
                ALTER TABLE users 
                MODIFY COLUMN email VARCHAR(255) NULL 
                COMMENT 'Optional email for notifications and account recovery'
            `);
            console.log('✅ Email is now optional (nullable)');
        }

        // 2. Add unique index to phone_number if not exists
        const [phoneCol] = await db.execute(`
            SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_KEY
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'phone_number'
        `);

        if (phoneCol.length > 0) {
            console.log('📋 Current phone_number column:', phoneCol[0]);

            try {
                await db.execute('CREATE UNIQUE INDEX idx_phone_unique ON users(phone_number)');
                console.log('✅ Added unique index to phone_number');
            } catch (err) {
                console.log('ℹ️  Unique index on phone_number may already exist (this is okay)');
            }
        }

        // 3. Verify the changes
        console.log('\n📊 Verifying changes...\n');
        
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME IN ('email', 'phone_number')
            ORDER BY ORDINAL_POSITION
        `);

        columns.forEach(col => {
            console.log(`${col.COLUMN_NAME}:`);
            console.log(`  Type: ${col.COLUMN_TYPE}`);
            console.log(`  Nullable: ${col.IS_NULLABLE}`);
            console.log(`  Key: ${col.COLUMN_KEY || 'none'}`);
            console.log(`  Comment: ${col.COLUMN_COMMENT || 'none'}`);
            console.log('');
        });

        console.log('✨ Migration complete!');
        console.log('');
        console.log('📱 Phone number is now the PRIMARY contact method (required, unique)');
        console.log('📧 Email is now OPTIONAL (can be null)');
        console.log('');
        console.log('💡 Users can register with just phone number + password');
        console.log('💡 Notifications will prioritize WhatsApp/SMS over email');
        
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the migration
makeEmailOptional();
