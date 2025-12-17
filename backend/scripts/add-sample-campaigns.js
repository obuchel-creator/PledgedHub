const { pool } = require('../config/db');

async function addSampleCampaigns() {
  try {
    console.log('🚀 Adding sample campaigns...\n');

    const sampleCampaigns = [
      {
        name: 'School Library Renovation',
        description: 'Help us renovate our school library to provide better learning resources for 500+ students.',
        target_amount: 50000000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      },
      {
        name: 'Community Health Center',
        description: 'Build a new health center to serve the community with quality healthcare services.',
        target_amount: 100000000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      },
      {
        name: 'Youth Sports Equipment',
        description: 'Purchase sports equipment for youth development programs in the community.',
        target_amount: 15000000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      },
      {
        name: 'Water Well Project',
        description: 'Construct a clean water well for rural villages lacking access to safe drinking water.',
        target_amount: 30000000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      },
      {
        name: 'Teacher Training Program',
        description: 'Fund professional development training for 100 teachers to improve educational quality.',
        target_amount: 25000000,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active'
      }
    ];

    for (const campaign of sampleCampaigns) {
      const [result] = await pool.execute(
        'INSERT INTO campaigns (name, description, target_amount, start_date, end_date, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [campaign.name, campaign.description, campaign.target_amount, campaign.start_date, campaign.end_date, campaign.status]
      );

      console.log(`✅ Created: "${campaign.name}"`);
      console.log(`   ID: ${result.insertId} | Goal: ${campaign.target_amount} UGX\n`);
    }

    console.log('✨ All sample campaigns created successfully!\n');
    console.log('📊 Summary:');
    console.log('   - 5 active campaigns added');
    console.log('   - Total combined goal: 220,000,000 UGX');
    console.log('   - Ready for testing\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding campaigns:', error.message);
    process.exit(1);
  }
}

addSampleCampaigns();
