require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool } = require('../config/db');

async function checkTableStructure() {
  try {
    const [cols] = await pool.execute('DESCRIBE users');
    console.log('\n📋 Users Table Structure:\n');
    cols.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();
