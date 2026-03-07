require('dotenv').config({ path: './backend/.env' });
const mysql = require('./backend/node_modules/mysql2/promise');

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'pledgehub_db',
};

const pool = mysql.createPool(cfg);

async function run() {
  const [[vRow]] = await pool.execute('SELECT VERSION() AS v, DATABASE() AS d');
  console.log(`\n✅ Connected to MySQL ${vRow.v}  |  database: ${vRow.d}\n`);

  const [tables] = await pool.query(
    `SELECT TABLE_NAME, TABLE_ROWS
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = '${cfg.database}' AND TABLE_TYPE = 'BASE TABLE'
     ORDER BY TABLE_NAME`
  );

  console.log(`   ${tables.length} tables found:\n`);
  tables.forEach(t => {
    const nm = String(t.TABLE_NAME).padEnd(35);
    console.log(`   ${nm} ~${t.TABLE_ROWS ?? 0} rows`);
  });
  process.exit(0);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
