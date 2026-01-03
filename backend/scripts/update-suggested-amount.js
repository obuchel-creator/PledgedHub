// Temporary script to update all campaigns with a default suggested_amount if missing or zero
const { pool } = require('../config/db');

async function updateSuggestedAmount() {
  try {
    const [result] = await pool.execute(
      'UPDATE campaigns SET suggested_amount = 10000 WHERE suggested_amount IS NULL OR suggested_amount <= 0'
    );
    console.log(`✅ Updated ${result.affectedRows} campaigns with default suggested_amount.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating suggested_amount:', error);
    process.exit(1);
  }
}

updateSuggestedAmount();
