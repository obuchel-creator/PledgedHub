require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function up() {
  const queries = [
    `ALTER TABLE payments ADD INDEX idx_payment_date (payment_date);`,
    `ALTER TABLE payments ADD INDEX idx_pledge_id (pledge_id);`
  ];

  try {
    for (const q of queries) {
      console.log('Running:', q);
      await pool.execute(q);
    }
    console.log('Indexes created');
  } catch (e) {
    if (e && e.code === 'ER_DUP_KEYNAME') {
      console.log('Index already exists');
    } else {
      console.error('Error creating indexes:', e.message);
    }
  } finally {
    process.exit(0);
  }
}

up();
