const { pool } = require('../config/db');

async function createPaymentsTable() {
    try {
        console.log('🔧 Checking/Creating payments table...');

        // Check if payments table exists
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'payments'
        `);

        if (tables.length > 0) {
            console.log('ℹ️  Payments table already exists');
            
            // Check if it has the required columns
            const [columns] = await pool.query(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'payments'
            `);
            
            const columnNames = columns.map(col => col.COLUMN_NAME);
            console.log('📋 Existing columns:', columnNames.join(', '));
            
            // Add missing columns if needed
            const requiredColumns = {
                'recorded_by': 'INT NOT NULL COMMENT \'User ID who recorded the payment\'',
                'reference': 'VARCHAR(255) DEFAULT NULL COMMENT \'Transaction reference or receipt number\'',
                'notes': 'TEXT DEFAULT NULL'
            };
            
            for (const [colName, colDef] of Object.entries(requiredColumns)) {
                if (!columnNames.includes(colName)) {
                    console.log(`  Adding missing column: ${colName}`);
                    await pool.query(`ALTER TABLE payments ADD COLUMN ${colName} ${colDef}`);
                    console.log(`  ✅ Added ${colName}`);
                }
            }
            
            console.log('✅ Payments table is up to date!');
            process.exit(0);
            return;
        }

        // Create new payments table
        await pool.query(`
            CREATE TABLE payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pledge_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                payment_date DATE NOT NULL,
                payment_method ENUM('cash', 'mobile_money', 'bank_transfer', 'cheque', 'other') DEFAULT 'cash',
                reference VARCHAR(255) DEFAULT NULL COMMENT 'Transaction reference or receipt number',
                notes TEXT DEFAULT NULL,
                recorded_by INT NOT NULL COMMENT 'User ID who recorded the payment',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE,
                FOREIGN KEY (recorded_by) REFERENCES users(id),
                INDEX idx_pledge_id (pledge_id),
                INDEX idx_payment_date (payment_date),
                INDEX idx_recorded_by (recorded_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Payments table created successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

createPaymentsTable();
