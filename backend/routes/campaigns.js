const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const db = { query: pool.query.bind(pool), execute: pool.execute.bind(pool) };

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM campaigns WHERE deleted = 0 OR deleted IS NULL';
    const params = [];
    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = params.length
      ? await db.execute(sql, params)
      : await db.query(sql);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Campaigns route error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
