const db = require('../config/db');

/**
 * Migration: Add user management columns
 * Adds deleted_at and role columns to users table
 */

async function runMigration() {
    console.log('🔄 Starting user management migration...\n');
    
    const pool = db.pool || db;
    
    try {
        // Check if deleted_at column exists
        console.log('Checking deleted_at column...');
        const [deletedAtCheck] = await pool.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'deleted_at'
        `);

        if (deletedAtCheck.length === 0) {
            console.log('  ➕ Adding deleted_at column...');
            await pool.execute(`
                ALTER TABLE users 
                ADD COLUMN deleted_at DATETIME DEFAULT NULL 
                COMMENT 'Timestamp when user was soft deleted'
            `);
            console.log('  ✅ deleted_at column added');
        } else {
            console.log('  ✓ deleted_at column already exists');
        }

        // Check if role column exists
        console.log('\nChecking role column...');
        const [roleCheck] = await pool.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'users' 
            AND COLUMN_NAME = 'role'
        `);

        if (roleCheck.length === 0) {
            console.log('  ➕ Adding role column...');
            await pool.execute(`
                ALTER TABLE users 
                ADD COLUMN role ENUM('user', 'admin', 'staff') DEFAULT 'user' 
                COMMENT 'User role for access control'
            `);
            console.log('  ✅ role column added');
            
            // Set existing admin user(s) to admin role if they exist
            console.log('  🔧 Setting admin role for admin@pledgehub.com...');
            await pool.execute(`
                UPDATE users 
                SET role = 'admin' 
                WHERE email = 'admin@pledgehub.com'
            `);
            console.log('  ✅ Admin role set');
        } else {
            console.log('  ✓ role column already exists');
        }

        // Add index on deleted_at for query performance
        console.log('\nAdding index on deleted_at...');
        try {
            await pool.execute(`
                CREATE INDEX idx_deleted_at ON users(deleted_at)
            `);
            console.log('  ✅ Index added on deleted_at');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('  ✓ Index already exists');
            } else {
                throw err;
            }
        }

        // Add index on role for query performance
        console.log('\nAdding index on role...');
        try {
            await pool.execute(`
                CREATE INDEX idx_role ON users(role)
            `);
            console.log('  ✅ Index added on role');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('  ✓ Index already exists');
            } else {
                throw err;
            }
        }

        console.log('\n✅ User management migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   • deleted_at column added (soft delete support)');
        console.log('   • role column added (admin/staff/user roles)');
        console.log('   • Indexes created for performance');
        console.log('   • Admin user role configured');
        
    } catch (err) {
        console.error('\n❌ Migration failed:', err.message);
        throw err;
    } finally {
        try {
            await pool.end();
        } catch (e) {
            // Ignore pool end errors
        }
    }
}

// Run migration
if (require.main === module) {
    runMigration()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Fatal error:', err);
            process.exit(1);
        });
}

module.exports = runMigration;
