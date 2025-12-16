/**
 * Migration script to create the payments table
 * 
 * This table tracks all payments made against pledges.
 * Run this script once to add the payments table to your database.
 * 
 * Usage: node backend/scripts/add-payments-table.js
 */

const db = require('../config/db');

async function addPaymentsTable() {
    try {
        console.log('🔧 Starting payments table migration...');

        // Check if payments table already exists
        const [tables] = await db.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'payments'
        `);

        if (tables.length > 0) {
            console.log('✅ Payments table already exists. Skipping creation.');
            return;
        }

        // Create payments table
        console.log('📝 Creating payments table...');
        await db.execute(`
            CREATE TABLE payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                pledge_id INT NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
                status VARCHAR(20) NOT NULL DEFAULT 'completed',
                transaction_id VARCHAR(255) DEFAULT NULL,
                notes TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                refunded_at TIMESTAMP NULL DEFAULT NULL,
                FOREIGN KEY (pledge_id) REFERENCES pledges(id) ON DELETE CASCADE,
                INDEX idx_pledge_id (pledge_id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_created_at (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            COMMENT='Stores payment records for pledges'
        `);

        console.log('✅ Payments table created successfully!');
        
        // Insert some sample payments for testing
        console.log('📝 Adding sample payment data...');
        
        // First, get some pledge IDs
        const [pledges] = await db.execute('SELECT id, donor_name, amount FROM pledges LIMIT 5');
        
        if (pledges.length > 0) {
            for (const pledge of pledges) {
                // Create a partial payment for demonstration
                const paymentAmount = (pledge.amount * 0.5).toFixed(2); // 50% of pledge
                
                await db.execute(`
                    INSERT INTO payments (user_id, pledge_id, amount, payment_method, status, notes, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND() * 30) DAY)
                `, [
                    1, // Default user ID (admin)
                    pledge.id,
                    paymentAmount,
                    ['cash', 'mobile_money', 'bank_transfer', 'card'][Math.floor(Math.random() * 4)],
                    'completed',
                    `Payment from ${pledge.donor_name}`
                ]);
                
                console.log(`   ✓ Added payment of UGX ${paymentAmount} for pledge #${pledge.id}`);
            }
            
            console.log(`✅ Added ${pledges.length} sample payments`);
        } else {
            console.log('ℹ️  No pledges found. Skipping sample payment creation.');
        }

        console.log('\n✅ Migration completed successfully!');
        console.log('📊 You can now view payments in the dashboard.');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        await db.end();
    }
}

// Run the migration
addPaymentsTable()
    .then(() => {
        console.log('✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
