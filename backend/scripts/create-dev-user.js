/**
 * Create Development User Script
 * 
 * Creates a test user for development with known credentials
 * 
 * Usage: node backend/scripts/create-dev-user.js
 */

const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

// Development user credentials
const DEV_USER = {
    name: 'Dev User',
    username: 'devuser',
    phone: '+256700000000',
    email: 'dev@pledgedhub.com',
    password: 'devpass123',
    role: 'admin'
};

async function createDevUser() {
    let connection;
    
    try {
        console.log('\n🔧 Creating development user...\n');
        
        connection = await pool.getConnection();
        
        // Check if user already exists
        const [existing] = await connection.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [DEV_USER.email, DEV_USER.username]
        );
        
        if (existing.length > 0) {
            console.log('ℹ️  Development user already exists!');
            console.log(`   Email: ${DEV_USER.email}`);
            console.log(`   Username: ${DEV_USER.username}`);
            
            // Update password in case it was changed
            const hashedPassword = await bcrypt.hash(DEV_USER.password, 10);
            await connection.execute(
                'UPDATE users SET password = ?, role = ? WHERE email = ?',
                [hashedPassword, DEV_USER.role, DEV_USER.email]
            );
            console.log('✅ Password and role updated to latest values');
        } else {
            // Hash password
            const hashedPassword = await bcrypt.hash(DEV_USER.password, 10);
            
            // Create user
            const [result] = await connection.execute(
                `INSERT INTO users (name, username, phone, email, password, role, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                    DEV_USER.name,
                    DEV_USER.username,
                    DEV_USER.phone,
                    DEV_USER.email,
                    hashedPassword,
                    DEV_USER.role
                ]
            );
            
            console.log(`✅ Development user created successfully! (ID: ${result.insertId})`);
        }
        
        console.log('\n📋 Development User Credentials:');
        console.log('   ================================');
        console.log(`   Email:    ${DEV_USER.email}`);
        console.log(`   Username: ${DEV_USER.username}`);
        console.log(`   Password: ${DEV_USER.password}`);
        console.log(`   Role:     ${DEV_USER.role}`);
        console.log('   ================================\n');
        
        console.log('💡 You can now login with these credentials!');
        console.log('   Login endpoint: POST http://localhost:5001/api/auth/login');
        console.log('   Body: { "identifier": "dev@pledgedhub.com", "password": "devpass123" }\n');
        
    } catch (error) {
        console.error('❌ Error creating development user:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            connection.release();
        }
        await pool.end();
    }
}

// Run the script
createDevUser();
