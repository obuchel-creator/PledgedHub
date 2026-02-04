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
            const existingEmail = await User.findOne({ email: sanitizedEmail });
            if (existingEmail) {
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

        // Auto-issue a token with session tracking
        const { token, jti } = signToken({ 
            id: user.id || user._id,
            role: user.role || 'user',
            tenant_id: user.tenant_id
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
            recordFailedAttempt(loginId);
            console.log(`[SECURITY] Failed login attempt - user not found: ${loginId} from IP: ${req.ip}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Security: Check if account is locked due to failed attempts
        if (isAccountLocked(loginId)) {
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
            recordFailedAttempt(loginId);
            console.log(`[SECURITY] Failed login attempt - invalid password: ${loginId} from IP: ${req.ip}`);
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // Security: Clear failed login attempts on successful login
        clearLoginAttempts(loginId);

        // Generate token with session tracking
        const { token, jti } = signToken({ 
            id: user.id || user._id,
            role: user.role || 'user',
            tenant_id: user.tenant_id
        });

        // Security: Log successful login
        console.log(`[SECURITY] Successful login: ${user.id || user._id} from IP: ${req.ip}`);

        return res.status(200).json({ 
            success: true, 
            token, 
            user: sanitizeUser(user),
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
        const { email } = req.body;

        // Security: Input validation
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required.' });
        }

        // Security: Sanitize email
        const sanitizedEmail = sanitizeInput(email.toLowerCase());

        // Security: Validate email format
        const emailValidation = validateEmail(sanitizedEmail);
        if (!emailValidation.valid) {
            return res.status(400).json({ success: false, message: emailValidation.message });
        }

        // Find user
        const user = await User.findOne({ email: sanitizedEmail });
        
        // Security: Don't reveal if email exists or not (timing-safe response)
        if (!user) {
            console.log(`[SECURITY] Password reset requested for non-existent email: ${sanitizedEmail}`);
            // Still return success to prevent email enumeration
            return res.status(200).json({ 
                success: true, 
                message: 'If that email exists, a reset link has been sent.' 
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Set token and expiry (1 hour)
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = Date.now() + 3600000; // 1 hour
        await User.save(user);

        // In production, send email here
        // For now, we'll just log it
        console.log(`[SECURITY] Password reset token generated for user: ${user._id}`);
        console.log(`Reset token (development only): ${resetToken}`);

        // TODO: Send email with reset link
        // const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        // await sendEmail({
        //     to: user.email,
        //     subject: 'Password Reset Request',
        //     text: `Reset your password: ${resetUrl}`
        // });

        return res.status(200).json({ 
            success: true, 
            message: 'If that email exists, a reset link has been sent.',
            // In development, include token for testing
            ...(process.env.NODE_ENV === 'development' && { resetToken })
        });
    } catch (err) {
        console.error('[SECURITY ERROR] Forgot password error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
}

/**
 * Reset Password - Validate token and update password
 */
async function resetPassword(req, res) {
    try {
        const { token, password } = req.body;

        // Security: Input validation
        if (!token || !password) {
            return res.status(400).json({ success: false, message: 'Token and password are required.' });
        }

        // Security: Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ success: false, message: passwordValidation.message });
        }

        // Hash the token to compare
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid reset token
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            console.log(`[SECURITY] Invalid or expired reset token attempt`);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or expired reset token.' 
            });
        }

        // Hash new password
        const hashed = await bcrypt.hash(password, 12);
        
        // Update password and clear reset fields
        user.password = hashed;
        user.password_hash = hashed;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await User.save(user);

        // Security: Log password reset
        console.log(`[SECURITY] Password reset successful for user: ${user._id}`);

        // Clear any failed login attempts
        clearLoginAttempts(user.email);

        return res.status(200).json({ 
            success: true, 
            message: 'Password reset successfully. You can now login with your new password.' 
        });
    } catch (err) {
        console.error('[SECURITY ERROR] Reset password error:', err);
        return res.status(500).json({ success: false, message: 'Server error.' });
    }
}

module.exports = { register, login, me, logout, isSessionActive, forgotPassword, resetPassword };