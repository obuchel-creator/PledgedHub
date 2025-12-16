const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { rateLimiters } = require('../services/securityService');

/**
 * GET /api/security/settings
 * Fetch current security settings for authenticated admin
 */
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch PIN settings
    const [pinSettings] = await pool.execute(
      `SELECT * FROM security_settings WHERE user_id = ? AND setting_type = 'pin'`,
      [userId]
    );

    // Fetch IP whitelist
    const [ipWhitelist] = await pool.execute(
      `SELECT ip_address, description, created_at FROM ip_whitelist WHERE user_id = ? AND active = 1`,
      [userId]
    );

    // Fetch 2FA settings
    const [twoFASettings] = await pool.execute(
      `SELECT * FROM security_settings WHERE user_id = ? AND setting_type = '2fa'`,
      [userId]
    );

    return res.json({
      success: true,
      data: {
        pin: pinSettings[0] || {
          enabled: false,
          threshold: 500000,
          max_attempts: 3,
          lockout_duration: 900
        },
        ipWhitelist: ipWhitelist || [],
        twoFA: twoFASettings[0] || {
          enabled: false,
          method: 'email'
        }
      }
    });
  } catch (error) {
    console.error('Error fetching security settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security settings'
    });
  }
});

/**
 * POST /api/security/pin/update
 * Update user's transaction PIN
 */
router.post('/pin/update', authenticateToken, requireAdmin, rateLimiters.api, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPin, newPin, confirmPin } = req.body;

    // Validate input
    if (!newPin || newPin.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'PIN must be exactly 4 digits'
      });
    }

    if (newPin !== confirmPin) {
      return res.status(400).json({
        success: false,
        error: 'PIN confirmation does not match'
      });
    }

    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({
        success: false,
        error: 'PIN must contain only digits'
      });
    }

    // Check if PIN settings exist
    const [existing] = await pool.execute(
      `SELECT id FROM security_settings WHERE user_id = ? AND setting_type = 'pin'`,
      [userId]
    );

    if (existing.length === 0) {
      // Create new PIN setting
      await pool.execute(
        `INSERT INTO security_settings (user_id, setting_type, setting_value, enabled, created_at)
         VALUES (?, 'pin', ?, 1, NOW())`,
        [userId, newPin]
      );
    } else {
      // Update existing PIN
      await pool.execute(
        `UPDATE security_settings SET setting_value = ?, updated_at = NOW()
         WHERE user_id = ? AND setting_type = 'pin'`,
        [newPin, userId]
      );
    }

    return res.json({
      success: true,
      data: { message: 'PIN updated successfully' }
    });
  } catch (error) {
    console.error('Error updating PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PIN'
    });
  }
});

/**
 * POST /api/security/pin/threshold
 * Update PIN threshold (amount that triggers PIN requirement)
 */
router.post('/pin/threshold', authenticateToken, requireAdmin, rateLimiters.api, async (req, res) => {
  try {
    const userId = req.user.id;
    const { threshold } = req.body;

    // Validate threshold
    if (!threshold || threshold < 10000) {
      return res.status(400).json({
        success: false,
        error: 'Threshold must be at least 10,000 UGX'
      });
    }

    // Update or create threshold setting
    const [existing] = await pool.execute(
      `SELECT id FROM security_settings WHERE user_id = ? AND setting_type = 'pin_threshold'`,
      [userId]
    );

    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO security_settings (user_id, setting_type, setting_value, enabled, created_at)
         VALUES (?, 'pin_threshold', ?, 1, NOW())`,
        [userId, threshold]
      );
    } else {
      await pool.execute(
        `UPDATE security_settings SET setting_value = ?, updated_at = NOW()
         WHERE user_id = ? AND setting_type = 'pin_threshold'`,
        [threshold, userId]
      );
    }

    return res.json({
      success: true,
      data: { 
        message: 'PIN threshold updated successfully',
        threshold: threshold
      }
    });
  } catch (error) {
    console.error('Error updating PIN threshold:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PIN threshold'
    });
  }
});

/**
 * POST /api/security/whitelist/add
 * Add IP address to whitelist
 */
router.post('/whitelist/add', authenticateToken, requireAdmin, rateLimiters.api, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ipAddress, description } = req.body;

    // Validate IP address format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipAddress || !ipRegex.test(ipAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid IP address format'
      });
    }

    // Check if IP already exists
    const [existing] = await pool.execute(
      `SELECT id FROM ip_whitelist WHERE user_id = ? AND ip_address = ? AND active = 1`,
      [userId, ipAddress]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'IP address already in whitelist'
      });
    }

    // Add IP to whitelist
    await pool.execute(
      `INSERT INTO ip_whitelist (user_id, ip_address, description, active, created_at)
       VALUES (?, ?, ?, 1, NOW())`,
      [userId, ipAddress, description || null]
    );

    return res.json({
      success: true,
      data: {
        message: 'IP address added to whitelist',
        ipAddress: ipAddress
      }
    });
  } catch (error) {
    console.error('Error adding IP to whitelist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add IP to whitelist'
    });
  }
});

/**
 * POST /api/security/whitelist/remove
 * Remove IP address from whitelist
 */
router.post('/whitelist/remove', authenticateToken, requireAdmin, rateLimiters.api, async (req, res) => {
  try {
    const userId = req.user.id;
    const { ipAddress } = req.body;

    if (!ipAddress) {
      return res.status(400).json({
        success: false,
        error: 'IP address required'
      });
    }

    // Soft delete: mark as inactive
    await pool.execute(
      `UPDATE ip_whitelist SET active = 0, updated_at = NOW()
       WHERE user_id = ? AND ip_address = ?`,
      [userId, ipAddress]
    );

    return res.json({
      success: true,
      data: {
        message: 'IP address removed from whitelist',
        ipAddress: ipAddress
      }
    });
  } catch (error) {
    console.error('Error removing IP from whitelist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove IP from whitelist'
    });
  }
});

/**
 * GET /api/security/status
 * Get overall security status and recommendations
 */
router.get('/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check PIN enabled
    const [pinEnabled] = await pool.execute(
      `SELECT enabled FROM security_settings WHERE user_id = ? AND setting_type = 'pin' AND enabled = 1`,
      [userId]
    );

    // Check IP whitelist
    const [ipWhitelistCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM ip_whitelist WHERE user_id = ? AND active = 1`,
      [userId]
    );

    // Check 2FA enabled
    const [twoFAEnabled] = await pool.execute(
      `SELECT enabled FROM security_settings WHERE user_id = ? AND setting_type = '2fa' AND enabled = 1`,
      [userId]
    );

    // Calculate security score
    let securityScore = 50; // Base score
    if (pinEnabled.length > 0) securityScore += 15;
    if (ipWhitelistCount[0].count > 0) securityScore += 15;
    if (twoFAEnabled.length > 0) securityScore += 20;

    return res.json({
      success: true,
      data: {
        pinEnabled: pinEnabled.length > 0,
        ipWhitelistActive: ipWhitelistCount[0].count > 0,
        ipWhitelistCount: ipWhitelistCount[0].count,
        twoFAEnabled: twoFAEnabled.length > 0,
        securityScore: securityScore,
        recommendations: [
          !pinEnabled.length && 'Enable transaction PIN for high-value payments',
          ipWhitelistCount[0].count === 0 && 'Configure IP whitelist for additional access control',
          !twoFAEnabled.length && 'Enable two-factor authentication for enhanced security'
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Error fetching security status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch security status'
    });
  }
});

/**
 * POST /api/security/pin/verify
 * Verify transaction PIN for payments
 */
router.post('/pin/verify', authenticateToken, rateLimiters.payment, async (req, res) => {
  try {
    const userId = req.user.id;
    const { pin, transactionId } = req.body;

    if (!pin || pin.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PIN format'
      });
    }

    // Fetch stored PIN
    const [pinSetting] = await pool.execute(
      `SELECT setting_value FROM security_settings WHERE user_id = ? AND setting_type = 'pin'`,
      [userId]
    );

    if (pinSetting.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'PIN not configured'
      });
    }

    const storedPin = pinSetting[0].setting_value;

    // Check if user is locked out
    const [lockout] = await pool.execute(
      `SELECT * FROM pin_lockout WHERE user_id = ? AND locked_until > NOW()`,
      [userId]
    );

    if (lockout.length > 0) {
      return res.status(423).json({
        success: false,
        error: 'Account locked due to too many failed attempts',
        lockedUntil: lockout[0].locked_until
      });
    }

    // Verify PIN
    if (pin !== storedPin) {
      // Increment attempt counter
      const [attempts] = await pool.execute(
        `SELECT attempt_count FROM pin_attempts WHERE user_id = ? AND DATE(created_at) = CURDATE()`,
        [userId]
      );

      const newAttempts = (attempts[0]?.attempt_count || 0) + 1;

      // Check if exceeded max attempts
      if (newAttempts >= 3) {
        // Lock account for 15 minutes
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await pool.execute(
          `INSERT INTO pin_lockout (user_id, locked_until) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE locked_until = ?`,
          [userId, lockUntil, lockUntil]
        );

        return res.status(423).json({
          success: false,
          error: 'Too many failed attempts. Account locked for 15 minutes',
          attemptsRemaining: 0,
          locked: true
        });
      }

      // Update attempt counter
      if (attempts.length === 0) {
        await pool.execute(
          `INSERT INTO pin_attempts (user_id, attempt_count, created_at)
           VALUES (?, 1, NOW())`,
          [userId]
        );
      } else {
        await pool.execute(
          `UPDATE pin_attempts SET attempt_count = ? WHERE user_id = ?`,
          [newAttempts, userId]
        );
      }

      return res.status(401).json({
        success: false,
        error: 'Invalid PIN',
        attemptsRemaining: Math.max(0, 3 - newAttempts)
      });
    }

    // PIN verified - reset attempt counter
    await pool.execute(
      `DELETE FROM pin_attempts WHERE user_id = ?`,
      [userId]
    );

    // Log successful PIN verification
    await pool.execute(
      `INSERT INTO pin_verification_log (user_id, transaction_id, verified_at)
       VALUES (?, ?, NOW())`,
      [userId, transactionId || null]
    );

    return res.json({
      success: true,
      data: { 
        message: 'PIN verified successfully',
        verified: true
      }
    });
  } catch (error) {
    console.error('Error verifying PIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify PIN'
    });
  }
});

/**
 * GET /api/security/whitelist/check
 * Check if request IP is whitelisted
 */
router.get('/whitelist/check', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check if IP is in whitelist
    const [whitelisted] = await pool.execute(
      `SELECT id FROM ip_whitelist 
       WHERE user_id = ? AND ip_address = ? AND active = 1`,
      [userId, clientIp]
    );

    return res.json({
      success: true,
      data: {
        clientIp: clientIp,
        whitelisted: whitelisted.length > 0,
        requiresWhitelist: true
      }
    });
  } catch (error) {
    console.error('Error checking IP whitelist:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check IP whitelist'
    });
  }
});

module.exports = router;
