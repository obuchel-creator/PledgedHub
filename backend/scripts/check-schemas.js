/**
 * Check both table schemas
 */

require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function checkSchemas() {
  try {
    console.log('🔍 Checking database schemas...\n');
    
    console.log('📋 PLEDGES TABLE COLUMNS:');
    const [pledgeColumns] = await pool.execute('DESCRIBE pledges');
    pledgeColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    console.log('\n📋 PAYMENTS TABLE COLUMNS:');
    const [paymentColumns] = await pool.execute('DESCRIBE payments');
    paymentColumns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    console.log('\n✓ Schema check complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkSchemas();
