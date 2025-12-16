/**
 * Setup Test Users
 * Creates test user accounts for login testing
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function setupTestUsers() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Setting up test users...\n');

    // Test user details
    const testUsers = [
      {
        name: 'Test User',
        username: 'testuser',
        email: 'testuser@example.com',
        password: 'testpass123',
        role: 'user'
      },
      {
        name: 'Admin User',
        username: 'admin',
        email: 'admin@pledgehub.com',
        password: 'admin123',
        role: 'admin'
      },
      {
        name: 'Staff User',
        username: 'staff',
        email: 'staff@pledgehub.com',
        password: 'staff123',
        role: 'staff'
      }
    ];

    // Create each user
    for (const user of testUsers) {
      try {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Check if user exists
        const [existing] = await connection.execute(
          'SELECT id FROM users WHERE email = ? OR username = ?',
          [user.email, user.username]
        );

        if (existing.length > 0) {
          console.log(`⏭️  User ${user.username} already exists, skipping...`);
          continue;
        }

        // Insert user
        const columns = ['name', 'username', 'email', 'password', 'created_at'];
        const values = [user.name, user.username, user.email, hashedPassword, 'NOW()'];
        const placeholders = ['?', '?', '?', '?', 'NOW()'];
        
        const sql = `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`;
        
        await connection.execute(sql, [user.name, user.username, user.email, hashedPassword]);

        console.log(`✅ Created user: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Role: ${user.role}\n`);
      } catch (userError) {
        if (userError.code === 'ER_DUP_ENTRY') {
          console.log(`⏭️  User ${user.username} already exists, skipping...`);
        } else {
          console.error(`❌ Error creating user ${user.username}:`, userError.message);
        }
      }
    }

    console.log('✅ Test users setup complete!\n');
    console.log('📋 You can now login with:\n');
    console.log('   Email: testuser@example.com');
    console.log('   Password: testpass123');
    console.log('   (or other test users above)\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Make sure MySQL is running');
    console.error('2. Check .env file has correct DB credentials');
    console.error('3. Make sure pledgehub_db database exists');
    console.error('4. Run this script from backend directory: node scripts/setup-test-users.js');
  } finally {
    await connection.release();
    await pool.end();
    process.exit(0);
  }
}

setupTestUsers();
