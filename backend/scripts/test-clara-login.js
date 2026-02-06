require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testClaraLogin() {
  console.log('\n🧪 Testing Clara Asio Login...\n');
  
  try {
    console.log('📧 Email: claralystra@gmail.com');
    console.log('🔑 Password: Clara@123');
    console.log('\n⏳ Attempting login...\n');

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'claralystra@gmail.com',
      password: 'Clara@123'
    });

    if (response.data && response.data.token) {
      console.log('✅ LOGIN SUCCESSFUL!\n');
      console.log('📋 User Information:');
      console.log(`   ID: ${response.data.user.id}`);
      console.log(`   Name: ${response.data.user.name}`);
      console.log(`   Email: ${response.data.user.email}`);
      console.log(`   Username: ${response.data.user.username}`);
      console.log(`   Phone: ${response.data.user.phone}`);
      console.log(`   Role: ${response.data.user.role}`);
      console.log(`\n🎯 Token: ${response.data.token.substring(0, 50)}...`);
      console.log('\n✅ Clara can now log in to the application!\n');
    } else {
      console.log('❌ Unexpected response:', response.data);
    }

  } catch (error) {
    console.error('❌ Login failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data.error || error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testClaraLogin();
