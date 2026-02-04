require('dotenv').config();
const { pool } = require('./config/db');

(async () => {
  try {
    console.log('Checking campaigns...\n');
    
    const [campaigns] = await pool.execute(
      'SELECT * FROM campaigns WHERE deleted = 0 ORDER BY created_at DESC'
    );
    
    console.log(`Total campaigns: ${campaigns.length}\n`);
    
    if (campaigns.length === 0) {
      console.log('No campaigns found in database.');
      
      // Check if table exists
      const [tables] = await pool.execute("SHOW TABLES LIKE 'campaigns'");
      if (tables.length === 0) {
        console.log('❌ Campaigns table does not exist!');
      } else {
        console.log('✅ Campaigns table exists but is empty');
        
        // Check for soft-deleted campaigns
        const [deleted] = await pool.execute('SELECT COUNT(*) as count FROM campaigns WHERE deleted = 1');
        console.log(`Soft-deleted campaigns: ${deleted[0].count}`);
        
        // Check all campaigns
        const [all] = await pool.execute('SELECT COUNT(*) as count FROM campaigns');
        console.log(`Total campaigns (including deleted): ${all[0].count}`);
      }
    } else {
      campaigns.forEach(c => {
        console.log(`ID: ${c.id}`);
        console.log(`Name: ${c.name}`);
        console.log(`Goal: ${c.goal_amount}`);
        console.log(`Current: ${c.current_amount}`);
        console.log(`Status: ${c.status}`);
        console.log(`Creator: ${c.creator_id}`);
        console.log(`Created: ${c.created_at}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
