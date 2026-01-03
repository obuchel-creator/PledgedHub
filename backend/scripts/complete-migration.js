const { pool } = require('../config/db');

/**
 * Complete Migration: Add all necessary columns for AI/Automation features
 * This migration adds donor tracking, reminders, and collection date columns
 */

const DB_NAME = process.env.DB_NAME || 'pledgehub_db';

async function runMigration() {
    console.log('🔄 Starting comprehensive database migration...\n');
    
    try {
        // Check and add columns to pledges table
        const columnsToAdd = [
            {
                name: 'donor_name',
                definition: 'VARCHAR(255)',
                after: 'name',
                description: 'Name of the person making the pledge'
            },
            {
                name: 'donor_email',
                definition: 'VARCHAR(255)',
                after: 'donor_name',
                description: 'Email of the donor'
            },
            {
                name: 'donor_phone',
                definition: 'VARCHAR(20)',
                after: 'donor_email',
                description: 'Phone number of the donor'
            },
            {
                name: 'purpose',
                definition: 'VARCHAR(500)',
                after: 'description',
                description: 'Purpose/category of the pledge'
            },
            {
                name: 'collection_date',
                definition: 'DATE',
                after: 'purpose',
                description: 'When the pledge amount should be collected'
            },
            {
                name: 'last_reminder_sent',
                definition: 'DATETIME DEFAULT NULL',
                after: 'collection_date',
                description: 'Timestamp of last reminder sent'
            },
            {
                name: 'reminder_count',
                definition: 'INT DEFAULT 0',
                after: 'last_reminder_sent',
                description: 'Number of reminders sent for this pledge'
            },
            {
                name: 'payment_method',
                definition: "ENUM('cash', 'mobile_money', 'bank_transfer', 'check', 'other') DEFAULT 'cash'",
                after: 'reminder_count',
                description: 'Preferred payment method'
            },
            {
                name: 'notes',
                definition: 'TEXT',
                after: 'payment_method',
                description: 'Additional notes about the pledge'
            }
        ];
        
        // Update status column to match our needs
        console.log('1️⃣  Checking status column...');
        const [statusCheck] = await pool.execute(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = 'pledges' 
            AND COLUMN_NAME = 'status'
        `, [DB_NAME]);
        
        if (statusCheck && statusCheck[0]) {
            const currentType = statusCheck[0].COLUMN_TYPE;
            if (!currentType.includes('pending') || !currentType.includes('paid')) {
                console.log('   ⚙️  Updating status column to support new values...');
                await pool.execute(`
                    ALTER TABLE pledges 
                    MODIFY COLUMN status ENUM('active', 'pending', 'paid', 'completed', 'cancelled', 'overdue') 
                    DEFAULT 'pending'
                `);
                console.log('   ✅ Status column updated\n');
            } else {
                console.log('   ℹ️  Status column already has correct values\n');
            }
        }
        
        // Add each column if it doesn't exist
        for (const column of columnsToAdd) {
            console.log(`2️⃣  Checking ${column.name} column...`);
            
            const [exists] = await pool.execute(`
                SELECT COUNT(*) as count
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = ?
                AND TABLE_NAME = 'pledges'
                AND COLUMN_NAME = ?
            `, [DB_NAME, column.name]);
            
            if (exists[0].count === 0) {
                console.log(`   ⚙️  Adding ${column.name}: ${column.description}`);
                await pool.execute(`
                    ALTER TABLE pledges 
                    ADD COLUMN ${column.name} ${column.definition} 
                    AFTER ${column.after}
                `);
                console.log(`   ✅ ${column.name} added successfully\n`);
            } else {
                console.log(`   ℹ️  ${column.name} already exists\n`);
            }
        }
        
        // Show final table structure
        console.log('📋 Final pledges table structure:');
        const [columns] = await pool.execute('DESCRIBE pledges');
        console.table(columns);
        
        // Update any existing pledges with default values
        console.log('\n3️⃣  Updating existing pledges with defaults...');
        
        // Set default collection_date for pledges without one (30 days from creation)
        const [updated] = await pool.execute(`
            UPDATE pledges 
            SET collection_date = DATE_ADD(created_at, INTERVAL 30 DAY)
            WHERE collection_date IS NULL
        `);
        console.log(`   ✅ Updated ${updated.affectedRows} pledges with default collection dates`);
        
        // Set donor_name from name field where empty
            // Skipped: No legacy 'name' column exists, so no donor_name update needed
        
        // Set default purpose where empty
        const [purposeUpdated] = await pool.execute(`
            UPDATE pledges 
            SET purpose = 'General Pledge'
            WHERE purpose IS NULL OR purpose = ''
        `);
        console.log(`   ✅ Updated ${purposeUpdated.affectedRows} pledges with default purposes`);
        
        console.log('\n✅ Migration completed successfully!');
        console.log('\n📊 Summary:');
        console.log('   • Donor tracking columns added (name, email, phone)');
        console.log('   • Reminder system columns added');
        console.log('   • Collection date tracking added');
        console.log('   • Payment method and notes fields added');
        console.log('   • Status column updated for complete workflow');
        console.log('   • Existing data migrated with sensible defaults\n');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    }
}

runMigration();
