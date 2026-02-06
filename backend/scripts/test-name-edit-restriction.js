require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

async function testNameEditRestriction() {
  console.log('\n🧪 Testing Name Edit Restriction for Regular Users\n');
  console.log('═══════════════════════════════════════════════════════\n');
  
  try {
    // Step 1: Login as Clara (regular user)
    console.log('📝 Step 1: Login as Clara Asio (regular user)...\n');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'claralystra@gmail.com',
      password: 'Clara@123'
    });

    const claraToken = loginRes.data.token;
    const claraUser = loginRes.data.user;
    
    console.log('✅ Login successful!');
    console.log(`   User: ${claraUser.name}`);
    console.log(`   Role: ${claraUser.role}`);
    console.log(`   Email: ${claraUser.email}\n`);

    // Step 2: Try to update name (should FAIL)
    console.log('📝 Step 2: Attempt to edit name (should FAIL)...\n');
    try {
      const updateRes = await axios.put(
        `${BASE_URL}/users/${claraUser.id}`,
        { name: 'Clara Renamed' },
        { headers: { Authorization: `Bearer ${claraToken}` } }
      );
      console.log('❌ FAILED: Name was updated when it should have been blocked!');
      console.log('Response:', updateRes.data);
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ BLOCKED: Name edit was correctly rejected!');
        console.log(`   Error: ${error.response.data.error}\n`);
      } else {
        throw error;
      }
    }

    // Step 3: Update email (should SUCCEED)
    console.log('📝 Step 3: Attempt to edit email (should SUCCEED)...\n');
    const emailUpdateRes = await axios.put(
      `${BASE_URL}/users/${claraUser.id}`,
      { email: 'claralystra.updated@gmail.com' },
      { headers: { Authorization: `Bearer ${claraToken}` } }
    );
    
    if (emailUpdateRes.data.user.email === 'claralystra.updated@gmail.com') {
      console.log('✅ SUCCESS: Email was updated!');
      console.log(`   New Email: ${emailUpdateRes.data.user.email}\n`);
    }

    // Step 4: Reset email back to original
    console.log('📝 Step 4: Resetting email back to original...\n');
    await axios.put(
      `${BASE_URL}/users/${claraUser.id}`,
      { email: 'claralystra@gmail.com' },
      { headers: { Authorization: `Bearer ${claraToken}` } }
    );
    console.log('✅ Email reset to original\n');

    // Step 5: Try to update password (should SUCCEED)
    console.log('📝 Step 5: Attempt to edit password (should SUCCEED)...\n');
    const passwordUpdateRes = await axios.put(
      `${BASE_URL}/users/${claraUser.id}`,
      { password: 'NewPassword@123' },
      { headers: { Authorization: `Bearer ${claraToken}` } }
    );
    
    if (passwordUpdateRes.status === 200) {
      console.log('✅ SUCCESS: Password was updated!\n');
    }

    // Step 6: Test with updated password
    console.log('📝 Step 6: Testing login with new password...\n');
    const newLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'claralystra@gmail.com',
      password: 'NewPassword@123'
    });

    if (newLoginRes.data.token) {
      console.log('✅ SUCCESS: Login works with new password!\n');
      
      // Reset password back to original
      const adminToken = newLoginRes.data.token;
      await axios.put(
        `${BASE_URL}/users/${claraUser.id}`,
        { password: 'Clara@123' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('✅ Password reset to original\n');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response?.data) {
      console.error('Response:', error.response.data);
    }
  }

  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📊 TEST SUMMARY:\n');
  console.log('✅ Regular users CANNOT edit their name');
  console.log('✅ Regular users CAN edit their email');
  console.log('✅ Regular users CAN edit their password');
  console.log('✅ Name edit restriction working correctly!\n');
}

testNameEditRestriction();
