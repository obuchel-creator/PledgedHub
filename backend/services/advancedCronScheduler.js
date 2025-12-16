const cron = require('node-cron');
const advancedReminderService = require('./advancedReminderService');
const paymentTrackingService = require('./paymentTrackingService');

/**
 * Advanced Cron Scheduler with Intelligent Reminder Frequencies
 * 
 * Schedule:
 * - Wednesdays 2 PM: Weekly reminders (2+ months away)
 * - Tuesdays 10 AM: Bi-weekly reminders (30-60 days away)
 * - Fridays 10 AM: Bi-weekly reminders (30-60 days away)
 * - Daily 9 AM: Final week reminders (1-7 days away)
 * - Daily 8 AM: Due today reminders
 * - Daily 5 PM: Overdue reminders
 * - Daily 10 AM: Balance reminders
 * 
 * Timezone: Africa/Kampala (EAT)
 */

const jobs = [];

/**
 * Initialize all cron jobs
 */
function initializeJobs() {
    console.log('\n[STEP] Initializing Advanced Cron Jobs...');
    
    // 1. Weekly reminders - Wednesdays at 2:00 PM (for pledges 2+ months away)
    const weeklyReminderJob = cron.schedule('0 14 * * 3', async () => {
        console.log('\n[INFO] ===== Weekly Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await advancedReminderService.processWeeklyReminders();
            console.log('[OK] Weekly reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Weekly reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Weekly Reminders',
        schedule: 'Wednesdays at 2:00 PM',
        description: 'Reminders for pledges 2+ months away',
        job: weeklyReminderJob
    });
    
    // 2. Bi-weekly reminders (Tuesday) - 10:00 AM (for pledges 30-60 days away)
    const tuesdayReminderJob = cron.schedule('0 10 * * 2', async () => {
        console.log('\n[INFO] ===== Tuesday Bi-Weekly Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await advancedReminderService.processBiWeeklyReminders();
            console.log('[OK] Tuesday reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Tuesday reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Tuesday Bi-Weekly Reminders',
        schedule: 'Tuesdays at 10:00 AM',
        description: 'Bi-weekly reminders for pledges 30-60 days away',
        job: tuesdayReminderJob
    });
    
    // 3. Bi-weekly reminders (Friday) - 10:00 AM (for pledges 30-60 days away)
    const fridayReminderJob = cron.schedule('0 10 * * 5', async () => {
        console.log('\n[INFO] ===== Friday Bi-Weekly Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await advancedReminderService.processBiWeeklyReminders();
            console.log('[OK] Friday reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Friday reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Friday Bi-Weekly Reminders',
        schedule: 'Fridays at 10:00 AM',
        description: 'Bi-weekly reminders for pledges 30-60 days away',
        job: fridayReminderJob
    });
    
    // 4. Final week reminders - Daily at 9:00 AM (for pledges 1-7 days away)
    const finalWeekReminderJob = cron.schedule('0 9 * * *', async () => {
        console.log('\n[INFO] ===== Final Week Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await advancedReminderService.processFinalWeekReminders();
            console.log('[OK] Final week reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Final week reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Final Week Reminders',
        schedule: 'Daily at 9:00 AM',
        description: 'Daily reminders for pledges 1-7 days away',
        job: finalWeekReminderJob
    });
    
    // 5. Due today reminders - Daily at 8:00 AM
    const dueTodayReminderJob = cron.schedule('0 8 * * *', async () => {
        console.log('\n[INFO] ===== Due Today Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await advancedReminderService.processDueTodayReminders();
            console.log('[OK] Due today reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Due today reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Due Today Reminders',
        schedule: 'Daily at 8:00 AM',
        description: 'Reminders for pledges due today',
        job: dueTodayReminderJob
    });
    
    // 6. Overdue reminders - Daily at 5:00 PM
    const overdueReminderJob = cron.schedule('0 17 * * *', async () => {
        console.log('\n[INFO] ===== Overdue Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await advancedReminderService.processOverdueReminders();
            console.log('[OK] Overdue reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Overdue reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Overdue Reminders',
        schedule: 'Daily at 5:00 PM',
        description: 'Reminders for overdue pledges',
        job: overdueReminderJob
    });
    
    // 7. Balance reminders - Daily at 10:00 AM
    const balanceReminderJob = cron.schedule('0 10 * * *', async () => {
        console.log('\n[INFO] ===== Balance Reminder Job Triggered =====');
        console.log('[INFO] Time:', new Date().toLocaleString('en-US', { timeZone: 'Africa/Kampala' }));
        try {
            const result = await paymentTrackingService.sendAllBalanceReminders();
            console.log('[OK] Balance reminders complete:', result);
        } catch (error) {
            console.error('[ERROR] Balance reminder job failed:', error);
        }
    }, {
        scheduled: false,
        timezone: "Africa/Kampala"
    });
    
    jobs.push({
        name: 'Balance Reminders',
        schedule: 'Daily at 10:00 AM',
        description: 'Reminders for pledges with outstanding balances',
        job: balanceReminderJob
    });
    
    console.log(`[OK] Initialized ${jobs.length} cron jobs\n`);
}

/**
 * Start all cron jobs
 */
function startJobs() {
    console.log('\n[STEP] Starting Advanced Cron Jobs...');
    
    if (jobs.length === 0) {
        console.log('[WARN] No jobs initialized. Call initializeJobs() first.');
        return;
    }
    
    jobs.forEach((jobInfo) => {
        jobInfo.job.start();
        console.log(`[OK] Started: ${jobInfo.name}`);
        console.log(`    Schedule: ${jobInfo.schedule}`);
        console.log(`    Description: ${jobInfo.description}\n`);
    });
    
    console.log(`[OK] All ${jobs.length} cron jobs are now active!\n`);
    displayScheduleSummary();
}

/**
 * Stop all cron jobs
 */
function stopJobs() {
    console.log('\n[STEP] Stopping all cron jobs...');
    
    jobs.forEach((jobInfo) => {
        jobInfo.job.stop();
        console.log(`[OK] Stopped: ${jobInfo.name}`);
    });
    
    console.log('[OK] All cron jobs stopped\n');
}

/**
 * Get status of all jobs
 */
function getJobStatus() {
    return jobs.map(jobInfo => ({
        name: jobInfo.name,
        schedule: jobInfo.schedule,
        description: jobInfo.description,
        running: jobInfo.job.getStatus() === 'running'
    }));
}

/**
 * Display schedule summary
 */
function displayScheduleSummary() {
    console.log('\n========================================');
    console.log('ADVANCED REMINDER SCHEDULE SUMMARY');
    console.log('========================================');
    console.log('Timezone: Africa/Kampala (EAT)\n');
    
    console.log('LONG-TERM REMINDERS (2+ months away):');
    console.log('  - Wednesdays at 2:00 PM\n');
    
    console.log('MONTHLY REMINDERS (30-60 days away):');
    console.log('  - Tuesdays at 10:00 AM');
    console.log('  - Fridays at 10:00 AM\n');
    
    console.log('FINAL WEEK REMINDERS (1-7 days away):');
    console.log('  - Daily at 9:00 AM\n');
    
    console.log('URGENT REMINDERS:');
    console.log('  - Due Today: Daily at 8:00 AM');
    console.log('  - Overdue: Daily at 5:00 PM\n');
    
    console.log('OTHER:');
    console.log('  - Balance Reminders: Daily at 10:00 AM');
    console.log('========================================\n');
}

/**
 * Manually trigger a specific job type (for testing)
 */
async function runManually(jobType) {
    console.log(`\n[INFO] Manually triggering: ${jobType}`);
    
    try {
        let result;
        
        switch (jobType.toLowerCase()) {
            case 'weekly':
                result = await advancedReminderService.processWeeklyReminders();
                break;
            case 'biweekly':
            case 'bi-weekly':
                result = await advancedReminderService.processBiWeeklyReminders();
                break;
            case 'finalweek':
            case 'final-week':
                result = await advancedReminderService.processFinalWeekReminders();
                break;
            case 'duetoday':
            case 'due-today':
                result = await advancedReminderService.processDueTodayReminders();
                break;
            case 'overdue':
                result = await advancedReminderService.processOverdueReminders();
                break;
            case 'balance':
                result = await paymentTrackingService.sendAllBalanceReminders();
                break;
            default:
                console.error('[ERROR] Invalid job type. Options: weekly, bi-weekly, final-week, due-today, overdue, balance');
                return;
        }
        
        console.log('[OK] Manual execution complete:', result);
        return result;
    } catch (error) {
        console.error('[ERROR] Manual execution failed:', error);
        throw error;
    }
}

/**
 * Test all reminder jobs (sends to real pledges)
 */
async function testAllJobs() {
    console.log('\n[INFO] ===== Testing All Reminder Jobs =====\n');
    
    const results = {
        weekly: await advancedReminderService.processWeeklyReminders(),
        biWeekly: await advancedReminderService.processBiWeeklyReminders(),
        finalWeek: await advancedReminderService.processFinalWeekReminders(),
        dueToday: await advancedReminderService.processDueTodayReminders(),
        overdue: await advancedReminderService.processOverdueReminders(),
        balance: await paymentTrackingService.sendAllBalanceReminders()
    };
    
    console.log('\n[OK] ===== All Tests Complete =====');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    return results;
}

module.exports = {
    initializeJobs,
    startJobs,
    stopJobs,
    getJobStatus,
    runManually,
    testAllJobs,
    displayScheduleSummary
};
