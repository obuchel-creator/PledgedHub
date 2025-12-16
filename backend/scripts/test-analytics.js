// Test Analytics Dashboard
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/api/analytics';

async function testAnalytics() {
    console.log('\n📊 TESTING ANALYTICS DASHBOARD\n');
    console.log('═══════════════════════════════════════════════════════\n');
    
    try {
        // Test 1: Overview Stats
        console.log('1️⃣  Testing Overview Statistics...');
        const overview = await axios.get(`${BASE_URL}/overview`);
        console.log('   ✅ Overview Stats:');
        console.log(`      Total Pledges: ${overview.data.data.totalPledges}`);
        console.log(`      Unique Donors: ${overview.data.data.uniqueDonors}`);
        console.log(`      Collection Rate: ${overview.data.data.collectionRate}%`);
        console.log(`      Total Amount: UGX ${overview.data.data.amounts.total.toLocaleString()}`);
        console.log(`      Paid Amount: UGX ${overview.data.data.amounts.paid.toLocaleString()}\n`);
        
        // Test 2: Trends
        console.log('2️⃣  Testing Trends (Month)...');
        const trends = await axios.get(`${BASE_URL}/trends?period=month`);
        console.log(`   ✅ Trends: ${trends.data.data.length} data points`);
        if (trends.data.data.length > 0) {
            const latest = trends.data.data[trends.data.data.length - 1];
            console.log(`      Latest: ${latest.label} - ${latest.count} pledges, ${latest.collectionRate}% collected\n`);
        }
        
        // Test 3: Top Donors
        console.log('3️⃣  Testing Top Donors...');
        const donors = await axios.get(`${BASE_URL}/top-donors?limit=5`);
        console.log(`   ✅ Top ${donors.data.data.length} Donors:`);
        donors.data.data.slice(0, 3).forEach((d, i) => {
            console.log(`      ${i + 1}. ${d.name} - UGX ${d.totalPaid.toLocaleString()} (${d.fulfillmentRate}% fulfillment)`);
        });
        console.log('');
        
        // Test 4: By Status
        console.log('4️⃣  Testing By Status...');
        const byStatus = await axios.get(`${BASE_URL}/by-status`);
        console.log('   ✅ Pledges by Status:');
        Object.entries(byStatus.data.data).forEach(([status, data]) => {
            console.log(`      ${status}: ${data.count} pledges, UGX ${data.totalAmount.toLocaleString()}`);
        });
        console.log('');
        
        // Test 5: By Purpose
        console.log('5️⃣  Testing By Purpose...');
        const byPurpose = await axios.get(`${BASE_URL}/by-purpose`);
        console.log(`   ✅ Top ${byPurpose.data.data.length} Purposes:`);
        byPurpose.data.data.slice(0, 3).forEach((p, i) => {
            console.log(`      ${i + 1}. ${p.purpose} - ${p.count} pledges, ${p.collectionRate}% collected`);
        });
        console.log('');
        
        // Test 6: Upcoming Collections
        console.log('6️⃣  Testing Upcoming Collections...');
        const upcoming = await axios.get(`${BASE_URL}/upcoming`);
        console.log(`   ✅ Upcoming Collections: ${upcoming.data.count} pledges in next 30 days`);
        if (upcoming.data.count > 0) {
            const total = upcoming.data.data.reduce((sum, p) => sum + p.amount, 0);
            console.log(`      Total Expected: UGX ${total.toLocaleString()}\n`);
        } else {
            console.log('');
        }
        
        // Test 7: At-Risk Pledges
        console.log('7️⃣  Testing At-Risk Pledges...');
        const atRisk = await axios.get(`${BASE_URL}/at-risk`);
        console.log(`   ✅ At-Risk Pledges: ${atRisk.data.total}`);
        console.log(`      High Risk: ${atRisk.data.byRiskLevel.high}`);
        console.log(`      Medium Risk: ${atRisk.data.byRiskLevel.medium}`);
        console.log(`      Low Risk: ${atRisk.data.byRiskLevel.low}\n`);
        
        // Test 8: AI Insights
        console.log('8️⃣  Testing AI Insights...');
        const insights = await axios.get(`${BASE_URL}/insights`);
        console.log(`   ✅ AI Insights: ${insights.data.available ? 'Available' : 'Not Available'}\n`);
        
        // Test 9: Complete Dashboard
        console.log('9️⃣  Testing Complete Dashboard...');
        const dashboard = await axios.get(`${BASE_URL}/dashboard`);
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
        console.log('   GET /api/analytics/trends?period=month');
        console.log('   GET /api/analytics/top-donors?limit=10');
        console.log('   GET /api/analytics/by-status');
        console.log('   GET /api/analytics/by-purpose');
        console.log('   GET /api/analytics/upcoming');
        console.log('   GET /api/analytics/at-risk');
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
