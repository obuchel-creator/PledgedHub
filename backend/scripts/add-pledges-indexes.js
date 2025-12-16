const db = require('../config/db');

async function addPledgesIndexes() {
  try {
    console.log('Adding indexes to pledges table...');
    const indexes = [
      { name: 'idx_pledges_phone', column: 'phone' },
      { name: 'idx_pledges_email', column: 'email' },
      { name: 'idx_pledges_collection_date', column: 'collection_date' },
    ];
    for (const idx of indexes) {
      const [rows] = await db.execute(
        `SELECT COUNT(1) as count FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = 'pledges' AND index_name = ?`,
        [idx.name]
      );
      if (rows[0].count === 0) {
        console.log(`  Creating index ${idx.name} on ${idx.column}...`);
        await db.execute(`CREATE INDEX ${idx.name} ON pledges(${idx.column})`);
        console.log(`  ✓ Index ${idx.name} created.`);
      } else {
        console.log(`  Index ${idx.name} already exists.`);
      }
    }
    console.log('✓ Indexes checked/created successfully on pledges table');
    await db.close();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error adding indexes:', error.message);
    await db.close();
    process.exit(1);
  }
}

addPledgesIndexes();