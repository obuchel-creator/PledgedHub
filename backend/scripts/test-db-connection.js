const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const dbName = process.env.TEST_DB_NAME || process.env.DB_NAME;

(async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: dbName,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306
    });
    const [rows] = await connection.execute('SHOW TABLES');
    console.log('✅ Connected to DB:', dbName, '| Tables:', rows.map(r => Object.values(r)[0]));
    await connection.end();
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
})();
