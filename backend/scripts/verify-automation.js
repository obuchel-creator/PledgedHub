const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

// Create direct database connection (don't load server)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pledgehub_db'
};

async function verifyAutomation() {
    console.log('🔍 Verifying Automated Reminder System\n');

    let connection;
    
    try {
        // Create direct connection
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ MySQL Connected\n');
        // 1. Check if last_reminder_sent column exists
        console.log('1️⃣ Checking database schema...');
        const [columns] = await connection.execute(`
            SHOW COLUMNS FROM pledges LIKE 'last_reminder_sent'
        `);

        if (columns.length === 0) {
            console.log('   ❌ Column last_reminder_sent not found');
            console.log('   📝 Action: Run migration script');
            console.log('   💻 Command: node backend/scripts/complete-migration.js\n');
            process.exit(1);
        }

        console.log('   ✅ Database schema: last_reminder_sent column exists\n');

        // 2. Check cron scheduler initialization
        console.log('2️⃣ Checking cron scheduler...');
        const cronPath = path.join(__dirname, '../services/cronScheduler.js');
        const fs = require('fs');
        
        if (fs.existsSync(cronPath)) {
            console.log('   ✅ Cron Scheduler: File exists');
            console.log('   ⏰ Schedule: 9:00 AM & 5:00 PM daily (Africa/Kampala)');
            console.log('   ℹ️  Jobs initialize when server starts\n');
        } else {
            console.log('   ❌ Cron Scheduler: File not found');
            process.exit(1);
        }

        // 3. Check pending pledges that need reminders
        console.log('3️⃣ Checking pledges needing reminders...');
        const [pendingPledges] = await connection.execute(`
            SELECT COUNT(*) as count
            FROM pledges
            WHERE status = 'pending'
              AND collection_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 7 DAY)
              AND (last_reminder_sent IS NULL 
                   OR last_reminder_sent < NOW() - INTERVAL 24 HOUR)
        `);

        console.log(`   📋 Pledges needing reminders: ${pendingPledges[0].count}`);
        
        if (pendingPledges[0].count > 0) {
            console.log('   ℹ️  These pledges will receive reminders at next scheduled time\n');
        } else {
            console.log('   ✅ No pending reminders (all up to date)\n');
        }

        // 4. Check last reminder sent
        console.log('4️⃣ Checking reminder history...');
        const [lastReminder] = await connection.execute(`
            SELECT 
                MAX(last_reminder_sent) as last_sent,
                COUNT(*) as total_reminders
            FROM pledges
            WHERE last_reminder_sent IS NOT NULL
        `);

        if (lastReminder[0].last_sent) {
            const lastSent = new Date(lastReminder[0].last_sent);
            const now = new Date();
            const hoursSince = Math.floor((now - lastSent) / (1000 * 60 * 60));

            console.log(`   📅 Last automated reminder: ${lastSent.toLocaleString()}`);
            console.log(`   ⏱️  Time elapsed: ${hoursSince} hours ago`);
            console.log(`   📊 Total reminders sent: ${lastReminder[0].total_reminders}\n`);
        } else {
            console.log('   ⚠️  No reminders have been sent yet');
            console.log('   ℹ️  Reminders will start at next scheduled time (9 AM or 5 PM)\n');
        }

        // 5. Check AI service availability
        console.log('5️⃣ Checking AI service...');
        const hasAIKey = !!process.env.AI_API_KEY;
        
        if (hasAIKey) {
            console.log('   ✅ AI Service: API key configured');
            console.log('   🤖 AI-enhanced personalized messages will be generated\n');
        } else {
            console.log('   ⚠️  AI Service: API key not configured');
            console.log('   💡 Tip: Set AI_API_KEY in .env for AI personalization');
            console.log('   ℹ️  System will use default templates\n');
        }

        // 6. Check email service configuration
        console.log('6️⃣ Checking email service...');
        const hasEmailConfig = process.env.SMTP_USER && process.env.SMTP_PASS;
        if (hasEmailConfig) {
            console.log('   ✅ Email Service: SMTP configured');
            console.log(`   📧 SMTP User: ${process.env.SMTP_USER}\n`);
        } else {
            console.log('   ❌ Email Service: SMTP not configured');
            console.log('   📝 Action: Set SMTP_USER and SMTP_PASS in .env');
            console.log('   💡 Tip: Use Gmail app passwords for SMTP\n');
        }

        // 7. Check SMS service configuration
        console.log('7️⃣ Checking SMS service...');
        const hasSMSConfig = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
        if (hasSMSConfig) {
            console.log('   ✅ SMS Service: Twilio configured (optional)\n');
        } else {
            console.log('   ℹ️  SMS Service: Not configured (optional)');
            console.log('   💡 Tip: Set TWILIO_* vars in .env for SMS notifications\n');
        }

        // 8. Show next scheduled run times
        console.log('8️⃣ Next scheduled runs...');
        const now = new Date();
        const kampalaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        
        const next9AM = new Date(kampalaTime);
        next9AM.setHours(9, 0, 0, 0);
        if (next9AM <= kampalaTime) next9AM.setDate(next9AM.getDate() + 1);

        const next5PM = new Date(kampalaTime);
        next5PM.setHours(17, 0, 0, 0);
        if (next5PM <= kampalaTime) next5PM.setDate(next5PM.getDate() + 1);

        const nextRun = next9AM < next5PM ? next9AM : next5PM;

        console.log('   ⏰ Next Scheduled Run:');
        console.log(`      ${nextRun.toLocaleString('en-US', { 
            timeZone: 'Africa/Kampala',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })}`);
        
        console.log('   📅 Following Run:');
        const followingRun = next9AM < next5PM ? next5PM : next9AM;
        console.log(`      ${followingRun.toLocaleString('en-US', { 
            timeZone: 'Africa/Kampala',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
        })}\n`);

        // 9. Summary
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✨ Automation Verification Complete!');
        console.log('═══════════════════════════════════════════════════════════\n');
        
        console.log('📝 Summary:');
        console.log('   • Reminders run automatically at 9 AM & 5 PM daily');
        console.log('   • AI generates personalized messages (if configured)');
        console.log('   • No manual intervention required');
        console.log('   • Admin endpoints (/api/reminders/*) are for testing only');
        console.log('   • Staff/Donors: receive reminders automatically\n');

        const allGood = columns.length > 0 && hasEmailConfig;
        if (allGood) {
            console.log('✅ Status: FULLY OPERATIONAL - System ready for automated reminders!');
        } else {
            console.log('⚠️  Status: CONFIGURATION NEEDED - Review items above');
        }
        console.log('');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }

    process.exit(0);
}

// Run verification
verifyAutomation();
