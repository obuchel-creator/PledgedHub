require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function markTest() {
  try {
    const idToMark = 2; // suspected/mock payment
    const note = 'Marked as test by admin script on 2026-02-12';
    const [res] = await pool.execute('UPDATE payments SET verification_status = ?, verification_notes = ? WHERE id = ?', ['rejected', note, idToMark]);
    console.log('Updated rows:', res.affectedRows);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

markTest();
