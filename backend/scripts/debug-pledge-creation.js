const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api';

(async () => {
  let token = null;
  let userId = null;
  let userName = null;

  // Register
  console.log('\n1️⃣  Registering test user...');
  try {
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Debug Test User',
      username: 'debugtest',
      phone: '+256777111222',
      email: 'debugtest.pledge@example.com',
      password: 'DebugTest123!@#'
    });
    console.log('✓ Registered');
  } catch (err) {
    if (err.response?.status === 409) {
      console.log('✓ User already exists (that\'s OK)');
    } else {
      console.log('✗ Registration error:', err.response?.data?.error || err.message);
    }
  }

  // Login
  console.log('\n2️⃣  Logging in...');
  const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
    email: 'debugtest.pledge@example.com',
    password: 'DebugTest123!@#'
  });

  token = loginRes.data.token;
  userId = loginRes.data.user.id;
  userName = loginRes.data.user.name;
  
  console.log(`✓ Logged in as: ${userName} (ID: ${userId})`);
  console.log(`  Tenant ID in response: ${loginRes.data.user.tenant_id}`);

  // Set tenant_id and re-login if needed
  if (!loginRes.data.user.tenant_id) {
    console.log('\n3️⃣  Setting tenant_id...');
    const mysql = require('mysql2/promise');
    require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
    
    await pool.execute('UPDATE users SET tenant_id = ? WHERE id = ?', [userId, userId]);
    pool.end();
    console.log(`✓ tenant_id set to ${userId}`);

    // Re-login
    console.log('\n4️⃣  Re-logging in to refresh JWT...');
    const reloginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'debugtest.pledge@example.com',
      password: 'DebugTest123!@#'
    });
    token = reloginRes.data.token;
    console.log(`✓ Re-logged in`);
    console.log(`  Tenant ID in new response: ${reloginRes.data.user.tenant_id}`);
  }

  // Create pledge
  console.log('\n5️⃣  Creating pledge...');
  try {
    const pledgeRes = await axios.post(`${BASE_URL}/pledges`, {
      donor_name: userName,
      donor_email: 'test@example.com',
      donor_phone: '+256700999888',
      amount: 100000,
      purpose: 'Debug test',
      collection_date: new Date().toISOString().split('T')[0],
      date: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✓ Pledge created successfully!');
    console.log(`  ID: ${pledgeRes.data.pledge.id}`);
    console.log(`  Name: ${pledgeRes.data.pledge.donor_name}`);
    console.log(`  Amount: ${pledgeRes.data.pledge.amount}`);
  } catch (err) {
    console.log('✗ Pledge creation failed');
    console.log(`  Status: ${err.response?.status}`);
    console.log(`  Error: ${err.response?.data?.error}`);
    console.log(`  Details: ${JSON.stringify(err.response?.data?.details)}`);
  }
})();
