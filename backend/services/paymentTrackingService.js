const { pool } = require('../config/db');
const emailService = require('./emailService');
const smsService = require('./smsService');
const messageGenerator = require('./messageGenerator');
const accountingService = require('./accountingService');
const Account = require('../models/Account');

/**
 * Payment Tracking Service
 * Handles partial payments, balance calculations, and balance reminders
 */

/**
 * Record a payment for a pledge and update balance
 * @param {number} pledgeId - The pledge ID
 * @param {number} amount - Amount paid
 * @param {string} paymentMethod - Payment method used
 * @param {number} userId - User making the payment
 * @returns {Promise<Object>} Updated pledge with balance info
 */
async function recordPayment(pledgeId, amount, paymentMethod = 'cash', userId = null) {
    try {
        // Validate input
        if (!pledgeId || !amount || isNaN(amount) || amount <= 0) {
            return { success: false, error: 'Invalid pledgeId or amount' };
        }

        // Get current pledge info
        const [pledges] = await pool.execute(
            'SELECT * FROM pledges WHERE id = ? AND deleted_at IS NULL',
            [pledgeId]
        );
        
        if (!pledges || pledges.length === 0) {
            return { success: false, error: 'Pledge not found' };
        }
        
        const pledge = pledges[0];
        const totalAmount = parseFloat(pledge.amount);
        const currentPaid = parseFloat(pledge.amount_paid || 0);
        const newPaid = currentPaid + parseFloat(amount);
        const newBalance = totalAmount - newPaid;
        
        // Determine new status
        let newStatus = pledge.status;
        if (newBalance <= 0) {
            newStatus = 'paid'; // Fully paid
        } else if (newPaid > 0 && newBalance > 0) {
            newStatus = 'active'; // Partially paid
        }
        
        // Update pledge with new payment info
        await pool.execute(`
            UPDATE pledges 
            SET amount_paid = ?,
                balance_remaining = ?,
                last_payment_date = NOW(),
                status = ?
            WHERE id = ?
        `, [newPaid, Math.max(0, newBalance), newStatus, pledgeId]);
        
        // Record the payment in payments table if it exists
        try {
            await pool.execute(`
                INSERT INTO payments (user_id, pledge_id, amount, payment_method, status, created_at)
                VALUES (?, ?, ?, ?, 'completed', NOW())
            `, [userId || pledge.ownerId, pledgeId, amount, paymentMethod]);
        } catch (paymentError) {
            console.warn('Note: Could not record in payments table:', paymentError.message);
        }
        
        // Get updated pledge
        const [updated] = await pool.execute(
            'SELECT * FROM pledges WHERE id = ? AND deleted_at IS NULL',
            [pledgeId]
        );
        
        if (!updated || updated.length === 0) {
            return { success: false, error: 'Failed to update pledge' };
        }
        
        const updatedPledge = updated[0];
        
        // Create accounting journal entry for payment
        await createPaymentJournalEntry(pledgeId, amount, paymentMethod, userId);
        
        // Send confirmation and balance reminder if there's remaining balance
        if (newBalance > 0) {
            await sendBalanceReminder(pledgeId, true); // true = is payment confirmation
        } else {
            // Send completion confirmation
            await sendPaymentConfirmation(pledgeId, amount, 0);
        }
        
        return {
            success: true,
            pledge: updatedPledge,
            payment: {
                amount: parseFloat(amount),
                newTotal: newPaid,
                balance: Math.max(0, newBalance),
                fullyPaid: newBalance <= 0
            }
        };
        
    } catch (error) {
        console.error('Error recording payment:', error);
        throw error;
    }
}

/**
 * Send balance reminder to pledger
 * @param {number} pledgeId - The pledge ID
 * @param {boolean} isPaymentConfirmation - If true, includes thank you for recent payment
 * @returns {Promise<Object>} Result of reminder
 */
async function sendBalanceReminder(pledgeId, isPaymentConfirmation = false) {
    try {
        // Validate input
        if (!pledgeId) {
            return { success: false, error: 'Pledge ID is required' };
        }

        // Get pledge details
        const [pledges] = await pool.execute(`
            SELECT p.*, u.username, u.email, u.phone_number
            FROM pledges p
            LEFT JOIN users u ON p.ownerId = u.id
            WHERE p.id = ? AND p.deleted_at IS NULL
        `, [pledgeId]);
        
        if (!pledges || pledges.length === 0) {
            return { success: false, error: 'Pledge not found' };
        }
        
        const pledge = pledges[0];
        const balance = parseFloat(pledge.balance_remaining);
        const amountPaid = parseFloat(pledge.amount_paid || 0);
        const totalAmount = parseFloat(pledge.amount);
        
        if (balance <= 0) {
            return { success: true, message: 'No balance remaining' };
        }
        
        // Generate reminder message
        const messageType = isPaymentConfirmation ? 'payment_confirmation' : 'balance_reminder';
        const message = generateBalanceMessage(pledge, isPaymentConfirmation);
        
        const results = {
            email: false,
            sms: false
        };
        
        // Send email if available
        if (pledge.email || pledge.donor_email) {
            try {
                const email = pledge.email || pledge.donor_email;
                const subject = isPaymentConfirmation 
                    ? 'Payment Received - Balance Reminder' 
                    : 'Pledge Balance Reminder';
                
                await emailService.sendEmail({
                    to: email,
                    subject: subject,
                    text: message,
                    html: generateBalanceEmailHTML(pledge, isPaymentConfirmation)
                });
                results.email = true;
            } catch (emailError) {
                console.error('Error sending balance email:', emailError);
            }
        }
        
        // Send SMS if available
        if (pledge.phone_number || pledge.donor_phone) {
            try {
                const phone = pledge.phone_number || pledge.donor_phone;
                await smsService.sendSMS(phone, message);
                results.sms = true;
            } catch (smsError) {
                console.error('Error sending balance SMS:', smsError);
            }
        }
        
        // Update last reminder timestamp
        await pool.execute(`
            UPDATE pledges 
            SET last_balance_reminder = NOW()
            WHERE id = ?
        `, [pledgeId]);
        
        return {
            success: true,
            results,
            balance,
            amountPaid
        };
        
    } catch (error) {
        console.error('Error sending balance reminder:', error);
        throw error;
    }
}

/**
 * Send payment confirmation (for full payment)
 */
async function sendPaymentConfirmation(pledgeId, amount, remainingBalance) {
    try {
        const [pledges] = await pool.execute(`
            SELECT p.*, u.username, u.email, u.phone_number
            FROM pledges p
            LEFT JOIN users u ON p.ownerId = u.id
            WHERE p.id = ? AND p.deleted_at IS NULL
        `, [pledgeId]);
        
        if (!pledges || pledges.length === 0) {
            return { success: false, error: 'Pledge not found' };
        }
        
        const pledge = pledges[0];
        const message = `Thank you! Your payment of UGX ${amount.toLocaleString()} has been received. Your pledge is now fully paid. We appreciate your support! 🎉`;
        
        // Send email
        if (pledge.email || pledge.donor_email) {
            try {
                await emailService.sendEmail({
                    to: pledge.email || pledge.donor_email,
                    subject: 'Payment Completed - Thank You!',
                    text: message,
                    html: `<div style="font-family: Arial; padding: 20px;">
                        <h2 style="color: #2e7d32;">✅ Payment Completed!</h2>
                        <p>${message}</p>
                        <p style="margin-top: 20px; color: #666;">
                            <strong>Pledge Amount:</strong> UGX ${parseFloat(pledge.amount).toLocaleString()}<br>
                            <strong>Amount Paid:</strong> UGX ${parseFloat(pledge.amount_paid).toLocaleString()}<br>
                            <strong>Status:</strong> Fully Paid
                        </p>
                    </div>`
                });
            } catch (error) {
                console.error('Error sending confirmation email:', error);
            }
        }
        
        // Send SMS
        if (pledge.phone_number || pledge.donor_phone) {
            try {
                await smsService.sendSMS(pledge.phone_number || pledge.donor_phone, message);
            } catch (error) {
                console.error('Error sending confirmation SMS:', error);
            }
        }
    } catch (error) {
        console.error('Error sending payment confirmation:', error);
    }
}

/**
 * Generate balance reminder message
 */
function generateBalanceMessage(pledge, isPaymentConfirmation) {
    const balance = parseFloat(pledge.balance_remaining);
    const amountPaid = parseFloat(pledge.amount_paid || 0);
    const totalAmount = parseFloat(pledge.amount);
    const name = pledge.donor_name || pledge.username || 'Valued Pledger';
    
    let message = '';
    
    if (isPaymentConfirmation) {
        message = `Dear ${name}, thank you for your payment of UGX ${amountPaid.toLocaleString()}! `;
    } else {
        message = `Dear ${name}, `;
    }
    
    message += `You have a remaining balance of UGX ${balance.toLocaleString()} on your pledge of UGX ${totalAmount.toLocaleString()}. `;
    message += `Amount paid so far: UGX ${amountPaid.toLocaleString()}. `;
    message += `Please complete your pledge at your earliest convenience. Thank you for your support!`;
    
    return message;
}

/**
 * Generate HTML email for balance reminder
 */
function generateBalanceEmailHTML(pledge, isPaymentConfirmation) {
    const balance = parseFloat(pledge.balance_remaining);
    const amountPaid = parseFloat(pledge.amount_paid || 0);
    const totalAmount = parseFloat(pledge.amount);
    const percentPaid = ((amountPaid / totalAmount) * 100).toFixed(0);
    const name = pledge.donor_name || pledge.username || 'Valued Pledger';
    
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">💰 Pledge Balance Reminder</h1>
        </div>
        
        <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
            ${isPaymentConfirmation ? `
                <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2e7d32;">
                    <p style="margin: 0; color: #2e7d32; font-weight: bold;">✅ Payment Received!</p>
                    <p style="margin: 5px 0 0 0; color: #2e7d32;">Thank you for your recent payment of UGX ${amountPaid.toLocaleString()}</p>
                </div>
            ` : ''}
            
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Dear ${name},</p>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
                This is a friendly reminder about your pledge balance. Here's your current status:
            </p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #666;">Total Pledge Amount:</span>
                        <strong style="color: #333;">UGX ${totalAmount.toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: #666;">Amount Paid:</span>
                        <strong style="color: #2e7d32;">UGX ${amountPaid.toLocaleString()}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                        <span style="color: #666;">Balance Remaining:</span>
                        <strong style="color: #d32f2f;">UGX ${balance.toLocaleString()}</strong>
                    </div>
                </div>
                
                <div style="background: #e0e0e0; height: 20px; border-radius: 10px; overflow: hidden;">
                    <div style="background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; width: ${percentPaid}%; transition: width 0.3s;"></div>
                </div>
                <p style="text-align: center; margin-top: 5px; font-size: 12px; color: #666;">${percentPaid}% Completed</p>
            </div>
            
            <p style="font-size: 14px; color: #666; line-height: 1.6;">
                We kindly request that you complete your pledge at your earliest convenience. Your support makes a real difference!
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
                <p style="color: #666; font-size: 12px;">Thank you for your generosity and support! 🙏</p>
            </div>
        </div>
    </div>
    `;
}

/**
 * Get all pledges with remaining balances that need reminders
 * @param {number} daysSinceLastReminder - Minimum days since last reminder
 * @returns {Promise<Array>} Pledges needing reminders
 */
async function getPledgesNeedingBalanceReminders(daysSinceLastReminder = 7) {
    try {
        const [pledges] = await pool.execute(`
            SELECT p.*, u.username, u.email, u.phone_number
            FROM pledges p
            LEFT JOIN users u ON p.ownerId = u.id
            WHERE p.balance_remaining > 0
            AND p.status IN ('active', 'pending')
            AND p.deleted_at IS NULL
            AND (
                p.last_balance_reminder IS NULL
                OR DATEDIFF(NOW(), p.last_balance_reminder) >= ?
            )
            ORDER BY p.balance_remaining DESC
        `, [daysSinceLastReminder]);
        
        return pledges || [];
    } catch (error) {
        console.error('Error getting pledges needing reminders:', error);
        return [];
    }
}

/**
 * Send balance reminders to all pledges that need them
 * @returns {Promise<Object>} Results summary
 */
async function sendAllBalanceReminders() {
    try {
        console.log('🔔 Checking for pledges with outstanding balances...');
        
        const pledges = await getPledgesNeedingBalanceReminders(7); // Every 7 days
        
        if (pledges.length === 0) {
            console.log('✓ No balance reminders needed');
            return { sent: 0, failed: 0 };
        }
        
        console.log(`📧 Sending balance reminders to ${pledges.length} pledgers...`);
        
        let sent = 0;
        let failed = 0;
        
        for (const pledge of pledges) {
            try {
                await sendBalanceReminder(pledge.id, false);
                sent++;
                console.log(`  ✓ Sent reminder for pledge #${pledge.id} (Balance: UGX ${pledge.balance_remaining})`);
            } catch (error) {
                failed++;
                console.error(`  ✗ Failed for pledge #${pledge.id}:`, error.message);
            }
        }
        
        console.log(`\n✅ Balance reminders complete: ${sent} sent, ${failed} failed\n`);
        
        return { sent, failed, total: pledges.length };
    } catch (error) {
        console.error('Error sending balance reminders:', error);
        return { sent: 0, failed: 0, error: error.message };
    }
}

/**
 * Create journal entry when payment is recorded
 * Debits cash/mobile money account, Credits pledges receivable
 * @param {number} pledgeId - Pledge ID
 * @param {number} amount - Payment amount
 * @param {string} paymentMethod - Payment method (cash, mtn, airtel, bank, paypal)
 * @param {number} userId - User recording payment
 */
async function createPaymentJournalEntry(pledgeId, amount, paymentMethod, userId) {
    try {
        // Map payment method to account
        const accountMap = {
            'mtn': '1100',      // Mobile Money - MTN
            'airtel': '1110',    // Mobile Money - Airtel
            'cash': '1000',      // Cash
            'bank': '1050',      // Bank Account
            'paypal': '1300'     // PayPal Account
        };
        
        const cashAccountCode = accountMap[paymentMethod.toLowerCase()] || '1000';
        const cashAccount = await Account.getByCode(cashAccountCode);
        const receivableAccount = await Account.getByCode('1200'); // Pledges Receivable
        
        if (!cashAccount || !receivableAccount) {
            console.warn('⚠️  Accounting not configured - skipping journal entry');
            return { success: false, error: 'Accounting accounts not found' };
        }
        
        // Create journal entry
        const entry = {
            date: new Date(),
            description: `Payment received for Pledge #${pledgeId}`,
            reference: `PLG-${pledgeId}-PMT`,
            userId: userId,
            lines: [
                {
                    accountId: cashAccount.id,
                    debit: amount,
                    credit: 0,
                    description: `Cash/payment received via ${paymentMethod}`
                },
                {
                    accountId: receivableAccount.id,
                    debit: 0,
                    credit: amount,
                    description: `Reduce receivable for Pledge #${pledgeId}`
                }
            ]
        };
        
        const result = await accountingService.createJournalEntry(entry);
        
        if (result.success) {
            console.log(`📒 Journal Entry ${result.data.entryNumber} created for payment`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error creating payment journal entry:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Create journal entry when new pledge is created
 * Debits pledges receivable, Credits unearned revenue
 * @param {number} pledgeId - Pledge ID
 * @param {number} amount - Pledge amount
 * @param {number} userId - User creating pledge
 */
async function createPledgeJournalEntry(pledgeId, amount, userId) {
    try {
        const receivableAccount = await Account.getByCode('1200'); // Pledges Receivable
        const unearnedAccount = await Account.getByCode('2000');   // Unearned Revenue
        
        if (!receivableAccount || !unearnedAccount) {
            console.warn('⚠️  Accounting not configured - skipping journal entry');
            return { success: false, error: 'Accounting accounts not found' };
        }
        
        // Create journal entry
        const entry = {
            date: new Date(),
            description: `New Pledge #${pledgeId} created`,
            reference: `PLG-${pledgeId}-NEW`,
            userId: userId,
            lines: [
                {
                    accountId: receivableAccount.id,
                    debit: amount,
                    credit: 0,
                    description: `Pledge receivable created`
                },
                {
                    accountId: unearnedAccount.id,
                    debit: 0,
                    credit: amount,
                    description: `Unearned revenue for Pledge #${pledgeId}`
                }
            ]
        };
        
        const result = await accountingService.createJournalEntry(entry);
        
        if (result.success) {
            console.log(`📒 Journal Entry ${result.data.entryNumber} created for new pledge`);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Error creating pledge journal entry:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    recordPayment,
    sendBalanceReminder,
    sendPaymentConfirmation,
    getPledgesNeedingBalanceReminders,
    sendAllBalanceReminders,
    createPaymentJournalEntry,
    createPledgeJournalEntry
};
