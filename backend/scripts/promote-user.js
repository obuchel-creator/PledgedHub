// promote-user.js
// Usage: node promote-user.js <userId> <role>
const db = require('../config/db');

async function promoteUser(userId, role = 'admin') {
  if (!userId) {
    console.error('Usage: node promote-user.js <userId> [role]');
    process.exit(1);
  }
  if (!['admin', 'staff'].includes(role)) {
    console.error('Role must be admin or staff');
    process.exit(1);
  }
  try {
    const [result] = await db.execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    if (result.affectedRows > 0) {
      console.log(`User ${userId} promoted to ${role}.`);
    } else {
      console.error('User not found or not updated.');
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error promoting user:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  const userId = process.argv[2];
  const role = process.argv[3] || 'admin';
  promoteUser(userId, role);
}
