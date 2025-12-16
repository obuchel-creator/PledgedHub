const db = require('../config/db');

async function addRecoveryPhone() {
    try {
        console.log('🔍 Finding superadmin account...');
        
        // Find the superadmin user
        const [users] = await db.execute(
            'SELECT id, email, phone_number, role FROM users WHERE email = ?',
            ['zigocut.tech@gmail.com']
        );

        if (users.length === 0) {
            console.log('❌ Superadmin user not found!');
            process.exit(1);
        }

        const user = users[0];
        console.log(`✅ Found user:`, user);

        // Update with recovery phone number
        const recoveryPhone = '+256701067528';
        console.log(`\n📱 Adding recovery phone: ${recoveryPhone}`);

        const [result] = await db.execute(
            'UPDATE users SET phone_number = ? WHERE id = ?',
            [recoveryPhone, user.id]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Recovery phone number added successfully!');
            
            // Verify the update
            const [updated] = await db.execute(
                'SELECT id, email, phone_number, role FROM users WHERE id = ?',
                [user.id]
            );
            
            console.log('\n✅ Updated account details:');
            console.log(updated[0]);
        } else {
            console.log('❌ Failed to update phone number');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

addRecoveryPhone();
