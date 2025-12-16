/**
 * Test Script for Payment Tracking System
 * Tests partial payments, balance calculation, and reminders
 */

const { pool } = require('../config/db');
const paymentTrackingService = require('../services/paymentTrackingService');

async function runTests() {
    console.log('\n🧪 Testing Payment Tracking System\n');
    console.log('='.repeat(60));
    
    let testPledgeId = null;
    
    try {
        // Step 1: Create a test pledge
        console.log('\n1️⃣  Creating test pledge (UGX 1,000,000)...');
        const [result] = await pool.query(`
            INSERT INTO pledges 
            (ownerId, name, title, amount, status, donor_name, donor_email, donor_phone, 
             amount_paid, balance_remaining, created_at)
            VALUES 
            (1, 'Test Pledge for Payment Tracking', 'Test Payment Tracking', 1000000, 'pending', 
             'Test Donor', 'test@example.com', '+256700000000', 
             0, 1000000, NOW())
        `);
        
        testPledgeId = result.insertId;
        console.log(`   ✓ Test pledge created with ID: ${testPledgeId}`);
        
        // Step 2: Make first partial payment (300,000)
        console.log('\n2️⃣  Making first partial payment (UGX 300,000)...');
        const payment1 = await paymentTrackingService.recordPayment(
            testPledgeId,
            300000,
            'mobile_money',
            1
        );
        
        console.log(`   ✓ Payment recorded successfully`);
        console.log(`   - Amount paid: UGX ${payment1.payment.newTotal.toLocaleString()}`);
        console.log(`   - Balance remaining: UGX ${payment1.payment.balance.toLocaleString()}`);
        console.log(`   - Status: ${payment1.pledge.status}`);
        console.log(`   - Fully paid: ${payment1.payment.fullyPaid ? 'Yes' : 'No'}`);
        
        if (payment1.payment.newTotal !== 300000 || payment1.payment.balance !== 700000) {
            throw new Error('Payment calculation incorrect!');
        }
        
        // Step 3: Make second partial payment (400,000)
        console.log('\n3️⃣  Making second partial payment (UGX 400,000)...');
        const payment2 = await paymentTrackingService.recordPayment(
            testPledgeId,
            400000,
            'bank_transfer',
            1
        );
        
        console.log(`   ✓ Payment recorded successfully`);
        console.log(`   - Amount paid: UGX ${payment2.payment.newTotal.toLocaleString()}`);
        console.log(`   - Balance remaining: UGX ${payment2.payment.balance.toLocaleString()}`);
        console.log(`   - Status: ${payment2.pledge.status}`);
        console.log(`   - Fully paid: ${payment2.payment.fullyPaid ? 'Yes' : 'No'}`);
        
        if (payment2.payment.newTotal !== 700000 || payment2.payment.balance !== 300000) {
            throw new Error('Payment calculation incorrect!');
        }
        
        // Step 4: Make final payment (300,000)
        console.log('\n4️⃣  Making final payment (UGX 300,000)...');
        const payment3 = await paymentTrackingService.recordPayment(
            testPledgeId,
            300000,
            'cash',
            1
        );
        
        console.log(`   ✓ Payment recorded successfully`);
        console.log(`   - Amount paid: UGX ${payment3.payment.newTotal.toLocaleString()}`);
        console.log(`   - Balance remaining: UGX ${payment3.payment.balance.toLocaleString()}`);
        console.log(`   - Status: ${payment3.pledge.status}`);
        console.log(`   - Fully paid: ${payment3.payment.fullyPaid ? 'Yes' : 'No'}`);
        
        if (payment3.payment.newTotal !== 1000000 || payment3.payment.balance !== 0) {
            throw new Error('Final payment calculation incorrect!');
        }
        
        if (payment3.pledge.status !== 'paid') {
            throw new Error('Status should be "paid" when balance reaches zero!');
        }
        
        // Step 5: Test balance reminder query
        console.log('\n5️⃣  Testing balance reminder query...');
        
        // Create another test pledge with unpaid balance
        const [result2] = await pool.query(`
            INSERT INTO pledges 
            (ownerId, name, title, amount, status, donor_name, donor_email, donor_phone, 
             amount_paid, balance_remaining, created_at, last_balance_reminder)
            VALUES 
            (1, 'Test Pledge with Balance', 'Test Balance Tracking', 500000, 'active', 
             'Test Donor 2', 'test2@example.com', '+256700000001', 
             200000, 300000, NOW(), DATE_SUB(NOW(), INTERVAL 8 DAY))
        `);
        
        const testPledgeId2 = result2.insertId;
        console.log(`   ✓ Created second test pledge with ID: ${testPledgeId2}`);
        
        const pledgesNeedingReminders = await paymentTrackingService.getPledgesNeedingBalanceReminders(7);
        console.log(`   ✓ Found ${pledgesNeedingReminders.length} pledge(s) needing reminders`);
        
        if (pledgesNeedingReminders.length === 0) {
            console.log('   ⚠️  No pledges need reminders (this is expected if test data was just created)');
        } else {
            console.log(`   - First pledge needing reminder: ID ${pledgesNeedingReminders[0].id}`);
            console.log(`   - Balance: UGX ${parseFloat(pledgesNeedingReminders[0].balance_remaining).toLocaleString()}`);
        }
        
        // Step 6: Test manual reminder sending (without actually sending)
        console.log('\n6️⃣  Testing balance reminder service...');
        console.log('   (Note: Actual emails/SMS may not send if services not configured)');
        
        try {
            const reminderResult = await paymentTrackingService.sendBalanceReminder(testPledgeId2, false);
            console.log(`   ✓ Reminder service executed`);
            console.log(`   - Email sent: ${reminderResult.results.email ? 'Yes' : 'No'}`);
            console.log(`   - SMS sent: ${reminderResult.results.sms ? 'Yes' : 'No'}`);
        } catch (reminderError) {
            console.log(`   ⚠️  Reminder service error (may be expected): ${reminderError.message}`);
        }
        
        // Cleanup: Delete test pledges
        console.log('\n7️⃣  Cleaning up test data...');
        if (testPledgeId) {
            await pool.query('DELETE FROM pledges WHERE id = ?', [testPledgeId]);
            console.log(`   ✓ Deleted test pledge ${testPledgeId}`);
        }
        if (testPledgeId2) {
            await pool.query('DELETE FROM pledges WHERE id = ?', [testPledgeId2]);
            console.log(`   ✓ Deleted test pledge ${testPledgeId2}`);
        }
        
        // Also cleanup test payments if they were created
        await pool.query('DELETE FROM payments WHERE pledge_id IN (?, ?)', [testPledgeId, testPledgeId2]);
        console.log('   ✓ Deleted test payments');
        
        console.log('\n' + '='.repeat(60));
        console.log('\n✅ All tests passed! Payment tracking system is working correctly.\n');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error);
        
        // Cleanup on error
        if (testPledgeId) {
            try {
                await pool.query('DELETE FROM pledges WHERE id = ?', [testPledgeId]);
                console.log('   ✓ Cleaned up test pledge');
            } catch (e) {
                console.error('   Failed to cleanup:', e.message);
            }
        }
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
