const { pool } = require('../config/db');

async function createPaymentSettingsTable() {
  try {
    console.log('⏳ Creating payment_settings table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS payment_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        mtn_data LONGTEXT DEFAULT NULL COMMENT 'Encrypted MTN Mobile Money settings',
        airtel_data LONGTEXT DEFAULT NULL COMMENT 'Encrypted Airtel Money settings',
        paypal_data LONGTEXT DEFAULT NULL COMMENT 'Encrypted PayPal settings',
        stripe_data LONGTEXT DEFAULT NULL COMMENT 'Encrypted Stripe settings (future)',
        security_settings JSON DEFAULT NULL COMMENT 'IP whitelist, rate limits',
        webhook_settings JSON DEFAULT NULL COMMENT 'Webhook URLs and configs',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT DEFAULT NULL,
        updated_by INT DEFAULT NULL,
        INDEX idx_created_at (created_at),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.execute(createTableSQL);
    console.log('✅ payment_settings table created successfully');

    // Verify table
    const [tables] = await pool.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_NAME = 'payment_settings'`
    );

    if (tables.length > 0) {
      console.log('✅ Table verification passed');
      return { success: true, message: 'payment_settings table created' };
    } else {
      throw new Error('Table creation verification failed');
    }
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  payment_settings table already exists');
      return { success: true, message: 'Table already exists' };
    }
    console.error('❌ Error creating table:', error.message);
    throw error;
  }
}

// Run migration
if (require.main === module) {
  createPaymentSettingsTable()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { createPaymentSettingsTable };
