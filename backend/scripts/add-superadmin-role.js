/**
 * Migration script to add superadmin role to users table
 * Run this script: node backend/scripts/add-superadmin-role.js
 */

const db = require('../config/db');

async function addSuperadminRole() {
    try {
        console.log('🔧 Checking current role enum values...');

        // Check current enum values
        const [columns] = await db.execute(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        `);

        if (columns.length === 0) {
            console.log('❌ Role column not found!');
            process.exit(1);
        }

        const currentEnum = columns[0].COLUMN_TYPE;
        console.log('📋 Current role enum:', currentEnum);

        // Check if superadmin already exists
        if (currentEnum.includes('superadmin')) {
            console.log('✅ superadmin role already exists in enum!');
            process.exit(0);
        }

        console.log('➕ Adding superadmin to role enum...');

        // Modify the enum to add superadmin (must list ALL values)
        await db.execute(`
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('superadmin', 'admin', 'staff', 'donor') 
            DEFAULT 'donor'
            COMMENT 'User role: superadmin (full control), admin (manage users), staff (extended access), donor (make pledges)'
        `);

        console.log('✅ Successfully added superadmin role!');

        // Verify the change
        const [verify] = await db.execute(`
            SELECT COLUMN_TYPE, COLUMN_DEFAULT, COLUMN_COMMENT
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        `);

        if (verify.length > 0) {
            console.log('📋 Updated column details:');
            console.log(verify[0]);
        }

        console.log('\n✨ Migration complete! You can now assign superadmin role to users.');
        console.log('💡 Superadmin can manage admins and all other users.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run the migration
addSuperadminRole();
