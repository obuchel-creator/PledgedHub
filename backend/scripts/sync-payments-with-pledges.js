const { pool } = require('../config/db');

/**
 * Sync Script: Create payment records for any pledges that are marked as paid
 * but don't have corresponding payment records
 */

async function syncPaymentsWithPledges() {
  console.log('🔄 Syncing payments with paid pledges...\n');

  try {
    // Find all pledges that are marked as paid but have no payment records
    const [paidPledgesWithoutPayments] = await pool.execute(`
      SELECT p.id, p.donor_name, p.amount, p.payment_method, p.created_at
      FROM pledges p
      LEFT JOIN payments pm ON p.id = pm.pledge_id
      WHERE p.status = 'paid'
        AND p.deleted = 0
        AND pm.id IS NULL
      LIMIT 100
    `);

    console.log(`Found ${paidPledgesWithoutPayments.length} paid pledges without payment records\n`);

    if (paidPledgesWithoutPayments.length === 0) {
      console.log('✅ All paid pledges have corresponding payment records!');
      process.exit(0);
      return;
    }

    // Create payment records for these pledges
    let created = 0;
    let failed = 0;

    for (const pledge of paidPledgesWithoutPayments) {
      try {
        console.log(`📝 Creating payment record for pledge #${pledge.id} (${pledge.donor_name})`);
        
        const [result] = await pool.execute(
          `INSERT INTO payments 
           (pledge_id, amount, payment_method, payment_date) 
           VALUES (?, ?, ?, ?)`,
          [
            pledge.id,
            pledge.amount,
            pledge.payment_method || 'manual',
            new Date()
          ]
        );

        if (result.affectedRows > 0) {
          console.log(`   ✅ Payment created (ID: ${result.insertId})\n`);
          created++;
        }
      } catch (error) {
        console.error(`   ❌ Failed to create payment for pledge #${pledge.id}:`, error.message, '\n');
        failed++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Created: ${created} payment records`);
    console.log(`   ❌ Failed: ${failed} payment records`);
    console.log(`\n✅ Sync completed!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Sync failed:', error);
    process.exit(1);
  }
}

syncPaymentsWithPledges();
