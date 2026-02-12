/**
 * Check the payments table schema
 */

require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function checkSchema() {
  try {
    console.log('📋 Checking payments table schema...\n');
    const [columns] = await pool.execute('DESCRIBE payments');
    
    console.log('Columns in payments table:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'nullable' : 'required'}`);
    });
    
    console.log('\n✓ Schema retrieved successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkSchema();
