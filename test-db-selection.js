const { pool } = require('./backend/config/db');

(async () => {
  try {
    // Check which database is selected
    const [db] = await pool.query('SELECT DATABASE() as current_db');
    console.log('Current database:', db[0].current_db);
    
    // Check if user_usage_stats exists
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'pledgehub_db' 
      AND TABLE_NAME = 'user_usage_stats'
    `);
    console.log('user_usage_stats in pledgehub_db:', tables.length > 0 ? 'EXISTS' : 'NOT FOUND');
    
    // Check using DATABASE()
    const [check] = await pool.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'user_usage_stats'
    `);
    console.log('user_usage_stats in DATABASE():', check.length > 0 ? 'EXISTS' : 'NOT FOUND');
    
    await pool.end();
  } catch (error) {
    console.error('ERROR:', error.message);
  }
})();
