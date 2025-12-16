const nodemailer = require('nodemailer');

/**
 * Email Service
 * Handles sending emails using nodemailer
 */

// Create reusable transporter
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;
    
    const config = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    };
    
    // If SMTP not configured, use console logging for development
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('⚠️  SMTP not configured. Emails will be logged to console.');
        return null;
    }
    
    transporter = nodemailer.createTransporter(config);
    return transporter;
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.html - HTML content (optional)
 * @returns {Promise} Send result
 */
async function sendEmail({ to, subject, text, html }) {
    try {
        const transport = getTransporter();
        
        // If no transporter (SMTP not configured), log to console
        if (!transport) {
            console.log('\n📧 [EMAIL - DEV MODE]');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('Content:', text || html?.substring(0, 200) + '...');
            console.log('---\n');
            return { success: true, mode: 'development' };
        }
        
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"Omukwano Pledge" <noreply@omukwano.com>',
            to,
            subject,
            text,
            html
        };
        
        const info = await transport.sendMail(mailOptions);
        
        return {
            success: true,
            messageId: info.messageId,
            response: info.response
        };
    } catch (error) {
        console.error('Email send error:', error);
        throw error;
    }
}

/**
 * Send bulk emails
 * @param {Array} emails - Array of email objects
 * @returns {Promise} Results
 */
async function sendBulkEmails(emails) {
    const results = await Promise.allSettled(
        emails.map(email => sendEmail(email))
    );
    
    return results.map((result, index) => ({
        to: emails[index].to,
        success: result.status === 'fulfilled',
        error: result.status === 'rejected' ? result.reason?.message : null
    }));
}

module.exports = {
    sendEmail,
    sendBulkEmails
};
