// scripts/check-db-users.js
// Run with: node scripts/check-db-users.js

const db = require('../config/db');

(async () => {
  try {
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM users');
    console.log('[DB CHECK] User count:', rows[0].count);
    const [users] = await db.execute('SELECT id, username, email, phone_number FROM users ORDER BY id DESC LIMIT 10');
    console.log('[DB CHECK] Sample users:', users);
    process.exit(0);
  } catch (err) {
    console.error('[DB CHECK ERROR]', err);
    process.exit(1);
  }
})();
