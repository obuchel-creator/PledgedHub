const { execute } = require('../config/db');

async function getFeedbacks({ page = 1, pageSize = 20 }) {
  const offset = (page - 1) * pageSize;
  const sql = 'SELECT * FROM feedback ORDER BY created_at DESC LIMIT ? OFFSET ?';
  const [rows] = await execute(sql, [pageSize, offset]);
  return rows;
}

module.exports = { getFeedbacks };
