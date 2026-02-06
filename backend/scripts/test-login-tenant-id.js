/**
 * Test login and verify JWT includes tenant_id
 */

require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5001/api';

async function testLogin() {
    console.log('\n🔐 Testing Login with Tenant ID Fix\n');
    console.log('='.repeat(60));
    
    // Use your actual email
    const email = 'zigocut.tech@gmail.com';
    
    try {
        console.log(`\n1️⃣  Attempting login for: ${email}`);
        
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: email,
            password: process.env.TEST_PASSWORD || 'your_password_here' // Update this
        });
        
        if (response.data.success) {
            console.log('✅ Login successful!');
            
            // Decode JWT to see payload
            const token = response.data.token;
            const decoded = jwt.decode(token);
            
            console.log('\n2️⃣  JWT Token Payload:');
            console.log('   User ID:', decoded.id);
            console.log('   Role:', decoded.role);
            console.log('   Email:', decoded.email);
            console.log('   Tenant ID:', decoded.tenant_id);
            console.log('   Name:', decoded.name);
            
            console.log('\n3️⃣  User Object from Response:');
            console.log('   ID:', response.data.user.id);
            console.log('   Name:', response.data.user.name);
            console.log('   Email:', response.data.user.email);
            console.log('   Tenant ID:', response.data.user.tenant_id);
            
            if (decoded.tenant_id) {
                console.log('\n✅ SUCCESS: tenant_id is present in JWT!');
                console.log('   You should now be able to create pledges.');
            } else {
                console.log('\n❌ ERROR: tenant_id is missing from JWT!');
                console.log('   Please check the login controller code.');
            }
            
        } else {
            console.log('❌ Login failed:', response.data.message);
        }
        
    } catch (error) {
        if (error.response) {
            console.log('❌ Login error:', error.response.data.message || error.response.data);
        } else {
            console.log('❌ Connection error:', error.message);
        }
    }
    
    console.log('\n' + '='.repeat(60));
}

// Run test
testLogin().then(() => {
    console.log('\n✓ Test completed\n');
    process.exit(0);
}).catch(err => {
    console.error('\n✗ Test failed:', err.message);
    process.exit(1);
});
