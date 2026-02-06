const { pool } = require('./backend/config/db');

async function checkSchema() {
  try {
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_KEY FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'audit_log' AND TABLE_SCHEMA = 'pledgehub_db'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('audit_log columns:');
    columns.forEach(c => {
      console.log(`  ${c.COLUMN_NAME} (${c.DATA_TYPE})${c.COLUMN_KEY === 'PRI' ? ' [PK]' : ''}`);
    });
  } finally {
    await pool.end();
  }
}

checkSchema();
