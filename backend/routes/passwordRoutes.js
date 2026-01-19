const smsService = require('../services/smsService');
// Helper: Generate 6-digit code
function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
const router = require('express').Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/authMiddleware');
const { pool } = require('../config/db');
const emailService = require('../services/emailService');

// Change password endpoint
router.post('/change', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user && req.user.id;
        const passwordService = require('../services/passwordService');

        // Debug logging
        const authHeader = req.headers['authorization'] || req.headers['Authorization'];
        console.log('[PasswordChange] Debug:', {
          userId,
          reqUser: req.user,
          authHeader,
          body: req.body
        });

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: 'Current password and new password are required'
            });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                error: 'New password must be at least 8 characters long'
            });
        }

        const result = await passwordService.changePassword(userId, currentPassword, newPassword);
        if (!result.success) {
            const status = result.error === 'Current password is incorrect' ? 401 : 400;
            return res.status(status).json({ success: false, error: result.error });
        }
        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('[PasswordChange] Change password error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to change password. Please try again.'
        });
    }
});

// Request password reset

router.post('/forgot', async (req, res) => {
    try {
        const { email, phone } = req.body;
        if (!email && !phone) {
            return res.status(400).json({ error: 'Email or phone is required' });
        }
        let user;
        if (email) {
            const [users] = await pool.query('SELECT id, email, name FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                return res.json({ success: true, message: 'If that email or phone exists, a reset link/code has been sent' });
            }
            user = users[0];
            // Email flow (same as before)
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
            await pool.query('UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?', [resetTokenHash, resetTokenExpiry, user.id]);
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
            await emailService.sendEmail({
                to: user.email,
                subject: 'Password Reset Request - PledgeHub',
                html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><h2 style="color: #2563eb;">Password Reset Request</h2><p>Hi ${user.name},</p><p>You requested to reset your password. Click the button below to create a new password:</p><a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a><p>Or copy and paste this link into your browser:</p><p style="color: #64748b; word-break: break-all;">${resetUrl}</p><p style="color: #ef4444; margin-top: 20px;"><strong>This link expires in 1 hour.</strong></p><p>If you didn't request this, please ignore this email.</p><hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;"><p style="color: #94a3b8; font-size: 12px;">PledgeHub Management System</p></div>`
            });
            return res.json({ success: true, message: 'If that email or phone exists, a reset link/code has been sent' });
        } else if (phone) {
            // Normalize phone (Uganda format)
            let normalizedPhone = phone.replace(/\+/g, '');
            if (normalizedPhone.startsWith('0')) {
                normalizedPhone = '256' + normalizedPhone.substring(1);
            } else if (!normalizedPhone.startsWith('256')) {
                normalizedPhone = '256' + normalizedPhone;
            }
            const [users] = await pool.query('SELECT id, phone, name FROM users WHERE phone = ?', [normalizedPhone]);
            if (users.length === 0) {
                return res.json({ success: true, message: 'If that email or phone exists, a reset link/code has been sent' });
            }
            user = users[0];
            // Generate code
            const code = generateResetCode();
            const codeExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
            await pool.query('UPDATE users SET reset_code = ?, reset_code_expiry = ? WHERE id = ?', [code, codeExpiry, user.id]);
            // Send SMS
            await smsService.sendSMS({
                to: normalizedPhone,
                message: `Your PledgeHub password reset code is: ${code}. It expires in 10 minutes.`
            });
            return res.json({ success: true, message: 'If that email or phone exists, a reset link/code has been sent' });
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Verify phone code and reset password
router.post('/reset-by-phone', async (req, res) => {
    try {
        const { phone, code, newPassword } = req.body;
        if (!phone || !code || !newPassword) {
            return res.status(400).json({ error: 'Phone, code, and new password are required' });
        }
        let normalizedPhone = phone.replace(/\+/g, '');
        if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '256' + normalizedPhone.substring(1);
        } else if (!normalizedPhone.startsWith('256')) {
            normalizedPhone = '256' + normalizedPhone;
        }
        const [users] = await pool.query('SELECT id, reset_code, reset_code_expiry FROM users WHERE phone = ?', [normalizedPhone]);
        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid phone or code' });
        }
        const user = users[0];
        if (!user.reset_code || !user.reset_code_expiry || user.reset_code !== code || new Date(user.reset_code_expiry) < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ?, reset_code = NULL, reset_code_expiry = NULL WHERE id = ?', [passwordHash, user.id]);
        res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' });
    } catch (error) {
        console.error('Reset by phone error:', error);
        res.status(500).json({ error: 'Failed to reset password by phone' });
    }
});

// Reset password with token
router.post('/reset', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token and new password are required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        // Hash the provided token
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        // Find user with valid reset token
        const [users] = await pool.query(
            'SELECT id, email, name FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()',
            [resetTokenHash]
        );

        if (users.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        }

        const user = users[0];

        // Hash new password
        const passwordHash = await bcrypt.hash(newPassword, 10);

        // Update password and clear reset token
        await pool.query(
            'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
            [passwordHash, user.id]
        );

        // Send confirmation email
        await emailService.sendEmail({
            to: user.email,
            subject: 'Password Changed Successfully - PledgeHub',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">Password Changed Successfully</h2>
                    <p>Hi ${user.name},</p>
                    <p>Your password has been changed successfully. You can now log in with your new password.</p>
                    <p style="color: #ef4444; margin-top: 20px;">If you didn't make this change, please contact support immediately.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px;">PledgeHub Management System</p>
                </div>
            `
        });

        res.json({ 
            success: true, 
            message: 'Password reset successfully. You can now log in with your new password.' 
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

module.exports = router;
