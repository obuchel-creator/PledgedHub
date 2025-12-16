const aiService = require('./aiService');

/**
 * Message Generator Service
 * Creates smart, context-aware messages for various scenarios
 */

// Message templates by type and tone
const templates = {
    reminder: {
        friendly: {
            '7_days': "Hi {name}! 😊 Just a gentle reminder that your pledge of {amount} for {purpose} is coming up in 7 days ({date}). Thank you for your commitment!",
            '3_days': "Hi {name}! 🙏 Your pledge of {amount} for {purpose} is due in 3 days ({date}). We really appreciate your support!",
            'due_today': "Hi {name}! ⏰ Just a reminder that your pledge of {amount} for {purpose} is due today ({date}). Thank you!",
            'overdue': "Hi {name}, your pledge of {amount} for {purpose} was due on {date}. Please let us know if you need assistance arranging payment."
        },
        professional: {
            '7_days': "Dear {name}, This is to remind you that your pledge of {amount} for {purpose} is due in 7 days ({date}). Thank you for your support.",
            '3_days': "Dear {name}, Your pledge of {amount} for {purpose} is due in 3 days ({date}). We appreciate your timely attention to this matter.",
            'due_today': "Dear {name}, This is to notify you that your pledge of {amount} for {purpose} is due today ({date}). Thank you.",
            'overdue': "Dear {name}, Your pledge of {amount} for {purpose} was due on {date}). Please arrange payment at your earliest convenience."
        },
        urgent: {
            '7_days': "REMINDER: {name}, your pledge of {amount} for {purpose} is due in 7 days ({date}). Please prepare for payment.",
            '3_days': "IMPORTANT: {name}, your pledge of {amount} for {purpose} is due in 3 days ({date}). Action required soon.",
            'due_today': "URGENT: {name}, your pledge of {amount} for {purpose} is DUE TODAY ({date}). Please remit payment immediately.",
            'overdue': "OVERDUE: {name}, your pledge of {amount} for {purpose} was due on {date}. Immediate payment required."
        }
    },
    thankYou: {
        warm: "Dear {name}, thank you so much for your generous payment of {amount} for {purpose}! 🙏💙 Your support makes a real difference in our community. We're truly grateful!",
        professional: "Dear {name}, We acknowledge receipt of your payment of {amount} for {purpose}. Thank you for your valuable contribution and continued support.",
        casual: "Hey {name}! 🎉 Just received your payment of {amount} for {purpose}. You're amazing! Thank you for being awesome! 💪"
    },
    followUp: {
        gentle: "Hi {name}, we wanted to check in about your pledge of {amount} for {purpose}. Is everything okay? We're here to help if you need to discuss payment arrangements. 🤝",
        standard: "Dear {name}, Following up on your pledge of {amount} for {purpose}, which was due on {date}. Please contact us to arrange payment or discuss any concerns.",
        firm: "Dear {name}, Your pledge of {amount} for {purpose} remains outstanding since {date}. Please remit payment immediately or contact us to resolve this matter."
    },
    confirmation: {
        standard: "Hi {name}! ✅ Your pledge of {amount} for {purpose} has been confirmed. Due date: {date}. Thank you for your commitment!",
        detailed: "Dear {name}, This confirms your pledge:\n\n💰 Amount: {amount}\n📋 Purpose: {purpose}\n📅 Due Date: {date}\n\nThank you for your generous support!"
    }
};

/**
 * Replace placeholders in message template
 * @param {string} template - Message template with {placeholders}
 * @param {Object} data - Data to replace placeholders
 * @returns {string} Message with values filled in
 */
function fillTemplate(template, data) {
    let message = template;
    
    // Replace all {placeholder} patterns
    for (const [key, value] of Object.entries(data)) {
        const placeholder = `{${key}}`;
        message = message.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return message;
}

/**
 * Format amount for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
function formatAmount(amount) {
    if (!amount) return 'the pledged amount';
    return `UGX ${Number(amount).toLocaleString()}`;
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    if (!date) return 'the due date';
    return new Date(date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

/**
 * Prepare data object for template filling
 * @param {Object} pledge - Pledge object
 * @returns {Object} Data for template
 */
function prepareTemplateData(pledge) {
    return {
        name: pledge.donor_name || 'Valued Donor',
        amount: formatAmount(pledge.amount),
        purpose: pledge.purpose || 'your pledge',
        date: formatDate(pledge.collection_date),
        phone: pledge.phone || '',
        email: pledge.email || ''
    };
}

/**
 * Generate reminder message
 * @param {Object} pledge - Pledge object
 * @param {string} type - Reminder type (7_days, 3_days, due_today, overdue)
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated message
 */
async function generateReminderMessage(pledge, type, options = {}) {
    const {
        tone = 'friendly',
        useAI = true,
        language = 'English',
        maxLength = 160
    } = options;
    
    const data = prepareTemplateData(pledge);
    
    // Try AI generation if enabled and available
    if (useAI && aiService.isAIAvailable()) {
        try {
            const aiMessage = await aiService.generateEnhancedReminderMessage(
                pledge, 
                type, 
                { tone, language, maxLength, includeMotivation: true }
            );
            
            return {
                text: aiMessage,
                html: formatAsHtml(aiMessage, type),
                source: 'ai',
                tone,
                type
            };
        } catch (error) {
            console.error('AI generation failed, falling back to template:', error.message);
        }
    }
    
    // Fallback to template
    const template = templates.reminder[tone]?.[type] || templates.reminder.friendly[type];
    const message = fillTemplate(template, data);
    
    return {
        text: message,
        html: formatAsHtml(message, type),
        source: 'template',
        tone,
        type
    };
}

/**
 * Generate thank you message
 * @param {Object} pledge - Pledge object
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated message
 */
async function generateThankYouMessage(pledge, options = {}) {
    const {
        tone = 'warm',
        useAI = true,
        includeImpact = true
    } = options;
    
    const data = prepareTemplateData(pledge);
    
    // Try AI generation
    if (useAI && aiService.isAIAvailable()) {
        try {
            const aiMessage = await aiService.generateThankYouMessage(
                pledge,
                { tone, includeImpact }
            );
            
            return {
                text: aiMessage,
                html: formatAsHtml(aiMessage, 'thankYou'),
                source: 'ai',
                tone
            };
        } catch (error) {
            console.error('AI generation failed, falling back to template:', error.message);
        }
    }
    
    // Fallback to template
    const template = templates.thankYou[tone] || templates.thankYou.warm;
    const message = fillTemplate(template, data);
    
    return {
        text: message,
        html: formatAsHtml(message, 'thankYou'),
        source: 'template',
        tone
    };
}

/**
 * Generate follow-up message
 * @param {Object} pledge - Pledge object
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated message
 */
async function generateFollowUpMessage(pledge, options = {}) {
    const {
        approach = 'gentle',
        useAI = true
    } = options;
    
    const data = prepareTemplateData(pledge);
    
    // Calculate days overdue
    const daysOverdue = Math.floor(
        (new Date() - new Date(pledge.collection_date)) / (1000 * 60 * 60 * 24)
    );
    
    // Determine approach based on days overdue if not specified
    let selectedApproach = approach;
    if (!approach) {
        if (daysOverdue <= 3) selectedApproach = 'gentle';
        else if (daysOverdue <= 7) selectedApproach = 'standard';
        else selectedApproach = 'firm';
    }
    
    // Try AI generation
    if (useAI && aiService.isAIAvailable()) {
        try {
            const prompt = `Generate a ${selectedApproach} follow-up message for an overdue pledge (${daysOverdue} days). 
                           Donor: ${data.name}, Amount: ${data.amount}, Purpose: ${data.purpose}, Due: ${data.date}.
                           Keep it under 160 characters.`;
            
            // We can extend aiService for custom prompts later
            // For now, use template
        } catch (error) {
            console.error('AI generation failed:', error.message);
        }
    }
    
    // Fallback to template
    const template = templates.followUp[selectedApproach];
    const message = fillTemplate(template, data);
    
    return {
        text: message,
        html: formatAsHtml(message, 'followUp'),
        source: 'template',
        approach: selectedApproach,
        daysOverdue
    };
}

/**
 * Generate confirmation message
 * @param {Object} pledge - Pledge object
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated message
 */
async function generateConfirmationMessage(pledge, options = {}) {
    const {
        style = 'standard',
        useAI = false // Usually don't need AI for confirmations
    } = options;
    
    const data = prepareTemplateData(pledge);
    
    const template = templates.confirmation[style] || templates.confirmation.standard;
    const message = fillTemplate(template, data);
    
    return {
        text: message,
        html: formatAsHtml(message, 'confirmation'),
        source: 'template',
        style
    };
}

/**
 * Format message as HTML
 * @param {string} message - Plain text message
 * @param {string} type - Message type
 * @returns {string} HTML formatted message
 */
function formatAsHtml(message, type) {
    // Color themes by type
    const colors = {
        '7_days': '#4285f4',
        '3_days': '#fbbc04',
        'due_today': '#34a853',
        'overdue': '#ea4335',
        'thankYou': '#34a853',
        'followUp': '#fbbc04',
        'confirmation': '#4285f4'
    };
    
    const color = colors[type] || '#4285f4';
    
    // Convert line breaks to <br>
    const htmlMessage = message.replace(/\n/g, '<br>');
    
    return `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
            <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid ${color};">
                <p style="margin: 0; color: #333; line-height: 1.6; font-size: 16px;">
                    ${htmlMessage}
                </p>
            </div>
        </div>
    `;
}

/**
 * Generate bulk messages for multiple pledges
 * @param {Array} pledges - Array of pledges
 * @param {string} messageType - Type of message
 * @param {Object} options - Generation options
 * @returns {Promise<Array>} Array of generated messages
 */
async function generateBulkMessages(pledges, messageType, options = {}) {
    const results = [];
    
    for (const pledge of pledges) {
        try {
            let message;
            
            switch (messageType) {
                case 'reminder':
                    message = await generateReminderMessage(pledge, options.reminderType || '7_days', options);
                    break;
                case 'thankYou':
                    message = await generateThankYouMessage(pledge, options);
                    break;
                case 'followUp':
                    message = await generateFollowUpMessage(pledge, options);
                    break;
                case 'confirmation':
                    message = await generateConfirmationMessage(pledge, options);
                    break;
                default:
                    throw new Error(`Unknown message type: ${messageType}`);
            }
            
            results.push({
                pledgeId: pledge.id,
                success: true,
                message
            });
        } catch (error) {
            results.push({
                pledgeId: pledge.id,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

module.exports = {
    generateReminderMessage,
    generateThankYouMessage,
    generateFollowUpMessage,
    generateConfirmationMessage,
    generateBulkMessages,
    fillTemplate,
    formatAmount,
    formatDate
};
