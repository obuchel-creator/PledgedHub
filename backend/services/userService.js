const { pool } = require('../config/db');

async function promoteToAdmin(identifier) {
  // identifier can be email, phone, or username
  try {
    const [result] = await pool.execute(
      `UPDATE users SET role = 'admin' WHERE email = ? OR phone = ? OR username = ?`,
      [identifier, identifier, identifier]
    );
    if (result.affectedRows > 0) {
      return { success: true };
    } else {
      return { success: false, error: 'User not found' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = { promoteToAdmin };