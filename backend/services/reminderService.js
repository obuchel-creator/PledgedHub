const { pool } = require('../config/db');
const smsService = require('./smsService');
const emailService = require('./emailService');
const messageGenerator = require('./messageGenerator');
const deploymentConfig = require('../config/deploymentConfig');
const monetizationService = require('./monetizationService');

/**
 * Reminder Service
 * Handles automated reminders for pledges
 */

/**
 * Get pledges that need reminders
 * @param {number} daysUntilDue - Days until collection date (e.g., 7, 3, 0, -7)
 * @returns {Array} Pledges that need reminders
 */
async function getPledgesNeedingReminder(daysUntilDue) {
    try {
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilDue);
        
        // Format dates for SQL comparison (YYYY-MM-DD)
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        const query = `
            SELECT 
                p.*
            FROM pledges p
            WHERE DATE(p.collection_date) = ?
            AND p.status != 'paid'
            AND p.status != 'cancelled'
            AND (p.last_reminder_sent IS NULL OR DATE(p.last_reminder_sent) != CURDATE())
        `;
        
        const [pledges] = await pool.execute(query, [targetDateStr]);
        return pledges || [];
    } catch (error) {
        console.error('Error fetching pledges for reminders:', error);
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
            AND (p.last_reminder_sent IS NULL OR DATE(p.last_reminder_sent) != CURDATE())
        `;
        
        const [pledges] = await pool.execute(query);
        return pledges || [];
    } catch (error) {
        console.error('Error fetching overdue pledges:', error);
        return [];
    }
}

/**
 * Generate reminder message
 * @param {Object} pledge - Pledge object
 * @param {string} type - Reminder type (7_days, 3_days, due_today, overdue)
 * @returns {Object} Message content
 */
function generateReminderMessage(pledge, type) {
    const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'the pledged amount';
    const purpose = pledge.purpose || 'your pledge';
    const donorName = pledge.donor_name || 'Valued Donor';
    const collectionDate = pledge.collection_date ? new Date(pledge.collection_date).toLocaleDateString() : 'the due date';
    
    const messages = {
        '7_days': {
            subject: 'Pledge Reminder - 7 Days Until Collection',
            sms: `Hi ${donorName}, this is a friendly reminder that your pledge of ${amount} for ${purpose} is due in 7 days (${collectionDate}). Thank you for your commitment!`,
            email: {
                subject: 'Pledge Reminder - 7 Days Until Collection',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #4285f4;">Pledge Reminder</h2>
                        <p>Dear ${donorName},</p>
                        <p>This is a friendly reminder that your pledge is due in <strong>7 days</strong>.</p>
                        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                        </div>
                        <p>Thank you for your generous commitment!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgeHub Pledge Management System</p>
                    </div>
                `
            }
        },
        '3_days': {
            subject: 'Pledge Reminder - 3 Days Until Collection',
            sms: `Hi ${donorName}, your pledge of ${amount} for ${purpose} is due in 3 days (${collectionDate}). Please prepare for collection. Thank you!`,
            email: {
                subject: 'Pledge Reminder - 3 Days Until Collection',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #f59e0b;">Pledge Reminder - Coming Up Soon</h2>
                        <p>Dear ${donorName},</p>
                        <p>Your pledge collection date is approaching in <strong>3 days</strong>.</p>
                        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                        </div>
                        <p>Please ensure you're ready for collection on the due date.</p>
                        <p>Thank you for your continued support!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgeHub Pledge Management System</p>
                    </div>
                `
            }
        },
        'due_today': {
            subject: 'Pledge Collection Due Today',
            sms: `Hi ${donorName}, your pledge of ${amount} for ${purpose} is due TODAY (${collectionDate}). Thank you for your support!`,
            email: {
                subject: 'Pledge Collection Due Today',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #10b981;">Pledge Collection Due Today</h2>
                        <p>Dear ${donorName},</p>
                        <p>This is a reminder that your pledge collection is scheduled for <strong>today</strong>.</p>
                        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Collection Date:</strong> ${collectionDate}</p>
                        </div>
                        <p>Thank you for keeping your commitment!</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgeHub Pledge Management System</p>
                    </div>
                `
            }
        },
        'overdue': {
            subject: 'Overdue Pledge - Action Required',
            sms: `Hi ${donorName}, your pledge of ${amount} for ${purpose} was due on ${collectionDate} and is now overdue. Please contact us to arrange collection. Thank you.`,
            email: {
                subject: 'Overdue Pledge - Action Required',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #ef4444;">Overdue Pledge Notice</h2>
                        <p>Dear ${donorName},</p>
                        <p>We noticed that your pledge payment is now <strong>overdue</strong>.</p>
                        <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
                            <p style="margin: 5px 0;"><strong>Amount:</strong> ${amount}</p>
                            <p style="margin: 5px 0;"><strong>Purpose:</strong> ${purpose}</p>
                            <p style="margin: 5px 0;"><strong>Due Date:</strong> ${collectionDate}</p>
                            <p style="margin: 5px 0;"><strong>Days Overdue:</strong> ${pledge.days_overdue || 'Several'}</p>
                        </div>
                        <p>If you've already made this payment, please disregard this message.</p>
                        <p>Otherwise, please contact us at your earliest convenience to arrange payment.</p>
                        <p>Thank you for your understanding.</p>
                        <p style="color: #666; font-size: 12px; margin-top: 30px;">PledgeHub Pledge Management System</p>
                    </div>
                `
            }
        }
    };
    
    return messages[type] || messages['7_days'];
}

/**
 * Send reminder for a pledge
 * @param {Object} pledge - Pledge object
 * @param {string} type - Reminder type
 * @returns {Object} Result
 */
async function sendReminder(pledge, type) {
    try {
        const message = generateReminderMessage(pledge, type);
        const results = {
            pledgeId: pledge.id,
            type,
            sms: { sent: false },
            email: { sent: false },
            gracePeriod: false,
            monetizationPhase: null
        };

        // DEPLOYMENT-AWARE: Get current monetization phase
        const phase = deploymentConfig.getCurrentPhase();
        results.monetizationPhase = phase.phase;
        results.gracePeriod = deploymentConfig.isInGracePeriod();
        
        // Send SMS if phone number exists (check both phone_number and donor_phone fields)
        const phoneNumber = pledge.phone_number || pledge.donor_phone;
        if (phoneNumber) {
            try {
                // GRACE PERIOD: During grace period, SMS is unlimited
                // MONETIZATION ACTIVE: Check user limits
                let canSend = { allowed: true, reason: 'Grace period' };
                
                if (!results.gracePeriod && pledge.user_id) {
                    canSend = await monetizationService.canSendSMS(pledge.user_id);
                }

                if (canSend.allowed) {
                    await smsService.sendSMS(phoneNumber, message.sms);
                    results.sms.sent = true;
                    
                    // Track SMS usage even during grace period
                    if (pledge.user_id) {
                        await monetizationService.incrementUsage(pledge.user_id, 'sms');
                    }
                    
                    if (results.gracePeriod) {
                        console.log(`✓ SMS sent to ${pledge.donor_name} (${phoneNumber}) [GRACE PERIOD - FREE]`);
                    } else {
                        console.log(`✓ SMS sent to ${pledge.donor_name} (${phoneNumber}) [${canSend.remaining} remaining]`);
                    }
                } else {
                    // SMS blocked by monetization limits
                    console.log(`⚠️  SMS blocked for ${pledge.donor_name}: ${canSend.reason}. Routing to email...`);
                    results.sms.blocked = true;
                    results.sms.reason = canSend.reason;
                    
                    // Force email as fallback when SMS blocked
                    if (!pledge.email && !pledge.donor_email) {
                        console.error(`❌ Cannot send reminder to ${pledge.donor_name}: SMS blocked and no email available`);
                    }
                }
            } catch (smsError) {
                console.error(`✗ SMS failed for ${pledge.donor_name}:`, smsError.message);
                results.sms.error = smsError.message;
            }
        }
        
        // Send Email if email exists (check both email and donor_email fields)
        const emailAddress = pledge.email || pledge.donor_email;
        if (emailAddress) {
            try {
                console.log(`📧 Sending reminder email to ${emailAddress}`);
                await emailService.sendEmail({
                    to: emailAddress,
                    subject: message.email.subject,
                    html: message.email.html
                });
                results.email.sent = true;
                
                // Track email usage
                if (pledge.user_id) {
                    await monetizationService.incrementUsage(pledge.user_id, 'email');
                }
                
                console.log(`✅ Email sent successfully to ${pledge.donor_name} (${emailAddress})`);
            } catch (emailError) {
                console.error(`❌ Email failed for ${pledge.donor_name}:`, emailError.message);
                results.email.error = emailError.message;
            }
        } else {
            console.log(`⚠️  No email address found for ${pledge.donor_name} (ID: ${pledge.id})`);
        }
        
        // Update last reminder sent timestamp
        if (results.sms.sent || results.email.sent) {
            await pool.execute(
                'UPDATE pledges SET last_reminder_sent = NOW() WHERE id = ?',
                [pledge.id]
            );
        }
        
        return results;
    } catch (error) {
        console.error('Error sending reminder:', error);
        return {
            pledgeId: pledge.id,
            type,
            error: error.message,
            sms: { sent: false },
            email: { sent: false }
        };
    }
}

/**
 * Process reminders for a specific type
 * @param {string} type - Reminder type
 * @param {number} daysUntilDue - Days until due (null for overdue)
 * @returns {Object} Summary
 */
async function processReminders(type, daysUntilDue = null) {
    console.log(`\n🔔 Processing ${type} reminders...`);
    
    try {
        // Get pledges that need reminders
        const pledges = daysUntilDue !== null 
            ? await getPledgesNeedingReminder(daysUntilDue)
            : await getOverduePledges();
        
        if (pledges.length === 0) {
            console.log(`No pledges need ${type} reminders today.`);
            return {
                type,
                processed: 0,
                successful: 0,
                failed: 0
            };
        }
        
        console.log(`Found ${pledges.length} pledge(s) needing reminders.`);
        
        // Send reminders
        const results = await Promise.all(
            pledges.map(pledge => sendReminder(pledge, type))
        );
        
        // Calculate statistics
        const successful = results.filter(r => r.sms.sent || r.email.sent).length;
        const failed = results.length - successful;
        
        console.log(`✅ ${type} reminders complete: ${successful} sent, ${failed} failed\n`);
        
        return {
            type,
            processed: pledges.length,
            successful,
            failed,
            details: results
        };
    } catch (error) {
        console.error(`Error processing ${type} reminders:`, error);
        return {
            type,
            processed: 0,
            successful: 0,
            failed: 0,
            error: error.message
        };
    }
}

/**
 * Run all scheduled reminders
 * Called by cron job
 */
async function runDailyReminders() {
    console.log('\n' + '='.repeat(50));
    console.log('📅 Daily Reminder Job Started');
    console.log('Time:', new Date().toLocaleString());
    console.log('='.repeat(50));
    
    const results = {
        timestamp: new Date(),
        reminders: []
    };
    
    // 7 days before
    results.reminders.push(await processReminders('7_days', 7));
    
    // 3 days before
    results.reminders.push(await processReminders('3_days', 3));
    
    // Due today
    results.reminders.push(await processReminders('due_today', 0));
    
    // Overdue
    results.reminders.push(await processReminders('overdue', null));
    
    // Summary
    const totalProcessed = results.reminders.reduce((sum, r) => sum + r.processed, 0);
    const totalSuccessful = results.reminders.reduce((sum, r) => sum + r.successful, 0);
    const totalFailed = results.reminders.reduce((sum, r) => sum + r.failed, 0);
    
    console.log('='.repeat(50));
    console.log('📊 Daily Summary:');
    console.log(`   Total Processed: ${totalProcessed}`);
    console.log(`   Successful: ${totalSuccessful}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log('='.repeat(50) + '\n');
    
    return results;
}

module.exports = {
    getPledgesNeedingReminder,
    getOverduePledges,
    generateReminderMessage,
    sendReminder,
    processReminders,
    runDailyReminders
};
