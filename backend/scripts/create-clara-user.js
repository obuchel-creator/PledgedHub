require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function createClaraUser() {
  console.log('\n🔐 Creating Clara Asio user...\n');
  
  try {
    // Check if user already exists
    const [existingUsers] = await pool.execute(
      'SELECT id, email, deleted FROM users WHERE email = ?',
      ['claralystra@gmail.com']
    );

    if (existingUsers.length > 0) {
      const user = existingUsers[0];
      console.log('⚠️  User already exists:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: claralystra@gmail.com`);
      console.log(`   Deleted: ${user.deleted}`);

      if (user.deleted === 1 || user.deleted === null) {
        console.log('\n🔧 Restoring user (setting deleted = 0)...');
        await pool.execute(
          'UPDATE users SET deleted = 0, deleted_at = NULL WHERE id = ?',
          [user.id]
        );
        console.log('✅ User restored!');
      } else {
        console.log('\n✅ User is already active and valid!');
      }

      // Update password to ensure it's correct
      console.log('\n🔄 Updating password...');
      const hashedPassword = await bcrypt.hash('Clara@123', 10);
      await pool.execute(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      console.log('✅ Password updated!');

    } else {
      // Create new user
      console.log('📝 Creating new user...\n');
      const hashedPassword = await bcrypt.hash('Clara@123', 10);

      const [result] = await pool.execute(
        `INSERT INTO users (name, email, username, phone, password, role, deleted, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          'Clara Asio',
          'claralystra@gmail.com',
          'claralystra',
          '+256700000000',
          hashedPassword,
          'user',
          0
        ]
      );

      console.log('✅ User created successfully!\n');
      console.log('📋 User Details:');
      console.log(`   ID: ${result.insertId}`);
      console.log(`   Name: Clara Asio`);
      console.log(`   Email: claralystra@gmail.com`);
      console.log(`   Username: claralystra`);
      console.log(`   Phone: +256700000000`);
      console.log(`   Role: user`);
      console.log(`   Status: Active`);
    }

    console.log('\n🔑 Login Credentials:');
    console.log('   Email: claralystra@gmail.com');
    console.log('   Password: Clara@123');
    console.log('\n✅ Ready to login!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.sqlMessage) {
      console.error('SQL Error:', error.sqlMessage);
    }
  } finally {
    await pool.end();
  }
}

createClaraUser();
