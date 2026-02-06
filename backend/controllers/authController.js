const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');

require('dotenv').config();

// Security: Rate limiting storage (in-memory for simplicity, use Redis in production)
const loginAttempts = new Map();
const LOGIN_ATTEMPT_LIMIT = 5;
const LOGIN_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes

// Security: Track active sessions (for logout functionality)
const activeSessions = new Set();

/**
 * Helper to sign JWTs with secure defaults.
 * Payload should avoid sensitive data; include only minimal identifiers.
 */
function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const jti = crypto.randomUUID(); // Unique token ID for tracking
    const token = jwt.sign({ ...payload, jti }, secret, { expiresIn });
    activeSessions.add(jti); // Track active session
    return { token, jti };
}

/**
 * Security: Check if account is locked due to failed login attempts
 */
function isAccountLocked(identifier) {
    const attempts = loginAttempts.get(identifier);
    if (!attempts) return false;
    
    const now = Date.now();
    const recentAttempts = attempts.filter(time => now - time < LOGIN_ATTEMPT_WINDOW);
    
    if (recentAttempts.length >= LOGIN_ATTEMPT_LIMIT) {
        return true;
    }
    
    // Clean up old attempts
    loginAttempts.set(identifier, recentAttempts);
    return false;
}

/**
 * Security: Record failed login attempt
 */
function recordFailedAttempt(identifier) {
    const attempts = loginAttempts.get(identifier) || [];
    attempts.push(Date.now());
    loginAttempts.set(identifier, attempts);
}

/**
 * Security: Clear login attempts on successful login
 */
function clearLoginAttempts(identifier) {
    loginAttempts.delete(identifier);
}

/**
 * Remove sensitive fields from a user document/object before sending to client.
 */
function sanitizeUser(user) {
    const u = user && user.toObject ? user.toObject() : { ...user };
    if (u.password) delete u.password;
    if (u.password_hash) delete u.password_hash;
    if (u.passwordHash) delete u.passwordHash;
    if (u.__v) delete u.__v;
    if (u.passwordResetToken) delete u.passwordResetToken;
    if (u.passwordResetExpires) delete u.passwordResetExpires;
    return u;
}

/**
 * Security: Validate password strength
 */
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        return { valid: false, message: 'Password must contain at least one special character.' };
    }
    return { valid: true };
}

/**
 * Security: Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Invalid email format.' };
    }
    return { valid: true };
}

/**
 * Security: Sanitize input to prevent injection attacks
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    return input.trim().replace(/[<>]/g, '');
}

async function register(req, res) {
        console.log('🔵 [REGISTER] Received request body:', JSON.stringify(req.body, null, 2));
    try {
        const { name, phone, email, password } = req.body || {};
        
        // Security: Input validation - phone is required, email is optional
        if (!name || !phone || !password) {
            const response = { success: false, message: 'Name, phone number and password are required.' };
            console.log('❌ [REGISTER] Validation failed: Missing name, phone, or password', { name, phone, password });
            console.log('🟠 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
            return res.status(400).json(response);
        }

        // Security: Sanitize inputs
        const sanitizedName = sanitizeInput(name);
        const sanitizedPhone = sanitizeInput(phone);
        const sanitizedEmail = email ? sanitizeInput(email.toLowerCase()) : null;

        // Security: Validate phone format (basic international format)
        const phonePattern = /^\+?[1-9]\d{7,14}$/;
        const cleanPhone = sanitizedPhone.replace(/[\s\-()]/g, '');
        if (!phonePattern.test(cleanPhone)) {
            const response = { success: false, message: 'Invalid phone number format. Use international format (e.g., +256700000000)' };
            console.log('❌ [REGISTER] Validation failed: Invalid phone format', { cleanPhone });
            console.log('🟠 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
            return res.status(400).json(response);
        }

        // Security: Validate email format if provided
        if (sanitizedEmail) {
            const emailValidation = validateEmail(sanitizedEmail);
            if (!emailValidation.valid) {
                const response = { success: false, message: emailValidation.message };
                console.log('❌ [REGISTER] Validation failed: Invalid email format', { sanitizedEmail });
                console.log('🟠 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
                return res.status(400).json(response);
            }

            // Security: Check if email already exists
            const [existingEmail] = await pool.execute('SELECT id FROM users WHERE email = ?', [sanitizedEmail]);
            if (existingEmail && existingEmail.length > 0) {
                const response = { success: false, message: 'Email already in use.' };
                console.log('❌ [REGISTER] Validation failed: Email already in use', { sanitizedEmail });
                console.log('🟠 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
                return res.status(400).json(response);
            }
        }

        // Security: Check if phone already exists
        const [existingPhone] = await pool.execute('SELECT id FROM users WHERE phone_number = ?', [cleanPhone]);
        if (existingPhone && existingPhone.length > 0) {
            const response = { success: false, message: 'Phone number already in use.' };
            console.log('❌ [REGISTER] Validation failed: Phone already in use', { cleanPhone });
            console.log('🟠 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
            return res.status(400).json(response);
        }

        // Security: Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            const response = { success: false, message: passwordValidation.message };
            console.log('❌ [REGISTER] Validation failed: Password invalid', { password });
            console.log('🟠 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
            return res.status(400).json(response);
        }

        // Security: Hash password with stronger cost factor
        const hashed = await bcrypt.hash(password, 12);
        
        // Create user with sanitized data (phone is primary, email optional)
        const user = await User.create({ 
            name: sanitizedName,
            phone: cleanPhone, // Primary identifier
            email: sanitizedEmail, // Optional
            password: hashed 
        });

        // CRITICAL: Set tenant_id to user's own ID immediately after creation
        // This ensures the JWT token includes tenant_id from the start
        const userId = user.id || user._id;
        await pool.execute('UPDATE users SET tenant_id = ? WHERE id = ?', [userId.toString(), userId]);
        
        // Fetch updated user with tenant_id
        const [updatedUser] = await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
        const userWithTenant = updatedUser && updatedUser.length > 0 ? updatedUser[0] : user;

        // Auto-issue a token with session tracking
        const { token, jti } = signToken({ 
            id: userId,
            role: userWithTenant.role || 'user',
            tenant_id: userWithTenant.tenant_id || userId.toString()
        });

        // Security: Log registration event (in production, use proper logging service)
        console.log(`[SECURITY] New user registered: ${user.id || user._id} (phone: ${cleanPhone}) from IP: ${req.ip}`);

        const response = {
            success: true,
            token,
            user: sanitizeUser(user),
            message: 'Account created successfully.'
        };
        console.log('🟢 [REGISTER] Responding with:', JSON.stringify(response, null, 2));
        return res.status(201).json(response);
    } catch (err) {
        // Print full error stack and request body for debugging
        console.error('[SECURITY ERROR] Register error:', err && err.stack ? err.stack : err);
        try {
            res.status(500).json({ success: false, message: 'Server error.', error: (err && err.message) || String(err) });
        } catch (sendErr) {
            // If res.json fails, send plain text
            try {
                res.status(500).send('Server error: ' + ((err && err.message) || String(err)));
            } catch {}
        }
    }
}

async function login(req, res) {
    try {
        const { email, phone, identifier, password } = req.body || {};
        // Accept either email or phone (or identifier)
        const loginId = (identifier || email || phone || '').trim();
        if (!loginId || !password) {
            return res.status(400).json({ success: false, message: 'Email, phone, or identifier and password are required.' });
        }

        // Determine if loginId is an email or phone
        let user = null;
        let idType = '';
        if (/^\+?[1-9]\d{7,14}$/.test(loginId.replace(/[\s\-()]/g, ''))) {
            // Looks like a phone number
            const cleanPhone = loginId.replace(/[\s\-()]/g, '');
            user = await User.findOne({ phone: cleanPhone });
            idType = 'phone';
        } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginId)) {
            // Looks like an email
            const sanitizedEmail = sanitizeInput(loginId.toLowerCase());
            user = await User.findOne({ email: sanitizedEmail });
            idType = 'email';
        } else {
            // Try both (fallback)
            user = await User.findOne({ email: loginId }) || await User.findOne({ phone: loginId });
            idType = 'unknown';
        }

        if (!user) {
            if (String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase() !== 'true') {
                recordFailedAttempt(loginId);
            }
            console.log(`[SECURITY] Failed login attempt - user not found: ${loginId} from IP: ${req.ip}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Security: Check if account is locked due to failed attempts
        if (String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase() !== 'true' && isAccountLocked(loginId)) {
            console.log(`[SECURITY] Account locked due to failed attempts: ${loginId} from IP: ${req.ip}`);
            return res.status(429).json({ 
                success: false, 
                message: 'Too many failed login attempts. Please try again in 15 minutes.' 
            });
        }

        // Verify password - handle both password_hash and password fields
        const userPassword = user.password_hash || user.password;
        if (!userPassword) {
            console.log(`[SECURITY] Failed login attempt - no password found for user: ${loginId}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }
        const ok = await bcrypt.compare(password, userPassword);
        if (!ok) {
            if (String(process.env.DISABLE_RATE_LIMIT || '').toLowerCase() !== 'true') {
                recordFailedAttempt(loginId);
            }
            console.log(`[SECURITY] Failed login attempt - invalid password: ${loginId} from IP: ${req.ip}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Security: Clear failed login attempts on successful login
        clearLoginAttempts(loginId);

        // CRITICAL: Ensure tenant_id is set - fetch from database if missing
        let tenantId = user.tenant_id;
        const userId = user.id || user._id;
        
        if (!tenantId) {
            console.log(`[WARNING] User ${userId} missing tenant_id, fetching from database`);
            const [dbUser] = await pool.execute('SELECT tenant_id FROM users WHERE id = ?', [userId]);
            if (dbUser && dbUser.length > 0 && dbUser[0].tenant_id) {
                tenantId = dbUser[0].tenant_id;
            } else {
                // Last resort: set it now
                console.log(`[WARNING] Setting tenant_id for user ${userId}`);
                await pool.execute('UPDATE users SET tenant_id = ? WHERE id = ?', [userId.toString(), userId]);
                tenantId = userId.toString();
            }
        }

        // Generate token with session tracking
        const { token, jti } = signToken({ 
            id: userId,
            role: user.role || 'user',
            tenant_id: tenantId,
            email: user.email,
            name: user.name
        });

        // Security: Log successful login
        console.log(`[SECURITY] Successful login: ${userId} (tenant_id: ${tenantId}) from IP: ${req.ip}`);

        // Ensure user object has updated tenant_id and name for frontend
        const userResponse = sanitizeUser(user);
        userResponse.tenant_id = tenantId;
        userResponse.name = user.name;

        return res.status(200).json({ 
            success: true, 
            token, 
            user: userResponse,
            message: 'Login successful.'
        });
    } catch (err) {
        console.error('[SECURITY ERROR] Login error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
}

function me(req, res) {
    try {
        // authMiddleware is expected to set req.user (sanitized or raw)
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authenticated.' });
        }
        return res.status(200).json({ success: true, user: sanitizeUser(req.user) });
    } catch (err) {
        console.error('Me error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
}

async function logout(req, res) {
    try {
        // Security: Extract token from request
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.jti) {
                    // Remove from active sessions
                    activeSessions.delete(decoded.jti);
                    console.log(`[SECURITY] User logged out: ${decoded.id}`);
                }
            } catch (err) {
                // Token might be expired or invalid, that's okay for logout
                console.log('[SECURITY] Logout attempt with invalid token');
            }
        }
        
        return res.status(200).json({ 
            success: true,
            message: 'Logged out successfully.'
        });
    } catch (err) {
        console.error('[SECURITY ERROR] Logout error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
}

/**
 * Security: Verify if a session is still active
 */
function isSessionActive(jti) {
    return activeSessions.has(jti);
}

/**
 * Forgot Password - Send reset token via email
 */
async function forgotPassword(req, res) {
    try {
        const { email, phone } = req.body;
        const emailService = require('../services/emailService');
        const smsService = require('../services/smsService');

        // Validate input
        if (!email && !phone) {
            return res.status(400).json({ error: 'Email or phone is required' });
        }

        let user;
        if (email) {
            // Email reset flow
            const [users] = await pool.execute('SELECT id, email, name FROM users WHERE email = ?', [email.toLowerCase()]);
            if (users.length === 0) {
                // Security: Don't reveal if email exists
                return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
            }
            user = users[0];
            
            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            
            await pool.execute('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', 
                [resetTokenHash, resetTokenExpiry, user.id]);
            
            // Send reset email
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            await emailService.sendEmail({
                to: user.email,
                subject: 'Password Reset Request - PledgeHub',
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Password Reset Request</h2><p>Hi ${user.name},</p><p>You requested to reset your password. Click the button below to create a new password:</p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a><p>Or copy and paste this link into your browser:</p><p style="color: #64748b; word-break: break-all;">${resetUrl}</p><p style="color: #ef4444; margin-top: 20px;"><strong>This link expires in 1 hour.</strong></p><p>If you didn't request this, please ignore this email.</p><hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;"><p style="color: #94a3b8; font-size: 12px;">PledgeHub Management System</p></div>`
            });
            
            return res.json({ success: true, message: 'If that email exists, a reset link has been sent' });
        } else if (phone) {
            // Phone reset flow
            let normalizedPhone = phone.replace(/\+/g, '');
            if (normalizedPhone.startsWith('0')) {
                normalizedPhone = '256' + normalizedPhone.substring(1);
            } else if (!normalizedPhone.startsWith('256')) {
                normalizedPhone = '256' + normalizedPhone;
            }
            
            const [users] = await pool.execute('SELECT id, phone, name FROM users WHERE phone = ?', [normalizedPhone]);
            if (users.length === 0) {
                // Security: Don't reveal if phone exists
                return res.json({ success: true, message: 'If that phone exists, a reset code has been sent' });
            }
            user = users[0];
            
            // Generate reset code (6 digits)
            const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
            const resetCodeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
            
            await pool.execute('UPDATE users SET reset_code = ?, reset_code_expiry = ? WHERE id = ?', 
                [resetCode, resetCodeExpiry, user.id]);
            
            // Send reset SMS
            await smsService.sendSMS({
                to: normalizedPhone,
                message: `Your PledgeHub password reset code is: ${resetCode}. It expires in 10 minutes.`
            });
            
            return res.json({ success: true, message: 'If that phone exists, a reset code has been sent' });
        }
    } catch (error) {
        console.error('[AuthController] Forgot password error:', error);
        return res.status(500).json({ error: 'Failed to process password reset request' });
    }
}

/**
 * Reset Password - Validate token and update password
 */
async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;
        const emailService = require('../services/emailService');

        // Security: Input validation
        if (!token || !password) {
            return res.status(400).json({ error: 'Token and password are required.' });
        }

        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Hash the token to compare
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const [users] = await pool.execute(
            'SELECT id, email, name FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({ 
                error: 'Invalid or expired reset token.' 
            });
        }

        const user = users[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Update password and clear reset fields
        await pool.execute(
            'UPDATE users SET password_hash = ?, password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [passwordHash, passwordHash, user.id]
        );

        // Send confirmation email
        await emailService.sendEmail({
            to: user.email,
            subject: 'Password Changed Successfully - PledgeHub',
            html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #22c55e;">Password Changed Successfully</h2><p>Hi ${user.name},</p><p>Your password has been changed successfully. You can now log in with your new password.</p><p style="color: #ef4444; margin-top: 20px;">If you didn't make this change, please contact support immediately.</p><hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;"><p style="color: #94a3b8; font-size: 12px;">PledgeHub Management System</p></div>`
        });

        return res.json({ 
            success: true, 
            message: 'Password reset successfully. You can now log in with your new password.' 
        });
    } catch (err) {
        console.error('[SECURITY ERROR] Reset password error:', err);
        return res.status(500).json({ error: 'Failed to reset password' });
    }
}

/**
 * Reset Password by Phone - Verify code and update password
 */
async function resetByPhone(req, res) {
    try {
        const { phone, code, newPassword } = req.body;
        const emailService = require('../services/emailService');

        // Validation
        if (!phone || !code || !newPassword) {
            return res.status(400).json({ error: 'Phone, code, and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Normalize phone
        let normalizedPhone = phone.replace(/\+/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '256' + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('256')) {
            normalizedPhone = '256' + normalizedPhone;
        }

        // Find user and verify code
        const [users] = await pool.execute(
            'SELECT id, reset_code, reset_code_expiry, email, name FROM users WHERE phone = ?',
            [normalizedPhone]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid phone or code' });
        }

        const user = users[0];
        if (!user.reset_code || !user.reset_code_expiry || user.reset_code !== code) {
            return res.status(400).json({ error: 'Invalid code' });
        }

        // Check if code expired
        if (new Date(user.reset_code_expiry) < new Date()) {
            return res.status(400).json({ error: 'Code has expired' });
        }

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset code
        await pool.execute(
            'UPDATE users SET password_hash = ?, password = ?, reset_code = NULL, reset_code_expiry = NULL WHERE id = ?',
            [passwordHash, passwordHash, user.id]
        );

        // Send confirmation email if user has email
        if (user.email) {
            await emailService.sendEmail({
                to: user.email,
                subject: 'Password Changed Successfully - PledgeHub',
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #22c55e;">Password Changed Successfully</h2><p>Hi ${user.name},</p><p>Your password has been changed successfully. You can now log in with your new password.</p><p style="color: #ef4444; margin-top: 20px;">If you didn't make this change, please contact support immediately.</p><hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;"><p style="color: #94a3b8; font-size: 12px;">PledgeHub Management System</p></div>`
            });
        }

        return res.json({
            success: true,
            message: 'Password reset successfully. You can now log in with your new password.'
        });

    } catch (error) {
        console.error('[AuthController] Reset by phone error:', error);
        return res.status(500).json({ error: 'Failed to reset password' });
    }
}

module.exports = { register, login, me, logout, isSessionActive, forgotPassword, resetPassword, resetByPhone };