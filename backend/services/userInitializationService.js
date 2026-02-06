/**
 * User Initialization Service
 * Purpose: Complete user setup on registration with all required initialization
 * Ensures users are fully ready for login and have all necessary profiles/permissions
 * 
 * Handles:
 * - Monetization profile creation
 * - User permissions setup
 * - Audit logging
 * - Validation status initialization
 */

const { pool } = require('../config/db');

/**
 * Complete user initialization after registration
 * Called immediately after user insert
 */
async function initializeNewUser(userId, userData = {}) {
  try {

    console.log(`📍 [USER INIT] Starting initialization for user ${userId}`);
    console.log(`📍 [USER INIT] Pool status:`, pool.config ? 'EXISTS' : 'MISSING');
    console.log(`📍 [USER INIT] Pool database:`, pool.config?.database || 'UNKNOWN');

    // ============================================
    // 1. Initialize Monetization Profile
    // ============================================
    try {
      console.log(`📍 [USER INIT] About to query user_usage_stats...`);
      const [existing] = await pool.execute(
        'SELECT id FROM user_usage_stats WHERE user_id = ?',
        [userId]
      );
      console.log(`✅ [USER INIT] Query succeeded, found ${existing.length} records`);

      if (existing.length === 0) {
        await pool.execute(`
          INSERT INTO user_usage_stats 
          (user_id, tier, pledges_count, campaigns_count, sms_sent, emails_sent, ai_requests, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [userId, 'free', 0, 0, 0, 0, 0]);

        console.log(`✅ Monetization profile created (tier: free)`);
      }
    } catch (error) {
      console.error(`❌ Monetization profile error:`, error.message);
      throw error;
    }

    // ============================================
    // 2. Initialize Validation Status
    // ============================================
    try {
      const [existing] = await pool.execute(
        'SELECT user_id FROM user_validation_status WHERE user_id = ?',
        [userId]
      );

      if (existing.length === 0) {
        await pool.execute(`
          INSERT INTO user_validation_status
          (user_id, email_verified, phone_verified, two_factor_enabled, account_locked, failed_login_attempts, created_at)
          VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [userId, false, false, false, false, 0]);

        console.log(`✅ Validation status initialized`);
      }
    } catch (error) {
      console.error(`❌ Validation status error:`, error.message);
      throw error;
    }

    // ============================================
    // 3. Set Default Permissions
    // ============================================
    try {
      // Get user role
      const [users] = await pool.execute(
        'SELECT role FROM users WHERE id = ?',
        [userId]
      );

      const userRole = users[0]?.role || 'user';

      // Map roles to default permissions
      const defaultPermissions = {
        user: ['create_pledge', 'view_own_pledges', 'edit_own_pledges', 'make_payment'],
        staff: ['create_pledge', 'view_pledges', 'edit_pledges', 'manage_payments', 'view_analytics'],
        admin: ['*']  // Full access
      };

      const permissions = defaultPermissions[userRole] || defaultPermissions.user;

      // Insert default permissions
      for (const permission of permissions) {
        if (permission !== '*') {
          try {
            await pool.execute(`
              INSERT IGNORE INTO user_permissions 
              (user_id, permission_key, granted_at)
              VALUES (?, ?, NOW())
            `, [userId, permission]);
          } catch (e) {
            // Ignore duplicates
          }
        }
      }

      console.log(`✅ Default permissions set for role: ${userRole}`);
    } catch (error) {
      console.error(`❌ Permissions error:`, error.message);
      throw error;
    }

    // ============================================
    // 4. Log User Creation
    // ============================================
    try {
      await pool.execute(`
        INSERT INTO audit_log
        (action, user_id, resource_type, timestamp, details)
        VALUES (?, ?, ?, NOW(), ?)
      `, [
        'USER_CREATED',
        userId,
        'user',
        JSON.stringify({
          ...userData,
          password: undefined  // Never log password
        })
      ]);

      console.log(`✅ Audit log created`);
    } catch (error) {
      console.error(`❌ Audit log error:`, error.message);
      // Don't fail on audit log error
    }

    console.log(`✨ User ${userId} fully initialized`);

    return {
      success: true,
      userId,
      message: 'User initialization complete'
    };

  } catch (error) {
    console.error(`💥 User initialization failed:`, error.message);
    throw error;
  }
}

/**
 * Validate user before issuing login token
 * CRITICAL: Checks all pre-conditions for login
 */
async function validateUserForLogin(userId) {
  try {
    console.log(`🔐 [VALIDATE LOGIN] Checking user ${userId}`);

    // Check 1: User exists and is not deleted
    const [users] = await pool.execute(
      'SELECT id, email, username, phone, role FROM users WHERE id = ? AND deleted = 0',
      [userId]
    );

    if (users.length === 0) {
      return {
        success: false,
        error: 'User not found or deleted',
        code: 'USER_NOT_FOUND'
      };
    }

    const user = users[0];
    console.log(`✅ User exists (role: ${user.role})`);

    // Check 2: Valid role
    const validRoles = [
      'user',
      'donor',
      'creator',
      'staff',
      'support_staff',
      'finance_admin',
      'admin',
      'superadmin',
      'super_admin'
    ];
    if (!validRoles.includes(user.role)) {
      return {
        success: false,
        error: `Invalid role: ${user.role}`,
        code: 'INVALID_ROLE'
      };
    }
    console.log(`✅ Role is valid`);

    // Check 3: Account not locked
    const [validation] = await pool.execute(
      'SELECT account_locked, locked_until FROM user_validation_status WHERE user_id = ?',
      [userId]
    );

    if (validation.length > 0) {
      const { account_locked, locked_until } = validation[0];
      if (account_locked) {
        const now = new Date();
        if (locked_until && new Date(locked_until) > now) {
          return {
            success: false,
            error: 'Account temporarily locked. Try again later.',
            code: 'ACCOUNT_LOCKED',
            lockedUntil: locked_until
          };
        }
      }
    }
    console.log(`✅ Account not locked`);

    // Check 4: Monetization profile exists
    const [monetization] = await pool.execute(
      'SELECT id, tier FROM user_usage_stats WHERE user_id = ?',
      [userId]
    );

    if (monetization.length === 0) {
      console.warn(`⚠️ No monetization profile, creating...`);
      await pool.execute(
        'INSERT INTO user_usage_stats (user_id, tier) VALUES (?, ?)',
        [userId, 'free']
      );
    } else {
      console.log(`✅ Monetization tier: ${monetization[0].tier}`);
    }

    // Check 5: Validation status exists
    const [validationStatus] = await pool.execute(
      'SELECT user_id FROM user_validation_status WHERE user_id = ?',
      [userId]
    );

    if (validationStatus.length === 0) {
      console.warn(`⚠️ No validation status, creating...`);
      await pool.execute(
        'INSERT INTO user_validation_status (user_id) VALUES (?)',
        [userId]
      );
    } else {
      console.log(`✅ Validation status exists`);
    }

    console.log(`✨ All validations passed`);

    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      readyForLogin: true
    };

  } catch (error) {
    console.error(`💥 Login validation failed:`, error.message);
    return {
      success: false,
      error: error.message,
      code: 'VALIDATION_ERROR'
    };
  }
}

/**
 * Log login attempt
 */
async function logLoginAttempt(userId, success, failureReason = null, ipAddress = null) {
  try {
    await pool.execute(`
      INSERT INTO login_history
      (user_id, login_time, success, failure_reason, ip_address)
      VALUES (?, NOW(), ?, ?, ?)
    `, [userId, success ? 1 : 0, failureReason, ipAddress]);

    // Update last_login on successful login
    if (success) {
      await pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [userId]
      );
    }

    // Track failed attempts for account lockout
    if (!success) {
      const [validation] = await pool.execute(
        'SELECT failed_login_attempts FROM user_validation_status WHERE user_id = ?',
        [userId]
      );

      if (validation.length > 0) {
        const attempts = validation[0].failed_login_attempts + 1;
        
        // Lock after 5 failed attempts for 15 minutes
        if (attempts >= 5) {
          await pool.execute(`
            UPDATE user_validation_status 
            SET failed_login_attempts = ?, 
                last_failed_attempt = NOW(),
                account_locked = 1,
                locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
            WHERE user_id = ?
          `, [attempts, userId]);

          console.warn(`🔒 Account locked after ${attempts} failed attempts`);
        } else {
          await pool.execute(`
            UPDATE user_validation_status 
            SET failed_login_attempts = ?, last_failed_attempt = NOW()
            WHERE user_id = ?
          `, [attempts, userId]);
        }
      }
    } else {
      // Reset failed attempts on successful login
      await pool.execute(`
        UPDATE user_validation_status 
        SET failed_login_attempts = 0, account_locked = 0
        WHERE user_id = ?
      `, [userId]);
    }

  } catch (error) {
    console.error(`❌ Login logging error:`, error.message);
    // Don't fail on logging error
  }
}

/**
 * Store session token for tracking
 */
async function storeSessionToken(userId, tokenHash, expiresAt, ipAddress = null) {
  try {
    await pool.execute(`
      INSERT INTO session_tokens
      (user_id, token_hash, issued_at, expires_at, ip_address)
      VALUES (?, ?, NOW(), ?, ?)
    `, [userId, tokenHash, expiresAt, ipAddress]);

    console.log(`✅ Session token stored`);
  } catch (error) {
    console.error(`❌ Token storage error:`, error.message);
    // Don't fail on token storage error
  }
}

module.exports = {
  initializeNewUser,
  validateUserForLogin,
  logLoginAttempt,
  storeSessionToken
};
