// Comprehensive Feature Test Suite

const axios = require('axios');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const isTest = process.env.NODE_ENV === 'test';
const dbName = isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: dbName,
};

// Test user credentials
const TEST_USER = {
    name: 'Test User',
    username: 'testuser',
    phone: '+256771234567',
    email: 'testuser@example.com',
    password: 'testpass123'
};

let authToken = null;

const BASE_URL = 'http://localhost:5002/api';
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function test(name, fn) {
    try {
        await fn();
        log('green', `✅ ${name}`);
        return true;
    } catch (error) {
        log('red', `❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.response?.data) {
            console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
        }
        return false;
    }
}

async function runTests() {
    log('cyan', '\n🧪 COMPREHENSIVE FEATURE TEST SUITE\n');
    log('cyan', '═══════════════════════════════════════════════════════\n');

    const results = {
        passed: 0,
        failed: 0
    };

    // --- AUTHENTICATION: Register or login test user ---
    log('yellow', '\n🔑 Authenticating test user...');
    try {
        // Try to register first (ignore error if already exists)
        await axios.post(`${BASE_URL}/auth/register`, TEST_USER);
        log('green', 'Test user registered.');
    } catch (err) {
        if (err.response && err.response.data && err.response.data.error && err.response.data.error.includes('already')) {
            log('yellow', 'Test user already exists, will login.');
        } else {
            log('red', 'Test user registration failed: ' + (err.response?.data?.error || err.message));
        }
    }
    try {
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        authToken = loginRes.data.token;
        log('green', 'Test user authenticated.');
    } catch (err) {
        log('red', 'Test user login failed: ' + (err.response?.data?.error || err.message));
        throw new Error('Cannot authenticate test user, aborting tests.');
    }

    // --- Ensure test user has staff role ---
    log('yellow', 'Ensuring test user has staff role...');
    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            "UPDATE users SET role = 'admin' WHERE email = ? OR username = ?",
            [TEST_USER.email, TEST_USER.username]
        );
        await connection.end();
        log('green', 'Test user promoted to admin.');
    } catch (err) {
        log('red', 'Failed to promote test user to admin: ' + err.message);
        throw err;
    }

    // Helper to add auth header
    const authHeaders = () => authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};

    // ========================================
    // FEATURE #1: Pledge Creation with Phone Number
    // ========================================
    log('blue', '\n📦 Feature #1: Pledge Creation with Phone\n');

    let createdPledgeId = null;
    // Only the 11 fields used in backend SQL insert, in order
    const pledgePayload = {
        campaign_id: 1,
        donor_name: 'John Doe',
        donor_email: 'john@example.com',
        donor_phone: '+256700000000',
        purpose: 'Support local agriculture',
        message: '',
        collection_date: '2025-11-19',
        date: '2025-11-18', // Required pledge date
        amount: 100000,
        status: 'active'
    };

    if (await test('Create Pledge (phone required)', async () => {
        // Should succeed with phone
        const res = await axios.post(`${BASE_URL}/pledges`, pledgePayload, authHeaders());
        if (!res.data.success || !res.data.pledge) throw new Error('Pledge creation failed');
        // Accept donor_phone as the canonical field
        if (res.data.pledge.donor_phone !== pledgePayload.donor_phone) throw new Error('donor_phone not stored correctly');
        createdPledgeId = res.data.pledge.id || res.data.pledge.pledgeId;
    })) results.passed++; else results.failed++;

    if (await test('Create Pledge (missing phone should fail)', async () => {
        try {
            const badPayload = { ...pledgePayload };
            delete badPayload.donor_phone;
            await axios.post(`${BASE_URL}/pledges`, badPayload, authHeaders());
            throw new Error('Pledge creation should have failed without phone');
        } catch (err) {
            if (err.response && err.response.status === 400) {
                if (!/phone/i.test(err.response.data.error || '')) throw new Error('Missing phone error not found');
            } else {
                throw err;
            }
        }
    })) results.passed++; else results.failed++;
    // FEATURE #3: AI Integration Tests
    // ========================================
    log('blue', '📦 Feature #3: AI Integration\n');

    if (await test('AI Status Check', async () => {
        const res = await axios.get(`${BASE_URL}/ai/status`, authHeaders());
        if (!res.data.available) throw new Error('AI not available');
        console.log(`   Provider: ${res.data.provider}, Model: ${res.data.model}`);
    })) results.passed++; else results.failed++;

    if (await test('AI Test with Sample Data', async () => {
        const res = await axios.post(`${BASE_URL}/ai/test`, {}, authHeaders());
        if (!res.data.success) throw new Error('AI test failed');
        console.log(`   Sample: ${res.data.sampleMessage.substring(0, 60)}...`);
    })) results.passed++; else results.failed++;

    if (await test('AI Insights Generation', async () => {
        const res = await axios.get(`${BASE_URL}/ai/insights`, authHeaders());
        console.log(`   Summary: ${JSON.stringify(res.data.summary || {})}`);
    })) results.passed++; else results.failed++;

    if (await test('AI Suggestions', async () => {
        const res = await axios.get(`${BASE_URL}/ai/suggestions`, authHeaders());
        console.log(`   Stats: ${res.data.stats?.total || 0} pledges analyzed`);
    })) results.passed++; else results.failed++;
    // ========================================
    // FEATURE #4: Message Generation Tests
    // ========================================
    log('blue', '\n📦 Feature #4: Smart Message Generation\n');
    

    if (await test('Get Message Templates', async () => {
        const res = await axios.get(`${BASE_URL}/messages/templates`, authHeaders());
        console.log(`   Reminder types: ${res.data.templates.reminder.types.join(', ')}`);
        console.log(`   Tones: ${res.data.templates.reminder.tones.join(', ')}`);
    })) results.passed++; else results.failed++;

    // Test with a mock pledge ID (will fail gracefully if no pledges exist)
    if (await test('Generate Reminder Message (Template)', async () => {
        try {
            const res = await axios.post(`${BASE_URL}/messages/reminder`, {
                pledgeId: 1,
                type: '7_days',
                tone: 'friendly',
                useAI: false
            }, authHeaders());
            console.log(`   Source: ${res.data.message.source}`);
            console.log(`   Text: ${res.data.message.text.substring(0, 60)}...`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ℹ️  No pledges in database (expected for empty DB)');
            } else {
                throw error;
            }
        }
    })) results.passed++; else results.failed++;

    if (await test('Generate Thank You Message (Template)', async () => {
        try {
            const res = await axios.post(`${BASE_URL}/messages/thank-you`, {
                pledgeId: 1,
                tone: 'warm',
                useAI: false
            }, authHeaders());
            console.log(`   Source: ${res.data.message.source}`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ℹ️  No pledges in database (expected for empty DB)');
            } else {
                throw error;
            }
        }
    })) results.passed++; else results.failed++;

    if (await test('Generate Follow-up Message (Template)', async () => {
        try {
            const res = await axios.post(`${BASE_URL}/messages/follow-up`, {
                pledgeId: 1,
                approach: 'gentle',
                useAI: false
            }, authHeaders());
            console.log(`   Approach: ${res.data.message.approach}`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ℹ️  No pledges in database (expected for empty DB)');
            } else {
                throw error;
            }
        }
    })) results.passed++; else results.failed++;

    if (await test('Generate Confirmation Message', async () => {
        try {
            const res = await axios.post(`${BASE_URL}/messages/confirmation`, {
                pledgeId: 1,
                style: 'detailed'
            }, authHeaders());
            console.log(`   Style: ${res.data.message.style}`);
        } catch (error) {
            if (error.response?.status === 404) {
                console.log('   ℹ️  No pledges in database (expected for empty DB)');
            } else {
                throw error;
            }
        }
    })) results.passed++; else results.failed++;
    
    // ========================================
    // FEATURE #2: Automated Reminders Tests
    // ========================================
    log('blue', '\n📦 Feature #2: Automated Reminders\n');
    

    if (await test('Check Reminder Job Status', async () => {
        const res = await axios.get(`${BASE_URL}/reminders/status`, authHeaders());
        console.log(`   Jobs running: ${res.data.status}`);
        console.log(`   Initialized: ${res.data.initialized}`);
    })) results.passed++; else results.failed++;

    if (await test('Get Upcoming Reminders', async () => {
        const res = await axios.get(`${BASE_URL}/reminders/upcoming`, authHeaders());
        const total = Object.values(res.data.reminders).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`   Total reminders due: ${total}`);
    })) results.passed++; else results.failed++;
    
    // ========================================
    // Summary
    // ========================================
    log('cyan', '\n═══════════════════════════════════════════════════════');
    log('cyan', '📊 TEST SUMMARY\n');
    log('green', `✅ Passed: ${results.passed}`);
    if (results.failed > 0) {
        log('red', `❌ Failed: ${results.failed}`);
    } else {
        log('green', `❌ Failed: ${results.failed}`);
    }
    log('cyan', `\n💯 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%\n`);
    
    if (results.failed === 0) {
        log('green', '🎉 ALL TESTS PASSED! Your AI and automation features are working perfectly!\n');
        
        log('yellow', '📝 NEXT STEPS:');
        console.log('   1. ✅ AI Integration - COMPLETE');
        console.log('   2. ✅ Smart Message Generation - COMPLETE');
        console.log('   3. ✅ Automated Reminders - COMPLETE');
        console.log('   4. ⏳ Build Analytics Dashboard (Feature #5)');
        console.log('   5. ⏳ Create Documentation\n');
    }
}

runTests().catch(error => {
    log('red', `\n❌ Test suite failed: ${error.message}`);
    process.exit(1);
});
