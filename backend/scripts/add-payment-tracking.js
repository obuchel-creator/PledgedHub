const { pool } = require('../config/db');

/**
 * Migration: Add payment tracking columns to pledges table
 * Tracks total paid amount and remaining balance for partial payments
 */

async function addPaymentTrackingColumns() {
    try {
        console.log('Adding payment tracking columns to pledges table...');
        
        // Check if columns already exist
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'pledges' 
            AND COLUMN_NAME IN ('amount_paid', 'balance_remaining', 'last_payment_date', 'last_balance_reminder')
        `);
        
        const existingColumns = columns.map(c => c.COLUMN_NAME);
        
        // Add amount_paid column (tracks total amount paid so far)
        if (!existingColumns.includes('amount_paid')) {
            await pool.query(`
                ALTER TABLE pledges 
                ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0.00 AFTER amount
            `);
            console.log('✓ Added amount_paid column');
        } else {
            console.log('✓ amount_paid column already exists');
        }
        
        // Add balance_remaining column (calculated field for remaining balance)
        if (!existingColumns.includes('balance_remaining')) {
            await pool.query(`
                ALTER TABLE pledges 
                ADD COLUMN balance_remaining DECIMAL(10, 2) DEFAULT 0.00 AFTER amount_paid
            `);
            console.log('✓ Added balance_remaining column');
        } else {
            console.log('✓ balance_remaining column already exists');
        }
        
        // Add last_payment_date column
        if (!existingColumns.includes('last_payment_date')) {
            await pool.query(`
                ALTER TABLE pledges 
                ADD COLUMN last_payment_date DATETIME DEFAULT NULL AFTER balance_remaining
            `);
            console.log('✓ Added last_payment_date column');
        } else {
            console.log('✓ last_payment_date column already exists');
        }
        
        // Add last_balance_reminder column (track when we last sent a balance reminder)
        if (!existingColumns.includes('last_balance_reminder')) {
            await pool.query(`
                ALTER TABLE pledges 
                ADD COLUMN last_balance_reminder DATETIME DEFAULT NULL AFTER last_payment_date
            `);
            console.log('✓ Added last_balance_reminder column');
        } else {
            console.log('✓ last_balance_reminder column already exists');
        }
        
        // Initialize balance_remaining for existing pledges
        await pool.query(`
            UPDATE pledges 
            SET balance_remaining = amount - amount_paid 
            WHERE balance_remaining = 0 AND amount > 0
        `);
        console.log('✓ Initialized balance_remaining for existing pledges');
        
        console.log('✅ Payment tracking setup complete');
        process.exit(0);
        
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addPaymentTrackingColumns();
