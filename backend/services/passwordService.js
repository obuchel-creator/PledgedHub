const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function changePassword(userId, currentPassword, newPassword) {
  console.log(`[PasswordService] changePassword called for userId: ${userId}`);

  try {
    // Fetch current password hash
    const [rows] = await pool.execute(
      'SELECT password FROM users WHERE id = ? LIMIT 1',
      [userId]
    );
    if (!rows.length) {
      console.warn(`[PasswordService] User not found: ${userId}`);
      return { success: false, error: 'User not found' };
    }

    const user = rows[0];
    console.log(`[PasswordService] Fetched user for password change:`, user);

    // Compare current password
    const match = await bcrypt.compare(currentPassword, user.password);
    console.log(`[PasswordService] Password match: ${match}`);

    if (!match) {
      return { success: false, error: 'Current password is incorrect' };
    }

    // Hash new password
    const newHash = await bcrypt.hash(newPassword, 10);
    console.log(`[PasswordService] New password hash generated`);

    // Update password in DB
    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [newHash, userId]
    );
    console.log(`[PasswordService] Password updated for userId: ${userId}`);

    return { success: true };
  } catch (error) {
    console.error(`[PasswordService] Error changing password:`, error);
    return { success: false, error: 'Failed to change password. Please try again.' };
  }
}

module.exports = { changePassword };
