#!/usr/bin/env node

/**
 * QR Analytics Endpoint Test Script
 * Run: node backend/scripts/test-qr-analytics.js
 */

const axios = require('axios');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const BASE_URL = 'http://localhost:5001/api';
const timestamp = Date.now();
const TEST_USER = {
  name: 'QR Analytics Tester',
  username: `qrtester_${timestamp}`,
  phone: `+25677${String(timestamp).slice(-7)}`,
  email: `qrtester_${timestamp}@example.com`,
  password: 'TestPass123!@#'
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m'
};

let passed = 0;
let failed = 0;

const logPass = (msg) => {
  console.log(`${colors.green}✓ ${msg}${colors.reset}`);
  passed++;
};

const logFail = (msg, err) => {
  console.log(`${colors.red}✗ ${msg}${colors.reset}`);
  if (err) console.log(`${colors.red}  ${err}${colors.reset}`);
  failed++;
};

const logWarn = (msg, err) => {
  console.log(`${colors.yellow}! ${msg}${colors.reset}`);
  if (err) console.log(`${colors.yellow}  ${err}${colors.reset}`);
};

async function run() {
  console.log('🧪 QR Analytics Endpoint Tests');

  let token;
  try {
    try {
      await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
      logPass('Registered test user');
    } catch (regErr) {
      const regMessage = regErr.response?.data?.error || regErr.message;
      if (regMessage && regMessage.toLowerCase().includes('already')) {
        logPass('Test user already exists');
      } else {
        logFail('Registered test user', regMessage);
      }
    }

    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    token = loginRes.data.token;
    logPass('Authenticated test user');
  } catch (err) {
    logFail('Authenticated test user', err.response?.data?.error || err.message);
    process.exit(1);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  // Fetch a pledge ID for active QR codes (best effort)
  let pledgeId = null;
  try {
    const pledgesRes = await axios.get(`${BASE_URL}/pledges`, authHeaders);
    const pledges = pledgesRes.data?.data || pledgesRes.data?.pledges || pledgesRes.data || [];
    if (Array.isArray(pledges) && pledges.length > 0) {
      pledgeId = pledges[0].id;
      logPass('Loaded pledges for QR analytics test');
    } else {
      logWarn('Loaded pledges for QR analytics test', 'No pledges found');
    }
  } catch (err) {
    logWarn('Loaded pledges for QR analytics test', err.response?.data?.error || err.message);
  }

  // Test dashboard stats
  try {
    const statsRes = await axios.get(`${BASE_URL}/qr/dashboard`, authHeaders);
    if (statsRes.data?.success) {
      logPass('GET /qr/dashboard');
    } else {
      logFail('GET /qr/dashboard', statsRes.data?.error || 'Unexpected response');
    }
  } catch (err) {
    logFail('GET /qr/dashboard', err.response?.data?.error || err.message);
  }

  // Test analytics breakdown
  try {
    const analyticsRes = await axios.get(`${BASE_URL}/qr/analytics`, authHeaders);
    if (analyticsRes.data?.success) {
      logPass('GET /qr/analytics');
    } else {
      logFail('GET /qr/analytics', analyticsRes.data?.error || 'Unexpected response');
    }
  } catch (err) {
    logFail('GET /qr/analytics', err.response?.data?.error || err.message);
  }

  // Test active QR codes endpoint if pledgeId is available
  if (pledgeId) {
    try {
      const activeRes = await axios.get(`${BASE_URL}/qr/pledges/${pledgeId}/active`, authHeaders);
      if (activeRes.data?.success) {
        logPass('GET /qr/pledges/:pledgeId/active');
      } else {
        logFail('GET /qr/pledges/:pledgeId/active', activeRes.data?.error || 'Unexpected response');
      }
    } catch (err) {
      logFail('GET /qr/pledges/:pledgeId/active', err.response?.data?.error || err.message);
    }
  }

  console.log(`\nPassed: ${passed} | Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
