// scripts/list-pledges.js
// Lists pledges and their deleted status for troubleshooting reminder issues

const { pool } = require('../backend/config/db');

async function listPledges() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, deleted, donor_name, purpose, collection_date FROM pledges ORDER BY id DESC LIMIT 20'
    );
    console.table(rows);
    process.exit(0);
  } catch (err) {
    console.error('Error listing pledges:', err.message);
    process.exit(1);
  }
}

listPledges();
