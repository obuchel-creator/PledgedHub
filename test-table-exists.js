const { pool } = require('./backend/config/db');

(async () => {
  try {
    console.log('Checking database tables...');
    
    // Check current database
    const [db] = await pool.query('SELECT DATABASE() as db');
    console.log('Current database:', db[0].db);
    
    // List all tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('\nAll tables:', tables.map(t => Object.values(t)[0]));
    
    // Check user_usage_stats specifically
    const [exists] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'pledgehub_db' 
      AND table_name = 'user_usage_stats'
    `);
    console.log('\nuser_usage_stats exists:', exists[0].count > 0);
    
    // Try to query it
    const [rows] = await pool.query('SELECT COUNT(*) as count FROM user_usage_stats');
    console.log('Records in user_usage_stats:', rows[0].count);
    
    await pool.end();
    console.log('\n✅ All checks passed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
