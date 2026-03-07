const router = require('express').Router();
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');

// Generate 2FA secret and QR code
router.post('/setup', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user info
        const [users] = await pool.query('SELECT email, username FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const user = users[0];
        const accountName = user.email || user.username;
        
        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `PledgeHub (${accountName})`,
            issuer: 'PledgeHub'
        });
        
        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        
        // Store secret temporarily (not enabled yet)
        await pool.query(
            'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?',
            [secret.base32, userId]
        );
        // Audit log
        const { auditRoleAccess } = require('../middleware/authMiddleware');
        await auditRoleAccess(userId, '2fa_setup', { secret: 'generated' });

        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl
            }
        });
        
    } catch (error) {
        console.error('2FA setup error:', error);
        res.status(500).json({ success: false, error: 'Failed to setup 2FA' });
    }
});

// Verify and enable 2FA
router.post('/verify', authenticateToken, async (req, res) => {
    try {
        const { token } = req.body;
        const userId = req.user.id;
        
        if (!token) {
            return res.status(400).json({ success: false, error: 'Verification token required' });
        }
        
        // Get user's secret
        const [users] = await pool.query(
            'SELECT two_factor_secret FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0 || !users[0].two_factor_secret) {
            return res.status(400).json({ success: false, error: '2FA not set up. Please set up 2FA first.' });
        }
        
        const secret = users[0].two_factor_secret;
        
        // Verify token
        const verified = speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps before/after
        });
        
        if (!verified) {
            return res.status(401).json({ success: false, error: 'Invalid verification code' });
        }
        
        // Enable 2FA
        await pool.query(
            'UPDATE users SET two_factor_enabled = 1 WHERE id = ?',
            [userId]
        );
        // Audit log
        const { auditRoleAccess } = require('../middleware/authMiddleware');
        await auditRoleAccess(userId, '2fa_verify', { verified: true });

        res.json({
            success: true,
            message: 'Two-factor authentication enabled successfully'
        });
        
    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({ success: false, error: 'Failed to verify 2FA' });
    }
});

// Disable 2FA
router.post('/disable', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;
        
        if (!password) {
            return res.status(400).json({ success: false, error: 'Password required to disable 2FA' });
        }
        
        // Verify password
        const bcrypt = require('bcryptjs');
        const [users] = await pool.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        const isMatch = await bcrypt.compare(password, users[0].password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid password' });
        }
        
        // Disable 2FA
        await pool.query(
            'UPDATE users SET two_factor_enabled = 0, two_factor_secret = NULL WHERE id = ?',
            [userId]
        );
        // Audit log
        const { auditRoleAccess } = require('../middleware/authMiddleware');
        await auditRoleAccess(userId, '2fa_disable', { disabled: true });

        res.json({
            success: true,
            message: 'Two-factor authentication disabled'
        });
        
    } catch (error) {
        console.error('2FA disable error:', error);
        res.status(500).json({ success: false, error: 'Failed to disable 2FA' });
    }
});

// Check 2FA status
router.get('/status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [users] = await pool.query(
            'SELECT two_factor_enabled FROM users WHERE id = ?',
            [userId]
        );
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        res.json({
            success: true,
            data: {
                enabled: users[0].two_factor_enabled === 1
            }
        });
        
    } catch (error) {
        console.error('2FA status error:', error);
        res.status(500).json({ success: false, error: 'Failed to get 2FA status' });
    }
});

module.exports = router;

