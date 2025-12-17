// Standalone test: Insert a user into the users table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'pledgehub_db',
  });
  try {
    const [result] = await pool.execute(
      `INSERT INTO users (username, email, password_hash, role, phone_number, name) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        'standalone_test',
        'standalone_test@example.com',
        'hash',
        'admin',
        '256700000001',
        'Standalone Test'
      ]
    );
    console.log('Standalone insert result:', result);
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', ['standalone_test']);
    console.log('Inserted user:', rows[0]);
  } catch (err) {
    console.error('Standalone insert error:', err);
  } finally {
    await pool.end();
  }
}

main();
