const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { initializeNewUser } = require('../services/userInitializationService');


// Register
router.post('/register', async (req, res) => {
  console.log(`[REGISTER] POST /api/register`, req.body);
  console.log(`[REGISTER] DB Connection - Host: ${process.env.DB_HOST}, DB: ${process.env.DB_NAME}, User: ${process.env.DB_USER}`);
  const connection = await pool.getConnection();
  
  try {
    // ✅ FIX: Ensure connection uses correct database
    await connection.query(`USE \`${process.env.DB_NAME}\``);
    await connection.beginTransaction();
    
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
    const [existingPhone] = await connection.execute('SELECT * FROM users WHERE phone = ?', [normalizedPhone]);
    if (existingPhone.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }
    if (email) {
      const [existing] = await connection.execute('SELECT * FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
    }
    const [existingUser] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    const hash = await bcrypt.hash(password, 10);
    const [insertResult] = await connection.execute(
      'INSERT INTO users (name, username, phone, email, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, username, normalizedPhone, email || null, hash, 'user']
    );
    const userId = insertResult.insertId;
    if (!userId) throw new Error('User insert failed: missing insertId');
    
    await connection.commit();
    
    // ✅ CRITICAL: Initialize user with all required profiles (AFTER commit, use pool)
    console.log(`[REGISTER] About to call initializeNewUser for user ${userId}`);
    try {
      const initResult = await initializeNewUser(userId, { name, username, phone: normalizedPhone, email });
      console.log(`[REGISTER] User ${userId} fully initialized:`, initResult);
    } catch (initError) {
      console.error(`[REGISTER] ❌ INITIALIZATION FAILED:`, initError);
      console.error(`[REGISTER] Error message:`, initError.message);
      console.error(`[REGISTER] Error stack:`, initError.stack);
      throw initError;
    }
    
    const [rows] = await pool.execute('SELECT id, name, username, phone, email, role FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user) return res.status(500).json({ error: 'User not found after insert' });
    const token = jwt.sign({ 
      id: user.id, 
      name: user.name, 
      username: user.username, 
      phone: user.phone, 
      email: user.email,
      role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const response = { token, user, success: true };
    console.log('[REGISTER] Sending response:', response);
    res.status(201).json(response);
  } catch (err) {
    await connection.rollback();
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
  } finally {
    connection.release();
  }
});

// Login - supports email, username, or phone
const authService = require('../services/authService');
const { validateUserForLogin, logLoginAttempt } = require('../services/userInitializationService');

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
    const user = result.data.user;
    
    // ✅ CRITICAL: Validate user before issuing token
    const validation = await validateUserForLogin(user.id);
    if (!validation.success) {
      console.warn('[LOGIN] User validation failed:', validation.error);
      await logLoginAttempt(user.id, false, validation.error, req.ip);
      
      return res.status(403).json({ 
        success: false, 
        error: validation.error,
        code: validation.code
      });
    }
    
    console.log('[LOGIN] Login successful for:', email);
    
    // ✅ Log successful login
    await logLoginAttempt(user.id, true, null, req.ip);
    
    res.json(result.data); // Only send { token, user }
  } else {
    console.warn('[LOGIN] Login failed for:', email, '| Reason:', result.error);
    
    // Try to log failed attempt (best effort)
    try {
      const [users] = await pool.execute(
        'SELECT id FROM users WHERE email = ? OR username = ? OR phone = ? LIMIT 1',
        [email, email, email]
      );
      if (users.length > 0) {
        await logLoginAttempt(users[0].id, false, result.error, req.ip);
      }
    } catch (e) {
      // Ignore logging error
    }
    
    res.status(401).json({ success: false, error: result.error });
  }
});

module.exports = router;

