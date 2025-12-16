// Migration script to add feedback table
const db = require('../config/db');

const sql = `CREATE TABLE IF NOT EXISTS feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  message TEXT NOT NULL,
  user_agent VARCHAR(255),
  created_at DATETIME NOT NULL
)`;

(async () => {
  try {
    await db.execute(sql);
    console.log('✅ Feedback table created or already exists');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating feedback table:', err);
    process.exit(1);
  }
})();
