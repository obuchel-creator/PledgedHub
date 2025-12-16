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
        const userId = req.user.id;

        // Validation
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

        // Get user with password
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                error: 'User not found' 
            });
        }

        // Check if user uses OAuth (no password set)
        if (!user.password_hash) {
            return res.status(400).json({ 
                success: false, 
                error: 'OAuth users cannot change password. Manage your password through your OAuth provider (Google/Facebook).' 
            });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                error: 'Current password is incorrect' 
            });
        }

        // Check if new password is same as current
        const isSameAsOld = await bcrypt.compare(newPassword, user.password_hash);
        if (isSameAsOld) {
            return res.status(400).json({ 
                success: false, 
                error: 'New password must be different from current password' 
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.update(userId, { password_hash: newPasswordHash });

        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to change password. Please try again.' 
        });
    }
});

// Request password reset
router.post('/forgot', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        // Find user by email
        const [users] = await pool.query(
            'SELECT id, email, name FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal if email exists (security best practice)
            return res.json({ 
                success: true, 
                message: 'If that email exists, a reset link has been sent' 
            });
        }

        const user = users[0];

        // Generate reset token (valid for 1 hour)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');
        
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Store reset token in database
        await pool.query(
            'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
            [resetTokenHash, resetTokenExpiry, user.id]
        );

        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
        
        await emailService.sendEmail({
            to: user.email,
            subject: 'Password Reset Request - Omukwano Pledge',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>Hi ${user.name},</p>
                    <p>You requested to reset your password. Click the button below to create a new password:</p>
                    <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%); color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">Reset Password</a>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #64748b; word-break: break-all;">${resetUrl}</p>
                    <p style="color: #ef4444; margin-top: 20px;"><strong>This link expires in 1 hour.</strong></p>
                    <p>If you didn't request this, please ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px;">Omukwano Pledge Management System</p>
                </div>
            `
        });

        res.json({ 
            success: true, 
            message: 'If that email exists, a reset link has been sent' 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
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
            subject: 'Password Changed Successfully - Omukwano Pledge',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #22c55e;">Password Changed Successfully</h2>
                    <p>Hi ${user.name},</p>
                    <p>Your password has been changed successfully. You can now log in with your new password.</p>
                    <p style="color: #ef4444; margin-top: 20px;">If you didn't make this change, please contact support immediately.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
                    <p style="color: #94a3b8; font-size: 12px;">Omukwano Pledge Management System</p>
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
