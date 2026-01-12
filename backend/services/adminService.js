const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');
const { auditRoleAccess } = require('../middleware/authMiddleware');

/**
 * Superadmin: Reset another admin's password (forces reset on next login)
 * @param {number} superadminId - ID of the superadmin performing the reset
 * @param {number} targetUserId - ID of the admin whose password is being reset
 * @param {string} newPassword - New password to set (must be strong)
 * @returns {Promise<{ success: boolean, error?: string }>} Result
 */
async function superadminResetAdminPassword(superadminId, targetUserId, newPassword) {
  try {
    // Check that superadminId is a superadmin
    const [superadmins] = await pool.execute('SELECT id, role FROM users WHERE id = ? AND role = ? AND deleted_at IS NULL', [superadminId, 'superadmin']);
    if (!superadmins.length) {
      return { success: false, error: 'Only superadmins can reset admin passwords.' };
    }

    // Check that target user exists and is admin (not self)
    const [admins] = await pool.execute('SELECT id, role FROM users WHERE id = ? AND deleted_at IS NULL', [targetUserId]);
    if (!admins.length) {
      return { success: false, error: 'Target user not found.' };
    }
    if (admins[0].role !== 'admin' && admins[0].role !== 'superadmin') {
      return { success: false, error: 'Target user is not an admin or superadmin.' };
    }
    if (superadminId === targetUserId) {
      return { success: false, error: 'Superadmin cannot reset their own password.' };
    }

    // Validate password strength (reuse frontend rules)
    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    // Add more checks as needed

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Set password and force reset on next login
    await pool.execute(
      'UPDATE users SET password_hash = ?, password_reset_required = 1 WHERE id = ?',
      [passwordHash, targetUserId]
    );

    // Audit log
    await auditRoleAccess(superadminId, 'reset_admin_password', { targetUserId, newPassword: 'set' });

    return { success: true };
  } catch (error) {
    console.error('[superadminResetAdminPassword] Error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { superadminResetAdminPassword };
