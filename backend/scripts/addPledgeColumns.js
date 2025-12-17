const db = require('../config/db');

const DB_NAME = process.env.DB_NAME || 'pledgehub_db';
const TABLE = 'pledges';

const columns = [
  { name: 'title', def: 'VARCHAR(255) NOT NULL' },
  { name: 'description', def: 'TEXT' },
  { name: 'amount', def: 'DECIMAL(10,2) DEFAULT 0' },
  { name: 'ownerId', def: 'INT NULL' },
  { name: 'status', def: 'VARCHAR(50) NULL' },
  { name: 'raised', def: 'DECIMAL(10,2) DEFAULT 0' },
  { name: 'goal', def: 'DECIMAL(10,2) NULL' },
  { name: 'deleted', def: 'TINYINT(1) DEFAULT 0' },
];

(async () => {
  try {
    console.log('Migration start: add missing columns to', `${DB_NAME}.${TABLE}`);
    for (const col of columns) {
      const [rows] = await db.execute(
        `SELECT COUNT(*) AS cnt
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [DB_NAME, TABLE, col.name]
      );
      const exists = rows && rows[0] && Number(rows[0].cnt) > 0;
      if (exists) {
        console.log(` - column ${col.name} already exists`);
        continue;
      }
      const sql = `ALTER TABLE \`${TABLE}\` ADD COLUMN \`${col.name}\` ${col.def};`;
      console.log(' - adding column', col.name);
      await db.execute(sql);
      console.log(`   -> added ${col.name}`);
    }

    console.log('Migration finished.');
    const [desc] = await db.execute(`DESCRIBE \`${TABLE}\``);
    console.table(desc);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
})();