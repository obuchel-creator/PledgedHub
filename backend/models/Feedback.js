// Feedback model for MySQL
const { pool } = require('../config/db');

async function createFeedback({ message, userAgent, date }) {
  const sql = 'INSERT INTO feedback (message, user_agent, created_at) VALUES (?, ?, ?)';
  await pool.query(sql, [message, userAgent, date]);
  return { success: true };
}

module.exports = { createFeedback };
