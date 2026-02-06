const { pool } = require('./backend/config/db');

(async () => {
  const [tables] = await pool.execute(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'pledgehub_db' ORDER BY TABLE_NAME`
  );
  console.log('Tables in pledgehub_db:');
  tables.forEach(t => console.log('  -', t.TABLE_NAME));
  await pool.end();
})();
