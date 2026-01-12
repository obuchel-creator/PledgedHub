// Promote a user to admin or superadmin by username or email
// Usage: node backend/scripts/promote-user-to-admin.js --username johndoe OR --email user@example.com [--superadmin]

const { pool } = require('../config/db');

async function promoteUser({ username, email, superadmin }) {
  if (!username && !email) {
    console.error('Provide --username or --email');
    process.exit(1);
  }
  const where = username ? 'username = ?' : 'email = ?';
  const value = username || email;
  const [rows] = await pool.execute(`SELECT id, username, email, role FROM users WHERE ${where} LIMIT 1`, [value]);
  if (!rows.length) {
    console.error('User not found');
    process.exit(1);
  }
  const user = rows[0];
  const newRole = superadmin ? 'superadmin' : 'admin';
  await pool.execute('UPDATE users SET role = ? WHERE id = ?', [newRole, user.id]);
  console.log(`User ${user.username || user.email} promoted to ${newRole}`);
  process.exit(0);
}

// Parse CLI args
const args = process.argv.slice(2);
let username, email, superadmin = false;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--username') username = args[++i];
  if (args[i] === '--email') email = args[++i];
  if (args[i] === '--superadmin') superadmin = true;
}

promoteUser({ username, email, superadmin });
