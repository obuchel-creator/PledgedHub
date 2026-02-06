const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * Migration: Change payment_date from DATE to DATETIME
 * This allows storing both date and time for payments
 * Date: 2026-02-06
 */

async function migratePaymentDateTime() {
    let pool;
    try {
        // Create connection pool
        pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        console.log('🔄 Starting migration: payment_date DATE → DATETIME\n');

        // Check if payments table exists
        const [tables] = await pool.query(`
            SELECT TABLE_NAME 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'payments'
        `, [process.env.DB_NAME]);

        if (tables.length === 0) {
            console.log('ℹ️  Payments table does not exist yet. Skipping migration.');
            await pool.end();
            process.exit(0);
            return;
        }

        // Check current column type
        const [columns] = await pool.query(`
            SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ? 
                AND TABLE_NAME = 'payments' 
                AND COLUMN_NAME = 'payment_date'
        `, [process.env.DB_NAME]);

        if (columns.length === 0) {
            console.log('⚠️  payment_date column does not exist in payments table.');
            await pool.end();
            process.exit(1);
            return;
        }

        const currentType = columns[0].DATA_TYPE.toLowerCase();
        console.log('📋 Current payment_date type:', currentType.toUpperCase());

        if (currentType === 'datetime' || currentType === 'timestamp') {
            console.log('✅ payment_date is already DATETIME/TIMESTAMP. No migration needed!');
            await pool.end();
            process.exit(0);
            return;
        }

        // Alter column from DATE to DATETIME
        console.log('🔧 Altering payment_date column from DATE to DATETIME...');
        await pool.query(`
            ALTER TABLE payments 
            MODIFY COLUMN payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        `);

        console.log('✅ Successfully changed payment_date to DATETIME');
        console.log('✅ Existing DATE values preserved (time will be 00:00:00)');
        console.log('ℹ️  New payments will now store full date + time\n');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        if (pool) await pool.end();
        process.exit(1);
    }
}

migratePaymentDateTime();
