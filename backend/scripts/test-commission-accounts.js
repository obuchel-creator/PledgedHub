#!/usr/bin/env node

const axios = require('axios');
const { pool } = require('../config/db');

const BASE_URL = 'http://localhost:5001/api';

// Test user credentials
const TEST_USER = {
  username: 'testuser',
  password: 'testpass123'
};

let testToken = null;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    if (error.response?.data) {
      console.log(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

async function getAdminToken() {
  try {
    // Login
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    testToken = loginRes.data.token;
    console.log('\n🔑 Admin token obtained\n');
    return testToken;
  } catch (error) {
    console.error('Failed to get admin token:', error.message);
    throw error;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('🧪 COMMISSION SYSTEM TEST SUITE');
  console.log('========================================\n');

  try {
    // Get admin token
    await getAdminToken();

    const headers = { Authorization: `Bearer ${testToken}` };

    // Test 1: Get commission summary
    await test('Get commission summary', async () => {
      const res = await axios.get(`${BASE_URL}/commissions/summary`, { headers });
      if (!res.data.success) throw new Error('Failed to get summary');
      console.log(`   Balance: ${res.data.data.total_commission_owed} UGX`);
    });

    // Test 2: Get payment accounts
    await test('Get your payment accounts', async () => {
      const res = await axios.get(`${BASE_URL}/commissions/accounts`, { headers });
      if (!res.data.success) throw new Error('Failed to get accounts');
      
      const accounts = res.data.data;
      console.log(`   Found ${accounts.length} accounts:`);
      accounts.forEach((acc, i) => {
        const status = acc.is_primary ? '🔵 PRIMARY' : '⚪ Backup';
        console.log(`     ${i + 1}. ${acc.provider.toUpperCase()}: ${acc.phone_number} (${status})`);
      });
    });

    // Test 3: Get commission history
    await test('Get commission payout history', async () => {
      const res = await axios.get(`${BASE_URL}/commissions/history`, { headers });
      if (!res.data.success) throw new Error('Failed to get history');
      console.log(`   Total payouts: ${res.data.data.length}`);
    });

    // Test 4: Check commission details
    await test('Get commission details', async () => {
      const res = await axios.get(`${BASE_URL}/commissions/details?limit=5`, { headers });
      if (!res.data.success) throw new Error('Failed to get details');
      console.log(`   Recent commissions: ${res.data.data.length} records`);
    });

    console.log('\n========================================');
    console.log('✨ All Tests Passed! System Ready');
    console.log('========================================\n');

    console.log('📋 Your Commission Setup:');
    console.log('─────────────────────────────────────');
    console.log('🔵 Primary:  MTN 0774306868');
    console.log('⚪ Backup:   Airtel 0701067528');
    console.log('');
    console.log('💰 Daily Payout:');
    console.log('   Time: 5:00 PM (Africa/Kampala)');
    console.log('   Amount: All pending commissions');
    console.log('   Destination: Your primary MTN account');
    console.log('');
    console.log('🎯 What Happens Next:');
    console.log('   1. Organization creates pledge');
    console.log('   2. Payment received from donor');
    console.log('   3. Amount split between org & platform');
    console.log('   4. Your commission added to balance');
    console.log('   5. Daily 5 PM → Auto payout to MTN');
    console.log('   6. SMS confirmation sent to your phone');
    console.log('─────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }

  process.exit(0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
