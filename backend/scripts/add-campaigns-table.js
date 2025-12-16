const db = require('../config/db');

async function addCampaignsTable() {
    console.log('🚀 Starting campaigns table migration...\n');

    try {
        // 1. Create campaigns table
        console.log('📋 Creating campaigns table...');
        const createCampaignsSQL = `
            CREATE TABLE IF NOT EXISTS campaigns (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                goal_amount DECIMAL(15,2) NOT NULL,
                suggested_amount DECIMAL(15,2),
                current_amount DECIMAL(15,2) DEFAULT 0,
                status ENUM('active', 'completed', 'cancelled') DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_created (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `;

        await db.execute(createCampaignsSQL);
        console.log('✅ Campaigns table created successfully\n');

        // 2. Check if campaign_id column exists in pledges table
        console.log('📋 Checking if campaign_id column exists in pledges table...');
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'pledges' 
            AND COLUMN_NAME = 'campaign_id'
        `);

        if (columns.length === 0) {
            console.log('📋 Adding campaign_id column to pledges table...');
            
            // Add campaign_id column
            await db.execute(`
                ALTER TABLE pledges
                ADD COLUMN campaign_id INT DEFAULT NULL AFTER id
            `);
            console.log('✅ Added campaign_id column\n');

            // Add index
            console.log('📋 Adding index on campaign_id...');
            await db.execute(`
                ALTER TABLE pledges
                ADD INDEX idx_campaign_id (campaign_id)
            `);
            console.log('✅ Added index on campaign_id\n');

            // Add foreign key constraint
            console.log('📋 Adding foreign key constraint...');
            await db.execute(`
                ALTER TABLE pledges
                ADD CONSTRAINT fk_campaign 
                FOREIGN KEY (campaign_id) 
                REFERENCES campaigns(id) 
                ON DELETE SET NULL
            `);
            console.log('✅ Added foreign key constraint\n');
        } else {
            console.log('ℹ️  campaign_id column already exists in pledges table\n');
        }

        console.log('✨ Campaign migration completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('Next steps:');
        console.log('1. Start backend: npm run dev (in backend folder)');
        console.log('2. Test campaigns: node backend/scripts/test-campaigns.js');
        console.log('3. Use API: POST /api/campaigns to create campaigns\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('ℹ️  Campaigns table already exists');
            process.exit(0);
        } else if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('ℹ️  campaign_id column already exists');
            process.exit(0);
        } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log('ℹ️  Index or constraint already exists');
            process.exit(0);
        }
        
        console.error('Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        process.exit(1);
    }
}

// Run migration
addCampaignsTable();
