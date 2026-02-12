const { pool } = require('../config/db');

async function syncPaidPledgesToPayments() {
  const connection = await pool.getConnection();
  
  try {
    console.log('🔄 Starting sync of paid pledges to payments table...\n');
    
    // First, check what columns exist in pledges table
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'pledges' 
      ORDER BY COLUMN_NAME
    `);
    
    console.log('📋 Available columns in pledges table:');
    columns.forEach(col => console.log(`   - ${col.COLUMN_NAME}`));
    console.log('');
    
    // Find all paid pledges that don't have corresponding payment records
    const [paidPledges] = await connection.execute(`
      SELECT p.id, p.amount, p.created_at, p.status, p.created_by
      FROM pledges p
      LEFT JOIN payments pm ON p.id = pm.pledge_id
      WHERE p.status = 'paid' 
        AND p.amount > 0
        AND pm.id IS NULL
        AND p.deleted = 0
    `);
    
    console.log(`Found ${paidPledges.length} paid pledges without payment records\n`);
    
    if (paidPledges.length === 0) {
      console.log('✓ All paid pledges already have payment records!');
      connection.release();
      return;
    }
    
    // Create payment records for each paid pledge
    await connection.beginTransaction();
    
    for (const pledge of paidPledges) {
      const [result] = await connection.execute(
        `INSERT INTO payments (pledge_id, amount, payment_method, payment_date, deleted)
         VALUES (?, ?, ?, ?, 0)`,
        [
          pledge.id,
          pledge.amount,
          'manual',
          pledge.created_at || new Date()
        ]
      );
      
      console.log(`✓ Created payment record for Pledge #${pledge.id} (${pledge.amount} UGX)`);
    }
    
    await connection.commit();
    console.log(`\n✅ Successfully synced ${paidPledges.length} paid pledges to payments table!`);
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Error syncing paid pledges:', error.message);
    console.error('SQL State:', error.sqlState);
    console.error('Full error:', error);
    throw error;
  } finally {
    connection.release();
  }
}

// Run the sync
syncPaidPledgesToPayments()
  .then(() => {
    console.log('\n✓ Sync complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Fatal error:', err.message);
    process.exit(1);
  });
