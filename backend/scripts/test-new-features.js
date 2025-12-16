/**
 * Test script for newly implemented features:
 * 1. Password Reset Flow
 * 2. Payment Recording System
 */

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config();

const API_BASE = 'http://localhost:5001/api';
let testUserId = null;
let testPledgeId = null;
let resetToken = null;

// Color output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(60));
    log(title, 'blue');
    console.log('='.repeat(60));
}

function logTest(message) {
    log(`\n🧪 TEST: ${message}`, 'yellow');
}

function logSuccess(message) {
    log(`   ✅ ${message}`, 'green');
}

function logError(message) {
    log(`   ❌ ${message}`, 'red');
}

// Database connection
async function getDbConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'omukwano_pledge'
    });
}

// Setup: Create test user and pledge
async function setupTestData() {
    logSection('SETUP: Creating Test Data');
    const db = await getDbConnection();

    try {
        // Create test user
        const testEmail = `test_${Date.now()}@example.com`;
        const [userResult] = await db.execute(
            'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
            [testEmail, '$2b$10$dummyhash', 'Test User']
        );
        testUserId = userResult.insertId;
        logSuccess(`Created test user: ${testEmail} (ID: ${testUserId})`);

        // Create test pledge
        const [pledgeResult] = await db.execute(
            `INSERT INTO pledges (donor_name, donor_email, amount, collection_date, status) 
             VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY), 'pending')`,
            ['Test Donor', 'donor@example.com', 100000]
        );
        testPledgeId = pledgeResult.insertId;
        logSuccess(`Created test pledge (ID: ${testPledgeId})`);

    } finally {
        await db.end();
    }
}

// Test 1: Password Reset Flow
async function testPasswordReset() {
    logSection('TEST 1: Password Reset Flow');
    const db = await getDbConnection();
    const testEmail = `test_${testUserId}@example.com`;

    try {
        // Update user email to match what we'll use
        await db.execute('UPDATE users SET email = ? WHERE id = ?', [testEmail, testUserId]);

        logTest('Step 1: Request password reset');
        try {
            const response = await axios.post(`${API_BASE}/password/forgot`, {
                email: testEmail
            });
            logSuccess(`Reset email request successful: ${response.data.message}`);
        } catch (err) {
            logError(`Failed to request reset: ${err.response?.data?.error || err.message}`);
            return false;
        }

        // Get reset token from database
        logTest('Step 2: Retrieve reset token from database');
        const [rows] = await db.execute(
            'SELECT reset_token FROM users WHERE id = ?',
            [testUserId]
        );
        
        if (!rows[0]?.reset_token) {
            logError('No reset token found in database');
            return false;
        }
        
        resetToken = rows[0].reset_token;
        logSuccess(`Reset token retrieved from database`);

        logTest('Step 3: Reset password with token');
        try {
            const response = await axios.post(`${API_BASE}/password/reset`, {
                token: resetToken,
                newPassword: 'NewSecurePassword123!'
            });
            logSuccess(`Password reset successful: ${response.data.message}`);
        } catch (err) {
            logError(`Failed to reset password: ${err.response?.data?.error || err.message}`);
            return false;
        }

        // Verify token was cleared
        logTest('Step 4: Verify reset token was cleared');
        const [verifyRows] = await db.execute(
            'SELECT reset_token, reset_token_expiry FROM users WHERE id = ?',
            [testUserId]
        );
        
        if (verifyRows[0]?.reset_token) {
            logError('Reset token was not cleared after use');
            return false;
        }
        
        logSuccess('Reset token properly cleared after successful reset');
        return true;

    } finally {
        await db.end();
    }
}

// Test 2: Payment Recording
async function testPaymentRecording() {
    logSection('TEST 2: Payment Recording System');
    
    // First, we need to login to get a token
    logTest('Step 1: Login to get authentication token');
    let authToken;
    try {
        // Register a test user
        const testEmail = `payment_test_${Date.now()}@example.com`;
        const registerResponse = await axios.post(`${API_BASE}/auth/register`, {
            name: 'Payment Test User',
            email: testEmail,
            password: 'TestPassword123!'
        });
        authToken = registerResponse.data.token;
        logSuccess(`Registered and authenticated test user`);
    } catch (err) {
        logError(`Failed to authenticate: ${err.response?.data?.error || err.message}`);
        return false;
    }

    logTest('Step 2: Record a payment');
    let paymentId;
    try {
        const paymentData = {
            pledgeId: testPledgeId,
            amount: 50000,
            paymentDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'mobile_money',
            reference: 'MM-TEST-12345',
            notes: 'Test payment from automated test'
        };

        const response = await axios.post(
            `${API_BASE}/payments`,
            paymentData,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        paymentId = response.data.payment?.id;
        logSuccess(`Payment recorded successfully (ID: ${paymentId})`);
        logSuccess(`Amount: UGX ${paymentData.amount.toLocaleString()}`);
        logSuccess(`Method: ${paymentData.paymentMethod}`);
        logSuccess(`Reference: ${paymentData.reference}`);
    } catch (err) {
        logError(`Failed to record payment: ${err.response?.data?.error || err.message}`);
        return false;
    }

    logTest('Step 3: Retrieve payment list for pledge');
    try {
        const response = await axios.get(
            `${API_BASE}/payments?pledgeId=${testPledgeId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
        );
        
        const payments = response.data.payments || response.data;
        if (!Array.isArray(payments) || payments.length === 0) {
            logError('No payments found for pledge');
            return false;
        }
        
        logSuccess(`Retrieved ${payments.length} payment(s) for pledge`);
        
        const testPayment = payments.find(p => p.id === paymentId);
        if (testPayment) {
            logSuccess(`Test payment found in list`);
            logSuccess(`  Amount: UGX ${testPayment.amount.toLocaleString()}`);
            logSuccess(`  Method: ${testPayment.payment_method}`);
            logSuccess(`  Reference: ${testPayment.reference || 'N/A'}`);
        }
    } catch (err) {
        logError(`Failed to retrieve payments: ${err.response?.data?.error || err.message}`);
        return false;
    }

    logTest('Step 4: Verify payment in database');
    const db = await getDbConnection();
    try {
        const [rows] = await db.execute(
            'SELECT * FROM payments WHERE id = ?',
            [paymentId]
        );
        
        if (!rows[0]) {
            logError('Payment not found in database');
            return false;
        }
        
        const payment = rows[0];
        logSuccess(`Payment verified in database`);
        logSuccess(`  Pledge ID: ${payment.pledge_id}`);
        logSuccess(`  Amount: UGX ${payment.amount.toLocaleString()}`);
        logSuccess(`  Method: ${payment.payment_method}`);
        logSuccess(`  Recorded by: User ID ${payment.recorded_by || 'N/A'}`);
        
        return true;
    } finally {
        await db.end();
    }
}

// Cleanup: Remove test data
async function cleanup() {
    logSection('CLEANUP: Removing Test Data');
    const db = await getDbConnection();

    try {
        if (testPledgeId) {
            await db.execute('DELETE FROM payments WHERE pledge_id = ?', [testPledgeId]);
            await db.execute('DELETE FROM pledges WHERE id = ?', [testPledgeId]);
            logSuccess(`Deleted test pledge and payments`);
        }

        if (testUserId) {
            await db.execute('DELETE FROM users WHERE id >= ?', [testUserId]);
            logSuccess(`Deleted test users`);
        }
    } finally {
        await db.end();
    }
}

// Main test runner
async function runTests() {
    console.log('\n');
    log('╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║         NEW FEATURES COMPREHENSIVE TEST SUITE              ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝', 'blue');

    let results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    try {
        // Setup
        await setupTestData();

        // Test 1: Password Reset
        results.total++;
        const passwordResetPassed = await testPasswordReset();
        if (passwordResetPassed) {
            results.passed++;
        } else {
            results.failed++;
        }

        // Test 2: Payment Recording
        results.total++;
        const paymentRecordingPassed = await testPaymentRecording();
        if (paymentRecordingPassed) {
            results.passed++;
        } else {
            results.failed++;
        }

    } catch (error) {
        logError(`\n❌ Test suite error: ${error.message}`);
        console.error(error);
    } finally {
        // Cleanup
        await cleanup();
    }

    // Final results
    logSection('TEST RESULTS SUMMARY');
    log(`Total Tests: ${results.total}`, 'blue');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    
    if (results.passed === results.total) {
        log('\n🎉 ALL TESTS PASSED! New features are working correctly.', 'green');
    } else {
        log('\n⚠️  SOME TESTS FAILED. Please review the errors above.', 'red');
    }

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
    logError(`\n❌ Fatal error: ${err.message}`);
    console.error(err);
    process.exit(1);
});
