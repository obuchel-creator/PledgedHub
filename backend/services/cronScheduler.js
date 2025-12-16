const cron = require('node-cron');
const reminderService = require('../services/reminderService');
const paymentTrackingService = require('../services/paymentTrackingService');

/**
 * Scheduled Jobs for Automated Reminders and Payment Tracking
 */

let jobs = [];

/**
 * Initialize all cron jobs
 */
function initializeJobs() {
    console.log('🕐 Initializing scheduled jobs...');
    
    // Daily reminders at 9:00 AM
    const dailyReminderJob = cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Triggered: Daily reminder job');
        try {
            await reminderService.runDailyReminders();
        } catch (error) {
            console.error('Error in daily reminder job:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala" // Uganda timezone
    });
    
    jobs.push({
        name: 'Daily Reminders',
        schedule: '9:00 AM daily',
        job: dailyReminderJob
    });
    
    // Balance reminders at 10:00 AM daily (separate from regular reminders)
    const balanceReminderJob = cron.schedule('0 10 * * *', async () => {
        console.log('⏰ Triggered: Balance reminder job');
        try {
            await paymentTrackingService.sendAllBalanceReminders();
        } catch (error) {
            console.error('Error in balance reminder job:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Balance Reminders',
        schedule: '10:00 AM daily',
        job: balanceReminderJob
    });
    
    // Optional: Run reminders twice a day (9 AM and 5 PM)
    const eveningReminderJob = cron.schedule('0 17 * * *', async () => {
        console.log('⏰ Triggered: Evening reminder job');
        try {
            // Only process due_today and overdue reminders in the evening
            await reminderService.processReminders('due_today', 0);
            await reminderService.processReminders('overdue', null);
        } catch (error) {
            console.error('Error in evening reminder job:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Evening Reminders',
        schedule: '5:00 PM daily',
        job: eveningReminderJob
    });
    
    console.log(`✓ ${jobs.length} scheduled jobs initialized`);
}

/**
 * Start all cron jobs
 */
function startJobs() {
    if (jobs.length === 0) {
        initializeJobs();
    }
    
    console.log('\n🚀 Starting scheduled jobs...');
    jobs.forEach(({ name, schedule, job }) => {
        job.start();
        console.log(`  ✓ ${name} - ${schedule}`);
    });
    console.log('✅ All scheduled jobs are now running\n');
}

/**
 * Stop all cron jobs
 */
function stopJobs() {
    console.log('\n⏸️  Stopping scheduled jobs...');
    jobs.forEach(({ name, job }) => {
        job.stop();
        console.log(`  ✓ Stopped: ${name}`);
    });
    console.log('✅ All scheduled jobs stopped\n');
}

/**
 * Get status of all jobs
 */
function getJobStatus() {
    return jobs.map(({ name, schedule, job }) => ({
        name,
        schedule,
        running: job.getStatus() === 'scheduled'
    }));
}

/**
 * Run reminders manually (for testing)
 */
async function runManually() {
    console.log('\n🔧 Running reminders manually (test mode)...');
    try {
        const results = await reminderService.runDailyReminders();
        console.log('✅ Manual run complete');
        return results;
    } catch (error) {
        console.error('❌ Manual run failed:', error);
        throw error;
    }
}

/**
 * Run balance reminders manually (for testing)
 */
async function runBalanceRemindersManually() {
    console.log('\n🔧 Running balance reminders manually (test mode)...');
    try {
        const results = await paymentTrackingService.sendAllBalanceReminders();
        console.log('✅ Manual balance reminder run complete');
        return results;
    } catch (error) {
        console.error('❌ Manual balance reminder run failed:', error);
        throw error;
    }
}

module.exports = {
    initializeJobs,
    startJobs,
    stopJobs,
    getJobStatus,
    runManually,
    runBalanceRemindersManually
};

