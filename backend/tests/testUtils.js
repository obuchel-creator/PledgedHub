
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'TestPassword123!';

// Insert a real test user into the DB and return {user, token}
async function setupTestUser(overrides = {}) {
    // Debug: Log current database and tables
    try {
      const [dbRows] = await pool.query('SELECT DATABASE() AS db');
      console.log('Current DB:', dbRows[0] && dbRows[0].db);
      const [tables] = await pool.query('SHOW TABLES');
      console.log('Tables in DB:', tables);
    } catch (metaErr) {
      console.error('DB meta query error:', metaErr);
    }
  // Remove if exists
  await pool.execute('DELETE FROM users WHERE email = ?', [TEST_USER_EMAIL]);
  const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 8);
  // Generate a unique phone number in international format for each test run
  const uniquePhone = overrides.phone_number || ('+2567' + Math.floor(10000000 + Math.random() * 90000000));
  let dbResult;
  let insertSql = `INSERT INTO users (username, email, password_hash, role, phone_number, name) VALUES (?, ?, ?, ?, ?, ?)`;
  let insertParams = [
    overrides.username || 'testuser',
    TEST_USER_EMAIL,
    hashedPassword,
    overrides.role || 'admin',
    uniquePhone,
    overrides.name || 'Test User'
  ];
  try {
    dbResult = await pool.execute(insertSql, insertParams);
    console.log('TEST USER INSERT db.execute RESULT:', dbResult);
  } catch (err) {
    console.error('TEST USER INSERT db.execute SQL ERROR:', err);
    console.error('SQL:', insertSql);
    console.error('Params:', insertParams);
  }
  let userId = dbResult && dbResult[0] && dbResult[0].insertId;
  if (!userId && dbResult) {
    // Try to log the full dbResult for debugging
    console.log('dbResult keys:', Object.keys(dbResult));
    console.log('dbResult full:', dbResult);
  }
  // Fetch the inserted user for debugging and for JWT
  let insertedUser = null;
  try {
    if (userId) {
      const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
      insertedUser = rows && rows[0];
    } else {
      // Try to fetch by email or phone if insertId is missing
      const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? OR phone_number = ?', [TEST_USER_EMAIL, uniquePhone]);
      insertedUser = rows && rows[0];
    }
    console.log('FETCHED INSERTED USER:', insertedUser);
  } catch (fetchErr) {
    console.error('FETCH INSERTED USER ERROR:', fetchErr);
  }
  const user = insertedUser || {
    id: userId,
    email: TEST_USER_EMAIL,
    name: overrides.name || 'Test User',
    role: overrides.role || 'admin',
    phone_number: uniquePhone
  };
  const token = jwt.sign({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone_number: user.phone_number
  }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
  return { user, token };
}

// Remove the test user from DB
async function teardownTestUser() {
  await pool.execute('DELETE FROM users WHERE email = ?', [TEST_USER_EMAIL]);
}

module.exports = { setupTestUser, teardownTestUser, TEST_USER_EMAIL, TEST_USER_PASSWORD };
