const { pool } = require('../config/db');
const smsService = require('./smsService');
const emailService = require('./emailService');
const messageGenerator = require('./messageGenerator');

/**
 * Advanced Reminder Service with Intelligent Scheduling
 * 
 * Reminder Strategy:
 * - Events within 1 month: Reminders twice per week (Tuesdays and Fridays at 10 AM)
 * - Events 2+ months away: Reminders once per week (Wednesdays at 2 PM)
 * - Final week: Daily reminders at 9 AM
 * - Day of event: Reminder at 8 AM
 * - Overdue: Daily at 5 PM
 */

/**
 * Get pledges needing weekly reminders (2+ months away)
 * @returns {Array} Pledges that need weekly reminders
 */
async function getPledgesNeedingWeeklyReminder() {
    try {
        const query = `
            SELECT 
                p.*,
                DATEDIFF(p.collection_date, CURDATE()) as days_until_due
            FROM pledges p
            WHERE p.collection_date > DATE_ADD(CURDATE(), INTERVAL 60 DAY)
            AND p.status != 'paid'
            AND p.status != 'cancelled'
            AND p.deleted = 0
            AND (
                p.last_reminder_sent IS NULL 
                OR DATEDIFF(CURDATE(), p.last_reminder_sent) >= 7
            )
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('[ERROR] Fetching weekly reminder pledges:', error);
        return [];
    }
}

/**
 * Get pledges needing bi-weekly reminders (30-60 days away)
 * @returns {Array} Pledges that need bi-weekly reminders
 */
async function getPledgesNeedingBiWeeklyReminder() {
    try {
        const query = `
            SELECT 
                p.*,
                DATEDIFF(p.collection_date, CURDATE()) as days_until_due
            FROM pledges p
            WHERE p.collection_date BETWEEN DATE_ADD(CURDATE(), INTERVAL 30 DAY) 
            AND DATE_ADD(CURDATE(), INTERVAL 60 DAY)
            AND p.status != 'paid'
            AND p.status != 'cancelled'
            AND p.deleted = 0
            AND (
                p.last_reminder_sent IS NULL 
                OR DATEDIFF(CURDATE(), p.last_reminder_sent) >= 3
            )
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('[ERROR] Fetching bi-weekly reminder pledges:', error);
        return [];
    }
}

/**
 * Get pledges in final month (1-30 days away)
 * @returns {Array} Pledges in final month
 */
async function getPledgesInFinalMonth() {
    try {
        const query = `
            SELECT 
                p.*,
                DATEDIFF(p.collection_date, CURDATE()) as days_until_due
            FROM pledges p
            WHERE p.collection_date BETWEEN CURDATE() 
            AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
            AND p.status != 'paid'
            AND p.status != 'cancelled'
            AND p.deleted = 0
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('[ERROR] Fetching final month pledges:', error);
        return [];
    }
}

/**
 * Get pledges in final week (1-7 days away)
 * @returns {Array} Pledges in final week
 */
async function getPledgesInFinalWeek() {
    try {
        const query = `
            SELECT 
                p.*,
                DATEDIFF(p.collection_date, CURDATE()) as days_until_due
            FROM pledges p
            WHERE p.collection_date BETWEEN CURDATE() 
            AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            AND p.status != 'paid'
            AND p.status != 'cancelled'
            AND p.deleted = 0
            AND (
                p.last_reminder_sent IS NULL 
                OR DATE(p.last_reminder_sent) != CURDATE()
            )
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('[ERROR] Fetching final week pledges:', error);
        return [];
    }
}

/**
 * Get pledges due today
 * @returns {Array} Pledges due today
 */
async function getPledgesDueToday() {
    try {
        const query = `
            SELECT 
                p.*,
                0 as days_until_due
            FROM pledges p
            WHERE DATE(p.collection_date) = CURDATE()
            AND p.status != 'paid'
            AND p.status != 'cancelled'
            AND p.deleted = 0
            AND (
                p.last_reminder_sent IS NULL 
                OR DATE(p.last_reminder_sent) != CURDATE()
            )
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('[ERROR] Fetching pledges due today:', error);
        return [];
    }
}

/**
 * Get overdue pledges
 * @returns {Array} Overdue pledges
 */
async function getOverduePledges() {
    try {
        const query = `
            SELECT 
                p.*,
                DATEDIFF(CURDATE(), p.collection_date) as days_overdue
            FROM pledges p
            WHERE p.collection_date < CURDATE()
            AND p.status = 'pending'
            AND p.deleted = 0
            AND (
                p.last_reminder_sent IS NULL 
                OR DATE(p.last_reminder_sent) != CURDATE()
            )
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('[ERROR] Fetching overdue pledges:', error);
        return [];
    }
}

/**
 * Generate contextual reminder message based on timeline
 * @param {Object} pledge - Pledge object
 * @param {string} category - Reminder category
 * @returns {Object} Message content
 */
function generateAdvancedReminderMessage(pledge, category) {
    const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'the pledged amount';
    const purpose = pledge.purpose || 'your pledge';
    const donorName = pledge.donor_name || 'Valued Donor';
    const collectionDate = pledge.collection_date ? new Date(pledge.collection_date).toLocaleDateString() : 'the due date';
    const daysUntil = pledge.days_until_due || 0;
    
    const messages = {
        'long_term': {
            subject: `Upcoming Pledge - ${Math.ceil(daysUntil / 30)} Month(s) Away`,
            sms: `Hi ${donorName}, friendly reminder about your pledge of ${amount} for ${purpose}, due ${collectionDate}. Thank you for your commitment!`,
            email: {
                subject: `Upcoming Pledge Reminder - ${Math.ceil(daysUntil / 30)} Month(s) Away`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #3b82f6;">Pledge Reminder</h2>
                        <p>Dear ${donorName},</p>
                        <p>This is a friendly reminder about your upcoming pledge commitment.</p>
                        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                            <p style="margin: 5px 0;"><strong>Days Until Due:</strong> ${daysUntil} days</p>
                        </div>
                        <p>You'll receive reminders as the date approaches. Thank you for your generous support!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgedHub System</p>
                    </div>
                `
            }
        },
        'monthly': {
            subject: `Pledge Reminder - ${daysUntil} Days Away`,
            sms: `Hi ${donorName}, your pledge of ${amount} for ${purpose} is due in ${daysUntil} days (${collectionDate}). Please start preparing. Thank you!`,
            email: {
                subject: `Pledge Reminder - ${daysUntil} Days Until Collection`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #8b5cf6;">Pledge Approaching</h2>
                        <p>Dear ${donorName},</p>
                        <p>Your pledge collection date is approaching in <strong>${daysUntil} days</strong>.</p>
                        <div style="background: #f5f3ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                        </div>
                        <p>Please begin preparing for your pledge fulfillment.</p>
                        <p>Thank you for your commitment!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgedHub System</p>
                    </div>
                `
            }
        },
        'final_week': {
            subject: `Important: Pledge Due in ${daysUntil} Days`,
            sms: `Hi ${donorName}, IMPORTANT: Your pledge of ${amount} for ${purpose} is due in ${daysUntil} days (${collectionDate}). Please be ready!`,
            email: {
                subject: `Important: Pledge Due in ${daysUntil} Days`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #f59e0b;">Final Week Reminder</h2>
                        <p>Dear ${donorName},</p>
                        <p><strong>Your pledge collection is coming up very soon!</strong></p>
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                            <p style="margin: 5px 0; color: #f59e0b;"><strong>Days Remaining:</strong> ${daysUntil} days</p>
                        </div>
                        <p>Please ensure you're ready for collection on the due date.</p>
                        <p>Thank you for your continued support!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgedHub System</p>
                    </div>
                `
            }
        },
        'due_today': {
            subject: 'Pledge Collection Due TODAY',
            sms: `Hi ${donorName}, REMINDER: Your pledge of ${amount} for ${purpose} is due TODAY (${collectionDate}). Thank you!`,
            email: {
                subject: 'Pledge Collection Due TODAY',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">Pledge Due Today</h2>
                        <p>Dear ${donorName},</p>
                        <p><strong>Your pledge collection is scheduled for TODAY.</strong></p>
                        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Collection Date:</strong> ${collectionDate}</p>
                        </div>
                        <p>Thank you for honoring your commitment!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgedHub System</p>
                    </div>
                `
            }
        },
        'overdue': {
            subject: 'Overdue Pledge - Action Required',
            sms: `Hi ${donorName}, your pledge of ${amount} for ${purpose} was due ${collectionDate} and is now ${pledge.days_overdue} days overdue. Please contact us to arrange collection.`,
            email: {
                subject: 'Overdue Pledge - Action Required',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #ef4444;">Overdue Pledge Notice</h2>
                        <p>Dear ${donorName},</p>
                        <p><strong>Your pledge payment is now overdue.</strong></p>
                        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                            <p style="margin: 5px 0; color: #ef4444;"><strong>Days Overdue:</strong> ${pledge.days_overdue} days</p>
                        </div>
                        <p>If you've already made this payment, please disregard this message.</p>
                        <p>Otherwise, please contact us immediately to arrange payment.</p>
                        <p>Thank you for your understanding.</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgedHub System</p>
                    </div>
                `
            }
        }
    };
    
    return messages[category] || messages['monthly'];
}

/**
 * Send reminder for a pledge
 * @param {Object} pledge - Pledge object
 * @param {string} category - Reminder category
 * @returns {Object} Result
 */
async function sendAdvancedReminder(pledge, category) {
    try {
        const message = generateAdvancedReminderMessage(pledge, category);
        const results = {
            pledgeId: pledge.id,
            category,
            sms: { sent: false },
            email: { sent: false }
        };
        
        // Send SMS
        const phoneNumber = pledge.phone_number || pledge.donor_phone;
        if (phoneNumber) {
            try {
                await smsService.sendSMS(phoneNumber, message.sms);
                results.sms.sent = true;
                console.log(`[OK] SMS sent to ${pledge.donor_name} (${phoneNumber})`);
            } catch (smsError) {
                console.error(`[ERROR] SMS failed for ${pledge.donor_name}:`, smsError.message);
                results.sms.error = smsError.message;
            }
        }
        
        // Send Email
        const emailAddress = pledge.email || pledge.donor_email;
        if (emailAddress) {
            try {
                await emailService.sendEmail({
                    to: emailAddress,
                    subject: message.email.subject,
                    html: message.email.html
                });
                results.email.sent = true;
                console.log(`[OK] Email sent to ${pledge.donor_name} (${emailAddress})`);
            } catch (emailError) {
                console.error(`[ERROR] Email failed for ${pledge.donor_name}:`, emailError.message);
                results.email.error = emailError.message;
            }
        }
        
        // Update last reminder sent
        if (results.sms.sent || results.email.sent) {
            await pool.execute(
                'UPDATE pledges SET last_reminder_sent = NOW() WHERE id = ?',
                [pledge.id]
            );
        }
        
        return results;
    } catch (error) {
        console.error('[ERROR] Sending reminder:', error);
        return {
            pledgeId: pledge.id,
            category,
            error: error.message,
            sms: { sent: false },
            email: { sent: false }
        };
    }
}

/**
 * Process weekly reminders (Wednesdays at 2 PM for 2+ months away)
 */
async function processWeeklyReminders() {
    console.log('\n[STEP] Processing Weekly Reminders (2+ months away)...');
    
    try {
        const pledges = await getPledgesNeedingWeeklyReminder();
        
        if (pledges.length === 0) {
            console.log('[INFO] No pledges need weekly reminders.');
            return { processed: 0, successful: 0, failed: 0 };
        }
        
        console.log(`[INFO] Found ${pledges.length} pledge(s) for weekly reminders.`);
        
        const results = await Promise.all(
            pledges.map(pledge => sendAdvancedReminder(pledge, 'long_term'))
        );
        
        const successful = results.filter(r => r.sms.sent || r.email.sent).length;
        const failed = results.length - successful;
        
        console.log(`[OK] Weekly reminders complete: ${successful} sent, ${failed} failed\n`);
        
        return { processed: pledges.length, successful, failed, details: results };
    } catch (error) {
        console.error('[ERROR] Processing weekly reminders:', error);
        return { processed: 0, successful: 0, failed: 0, error: error.message };
    }
}

/**
 * Process bi-weekly reminders (Tuesdays and Fridays at 10 AM for 30-60 days away)
 */
async function processBiWeeklyReminders() {
    console.log('\n[STEP] Processing Bi-Weekly Reminders (30-60 days away)...');
    
    try {
        const pledges = await getPledgesNeedingBiWeeklyReminder();
        
        if (pledges.length === 0) {
            console.log('[INFO] No pledges need bi-weekly reminders.');
            return { processed: 0, successful: 0, failed: 0 };
        }
        
        console.log(`[INFO] Found ${pledges.length} pledge(s) for bi-weekly reminders.`);
        
        const results = await Promise.all(
            pledges.map(pledge => sendAdvancedReminder(pledge, 'monthly'))
        );
        
        const successful = results.filter(r => r.sms.sent || r.email.sent).length;
        const failed = results.length - successful;
        
        console.log(`[OK] Bi-weekly reminders complete: ${successful} sent, ${failed} failed\n`);
        
        return { processed: pledges.length, successful, failed, details: results };
    } catch (error) {
        console.error('[ERROR] Processing bi-weekly reminders:', error);
        return { processed: 0, successful: 0, failed: 0, error: error.message };
    }
}

/**
 * Process final week reminders (Daily at 9 AM for 1-7 days away)
 */
async function processFinalWeekReminders() {
    console.log('\n[STEP] Processing Final Week Reminders (1-7 days away)...');
    
    try {
        const pledges = await getPledgesInFinalWeek();
        
        if (pledges.length === 0) {
            console.log('[INFO] No pledges in final week.');
            return { processed: 0, successful: 0, failed: 0 };
        }
        
        console.log(`[INFO] Found ${pledges.length} pledge(s) in final week.`);
        
        const results = await Promise.all(
            pledges.map(pledge => sendAdvancedReminder(pledge, 'final_week'))
        );
        
        const successful = results.filter(r => r.sms.sent || r.email.sent).length;
        const failed = results.length - successful;
        
        console.log(`[OK] Final week reminders complete: ${successful} sent, ${failed} failed\n`);
        
        return { processed: pledges.length, successful, failed, details: results };
    } catch (error) {
        console.error('[ERROR] Processing final week reminders:', error);
        return { processed: 0, successful: 0, failed: 0, error: error.message };
    }
}

/**
 * Process due today reminders (8 AM on collection date)
 */
async function processDueTodayReminders() {
    console.log('\n[STEP] Processing Due Today Reminders...');
    
    try {
        const pledges = await getPledgesDueToday();
        
        if (pledges.length === 0) {
            console.log('[INFO] No pledges due today.');
            return { processed: 0, successful: 0, failed: 0 };
        }
        
        console.log(`[INFO] Found ${pledges.length} pledge(s) due today.`);
        
        const results = await Promise.all(
            pledges.map(pledge => sendAdvancedReminder(pledge, 'due_today'))
        );
        
        const successful = results.filter(r => r.sms.sent || r.email.sent).length;
        const failed = results.length - successful;
        
        console.log(`[OK] Due today reminders complete: ${successful} sent, ${failed} failed\n`);
        
        return { processed: pledges.length, successful, failed, details: results };
    } catch (error) {
        console.error('[ERROR] Processing due today reminders:', error);
        return { processed: 0, successful: 0, failed: 0, error: error.message };
    }
}

/**
 * Process overdue reminders (Daily at 5 PM)
 */
async function processOverdueReminders() {
    console.log('\n[STEP] Processing Overdue Reminders...');
    
    try {
        const pledges = await getOverduePledges();
        
        if (pledges.length === 0) {
            console.log('[INFO] No overdue pledges.');
            return { processed: 0, successful: 0, failed: 0 };
        }
        
        console.log(`[INFO] Found ${pledges.length} overdue pledge(s).`);
        
        const results = await Promise.all(
            pledges.map(pledge => sendAdvancedReminder(pledge, 'overdue'))
        );
        
        const successful = results.filter(r => r.sms.sent || r.email.sent).length;
        const failed = results.length - successful;
        
        console.log(`[OK] Overdue reminders complete: ${successful} sent, ${failed} failed\n`);
        
        return { processed: pledges.length, successful, failed, details: results };
    } catch (error) {
        console.error('[ERROR] Processing overdue reminders:', error);
        return { processed: 0, successful: 0, failed: 0, error: error.message };
    }
}

module.exports = {
    processWeeklyReminders,
    processBiWeeklyReminders,
    processFinalWeekReminders,
    processDueTodayReminders,
    processOverdueReminders,
    getPledgesNeedingWeeklyReminder,
    getPledgesNeedingBiWeeklyReminder,
    getPledgesInFinalWeek,
    getPledgesDueToday,
    getOverduePledges
};
