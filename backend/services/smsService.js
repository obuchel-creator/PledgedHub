const twilio = require('twilio');
const AfricasTalking = require('africastalking');
require('dotenv').config();

// SMS Provider Selection
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'twilio'; // 'twilio' or 'africastalking'

// Initialize Twilio client (will be null if credentials not configured)
let twilioClient = null;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Initialize Africa's Talking client
let atClient = null;
const AT_USERNAME = process.env.AFRICASTALKING_USERNAME;
const AT_API_KEY = process.env.AFRICASTALKING_API_KEY;
const AT_SENDER_ID = process.env.AFRICASTALKING_SENDER_ID || 'PledgedHub';

if (SMS_PROVIDER === 'africastalking' && AT_USERNAME && AT_API_KEY) {
    try {
        atClient = AfricasTalking({
            apiKey: AT_API_KEY,
            username: AT_USERNAME
        });
        console.log('✓ Africa\'s Talking SMS service initialized');
    } catch (error) {
        console.error('✗ Failed to initialize Africa\'s Talking:', error.message);
    }
} else if (SMS_PROVIDER === 'twilio' && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        console.log('✓ Twilio SMS service initialized');
    } catch (error) {
        console.error('✗ Failed to initialize Twilio:', error.message);
    }
} else {
    console.log(`ℹ SMS Provider: ${SMS_PROVIDER} - Credentials not configured. SMS notifications disabled.`);
}

/**
 * Send SMS notification to a phone number
 * @param {string} to - Phone number in E.164 format (e.g., +256700123456)
 * @param {string} message - Message text to send
 * @returns {Promise<object>} SMS provider response
 */
async function sendSMS(to, message) {
    // Africa's Talking Implementation
    if (SMS_PROVIDER === 'africastalking' && atClient) {
        try {
            const sms = atClient.SMS;
            const result = await sms.send({
                to: [to],
                message: message,
                from: AT_SENDER_ID
            });

            console.log(`[SMS] Africa's Talking - Message sent to ${to}:`, result);
            
            if (result.SMSMessageData && result.SMSMessageData.Recipients && result.SMSMessageData.Recipients.length > 0) {
                const recipient = result.SMSMessageData.Recipients[0];
                return {
                    success: true,
                    messageId: recipient.messageId,
                    status: recipient.status,
                    cost: recipient.cost
                };
            }
            
            return {
                success: true,
                message: 'SMS sent via Africa\'s Talking'
            };
        } catch (error) {
            console.error(`[SMS] Africa's Talking failed to send to ${to}:`, error.message);
            throw new Error(`Failed to send SMS via Africa's Talking: ${error.message}`);
        }
    }
    
    // Twilio Implementation
    if (SMS_PROVIDER === 'twilio' && twilioClient) {
        try {
            const result = await twilioClient.messages.create({
                body: message,
                from: TWILIO_PHONE_NUMBER,
                to: to
            });

            console.log(`[SMS] Twilio - Message sent to ${to}:`, result.sid);
            return {
                success: true,
                messageId: result.sid,
                status: result.status
            };
        } catch (error) {
            console.error(`[SMS] Twilio failed to send to ${to}:`, error.message);
            throw new Error(`Failed to send SMS via Twilio: ${error.message}`);
        }
    }
    
    // Simulation mode (no provider configured)
    console.log('[SMS] Simulating SMS (No provider configured):', { to, message });
    return {
        success: true,
        simulated: true,
        message: 'SMS simulated (No SMS provider configured)'
    };
}

/**
 * Send pledge reminder notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} pledgerName - Name of the person who made the pledge
 * @param {number} amount - Pledge amount
 * @param {string} purpose - Purpose of the pledge
 * @param {Date} collectionDate - Date when pledge should be fulfilled
 */
async function sendPledgeReminder(phoneNumber, pledgerName, amount, purpose, collectionDate) {
    const formatter = new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0
    });

    const formattedAmount = formatter.format(amount);
    const dateStr = collectionDate ? new Date(collectionDate).toLocaleDateString('en-UG') : 'soon';

    const message = `Hi ${pledgerName}! 👋\n\nFriendly reminder about your pledge of ${formattedAmount} for ${purpose}.\n\nCollection date: ${dateStr}\n\nThank you for your support!\n\n- PledgedHub`;

    return sendSMS(phoneNumber, message);
}

/**
 * Send thank you message after pledge is fulfilled
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} pledgerName - Name of the person who made the pledge
 * @param {number} amount - Amount that was paid
 * @param {string} purpose - Purpose of the pledge
 */
async function sendThankYouMessage(phoneNumber, pledgerName, amount, purpose) {
    const formatter = new Intl.NumberFormat('en-UG', {
        style: 'currency',
        currency: 'UGX',
        maximumFractionDigits: 0
    });

    const formattedAmount = formatter.format(amount);

    const message = `Thank you, ${pledgerName}! 🎉\n\nWe've received your payment of ${formattedAmount} for ${purpose}.\n\nYour contribution makes a real difference!\n\n- PledgedHub`;

    return sendSMS(phoneNumber, message);
}

/**
 * Send custom notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} pledgerName - Name of the person
 * @param {string} customMessage - Custom message to send
 */
async function sendCustomNotification(phoneNumber, pledgerName, customMessage) {
    const message = `Hi ${pledgerName}! 👋\n\n${customMessage}\n\n- PledgedHub`;
    return sendSMS(phoneNumber, message);
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid E.164 format
 */
function isValidPhoneNumber(phoneNumber) {
    // E.164 format: +[country code][number]
    // Uganda: +256 followed by 9 digits
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
}

/**
 * Format Uganda phone number to E.164
 * @param {string} phoneNumber - Phone number in various formats
 * @returns {string} Formatted phone number in E.164 format
 */
function formatUgandaPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let digits = phoneNumber.replace(/\D/g, '');

    // Handle different formats
    if (digits.startsWith('256')) {
        // Already has country code
        return `+${digits}`;
    } else if (digits.startsWith('0')) {
        // Local format: 0700123456 -> +256700123456
        return `+256${digits.substring(1)}`;
    } else if (digits.length === 9) {
        // Missing leading 0: 700123456 -> +256700123456
        return `+256${digits}`;
    }

    // Return as is if we can't determine format
    return phoneNumber;
}

module.exports = {
    sendSMS,
    sendPledgeReminder,
    sendThankYouMessage,
    sendCustomNotification,
    isValidPhoneNumber,
    formatUgandaPhoneNumber
};

