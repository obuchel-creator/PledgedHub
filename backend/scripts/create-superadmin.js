/**
 * Helper script to create a superadmin user or promote existing admin to superadmin
 * Run this script: node backend/scripts/create-superadmin.js
 */

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function createSuperAdmin() {
    try {
        console.log('\n⚡ Super Admin Management Tool\n');
        console.log('Choose an option:');
        console.log('1. Create new superadmin user');
        console.log('2. Promote existing user to superadmin');
        console.log('3. List all superadmins');
        console.log('4. Exit\n');

        const choice = await question('Enter your choice (1-4): ');

        switch (choice.trim()) {
            case '1':
                await createNewSuperAdmin();
                break;
            case '2':
                await promoteToSuperAdmin();
                break;
            case '3':
                await listSuperAdmins();
                break;
            case '4':
                console.log('👋 Goodbye!');
                process.exit(0);
            default:
                console.log('❌ Invalid choice. Please run the script again.');
                process.exit(1);
        }

        rl.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        rl.close();
        process.exit(1);
    }
}

async function createNewSuperAdmin() {
    console.log('\n📝 Create New Super Admin\n');

    const name = await question('Enter name: ');
    const email = await question('Enter email: ');
    const password = await question('Enter password (min 8 chars): ');

    if (!name || !email || !password) {
        console.log('❌ All fields are required!');
        return;
    }

    if (password.length < 8) {
        console.log('❌ Password must be at least 8 characters!');
        return;
    }

    // Check if email already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        console.log('❌ Email already exists!');
        return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create superadmin user
    await db.execute(
        'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, 'superadmin']
    );

    console.log('\n✅ Super Admin created successfully!');
    console.log(`📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`⚡ Role: superadmin`);
}

async function promoteToSuperAdmin() {
    console.log('\n⬆️  Promote User to Super Admin\n');

    // List all admins
    const [admins] = await db.execute(
        'SELECT id, username, email, role FROM users WHERE role IN ("admin", "staff", "donor") AND deleted_at IS NULL ORDER BY role, email'
    );

    if (admins.length === 0) {
        console.log('❌ No users found to promote!');
        return;
    }

    console.log('Available users:\n');
    admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.email} (${admin.username || 'No name'}) - Role: ${admin.role}`);
    });

    const choice = await question('\nEnter user number to promote: ');
    const index = parseInt(choice) - 1;

    if (index < 0 || index >= admins.length) {
        console.log('❌ Invalid selection!');
        return;
    }

    const selectedUser = admins[index];

    // Confirm promotion
    const confirm = await question(`\n⚠️  Promote ${selectedUser.email} to superadmin? (yes/no): `);
    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Promotion cancelled.');
        return;
    }

    // Update user role
    await db.execute('UPDATE users SET role = ? WHERE id = ?', ['superadmin', selectedUser.id]);

    console.log('\n✅ User promoted to Super Admin successfully!');
    console.log(`📧 Email: ${selectedUser.email}`);
    console.log(`👤 Name: ${selectedUser.username}`);
    console.log(`⚡ New Role: superadmin`);
}

async function listSuperAdmins() {
    console.log('\n⚡ Current Super Admins\n');

    const [superadmins] = await db.execute(
        'SELECT id, username, email, created_at FROM users WHERE role = "superadmin" AND deleted_at IS NULL ORDER BY created_at'
    );

    if (superadmins.length === 0) {
        console.log('❌ No superadmins found!');
        console.log('💡 You should create at least one superadmin user.');
        return;
    }

    superadmins.forEach((sa, index) => {
        const createdAt = new Date(sa.created_at).toLocaleString();
        console.log(`${index + 1}. ${sa.email}`);
        console.log(`   Name: ${sa.username || 'No name'}`);
        console.log(`   Created: ${createdAt}`);
        console.log('');
    });

    console.log(`Total superadmins: ${superadmins.length}`);
}

// Run the tool
createSuperAdmin();
