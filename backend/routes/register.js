const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');
const router = express.Router();

// POST /api/register (public)
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !phone || !password) {
      return res.status(400).json({ error: 'Name, phone, and password are required.' });
    }
    // Treat empty string as no email
    const safeEmail = email && email.trim() ? email.trim() : null;
    // Strong password validation
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.'
      });
    }
    // If email is provided, check if already exists
    if (safeEmail) {
      const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [safeEmail]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered.' });
      }
    }
    // Check if phone number already exists
    const [existingPhone] = await pool.query('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, phone, password) VALUES (?, ?, ?, ?)',
      [name, safeEmail, phone, hashedPassword]
    );
    const userId = result.insertId;
    const [users] = await pool.query('SELECT id, name, email, phone FROM users WHERE id = ?', [userId]);
    const user = users[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

module.exports = router;
