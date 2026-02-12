#!/usr/bin/env node

/**
 * QR Code Payment System Test Script
 * Tests all QR code functionality including generation, validation, and decoding
 * 
 * Run: node backend/scripts/test-qr-payment.js
 */

const axios = require('axios');
const qrCodeService = require('../services/qrCodeService');
const { pool } = require('../config/db');

const BASE_URL = 'http://localhost:5001/api';
let testToken = '';
let testPledgeId = 1;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m'
};

let passed = 0;
let failed = 0;

/**
 * Test utilities
 */
const test = async (name, fn) => {
  try {
    process.stdout.write(`  ✓ ${name} ... `);
    await fn();
    console.log(`${colors.green}PASS${colors.reset}`);
    passed++;
  } catch (error) {
    console.log(`${colors.red}FAIL${colors.reset}`);
    console.log(`    ${colors.red}Error: ${error.message}${colors.reset}`);
    failed++;
  }
};

/**
 * Local service tests (no server required)
 */
const testLocalServices = async () => {
  console.log(`\n${colors.bold}${colors.blue}Testing Local QR Code Service${colors.reset}`);
  console.log('═'.repeat(50));

  // Test 1: Generate MTN QR Code
  await test('Generate MTN QR Code', async () => {
    const result = await qrCodeService.generateMTNQRCode({
      pledgeId: 1,
      amount: 50000,
      donorName: 'Test Donor',
      saveToDatabase: false
    });
    if (!result.success) throw new Error(result.error);
    if (!result.qrCode) throw new Error('QR code not generated');
    if (result.provider !== 'mtn') throw new Error('Provider mismatch');
  });

  // Test 2: Generate Airtel QR Code
  await test('Generate Airtel QR Code', async () => {
    const result = await qrCodeService.generateAirtelQRCode({
      pledgeId: 1,
      amount: 50000,
      donorName: 'Test Donor',
      saveToDatabase: false
    });
    if (!result.success) throw new Error(result.error);
    if (!result.qrCode) throw new Error('QR code not generated');
    if (result.provider !== 'airtel') throw new Error('Provider mismatch');
  });

  // Test 3: Auto-detect and generate QR Code
  await test('Auto-detect provider and generate QR', async () => {
    const result = await qrCodeService.generatePaymentQRCode({
      pledgeId: 1,
      amount: 50000,
      phoneNumber: '256700000000', // Airtel prefix
      donorName: 'Test Donor',
      saveToDatabase: false
    });
    if (!result.success) throw new Error(result.error);
    if (result.provider !== 'airtel') throw new Error('Provider auto-detection failed');
  });

  // Test 4: Generate USSD Code for MTN
  await test('Generate MTN USSD Code', async () => {
    const ussd = qrCodeService.generateUSSDCode('mtn', 50000, 1);
    if (!ussd.code) throw new Error('USSD code not generated');
    if (ussd.code !== '*165#') throw new Error('MTN code incorrect');
    if (!ussd.manualSteps || ussd.manualSteps.length === 0) throw new Error('Steps not provided');
  });

  // Test 5: Generate USSD Code for Airtel
  await test('Generate Airtel USSD Code', async () => {
    const ussd = qrCodeService.generateUSSDCode('airtel', 50000, 1);
    if (!ussd.code) throw new Error('USSD code not generated');
    if (ussd.code !== '*185#') throw new Error('Airtel code incorrect');
  });

  // Test 6: Decode Payment Data
  await test('Decode Payment Data', async () => {
    const result = await qrCodeService.generateMTNQRCode({
      pledgeId: 123,
      amount: 75000,
      saveToDatabase: false
    });
    
    // Get the payment link from result
    const paymentLink = result.paymentLink;
    
    // Decode it
    const decoded = qrCodeService.decodePaymentData(paymentLink);
    if (!decoded.success) throw new Error(decoded.error);
    if (decoded.data.pledgeId !== 123) throw new Error('Pledge ID mismatch');
    if (decoded.data.amount !== 75000) throw new Error('Amount mismatch');
    if (decoded.data.provider !== 'mtn') throw new Error('Provider mismatch in decode');
  });

  // Test 7: QR Code Format Validation
  await test('Validate QR Code Format', async () => {
    const result = await qrCodeService.generateMTNQRCode({
      pledgeId: 1,
      amount: 50000,
      saveToDatabase: false
    });
    if (!Buffer.isBuffer(result.qrCode)) throw new Error('QR code is not a buffer');
    if (result.format !== 'png') throw new Error('Format should be png');
  });

  // Test 8: Missing Required Fields
  await test('Validate Required Fields', async () => {
    const result = await qrCodeService.generateMTNQRCode({
      // Missing pledgeId and amount
    });
    if (result.success) throw new Error('Should fail without required fields');
  });
};

/**
 * API endpoint tests (requires running server)
 */
const testAPIEndpoints = async () => {
  console.log(`\n${colors.bold}${colors.blue}Testing API Endpoints${colors.reset}`);
  console.log('═'.repeat(50));

  try {
    // Helper function to get auth token
    const getAuthToken = async () => {
      try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'testuser@example.com',
            password: 'Testpass123!'
        });
        return response.data.token || response.data.data?.token;
      } catch (error) {
        // If login fails, try registration first
        console.log('\n  ℹ Registering test user...');
        try {
          await axios.post(`${BASE_URL}/register`, {
            name: 'Test User',
            email: 'testuser@example.com',
            username: 'testuser',
            password: 'Testpass123!',
            phone: '+256771234567'
          });
          const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'testuser@example.com',
            password: 'Testpass123!'
          });
          return loginRes.data.token || loginRes.data.data?.token;
        } catch (regError) {
          throw new Error('Could not authenticate. Make sure server is running.');
        }
      }
    };

    // Get auth token
    console.log('\n  Getting authentication token...');
    testToken = await getAuthToken();
    if (!testToken) throw new Error('Could not obtain auth token');
    console.log(`  ✓ Auth token obtained`);

    // Find an existing pledge ID for QR API tests
    const [pledgeRows] = await pool.execute(
      'SELECT id FROM pledges WHERE deleted = 0 ORDER BY id DESC LIMIT 1'
    );
    if (!pledgeRows || pledgeRows.length === 0) {
      console.log(`\n  ${colors.yellow}⚠ No pledges found. Skipping QR API tests.${colors.reset}`);
      return;
    }
    testPledgeId = pledgeRows[0].id;

    // Test 1: Generate MTN QR via API
    await test('API: Generate MTN QR Code', async () => {
      const response = await axios.post(`${BASE_URL}/qr/mtn`, {
        pledgeId: testPledgeId,
        amount: 50000,
        donorName: 'Test Donor'
      }, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      if (!response.data.success) throw new Error(response.data.message);
      if (!response.data.data.qrCode) throw new Error('QR code not returned');
    });

    // Test 2: Generate Airtel QR via API
    await test('API: Generate Airtel QR Code', async () => {
      const response = await axios.post(`${BASE_URL}/qr/airtel`, {
        pledgeId: testPledgeId,
        amount: 50000,
        donorName: 'Test Donor'
      }, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });
      if (!response.data.success) throw new Error(response.data.message);
      if (!response.data.data.qrCode) throw new Error('QR code not returned');
    });

    // Test 3: Get QR Code Image
    await test('API: Stream QR Code Image', async () => {
      const response = await axios.get(`${BASE_URL}/qr/image`, {
        params: {
          provider: 'mtn',
          pledgeId: testPledgeId,
          amount: 50000
        },
        responseType: 'arraybuffer'
      });
      if (response.status !== 200) throw new Error('Image not returned');
      if (!Buffer.isBuffer(response.data)) throw new Error('Response is not a buffer');
    });

    // Test 4: Get USSD Instructions
    await test('API: Get USSD Instructions', async () => {
      const response = await axios.get(`${BASE_URL}/qr/ussd`, {
        params: {
          provider: 'mtn',
          pledgeId: testPledgeId,
          amount: 50000
        }
      });
      if (!response.data.success) throw new Error(response.data.message);
      if (!response.data.data.code) throw new Error('USSD code not returned');
    });

    // Test 5: Decode Payment Data
    await test('API: Decode Payment Data', async () => {
      const genRes = await axios.post(`${BASE_URL}/qr/mtn`, {
        pledgeId: testPledgeId,
        amount: 50000
      }, {
        headers: { 'Authorization': `Bearer ${testToken}` }
      });

      const paymentData = genRes.data.data.paymentData;
      const encoded = Buffer.from(JSON.stringify(paymentData)).toString('base64');
      const paymentLink = `pledgehub://pay/mtn?data=${encoded}`;

      const decodeRes = await axios.post(`${BASE_URL}/qr/decode`, {
        paymentLink: paymentLink
      });
      if (!decodeRes.data.success) throw new Error(decodeRes.data.message);
      if (!decodeRes.data.data.pledgeId) throw new Error('Decoded data incomplete');
    });

  } catch (error) {
    console.log(`\n  ${colors.yellow}⚠ Server tests skipped: ${error.message}${colors.reset}`);
    console.log(`  ${colors.yellow}Make sure backend is running on port 5001${colors.reset}`);
  }
};

/**
 * Performance tests
 */
const testPerformance = async () => {
  console.log(`\n${colors.bold}${colors.blue}Testing Performance${colors.reset}`);
  console.log('═'.repeat(50));

  // Test 1: QR generation speed
  await test('QR generation performance (<200ms)', async () => {
    const start = Date.now();
    await qrCodeService.generateMTNQRCode({
      pledgeId: 1,
      amount: 50000,
      saveToDatabase: false
    });
    const duration = Date.now() - start;
    if (duration > 200) throw new Error(`Too slow: ${duration}ms`);
  });

  // Test 2: Multiple QR generation
  await test('Batch QR generation (10x)', async () => {
    const start = Date.now();
    for (let i = 0; i < 10; i++) {
      await qrCodeService.generateMTNQRCode({
        pledgeId: i + 1,
        amount: 50000,
        saveToDatabase: false
      });
    }
    const duration = Date.now() - start;
    const avgTime = duration / 10;
    if (avgTime > 200) throw new Error(`Batch too slow: ${avgTime}ms per QR`);
  });

  // Test 3: USSD code generation speed
  await test('USSD generation performance (<10ms)', async () => {
    const start = Date.now();
    qrCodeService.generateUSSDCode('mtn', 50000, 1);
    const duration = Date.now() - start;
    if (duration > 10) throw new Error(`Too slow: ${duration}ms`);
  });
};

/**
 * Main test runner
 */
const runAllTests = async () => {
  console.log(`\n${colors.bold}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║     QR Code Payment System - Test Suite             ║');
  console.log('╚════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}`);

  try {
    // Run test suites
    await testLocalServices();
    await testPerformance();
    await testAPIEndpoints();

    // Summary
    console.log(`\n${colors.bold}${colors.blue}Test Summary${colors.reset}`);
    console.log('═'.repeat(50));
    console.log(`${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`Total: ${passed + failed}`);

    if (failed === 0) {
      console.log(`\n${colors.green}${colors.bold}✓ All tests passed!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`\n${colors.red}${colors.bold}✗ Some tests failed!${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
};

// Run tests
runAllTests();
