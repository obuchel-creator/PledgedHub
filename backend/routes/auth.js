
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
    const phonePattern = /^\+\d{9,15}$/;
    if (!name || !username || !phone || !password) {
      return res.status(400).json({ error: 'Name, username, phone, and password are required.' });
    }
    if (!phonePattern.test(phone)) {
      return res.status(400).json({ error: 'Phone number must be in format +256771234567.' });
    }
    // Check for existing phone number
    const [existingPhone] = await pool.execute('SELECT * FROM users WHERE phone = ?', [phone]);
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
      [name, username, phone, email || null, hash]
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
    console.error('[REGISTER ERROR]', err);
    if (err.message && err.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'User already exists.' });
    }
    res.status(500).json({ error: err.message || 'Server error.' });
  }
});

// Login - supports email, phone, or username
router.post('/login', async (req, res) => {
  console.log('[LOGIN] POST /api/auth/login', { identifier: req.body.email || req.body.phone || req.body.username });
  const { email, phone, username, password } = req.body;
  const identifier = email || phone || username;
  
  if (!identifier || !password) {
    return res.status(400).json({ error: 'Email/phone/username and password are required' });
  }
  
  try {
    // Query by email, phone, or username
    let query = 'SELECT * FROM users WHERE ';
    let params = [];
    
    if (email) {
      query += 'email = ?';
      params.push(email);
    } else if (phone) {
      query += 'phone = ?';
      params.push(phone);
    } else {
      query += 'username = ?';
      params.push(username);
    }
    
    const [users] = await pool.execute(query, params);
    const user = users[0];
    
    if (!user) {
      console.log('[LOGIN] User not found for identifier:', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('[LOGIN] User found:', { id: user.id, email: user.email, username: user.username });
    console.log('[LOGIN] Password provided length:', password?.length);
    console.log('[LOGIN] Stored hash length:', user.password?.length);
    console.log('[LOGIN] Password provided (first 5 chars):', password?.substring(0, 5));
    
    // Compare password with hashed password
    const match = await bcrypt.compare(password, user.password);
    
    console.log('[LOGIN] bcrypt.compare result:', match);
    
    if (!match) {
      console.log('[LOGIN] Password mismatch for user:', user.id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        name: user.name, 
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role 
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    
    console.log('[LOGIN] Success for user:', user.id);
    res.json({ 
      success: true,
      token, 
      user: userWithoutPassword 
    });
    
  } catch (err) {
    console.error('[LOGIN ERROR]', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

module.exports = router;

