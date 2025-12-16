const { pool } = require('../../config/db');
const axios = require('axios');

async function cleanupTestUsers() {
  await pool.execute("DELETE FROM users WHERE email LIKE 'test_%'");
}

async function createTestUser({ name = 'Test User', email, password = 'testpass123' } = {}) {
  if (!email) email = `test_${Date.now()}@example.com`;
  // Use HTTP to hit the real register endpoint
  const res = await axios.post('http://localhost:5001/api/auth/register', { name, email, password });
  return { ...res.data, email, password };
}

module.exports = {
  cleanupTestUsers,
  createTestUser,
};
