const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;

async function login({ email, password }) {
  try {
    console.log('[AUTH SERVICE] login() called with:', { email, password: password ? '***' : undefined });
    // Accept email, username, or phone
    const [users] = await pool.execute(
      `SELECT * FROM users WHERE email = ? OR username = ? OR phone = ? LIMIT 1`,
      [email, email, email]
    );
    console.log('[AUTH SERVICE] DB query result:', users);
    const user = users[0];
    if (!user) {
      console.warn('[AUTH SERVICE] User not found for:', email);
      return { success: false, error: 'User not found' };
    }

    // Compare password with password_hash or password (legacy)
    // Try all possible password fields for legacy and new users
      console.log('[AUTH SERVICE] Full user object:', user);
      // Always use user.password if present (as per DB schema)
      let hash = undefined;
      if (user.password && typeof user.password === 'string' && user.password.startsWith('$2b$')) {
        hash = user.password;
      } else if (user.password_hash) {
        hash = user.password_hash;
      } else if (user.passwordHash) {
        hash = user.passwordHash;
      } else if (user.PASSWORD_HASH) {
        hash = user.PASSWORD_HASH;
      } else if (user.PASSWORD) {
        hash = user.PASSWORD;
      }
    console.log('[AUTH SERVICE] Using hash for bcrypt.compare:', hash);
    if (!hash) {
      console.warn('[AUTH SERVICE] No password hash found for user:', user.id, '| user object:', user);
      return { success: false, error: 'No password set for user' };
    }
    const match = await bcrypt.compare(password, hash);
    console.log('[AUTH SERVICE] Password match:', match);
    if (!match) {
      console.warn('[AUTH SERVICE] Invalid password for:', email);
      return { success: false, error: 'Invalid password' };
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user info (omit password and password_hash)
    const { password: _password, password_hash: _password_hash, ...userData } = user;
    console.log('[AUTH SERVICE] Login success, user:', userData);
    return { success: true, data: { token, user: userData } };
  } catch (error) {
    console.error('[AUTH SERVICE] Exception:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { login };
