// Audit orphaned or incorrectly marked pledges
// Usage: node backend/scripts/audit-orphaned-pledges.js

const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function auditPledges() {
  const log = [];
  try {
    // Find pledges marked deleted but with active payments
    const [deletedWithPayments] = await pool.execute(`
      SELECT p.id, p.donor_name, p.amount, p.deleted, COUNT(pay.id) AS payment_count
      FROM pledges p
      LEFT JOIN payments pay ON pay.pledge_id = p.id AND pay.status = 'completed'
      WHERE p.deleted = 1
      GROUP BY p.id
      HAVING payment_count > 0
    `);
    log.push('--- Deleted pledges with active payments ---');
    deletedWithPayments.forEach(row => {
      log.push(`Pledge ID ${row.id}: ${row.donor_name} UGX ${row.amount} (Payments: ${row.payment_count})`);
    });

    // Find pledges not deleted but with no donor info or amount
    const [missingInfo] = await pool.execute(`
      SELECT id, donor_name, amount, deleted
      FROM pledges
      WHERE deleted = 0 AND (donor_name IS NULL OR donor_name = '' OR amount IS NULL OR amount <= 0)
    `);
    log.push('\n--- Active pledges missing donor info or amount ---');
    missingInfo.forEach(row => {
      log.push(`Pledge ID ${row.id}: donor_name='${row.donor_name}', amount=${row.amount}`);
    });

    // Find pledges with no matching user
    const [orphanedUser] = await pool.execute(`
      SELECT p.id, p.donor_name, p.amount, p.user_id
      FROM pledges p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE u.id IS NULL
    `);
    log.push('\n--- Pledges with no matching user ---');
    orphanedUser.forEach(row => {
      log.push(`Pledge ID ${row.id}: donor_name='${row.donor_name}', amount=${row.amount}, user_id=${row.user_id}`);
    });

    // Write results to file
    const outPath = path.join(__dirname, 'audit-orphaned-pledges.log');
    fs.writeFileSync(outPath, log.join('\n'), 'utf8');
    console.log(`Audit complete. Results written to ${outPath}`);
  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    pool.end();
  }
}

auditPledges();
