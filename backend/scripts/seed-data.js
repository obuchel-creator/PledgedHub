const { pool } = require('../config/db');

/**
 * Seed Test Data Script
 * Creates sample data for development and testing
 */

async function seedData() {
    console.log('🌱 Seeding test data...\n');
    
    try {
        // Check if data already exists
        const [existingPledges] = await pool.execute('SELECT COUNT(*) as count FROM pledges WHERE deleted = 0');
        
        if (existingPledges[0].count > 10) {
            console.log('⚠️  Database already contains data. Skipping seeding.');
            console.log(`   Current pledge count: ${existingPledges[0].count}`);
            process.exit(0);
        }
        
        // Create test campaigns
        console.log('📋 Creating test campaigns...');
        const campaigns = [
            ['Church Building Fund', 'Fund for constructing new church building', 'active', '2025-12-31'],
            ['Youth Ministry', 'Supporting youth programs and activities', 'active', '2025-12-31'],
            ['Community Outreach', 'Food and aid for community members', 'active', '2025-12-31']
        ];
        
        const campaignIds = [];
        for (const campaign of campaigns) {
            const [result] = await pool.execute(
                'INSERT INTO campaigns (name, description, status, end_date) VALUES (?, ?, ?, ?)',
                campaign
            );
            campaignIds.push(result.insertId);
            console.log(`   ✅ Created: ${campaign[0]}`);
        }
        
        // Create test pledges
        console.log('\n💰 Creating test pledges...');
        const today = new Date();
        const pledges = [
            // Paid pledges
            {
                donor_name: 'John Doe',
                donor_email: 'john@example.com',
                donor_phone: '+256700123456',
                amount: 500000,
                amount_paid: 500000,
                balance_remaining: 0,
                purpose: 'Church Building',
                collection_date: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'paid',
                campaign_id: campaignIds[0],
                description: 'Monthly pledge for building fund'
            },
            {
                donor_name: 'Jane Smith',
                donor_email: 'jane@example.com',
                donor_phone: '+256701234567',
                amount: 300000,
                amount_paid: 300000,
                balance_remaining: 0,
                purpose: 'Youth Ministry',
                collection_date: new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'paid',
                campaign_id: campaignIds[1],
                description: 'Support for youth programs'
            },
            // Partially paid pledges
            {
                donor_name: 'Peter Johnson',
                donor_email: 'peter@example.com',
                donor_phone: '+256702345678',
                amount: 1000000,
                amount_paid: 600000,
                balance_remaining: 400000,
                purpose: 'Church Building',
                collection_date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'partial',
                campaign_id: campaignIds[0],
                description: 'Large pledge - paying in installments'
            },
            {
                donor_name: 'Mary Williams',
                donor_email: 'mary@example.com',
                donor_phone: '+256703456789',
                amount: 400000,
                amount_paid: 150000,
                balance_remaining: 250000,
                purpose: 'Community Outreach',
                collection_date: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'partial',
                campaign_id: campaignIds[2],
                description: 'Ongoing monthly support'
            },
            // Pending pledges (due soon)
            {
                donor_name: 'David Brown',
                donor_email: 'david@example.com',
                donor_phone: '+256704567890',
                amount: 250000,
                amount_paid: 0,
                balance_remaining: 250000,
                purpose: 'Youth Ministry',
                collection_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending',
                campaign_id: campaignIds[1],
                description: 'Upcoming pledge payment'
            },
            {
                donor_name: 'Sarah Davis',
                donor_email: 'sarah@example.com',
                donor_phone: '+256705678901',
                amount: 350000,
                amount_paid: 0,
                balance_remaining: 350000,
                purpose: 'Church Building',
                collection_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending',
                campaign_id: campaignIds[0],
                description: 'Due in 3 days'
            },
            {
                donor_name: 'Michael Wilson',
                donor_email: 'michael@example.com',
                donor_phone: '+256706789012',
                amount: 450000,
                amount_paid: 0,
                balance_remaining: 450000,
                purpose: 'Community Outreach',
                collection_date: today.toISOString().split('T')[0],
                status: 'pending',
                campaign_id: campaignIds[2],
                description: 'Due today'
            },
            // Overdue pledges
            {
                donor_name: 'Robert Taylor',
                donor_email: 'robert@example.com',
                donor_phone: '+256707890123',
                amount: 200000,
                amount_paid: 0,
                balance_remaining: 200000,
                purpose: 'Youth Ministry',
                collection_date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'overdue',
                campaign_id: campaignIds[1],
                description: 'Overdue by 5 days'
            },
            {
                donor_name: 'Linda Martinez',
                donor_email: 'linda@example.com',
                donor_phone: '+256708901234',
                amount: 300000,
                amount_paid: 0,
                balance_remaining: 300000,
                purpose: 'Church Building',
                collection_date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'overdue',
                campaign_id: campaignIds[0],
                description: 'Overdue by 15 days'
            },
            // Future pledges
            {
                donor_name: 'James Anderson',
                donor_email: 'james@example.com',
                donor_phone: '+256709012345',
                amount: 600000,
                amount_paid: 0,
                balance_remaining: 600000,
                purpose: 'Community Outreach',
                collection_date: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                status: 'pending',
                campaign_id: campaignIds[2],
                description: 'Future pledge due in 30 days'
            }
        ];
        
        for (const pledge of pledges) {
            const [result] = await pool.execute(
                `INSERT INTO pledges (
                    donor_name, donor_email, donor_phone, amount, amount_paid, 
                    balance_remaining, purpose, collection_date, status, 
                    campaign_id, description, name
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    pledge.donor_name,
                    pledge.donor_email,
                    pledge.donor_phone,
                    pledge.amount,
                    pledge.amount_paid,
                    pledge.balance_remaining,
                    pledge.purpose,
                    pledge.collection_date,
                    pledge.status,
                    pledge.campaign_id,
                    pledge.description,
                    pledge.description // name field
                ]
            );
            console.log(`   ✅ Created pledge: ${pledge.donor_name} - UGX ${pledge.amount.toLocaleString()}`);
        }
        
        // Create some payment records for partially paid pledges
        console.log('\n💳 Creating payment records...');
        const [partialPledges] = await pool.execute(
            "SELECT id, donor_name, amount_paid FROM pledges WHERE status = 'partial' LIMIT 2"
        );
        
        for (const pledge of partialPledges) {
            const [result] = await pool.execute(
                `INSERT INTO payments (
                    pledge_id, amount, payment_date, payment_method, notes
                ) VALUES (?, ?, ?, ?, ?)`,
                [
                    pledge.id,
                    pledge.amount_paid,
                    new Date().toISOString().split('T')[0],
                    'cash',
                    'Partial payment'
                ]
            );
            console.log(`   ✅ Created payment record for ${pledge.donor_name}`);
        }
        
        // Summary
        console.log('\n📊 Seeding Summary:');
        const [pledgeCount] = await pool.execute('SELECT COUNT(*) as count FROM pledges WHERE deleted = 0');
        const [campaignCount] = await pool.execute('SELECT COUNT(*) as count FROM campaigns');
        const [paymentCount] = await pool.execute('SELECT COUNT(*) as count FROM payments');
        
        console.log(`   Campaigns: ${campaignCount[0].count}`);
        console.log(`   Pledges: ${pledgeCount[0].count}`);
        console.log(`   Payments: ${paymentCount[0].count}`);
        
        console.log('\n✅ Test data seeded successfully!\n');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run seeding
seedData();
