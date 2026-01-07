const mysql = require('mysql2/promise');

async function showTables() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '', // No password
    database: 'pledgehub_db'
  });

  try {
    const [rows] = await pool.query('SHOW TABLES');
    console.log('Tables in pledgehub_db:');
    rows.forEach(row => console.log(Object.values(row)[0]));
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    pool.end();
  }
}

showTables();