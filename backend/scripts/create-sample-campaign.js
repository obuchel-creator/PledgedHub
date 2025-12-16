const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

async function createSampleCampaign() {
    try {
        console.log('🔍 Checking for existing campaigns...');
        
        // Check if campaigns table exists and has data
        const [campaigns] = await db.execute('SELECT * FROM campaigns');
        
        console.log(`📊 Found ${campaigns.length} campaign(s) in database`);
        
        if (campaigns.length > 0) {
            console.log('\n📋 Existing campaigns:');
            campaigns.forEach(c => {
                console.log(`   - ID: ${c.id} | Title: ${c.title} | Status: ${c.status} | Goal: ${c.goal_amount}`);
            });
        } else {
            console.log('\n✨ Creating sample campaigns...');
            
            const sampleCampaigns = [
                {
                    title: 'School Library Renovation',
                    description: 'Help us renovate our school library to provide better learning resources for 500+ students.',
                    goalAmount: 50000000,
                    suggestedAmount: 1000000
                },
                {
                    title: 'Community Health Center',
                    description: 'Build a new health center to serve the community with quality healthcare services.',
                    goalAmount: 100000000,
                    suggestedAmount: 2000000
                },
                {
                    title: 'Youth Sports Equipment',
                    description: 'Purchase sports equipment for youth development programs in the community.',
                    goalAmount: 15000000,
                    suggestedAmount: 500000
                }
            ];
            
            for (const campaign of sampleCampaigns) {
                const [result] = await db.execute(
                    `INSERT INTO campaigns (title, description, goal_amount, suggested_amount, status, created_at, updated_at)
                     VALUES (?, ?, ?, ?, 'active', NOW(), NOW())`,
                    [campaign.title, campaign.description, campaign.goalAmount, campaign.suggestedAmount]
                );
                
                console.log(`   ✅ Created: ${campaign.title} (ID: ${result.insertId})`);
            }
            
            console.log('\n🎉 Sample campaigns created successfully!');
        }
        
        console.log('\n✅ Done!');
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        await db.close();
        process.exit(1);
    }
}

createSampleCampaign();
