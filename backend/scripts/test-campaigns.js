const fetch = require('node-fetch');

const API_BASE = 'http://localhost:5001/api';

// Test results tracking
let passedTests = 0;
let failedTests = 0;
const testResults = [];

function logTest(name, passed, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const message = `${status} - ${name}`;
    console.log(message);
    if (details) console.log(`   ${details}`);
    
    testResults.push({ name, passed, details });
    if (passed) passedTests++;
    else failedTests++;
}

async function testCampaignCreation() {
    console.log('\n📋 Testing Campaign Creation...');
    try {
        const response = await fetch(`${API_BASE}/campaigns`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'School Library Fund',
                description: 'Building a modern library for our students',
                goalAmount: 5000000,
                suggestedAmount: 100000
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success && data.data.id) {
            logTest('Create Campaign', true, `Campaign ID: ${data.data.id}`);
            return data.data.id;
        } else {
            logTest('Create Campaign', false, JSON.stringify(data));
            return null;
        }
    } catch (error) {
        logTest('Create Campaign', false, error.message);
        return null;
    }
}

async function testGetAllCampaigns() {
    console.log('\n📋 Testing Get All Campaigns...');
    try {
        const response = await fetch(`${API_BASE}/campaigns`);
        const data = await response.json();
        
        if (response.ok && data.success && Array.isArray(data.data)) {
            logTest('Get All Campaigns', true, `Found ${data.data.length} campaign(s)`);
            return data.data;
        } else {
            logTest('Get All Campaigns', false, JSON.stringify(data));
            return [];
        }
    } catch (error) {
        logTest('Get All Campaigns', false, error.message);
        return [];
    }
}

async function testGetCampaignDetails(campaignId) {
    console.log('\n📋 Testing Get Campaign Details...');
    try {
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`);
        const data = await response.json();
        
        if (response.ok && data.success && data.data) {
            logTest('Get Campaign Details', true, 
                `Campaign: ${data.data.title}, Pledges: ${data.data.pledges.length}`);
            return data.data;
        } else {
            logTest('Get Campaign Details', false, JSON.stringify(data));
            return null;
        }
    } catch (error) {
        logTest('Get Campaign Details', false, error.message);
        return null;
    }
}

async function testPledgeToCampaign(campaignId) {
    console.log('\n📋 Testing Pledge to Campaign...');
    try {
        const response = await fetch(`${API_BASE}/pledges`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({
                campaign_id: campaignId,
                title: 'School Library Pledge',
                amount: 100000,
                donorName: 'John Doe',
                message: JSON.stringify({
                    donor_email: 'john@example.com',
                    purpose: 'School Library Fund',
                    collection_date: '2025-12-31'
                }),
                date: new Date().toISOString()
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            logTest('Pledge to Campaign', true, `Pledge created successfully`);
            return true;
        } else {
            logTest('Pledge to Campaign', false, JSON.stringify(data));
            return false;
        }
    } catch (error) {
        logTest('Pledge to Campaign', false, error.message);
        return false;
    }
}

async function testCampaignAmountAggregation(campaignId) {
    console.log('\n📋 Testing Campaign Amount Aggregation...');
    try {
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            const { stats, goal_amount } = data.data;
            const hasStats = stats && typeof stats.totalPledged === 'number';
            const progressCalculated = stats && typeof stats.progressPercentage === 'number';
            
            if (hasStats && progressCalculated) {
                logTest('Campaign Amount Aggregation', true, 
                    `Total Pledged: ${stats.totalPledged}, Progress: ${stats.progressPercentage}%`);
                return true;
            } else {
                logTest('Campaign Amount Aggregation', false, 'Stats not properly calculated');
                return false;
            }
        } else {
            logTest('Campaign Amount Aggregation', false, JSON.stringify(data));
            return false;
        }
    } catch (error) {
        logTest('Campaign Amount Aggregation', false, error.message);
        return false;
    }
}

async function testGoalCompletion(campaignId) {
    console.log('\n📋 Testing Goal Completion (Add multiple pledges)...');
    try {
        // Add multiple pledges to reach the goal
        for (let i = 0; i < 5; i++) {
            await fetch(`${API_BASE}/pledges`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer test-token'
                },
                body: JSON.stringify({
                    campaign_id: campaignId,
                    title: `Pledge ${i + 1}`,
                    amount: 1000000,
                    donorName: `Donor ${i + 1}`,
                    message: JSON.stringify({
                        donor_email: `donor${i + 1}@example.com`,
                        purpose: 'School Library Fund',
                        collection_date: '2025-12-31'
                    }),
                    date: new Date().toISOString()
                })
            });
        }

        // Check if campaign status updated
        const response = await fetch(`${API_BASE}/campaigns/${campaignId}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            const { status, stats, goal_amount } = data.data;
            const goalReached = stats.totalPledged >= goal_amount;
            
            logTest('Goal Completion', goalReached, 
                `Total: ${stats.totalPledged}/${goal_amount}, Status: ${status}`);
            return goalReached;
        } else {
            logTest('Goal Completion', false, JSON.stringify(data));
            return false;
        }
    } catch (error) {
        logTest('Goal Completion', false, error.message);
        return false;
    }
}

async function testStandalonePledge() {
    console.log('\n📋 Testing Standalone Pledge (Backward Compatibility)...');
    try {
        const response = await fetch(`${API_BASE}/pledges`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({
                title: 'Standalone Donation',
                amount: 50000,
                donorName: 'Jane Smith',
                message: 'General donation',
                date: new Date().toISOString()
            })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            logTest('Standalone Pledge', true, `Pledge created without campaign link`);
            return true;
        } else {
            logTest('Standalone Pledge', false, JSON.stringify(data));
            return false;
        }
    } catch (error) {
        logTest('Standalone Pledge', false, error.message);
        return false;
    }
}

async function testFilterCampaignsByStatus() {
    console.log('\n📋 Testing Filter Campaigns by Status...');
    try {
        const response = await fetch(`${API_BASE}/campaigns?status=active`);
        const data = await response.json();
        
        if (response.ok && data.success) {
            const allActive = data.data.every(c => c.status === 'active');
            logTest('Filter Campaigns by Status', allActive, 
                `Found ${data.data.length} active campaign(s)`);
            return allActive;
        } else {
            logTest('Filter Campaigns by Status', false, JSON.stringify(data));
            return false;
        }
    } catch (error) {
        logTest('Filter Campaigns by Status', false, error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Campaign Architecture Tests');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('API Base URL:', API_BASE);
    console.log('Ensure backend is running on http://localhost:5001\n');

    // Run tests in sequence
    const campaignId = await testCampaignCreation();
    
    if (campaignId) {
        await testGetAllCampaigns();
        await testGetCampaignDetails(campaignId);
        await testPledgeToCampaign(campaignId);
        await testCampaignAmountAggregation(campaignId);
        await testGoalCompletion(campaignId);
        await testFilterCampaignsByStatus();
    }
    
    await testStandalonePledge();

    // Print summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

    if (failedTests === 0) {
        console.log('🎉 All tests passed! Campaign architecture is working correctly.\n');
    } else {
        console.log('⚠️  Some tests failed. Review the errors above.\n');
        console.log('Failed tests:');
        testResults.filter(t => !t.passed).forEach(t => {
            console.log(`  - ${t.name}: ${t.details}`);
        });
        console.log('');
    }

    process.exit(failedTests === 0 ? 0 : 1);
}

// Run tests
runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
});
