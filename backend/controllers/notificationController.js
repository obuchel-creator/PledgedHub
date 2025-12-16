const smsService = require('../services/smsService');
const Pledge = require('../models/pledgeModel');

/**
 * Send reminder to a specific pledge
 * POST /api/notifications/reminder/:pledgeId
 */
async function sendReminder(req, res) {
    try {
        const pledgeId = parseInt(req.params.pledgeId, 10);
        
        if (!pledgeId || isNaN(pledgeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid pledge ID is required' 
            });
        }

        // Get pledge details
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pledge not found' 
            });
        }

        // Get phone number from pledge.phone or fallback to message field for backwards compatibility
        let contact = pledge.phone;
        let pledgerName = pledge.name || 'Friend';
        let collectionDate = null;
        let purpose = pledge.title || 'your pledge';

        // Fallback: Try to parse from message field if phone field is empty
        if (!contact && pledge.message) {
            try {
                const messageData = JSON.parse(pledge.message);
                contact = messageData.contact;
                collectionDate = messageData.collectionDate;
                purpose = messageData.purpose || purpose;
            } catch (e) {
                // Message is not JSON, might be plain text
                console.log('Could not parse pledge message as JSON');
            }
        }

        if (!contact) {
            return res.status(400).json({ 
                success: false, 
                message: 'No phone number found for this pledge. Please add a phone number to enable SMS reminders.' 
            });
        }

        // Format phone number
        const formattedPhone = smsService.formatUgandaPhoneNumber(contact);
        
        if (!smsService.isValidPhoneNumber(formattedPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid phone number format: ${contact}. Use format: +256700123456 or 0700123456` 
            });
        }

        // Send reminder
        const result = await smsService.sendPledgeReminder(
            formattedPhone,
            pledgerName,
            pledge.amount,
            purpose,
            collectionDate
        );

        console.log(`[NOTIFICATION] Reminder sent for pledge ${pledgeId} to ${formattedPhone}`);

        return res.status(200).json({
            success: true,
            message: 'Reminder sent successfully',
            simulated: result.simulated || false,
            messageId: result.messageId
        });

    } catch (error) {
        console.error('[NOTIFICATION ERROR] Send reminder failed:', error);
        
        // Check for Twilio trial account restrictions
        if (error.message && error.message.includes('403')) {
            return res.status(400).json({
                success: false,
                message: 'Twilio trial account restriction: You can only send SMS to verified phone numbers. Please verify the recipient number in Twilio Console or upgrade your account.',
                error: error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send reminder'
        });
    }
}

/**
 * Send reminders to all pending pledges
 * POST /api/notifications/remind-all
 */
async function sendBulkReminders(req, res) {
    try {
        // Get all active pledges
        const pledges = await Pledge.list();
        const activePledges = pledges.filter(p => p.status === 'active');

        if (activePledges.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'No active pledges to remind',
                sent: 0
            });
        }

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        for (const pledge of activePledges) {
            try {
                // Get phone from pledge.phone or parse from message for backwards compatibility
                let contact = pledge.phone;
                let pledgerName = pledge.name || 'Friend';
                let collectionDate = null;
                let purpose = pledge.title || 'your pledge';

                // Fallback: Try to parse from message field if phone field is empty
                if (!contact && pledge.message) {
                    try {
                        const messageData = JSON.parse(pledge.message);
                        contact = messageData.contact;
                        collectionDate = messageData.collectionDate;
                        purpose = messageData.purpose || purpose;
                    } catch (e) {
                        console.log(`Pledge ${pledge.id}: Could not parse message`);
                    }
                }

                if (!contact) {
                    results.failed++;
                    results.errors.push(`Pledge ${pledge.id}: No phone number`);
                    continue;
                }

                const formattedPhone = smsService.formatUgandaPhoneNumber(contact);
                
                if (!smsService.isValidPhoneNumber(formattedPhone)) {
                    results.failed++;
                    results.errors.push(`Pledge ${pledge.id}: Invalid phone ${contact}`);
                    continue;
                }

                await smsService.sendPledgeReminder(
                    formattedPhone,
                    pledgerName,
                    pledge.amount,
                    purpose,
                    collectionDate
                );

                results.success++;
                console.log(`[NOTIFICATION] Reminder sent for pledge ${pledge.id}`);

            } catch (error) {
                results.failed++;
                results.errors.push(`Pledge ${pledge.id}: ${error.message}`);
            }
        }

        return res.status(200).json({
            success: true,
            message: `Sent ${results.success} reminders, ${results.failed} failed`,
            sent: results.success,
            failed: results.failed,
            errors: results.errors.length > 0 ? results.errors : undefined
        });

    } catch (error) {
        console.error('[NOTIFICATION ERROR] Bulk reminder failed:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send bulk reminders'
        });
    }
}

/**
 * Send custom notification to a pledge
 * POST /api/notifications/custom/:pledgeId
 * Body: { message: string }
 */
async function sendCustomNotification(req, res) {
    try {
        const pledgeId = parseInt(req.params.pledgeId, 10);
        const { message } = req.body;

        if (!pledgeId || isNaN(pledgeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid pledge ID is required' 
            });
        }

        if (!message || !message.trim()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Message text is required' 
            });
        }

        // Get pledge details
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pledge not found' 
            });
        }

        // Get phone from pledge.phone or parse from message for backwards compatibility
        let contact = pledge.phone;
        let pledgerName = pledge.name || 'Friend';

        // Fallback: Try to parse from message field if phone field is empty
        if (!contact && pledge.message) {
            try {
                const messageData = JSON.parse(pledge.message);
                contact = messageData.contact;
            } catch (e) {
                console.log('Could not parse pledge message as JSON');
            }
        }

        if (!contact) {
            return res.status(400).json({ 
                success: false, 
                message: 'No phone number found for this pledge' 
            });
        }

        const formattedPhone = smsService.formatUgandaPhoneNumber(contact);
        
        if (!smsService.isValidPhoneNumber(formattedPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid phone number format: ${contact}` 
            });
        }

        const result = await smsService.sendCustomNotification(
            formattedPhone,
            pledgerName,
            message.trim()
        );

        console.log(`[NOTIFICATION] Custom message sent for pledge ${pledgeId} to ${formattedPhone}`);

        return res.status(200).json({
            success: true,
            message: 'Notification sent successfully',
            simulated: result.simulated || false,
            messageId: result.messageId
        });

    } catch (error) {
        console.error('[NOTIFICATION ERROR] Send custom notification failed:', error);
        
        // Check for Twilio trial account restrictions
        if (error.message && error.message.includes('403')) {
            return res.status(400).json({
                success: false,
                message: 'Twilio trial account restriction: You can only send SMS to verified phone numbers. Please verify the recipient number in Twilio Console or upgrade your account.',
                error: error.message
            });
        }
        
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send notification'
        });
    }
}

/**
 * Send thank you message after payment
 * POST /api/notifications/thank-you/:pledgeId
 */
async function sendThankYou(req, res) {
    try {
        const pledgeId = parseInt(req.params.pledgeId, 10);
        
        if (!pledgeId || isNaN(pledgeId)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Valid pledge ID is required' 
            });
        }

        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({ 
                success: false, 
                message: 'Pledge not found' 
            });
        }

        // Get phone from pledge.phone or parse from message for backwards compatibility
        let contact = pledge.phone;
        let pledgerName = pledge.name || 'Friend';
        let purpose = pledge.title || 'your generous contribution';

        // Fallback: Try to parse from message field if phone field is empty
        if (!contact && pledge.message) {
            try {
                const messageData = JSON.parse(pledge.message);
                contact = messageData.contact;
                purpose = messageData.purpose || purpose;
            } catch (e) {
                console.log('Could not parse pledge message as JSON');
            }
        }

        if (!contact) {
            return res.status(400).json({ 
                success: false, 
                message: 'No phone number found for this pledge' 
            });
        }

        const formattedPhone = smsService.formatUgandaPhoneNumber(contact);
        
        if (!smsService.isValidPhoneNumber(formattedPhone)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid phone number format: ${contact}` 
            });
        }

        const result = await smsService.sendThankYouMessage(
            formattedPhone,
            pledgerName,
            pledge.amount,
            purpose
        );

        console.log(`[NOTIFICATION] Thank you sent for pledge ${pledgeId} to ${formattedPhone}`);

        return res.status(200).json({
            success: true,
            message: 'Thank you message sent successfully',
            simulated: result.simulated || false,
            messageId: result.messageId
        });

    } catch (error) {
        console.error('[NOTIFICATION ERROR] Send thank you failed:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to send thank you'
        });
    }
}

module.exports = {
    sendReminder,
    sendBulkReminders,
    sendCustomNotification,
    sendThankYou
};
