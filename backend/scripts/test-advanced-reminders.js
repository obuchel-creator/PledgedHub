const { pool } = require('../config/db');
const advancedReminderService = require('../services/advancedReminderService');

/**
 * Test Script for Advanced Reminder System
 * Creates test pledges at various time intervals to verify reminder logic
 */

async function createTestPledges() {
    console.log('\n[STEP] Creating Test Pledges for Advanced Reminder System...\n');
    
    const testPledges = [
        // Long-term: 3 months away (should get weekly reminders - Wednesdays 2PM)
        {
            donor_name: 'Alice Johnson',
            phone_number: '+256771234567',
            email: 'alice@test.com',
            amount: 500000,
            purpose: 'Building Fund',
            collection_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            status: 'pending'
        },
        // Long-term: 4 months away (should get weekly reminders - Wednesdays 2PM)
        {
            donor_name: 'Bob Smith',
            phone_number: '+256772345678',
            email: 'bob@test.com',
            amount: 750000,
            purpose: 'Education Project',
            collection_date: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days
            status: 'pending'
        },
        // Mid-term: 45 days away (should get bi-weekly reminders - Tuesdays & Fridays 10AM)
        {
            donor_name: 'Carol Williams',
            phone_number: '+256773456789',
            email: 'carol@test.com',
            amount: 300000,
            purpose: 'Medical Support',
            collection_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days
            status: 'pending'
        },
        // Final month: 25 days away (should get bi-weekly reminders - Tuesdays & Fridays 10AM)
        {
            donor_name: 'David Brown',
            phone_number: '+256774567890',
            email: 'david@test.com',
            amount: 400000,
            purpose: 'Community Center',
            collection_date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), // 25 days
            status: 'pending'
        },
        // Final week: 5 days away (should get daily reminders - 9AM)
        {
            donor_name: 'Emma Davis',
            phone_number: '+256775678901',
            email: 'emma@test.com',
            amount: 200000,
            purpose: 'Youth Program',
            collection_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
            status: 'pending'
        },
        // Due today (should get reminder at 8AM)
        {
            donor_name: 'Frank Miller',
            phone_number: '+256776789012',
            email: 'frank@test.com',
            amount: 150000,
            purpose: 'Emergency Fund',
            collection_date: new Date(), // Today
            status: 'pending'
        },
        // Overdue: 3 days past (should get reminder at 5PM)
        {
            donor_name: 'Grace Wilson',
            phone_number: '+256777890123',
            email: 'grace@test.com',
            amount: 100000,
            purpose: 'School Fees',
            collection_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            status: 'pending'
        }
    ];
    
    const createdPledges = [];
    
    for (const pledge of testPledges) {
        try {
            const collectionDateStr = pledge.collection_date.toISOString().split('T')[0];
            
            const query = `
                INSERT INTO pledges 
                (donor_name, phone_number, email, amount, purpose, collection_date, status, deleted)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            `;
            
            const [result] = await pool.execute(query, [
                pledge.donor_name,
                pledge.phone_number,
                pledge.email,
                pledge.amount,
                pledge.purpose,
                collectionDateStr,
                pledge.status
            ]);
            
            const daysUntil = Math.ceil((pledge.collection_date - new Date()) / (1000 * 60 * 60 * 24));
            const category = daysUntil >= 60 ? 'Weekly' : daysUntil >= 30 ? 'Bi-weekly' : daysUntil >= 1 ? 'Final Week' : daysUntil === 0 ? 'Due Today' : 'Overdue';
            
            console.log(`[OK] Created pledge for ${pledge.donor_name}`);
            console.log(`    Amount: UGX ${pledge.amount.toLocaleString()}`);
            console.log(`    Due: ${collectionDateStr} (${daysUntil} days)`);
            console.log(`    Category: ${category}\n`);
            
            createdPledges.push({
                id: result.insertId,
                ...pledge,
                daysUntil,
                category
            });
        } catch (error) {
            console.error(`[ERROR] Failed to create pledge for ${pledge.donor_name}:`, error.message);
        }
    }
    
    return createdPledges;
}

async function testReminderQueries() {
    console.log('\n[STEP] Testing Reminder Query Functions...\n');
    
    const tests = [
        {
            name: 'Weekly Reminders (2+ months)',
            fn: advancedReminderService.getPledgesNeedingWeeklyReminder
        },
        {
            name: 'Bi-Weekly Reminders (30-60 days)',
            fn: advancedReminderService.getPledgesNeedingBiWeeklyReminder
        },
        {
            name: 'Final Week (1-7 days)',
            fn: advancedReminderService.getPledgesInFinalWeek
        },
        {
            name: 'Due Today',
            fn: advancedReminderService.getPledgesDueToday
        },
        {
            name: 'Overdue',
            fn: advancedReminderService.getOverduePledges
        }
    ];
    
    const results = {};
    
    for (const test of tests) {
        try {
            const pledges = await test.fn();
            results[test.name] = pledges.length;
            console.log(`[OK] ${test.name}: ${pledges.length} pledge(s)`);
            
            if (pledges.length > 0) {
                pledges.forEach(p => {
                    const days = p.days_until_due !== undefined ? p.days_until_due : 
                                 p.days_overdue !== undefined ? -p.days_overdue : 0;
                    console.log(`    - ${p.donor_name}: ${days} days, UGX ${Number(p.amount).toLocaleString()}`);
                });
            }
            console.log('');
        } catch (error) {
            console.error(`[ERROR] ${test.name} failed:`, error.message);
            results[test.name] = 'ERROR';
        }
    }
    
    return results;
}

async function testReminderSending() {
    console.log('\n[STEP] Testing Reminder Sending (Dry Run)...\n');
    console.log('[INFO] This will attempt to send actual reminders to test pledges.');
    console.log('[INFO] Make sure SMS/Email services are configured or set to test mode.\n');
    
    const tests = [
        {
            name: 'Weekly Reminders',
            fn: advancedReminderService.processWeeklyReminders
        },
        {
            name: 'Bi-Weekly Reminders',
            fn: advancedReminderService.processBiWeeklyReminders
        },
        {
            name: 'Final Week Reminders',
            fn: advancedReminderService.processFinalWeekReminders
        },
        {
            name: 'Due Today Reminders',
            fn: advancedReminderService.processDueTodayReminders
        },
        {
            name: 'Overdue Reminders',
            fn: advancedReminderService.processOverdueReminders
        }
    ];
    
    const results = {};
    
    for (const test of tests) {
        try {
            const result = await test.fn();
            results[test.name] = result;
            
            console.log(`[OK] ${test.name} complete`);
            console.log(`    Processed: ${result.processed}`);
            console.log(`    Successful: ${result.successful}`);
            console.log(`    Failed: ${result.failed}\n`);
        } catch (error) {
            console.error(`[ERROR] ${test.name} failed:`, error.message);
            results[test.name] = { error: error.message };
        }
    }
    
    return results;
}

async function displayTestSummary(createdPledges, queryResults, sendResults) {
    console.log('\n========================================');
    console.log('ADVANCED REMINDER SYSTEM TEST SUMMARY');
    console.log('========================================\n');
    
    console.log('TEST PLEDGES CREATED:');
    console.log(`  Total: ${createdPledges.length}`);
    
    const categoryCounts = createdPledges.reduce((acc, p) => {
        acc[p.category] = (acc[p.category] || 0) + 1;
        return acc;
    }, {});
    
    Object.entries(categoryCounts).forEach(([category, count]) => {
        console.log(`  ${category}: ${count}`);
    });
    console.log('');
    
    console.log('QUERY RESULTS:');
    Object.entries(queryResults).forEach(([name, count]) => {
        console.log(`  ${name}: ${count}`);
    });
    console.log('');
    
    console.log('REMINDER SENDING RESULTS:');
    Object.entries(sendResults).forEach(([name, result]) => {
        if (result.error) {
            console.log(`  ${name}: ERROR - ${result.error}`);
        } else {
            console.log(`  ${name}: ${result.successful}/${result.processed} sent`);
        }
    });
    console.log('');
    
    console.log('REMINDER SCHEDULE:');
    console.log('  Weekly (2+ months): Wednesdays at 2:00 PM');
    console.log('  Bi-Weekly (30-60 days): Tuesdays & Fridays at 10:00 AM');
    console.log('  Final Week (1-7 days): Daily at 9:00 AM');
    console.log('  Due Today: Daily at 8:00 AM');
    console.log('  Overdue: Daily at 5:00 PM');
    console.log('========================================\n');
}

async function cleanup() {
    console.log('[INFO] Cleaning up test pledges...');
    
    try {
        // Delete pledges created in this test session
        await pool.execute(`
            DELETE FROM pledges 
            WHERE donor_name IN (
                'Alice Johnson', 'Bob Smith', 'Carol Williams', 
                'David Brown', 'Emma Davis', 'Frank Miller', 'Grace Wilson'
            )
        `);
        
        console.log('[OK] Test pledges cleaned up\n');
    } catch (error) {
        console.error('[ERROR] Cleanup failed:', error.message);
    }
}

async function runTests() {
    console.log('\n========================================');
    console.log('ADVANCED REMINDER SYSTEM - TEST SUITE');
    console.log('========================================');
    
    try {
        // Step 1: Create test pledges
        const createdPledges = await createTestPledges();
        
        // Step 2: Test query functions
        const queryResults = await testReminderQueries();
        
        // Step 3: Test reminder sending
        const sendResults = await testReminderSending();
        
        // Step 4: Display summary
        await displayTestSummary(createdPledges, queryResults, sendResults);
        
        // Step 5: Ask if user wants to cleanup
        console.log('[INFO] Test complete!');
        console.log('[INFO] To clean up test data, run: node backend/scripts/test-advanced-reminders.js --cleanup');
        
    } catch (error) {
        console.error('\n[ERROR] Test suite failed:', error);
    } finally {
        await pool.end();
    }
}

// Check if cleanup flag is passed
if (process.argv.includes('--cleanup')) {
    cleanup().then(() => {
        console.log('[OK] Cleanup complete');
        process.exit(0);
    }).catch(error => {
        console.error('[ERROR] Cleanup failed:', error);
        process.exit(1);
    });
} else {
    runTests();
}
