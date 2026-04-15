// Test Analytics Dashboard (requires auth; /api/analytics is protected in backend/server.js)
const axios = require('axios');
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_BASE_URL = 'http://localhost:5001/api';
const ANALYTICS_BASE_URL = `${API_BASE_URL}/analytics`;

const isTest = process.env.NODE_ENV === 'test';
const dbName = (isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME) || process.env.DB_NAME;
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: dbName
};

const TEST_USER = {
    name: 'Analytics Test User',
    username: 'analytics_test_user',
    phone: '+256771234568',
    email: 'analytics-testuser@example.com',
    password: 'TestPass123!@#'
};

let authToken = null;

const authHeaders = () => authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {};

async function ensureAuthenticatedTestUser() {
    const connection = await mysql.createConnection(dbConfig);
    try {
        await connection.execute('DELETE FROM users WHERE email = ? OR phone = ?', [TEST_USER.email, TEST_USER.phone]);
    } catch (err) {
        // Best-effort cleanup
    }

    try {
        await axios.post(`${API_BASE_URL}/auth/register`, TEST_USER);
    } catch (err) {
        // Ignore if already exists; login will validate
    }

    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
    });
    authToken = loginRes.data.token;
    if (!authToken) {
        throw new Error('Login succeeded but no token was returned');
    }

    // Promote to an elevated role so requireStaff-protected analytics routes work.
    // Prefer role = 'super_admin', but fall back to user_role if the schema uses that column.
    try {
        await connection.execute(
            "UPDATE users SET role = 'super_admin' WHERE email = ? OR username = ?",
            [TEST_USER.email, TEST_USER.username]
        );
    } catch (err) {
        if (String(err.message || '').includes('Unknown column')) {
            await connection.execute(
                "UPDATE users SET user_role = 'super_admin' WHERE email = ? OR username = ?",
                [TEST_USER.email, TEST_USER.username]
            );
        } else {
            throw err;
        }
    } finally {
        await connection.end();
    }
}

async function testAnalytics() {
    console.log('\n📊 TESTING ANALYTICS DASHBOARD\n');
    console.log('═══════════════════════════════════════════════════════\n');

    const today = new Date().toISOString().split('T')[0];
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
        // Sanity check server is up
        await axios.get('http://localhost:5001/api/health');

        // Auth bootstrap
        await ensureAuthenticatedTestUser();

        // Test 1: Overview Stats
        console.log('1️⃣  Testing Overview Statistics...');
        const overview = await axios.get(`${ANALYTICS_BASE_URL}/overview`, authHeaders());
        console.log('   ✅ Overview Stats:');
        console.log(`      Total Pledges: ${overview.data.data.totalPledges}`);
        console.log(`      Unique Donors: ${overview.data.data.uniqueDonors}`);
        console.log(`      Collection Rate: ${overview.data.data.collectionRate}%`);
        console.log(`      Total Amount: UGX ${Number(overview.data.data.amounts?.total || 0).toLocaleString()}`);
        console.log(`      Paid Amount: UGX ${Number(overview.data.data.amounts?.paid || 0).toLocaleString()}\n`);
        
        // Test 2: Trends
        console.log('2️⃣  Testing Trends (Date Range)...');
        const trends = await axios.get(`${ANALYTICS_BASE_URL}/trends?start=${oneMonthAgo}&end=${today}`, authHeaders());
        console.log(`   ✅ Trends: ${trends.data.data.length} data points`);
        if (trends.data.data.length > 0) {
            const latest = trends.data.data[trends.data.data.length - 1];
            console.log(`      Latest: ${latest.month} - ${latest.pledges} pledges, UGX ${Number(latest.amount || 0).toLocaleString()}\n`);
        }
        
        // Test 3: Top Donors
        console.log('3️⃣  Testing Top Donors...');
        const donors = await axios.get(`${ANALYTICS_BASE_URL}/top-donors?limit=5`, authHeaders());
        console.log(`   ✅ Top ${donors.data.data.length} Donors:`);
        donors.data.data.slice(0, 3).forEach((d, i) => {
            console.log(`      ${i + 1}. ${d.name} - UGX ${d.totalPaid.toLocaleString()} (${d.fulfillmentRate}% fulfillment)`);
        });
        console.log('');
        
        // Test 4: By Status
        console.log('4️⃣  Testing By Status...');
        const byStatus = await axios.get(`${ANALYTICS_BASE_URL}/by-status`, authHeaders());
        console.log('   ✅ Pledges by Status:');
        Object.entries(byStatus.data.data).forEach(([status, data]) => {
            console.log(`      ${status}: ${data.count} pledges, UGX ${data.totalAmount.toLocaleString()}`);
        });
        console.log('');
        
        // Test 5: By Purpose
        console.log('5️⃣  Testing By Purpose...');
        const byPurpose = await axios.get(`${ANALYTICS_BASE_URL}/by-purpose`, authHeaders());
        console.log(`   ✅ Top ${byPurpose.data.data.length} Purposes:`);
        byPurpose.data.data.slice(0, 3).forEach((p, i) => {
            console.log(`      ${i + 1}. ${p.purpose} - ${p.count} pledges, ${p.collectionRate}% collected`);
        });
        console.log('');
        
        // Test 6: Upcoming Collections
        console.log('6️⃣  Testing Upcoming Collections...');
        const upcoming = await axios.get(`${ANALYTICS_BASE_URL}/upcoming`, authHeaders());
        console.log(`   ✅ Upcoming Collections: ${upcoming.data.count} pledges in next 30 days`);
        if (upcoming.data.count > 0) {
            const total = upcoming.data.data.reduce((sum, p) => sum + p.amount, 0);
            console.log(`      Total Expected: UGX ${total.toLocaleString()}\n`);
        } else {
            console.log('');
        }
        
        // Test 7: At-Risk Pledges
        console.log('7️⃣  Testing At-Risk Pledges...');
        const atRisk = await axios.get(`${ANALYTICS_BASE_URL}/at-risk?start=${oneMonthAgo}&end=${today}`, authHeaders());
        console.log(`   ✅ At-Risk Pledges: ${atRisk.data.total || 0}`);
        const byRiskLevel = atRisk.data.byRiskLevel || {};
        const riskSummary = Object.keys(byRiskLevel).length
            ? Object.entries(byRiskLevel).map(([k, v]) => `${k}: ${v}`).join(', ')
            : 'None';
        console.log(`      By Risk Level: ${riskSummary}\n`);
        
        // Test 8: AI Insights
        console.log('8️⃣  Testing AI Insights...');
        const insights = await axios.get(`${ANALYTICS_BASE_URL}/insights`, authHeaders());
        console.log(`   ✅ AI Insights: ${insights.data.available ? 'Available' : 'Not Available'}\n`);
        
        // Test 9: Complete Dashboard
        console.log('9️⃣  Testing Complete Dashboard...');
        const dashboard = await axios.get(`${ANALYTICS_BASE_URL}/dashboard`, authHeaders());
        console.log('   ✅ Complete Dashboard Data Retrieved');
        console.log(`      Generated at: ${dashboard.data.generatedAt}`);
        console.log(`      Overview: ${dashboard.data.overview.totalPledges} pledges`);
        console.log(`      Trends: ${dashboard.data.trends.length} periods`);
        console.log(`      Top Donors: ${dashboard.data.topDonors.length} donors`);
        console.log(`      At Risk: ${dashboard.data.atRisk.length} pledges\n`);
        
        // Summary
        console.log('═══════════════════════════════════════════════════════');
        console.log('🎉 ALL ANALYTICS TESTS PASSED!\n');
        console.log('✅ Feature #5: Analytics Dashboard - COMPLETE\n');
        console.log('📋 Available Analytics Endpoints:');
        console.log('   GET /api/analytics/overview');
        console.log('   GET /api/analytics/summary?start=YYYY-MM-DD&end=YYYY-MM-DD');
        console.log('   GET /api/analytics/trends?start=YYYY-MM-DD&end=YYYY-MM-DD');
        console.log('   GET /api/analytics/top-donors?limit=10&start=YYYY-MM-DD&end=YYYY-MM-DD');
        console.log('   GET /api/analytics/by-status');
        console.log('   GET /api/analytics/by-purpose');
        console.log('   GET /api/analytics/upcoming');
        console.log('   GET /api/analytics/at-risk?start=YYYY-MM-DD&end=YYYY-MM-DD');
        console.log('   GET /api/analytics/insights');
        console.log('   GET /api/analytics/dashboard (all-in-one)\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response:', error.response.data);
        }
        process.exit(1);
    }
}

testAnalytics();
