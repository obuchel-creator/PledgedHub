const db = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function addUserRoles() {
    console.log('🔐 Adding user roles to support admin access control...\n');

    try {
        // Add role column to users table
        const addRoleSQL = `
            ALTER TABLE users 
            ADD COLUMN role ENUM('admin', 'staff', 'donor') DEFAULT 'donor' 
            AFTER email_verified
        `;

        try {
            await db.execute(addRoleSQL);
            console.log('✅ Added role column to users table');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️  Role column already exists');
            } else {
                throw err;
            }
        }

        // Check if username column exists, if not add email column
        const [columns] = await db.execute('SHOW COLUMNS FROM users LIKE "email"');
        if (columns.length === 0) {
            console.log('ℹ️  Adding email column for authentication...');
            await db.execute(`
                ALTER TABLE users 
                ADD COLUMN email VARCHAR(255) UNIQUE AFTER username,
                ADD COLUMN password_hash VARCHAR(255) AFTER email,
                ADD COLUMN name VARCHAR(255) AFTER password_hash
            `);
            console.log('✅ Added email, password_hash, and name columns');
        }

        // Check if admin user exists
        const [existingAdmins] = await db.execute(
            'SELECT id FROM users WHERE role = ? LIMIT 1',
            ['admin']
        );

        if (existingAdmins.length === 0) {
            const hashedPassword = await bcrypt.hash('Admin@2024', 10);

            await db.execute(`
                INSERT INTO users (username, email, password_hash, name, role, email_verified, created_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [
                'admin',
                'admin@pledgehub.com',
                hashedPassword,
                'System Administrator',
                'admin',
                1
            ]);

            console.log('✅ Created default admin user');
            console.log('\n📧 Admin Credentials:');
            console.log('   Email: admin@pledgehub.com');
            console.log('   Password: Admin@2024');
            console.log('   ⚠️  CHANGE THIS PASSWORD IMMEDIATELY AFTER FIRST LOGIN\n');
        } else {
            console.log('ℹ️  Admin user already exists');
        }

        // Add index for faster role lookups
        try {
            await db.execute('CREATE INDEX idx_user_role ON users(role)');
            console.log('✅ Added role index');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('ℹ️  Role index already exists');
            } else {
                throw err;
            }
        }

        console.log('\n✨ User roles setup complete!');
        console.log('\n📋 Next steps:');
        console.log('1. Login with admin credentials at /login');
        console.log('2. Change the default password immediately');
        console.log('3. Admin users can access /admin dashboard');
        console.log('4. Staff users can create pledges but not campaigns');
        console.log('5. Donor users can only view their own pledges\n');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await db.close();
    }
}

addUserRoles()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
