#!/usr/bin/env node

/**
 * QR Payment Webhook Integration Test
 * Tests MTN and Airtel payment callback workflows
 * 
 * Run: node backend/scripts/test-qr-webhooks.js
 */

const axios = require('axios');
const { pool } = require('../config/db');

const BASE_URL = 'http://localhost:5001/api';

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
let testUserId = null;
let testPledgeId = null;
let testQRCodeId = null;
let testQRReference = null;

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
 * Setup: Create test user and pledge
 */
async function setupTestData() {
    console.log(`\n${colors.bold}${colors.blue}Setting Up Test Data${colors.reset}`);

    try {
        // Create test user
        const registerRes = await axios.post(`${BASE_URL}/register`, {
            name: 'Webhook Test User',
            username: `webhook_test_${Date.now()}`,
            email: `webhook_test_${Date.now()}@example.com`,
            phone: '+256700000000',
            password: 'TestPass123!',
            role: 'user'
        });

        if (registerRes.data.success) {
            testUserId = registerRes.data.userId;
            console.log(`✅ Test user created: ${testUserId}`);
        } else {
            throw new Error('Failed to register test user');
        }

        // Login to get token
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: `webhook_test_${Date.now()}@example.com`,
            password: 'TestPass123!'
        });

        if (!loginRes.data.success) {
            throw new Error('Failed to login');
        }

        const token = loginRes.data.token;
        console.log(`✅ Test user logged in with token`);

        // Create test pledge
        const pledgeRes = await axios.post(`${BASE_URL}/pledges`, {
            title: 'Webhook Test Pledge',
            description: 'Test pledge for webhook integration',
            amount: 100000,
            currency: 'UGX',
            pledged_by: 'Test Donor',
            pledged_by_phone: '+256700000000'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (pledgeRes.data.success) {
            testPledgeId = pledgeRes.data.pledge.id;
            console.log(`✅ Test pledge created: ${testPledgeId}`);
        } else {
            throw new Error('Failed to create pledge');
        }

        // Generate QR code for the pledge
        const qrRes = await axios.post(`${BASE_URL}/qr/mtn`, {
            pledgeId: testPledgeId,
            amount: 50000,
            phoneNumber: '+256700000000'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (qrRes.data.success) {
            testQRCodeId = qrRes.data.qrCodeId;
            testQRReference = qrRes.data.qrReference;
            console.log(`✅ QR code generated: ${testQRCodeId}, Reference: ${testQRReference}`);
        } else {
            throw new Error('Failed to generate QR code');
        }

        return { userId: testUserId, pledgeId: testPledgeId, qrCodeId: testQRCodeId, qrReference: testQRReference, token };

    } catch (error) {
        console.error(`❌ Setup failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Test 1: MTN Payment Success Webhook
 */
const testMTNPaymentSuccess = async (token) => {
    console.log(`\n${colors.bold}${colors.blue}Testing MTN Payment Success Webhook${colors.reset}`);

    await test('Receive MTN payment success callback', async () => {
        const externalId = `PLEDGE-${testPledgeId}-${Date.now()}`;
        
        const payload = {
            referenceId: `MTN_REF_${Date.now()}`,
            status: 'SUCCESSFUL',
            amount: 50000,
            externalId: externalId,
            financialTransactionId: `MTN_FIN_${Date.now()}`
        };

        const res = await axios.post(`${BASE_URL}/payments/mtn/callback`, payload);
        
        if (!res.data.success) {
            throw new Error(res.data.message || 'Webhook processing failed');
        }
    });

    await test('Verify payment created in database', async () => {
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE pledge_id = ? AND payment_method = ? ORDER BY created_at DESC LIMIT 1',
            [testPledgeId, 'mtn']
        );

        if (!payments || payments.length === 0) {
            throw new Error('Payment record not found');
        }

        const payment = payments[0];
        if (payment.status !== 'completed') {
            throw new Error(`Expected status 'completed', got '${payment.status}'`);
        }
    });

    await test('Verify pledge balance updated', async () => {
        const [pledges] = await pool.execute(
            'SELECT amount_paid, balance_remaining FROM pledges WHERE id = ?',
            [testPledgeId]
        );

        if (!pledges || pledges.length === 0) {
            throw new Error('Pledge not found');
        }

        const pledge = pledges[0];
        if (pledge.amount_paid === 0) {
            throw new Error('Pledge amount_paid was not updated');
        }
        console.log(`    (Amount paid: ${pledge.amount_paid}, Remaining: ${pledge.balance_remaining})`);
    });

    await test('Verify QR code payment link created', async () => {
        const [qrPayments] = await pool.execute(
            'SELECT * FROM qr_code_payments WHERE qr_code_id = ? AND status = "completed"',
            [testQRCodeId]
        );

        if (!qrPayments || qrPayments.length === 0) {
            throw new Error('QR code payment link not found or status not completed');
        }
    });
};

/**
 * Test 2: MTN Payment Failed Webhook
 */
const testMTNPaymentFailed = async (token) => {
    console.log(`\n${colors.bold}${colors.blue}Testing MTN Payment Failed Webhook${colors.reset}`);

    await test('Receive MTN payment failed callback', async () => {
        const externalId = `PLEDGE-${testPledgeId}-${Date.now()}`;
        
        const payload = {
            referenceId: `MTN_FAIL_${Date.now()}`,
            status: 'FAILED',
            amount: 25000,
            externalId: externalId,
            reason: 'Insufficient funds'
        };

        const res = await axios.post(`${BASE_URL}/payments/mtn/callback`, payload);
        
        if (!res.data.success) {
            throw new Error(res.data.message || 'Webhook processing failed');
        }
    });

    await test('Verify failed payment marked in database', async () => {
        const [payments] = await pool.execute(
            `SELECT * FROM payments WHERE pledge_id = ? AND payment_method = 'mtn' AND status = 'failed' 
             ORDER BY created_at DESC LIMIT 1`,
            [testPledgeId]
        );

        if (!payments || payments.length === 0) {
            throw new Error('Failed payment record not found');
        }

        const payment = payments[0];
        if (!payment.notes || !payment.notes.includes('failed')) {
            throw new Error('Payment notes do not contain failure reason');
        }
    });
};

/**
 * Test 3: Airtel Payment Success Webhook
 */
const testAirtelPaymentSuccess = async (token) => {
    console.log(`\n${colors.bold}${colors.blue}Testing Airtel Payment Success Webhook${colors.reset}`);

    await test('Receive Airtel payment success callback', async () => {
        const externalId = `PLEDGE-${testPledgeId}-${Date.now()}`;
        
        const payload = {
            transactionId: `AIRTEL_TXN_${Date.now()}`,
            statusCode: '0',  // 0 = success in Airtel
            status: 'SUCCESSFUL',
            amount: 75000,
            externalId: externalId
        };

        const res = await axios.post(`${BASE_URL}/payments/airtel/callback`, payload);
        
        if (!res.data.success) {
            throw new Error(res.data.message || 'Webhook processing failed');
        }
    });

    await test('Verify Airtel payment created in database', async () => {
        const [payments] = await pool.execute(
            'SELECT * FROM payments WHERE pledge_id = ? AND payment_method = ? ORDER BY created_at DESC LIMIT 1',
            [testPledgeId, 'airtel']
        );

        if (!payments || payments.length === 0) {
            throw new Error('Airtel payment record not found');
        }

        const payment = payments[0];
        if (payment.status !== 'completed') {
            throw new Error(`Expected status 'completed', got '${payment.status}'`);
        }
    });

    await test('Verify pledge balance updated from Airtel payment', async () => {
        const [pledges] = await pool.execute(
            'SELECT amount_paid, balance_remaining FROM pledges WHERE id = ?',
            [testPledgeId]
        );

        if (!pledges || pledges.length === 0) {
            throw new Error('Pledge not found');
        }

        const pledge = pledges[0];
        // Balance should be reduced by amount paid
        console.log(`    (Total amount paid: ${pledge.amount_paid}, Remaining: ${pledge.balance_remaining})`);
    });
};

/**
 * Test 4: Airtel Payment Failed Webhook
 */
const testAirtelPaymentFailed = async (token) => {
    console.log(`\n${colors.bold}${colors.blue}Testing Airtel Payment Failed Webhook${colors.reset}`);

    await test('Receive Airtel payment failed callback', async () => {
        const externalId = `PLEDGE-${testPledgeId}-${Date.now()}`;
        
        const payload = {
            transactionId: `AIRTEL_FAIL_${Date.now()}`,
            statusCode: '1',  // 1 = failed in Airtel
            status: 'FAILED',
            amount: 30000,
            externalId: externalId,
            reason: 'Invalid phone number'
        };

        const res = await axios.post(`${BASE_URL}/payments/airtel/callback`, payload);
        
        if (!res.data.success) {
            throw new Error(res.data.message || 'Webhook processing failed');
        }
    });

    await test('Verify Airtel failed payment marked', async () => {
        const [payments] = await pool.execute(
            `SELECT * FROM payments WHERE pledge_id = ? AND payment_method = 'airtel' AND status = 'failed' 
             ORDER BY created_at DESC LIMIT 1`,
            [testPledgeId]
        );

        if (!payments || payments.length === 0) {
            throw new Error('Airtel failed payment record not found');
        }
    });
};

/**
 * Test 5: Idempotent Payment Processing (same webhook twice)
 */
const testIdempotentPayment = async (token) => {
    console.log(`\n${colors.bold}${colors.blue}Testing Idempotent Webhook Processing${colors.reset}`);

    const transactionId = `IDEMPOTENT_TEST_${Date.now()}`;
    const externalId = `PLEDGE-${testPledgeId}-${Date.now()}`;

    // Send first webhook
    await test('Send first payment webhook', async () => {
        const payload = {
            referenceId: transactionId,
            status: 'SUCCESSFUL',
            amount: 40000,
            externalId: externalId
        };

        const res = await axios.post(`${BASE_URL}/payments/mtn/callback`, payload);
        
        if (!res.data.success) {
            throw new Error('First webhook failed');
        }
    });

    // Send duplicate webhook
    await test('Send duplicate webhook (should not duplicate records)', async () => {
        const [paymentsBefore] = await pool.execute(
            'SELECT COUNT(*) as count FROM payments WHERE transaction_id = ?',
            [transactionId]
        );
        const countBefore = paymentsBefore[0].count;

        const payload = {
            referenceId: transactionId,
            status: 'SUCCESSFUL',
            amount: 40000,
            externalId: externalId
        };

        const res = await axios.post(`${BASE_URL}/payments/mtn/callback`, payload);
        
        if (!res.data.success) {
            throw new Error('Second webhook failed');
        }

        const [paymentsAfter] = await pool.execute(
            'SELECT COUNT(*) as count FROM payments WHERE transaction_id = ?',
            [transactionId]
        );
        const countAfter = paymentsAfter[0].count;

        if (countAfter !== countBefore) {
            throw new Error(`Payment count increased: ${countBefore} -> ${countAfter} (should be idempotent)`);
        }
    });
};

/**
 * Main test runner
 */
async function runTests() {
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bold}${colors.blue} QR PAYMENT WEBHOOK INTEGRATION TESTS${colors.reset}`);
    console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);

    try {
        // Setup
        const { token } = await setupTestData();

        // Run webhook tests
        await testMTNPaymentSuccess(token);
        await testMTNPaymentFailed(token);
        await testAirtelPaymentSuccess(token);
        await testAirtelPaymentFailed(token);
        await testIdempotentPayment(token);

        // Results
        console.log(`\n${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bold}TEST RESULTS${colors.reset}`);
        console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}`);
        console.log(`${colors.green}✓ Passed: ${passed}${colors.reset}`);
        console.log(`${colors.red}✗ Failed: ${failed}${colors.reset}`);
        console.log(`${colors.blue}Total: ${passed + failed}${colors.reset}`);
        console.log(`${colors.bold}${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

        // Exit code
        process.exit(failed > 0 ? 1 : 0);

    } catch (error) {
        console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
        process.exit(1);
    }
}

// Run tests
runTests();
