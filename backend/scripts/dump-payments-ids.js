/**
 * Dump full payment rows for given ids
 */
require('dotenv').config({ path: '../.env' });
const { pool } = require('../config/db');

async function dump() {
  try {
    const ids = [1,2];
    const [rows] = await pool.execute('SELECT * FROM payments WHERE id IN (?, ?) ORDER BY id', ids);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

dump();
