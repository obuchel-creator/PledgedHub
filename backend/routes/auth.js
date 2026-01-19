const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');


// Register
router.post('/register', async (req, res) => {
  console.log(`[REGISTER] POST /api/register`, req.body);
  try {
    const { name, username, phone, email, password } = req.body;
    if (!name || !username || !phone || !password) {
      return res.status(400).json({ error: 'Name, username, phone, and password are required.' });
    }
    // Normalize phone to 256XXXXXXXXX (Uganda format, no plus)
    let normalizedPhone = phone.replace(/\+/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '256' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('256')) {
      normalizedPhone = '256' + normalizedPhone;
    }
    // Validate phone format
    const phonePattern = /^256\d{9}$/;
    if (!phonePattern.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Phone number must be in format 256XXXXXXXXX.' });
    }
    // Check for existing phone number
    const [existingPhone] = await pool.execute('SELECT * FROM users WHERE phone = ?', [normalizedPhone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    if (email) {
      const [existing] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }
    const [existingUser] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [insertResult] = await pool.execute(
      'INSERT INTO users (name, username, phone, email, password, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, username, normalizedPhone, email || null, hash]
    );
    const userId = insertResult.insertId;
    if (!userId) throw new Error('User insert failed: missing insertId');
    const [rows] = await pool.execute('SELECT id, name, username, phone, email FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(500).json({ error: 'User not found after insert' });
    const token = jwt.sign({ id: user.id, name: user.name, username: user.username, phone: user.phone, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const response = { token, user, success: true };
    console.log('[REGISTER] Sending response:', response);
    res.status(201).json(response);
  } catch (err) {
    // Enhanced error logging for debugging
    console.error('[REGISTER ERROR]', err);
    if (err && err.stack) {
      console.error('[REGISTER ERROR STACK]', err.stack);
    }
    if (err && err.sqlMessage) {
      console.error('[REGISTER SQL ERROR]', err.sqlMessage);
    }
    if (err.message && err.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'User already exists.' });
    }
    res.status(500).json({
      error: err.message || 'Server error.',
      details: err.sqlMessage || err.stack || null
    });
  }
});

// Login - supports email, username, or phone
const authService = require('../services/authService');
router.post('/login', async (req, res) => {
  let { email, password } = req.body;
  console.log('[LOGIN] Incoming login request:', { email, password: password ? '***' : undefined });
  if (!email || !password) {
    console.warn('[LOGIN] Missing email or password');
    return res.status(400).json({ success: false, error: 'Email/username/phone and password are required' });
  }
  // If email looks like a phone, normalize it
  if (typeof email === 'string' && email.match(/^\+?\d{10,15}$/)) {
    let normalizedPhone = email.replace(/\+/g, '');
    if (normalizedPhone.startsWith('0')) {
      normalizedPhone = '256' + normalizedPhone.substring(1);
    } else if (!normalizedPhone.startsWith('256')) {
      normalizedPhone = '256' + normalizedPhone;
    }
    email = normalizedPhone;
  }
  const result = await authService.login({ email, password });
  if (result.success) {
    console.log('[LOGIN] Login successful for:', email);
    res.json(result.data); // Only send { token, user }
  } else {
    console.warn('[LOGIN] Login failed for:', email, '| Reason:', result.error);
    res.status(401).json({ success: false, error: result.error });
  }
});

module.exports = router;

