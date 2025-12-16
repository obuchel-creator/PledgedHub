/**
 * Enhanced AI Service with Configurable Prompts
 * Example of how to integrate the prompt configuration system
 */

require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { getPromptTemplate, processPromptTemplate } = require('../config/promptConfig');

let genAI = null;
let model = null;

// Initialize Google Gemini AI
function initializeAI() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        console.log('⚠️  Google AI API key not configured. AI features disabled.');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        console.log('✓ Google Gemini AI initialized (FREE tier)');
        return true;
    } catch (error) {
        console.error('✗ Failed to initialize Google AI:', error.message);
        return false;
    }
}

// Check if AI is available
function isAIAvailable() {
    return model !== null;
}

/**
 * Enhanced Reminder Message Generation with Configurable Prompts
 * @param {Object} pledge - Pledge object
 * @param {string} type - Reminder type (7_days, 3_days, due_today, overdue)
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Enhanced message
 */
async function generateEnhancedReminderMessage(pledge, type, options = {}) {
    if (!isAIAvailable()) {
        return generateSimpleMessage(pledge, type);
    }
    
    try {
        const {
            tone = 'friendly',
            language = 'English',
            includeMotivation = true,
            maxLength = 160,
            promptConfig = 'default' // New option for prompt configuration!
        } = options;
        
        // Prepare data for template processing
        const templateVars = {
            donorName: pledge.donor_name || 'Valued Donor',
            amount: pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'the pledged amount',
            purpose: pledge.purpose || 'your pledge',
            collectionDate: pledge.collection_date ? new Date(pledge.collection_date).toLocaleDateString() : 'the due date',
            status: {
                '7_days': 'due in 7 days',
                '3_days': 'due in 3 days', 
                'due_today': 'due today',
                'overdue': `overdue by ${pledge.days_overdue || 'several'} days`
            }[type] || 'due soon',
            tone,
            language,
            maxLength,
            motivationInstruction: includeMotivation 
                ? 'Include brief motivation/appreciation emphasizing community support' 
                : 'Keep it brief and factual'
        };
        
        // Get the appropriate prompt template
        const template = getPromptTemplate('reminder', promptConfig);
        const prompt = processPromptTemplate(template, templateVars);
        
        // Generate with AI
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Clean up response
        return text.replace(/^["']|["']$/g, '');
        
    } catch (error) {
        console.error('AI message generation failed:', error.message);
        return generateSimpleMessage(pledge, type);
    }
}

/**
 * Enhanced Thank You Message Generation with Configurable Prompts
 * @param {Object} pledge - Pledge object
 * @param {Object} options - Options including promptConfig
 * @returns {Promise<string>} Thank you message
 */
async function generateThankYouMessage(pledge, options = {}) {
    if (!isAIAvailable()) {
        const donorName = pledge.donor_name || 'Valued Donor';
        const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'your generous contribution';
        return `Dear ${donorName}, thank you for your payment of ${amount}! Your support makes a real difference. 🙏💙`;
    }
    
    try {
        const {
            tone = 'warm',
            includeImpact = true,
            promptConfig = 'default' // New option for prompt configuration!
        } = options;
        
        // Prepare template variables
        const templateVars = {
            donorName: pledge.donor_name || 'Valued Donor',
            amount: pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'your generous contribution',
            purpose: pledge.purpose || 'our cause',
            tone,
            impactInstruction: includeImpact 
                ? 'Mention positive community impact and collective progress' 
                : 'Keep focused on gratitude and community appreciation'
        };
        
        // Get the appropriate prompt template
        const template = getPromptTemplate('thankYou', promptConfig);
        const prompt = processPromptTemplate(template, templateVars);
        
        // Generate with AI
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        return text.replace(/^["']|["']$/g, '');
        
    } catch (error) {
        console.error('AI thank you message failed:', error.message);
        const donorName = pledge.donor_name || 'Valued Donor';
        const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'your generous contribution';
        return `Dear ${donorName}, thank you for your payment of ${amount}! Your support makes a real difference. 🙏💙`;
    }
}

/**
 * Enhanced Pledge Data Analysis with Configurable Prompts
 * @param {Array} pledges - Array of pledges
 * @param {Object} options - Options including promptConfig
 * @returns {Promise<Object>} AI-generated insights
 */
async function analyzePledgeData(pledges, options = {}) {
    if (!isAIAvailable()) {
        return {
            available: false,
            message: 'AI analysis not available. Get your FREE API key at https://makersuite.google.com/app/apikey'
        };
    }
    
    try {
        const { promptConfig = 'default' } = options;
        
        // Prepare summary data
        const total = pledges.length;
        const totalAmount = pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const paid = pledges.filter(p => p.status === 'paid').length;
        const pending = pledges.filter(p => p.status === 'pending').length;
        const overdue = pledges.filter(p => {
            if (p.status === 'paid' || p.status === 'cancelled') return false;
            return new Date(p.collection_date) < new Date();
        }).length;
        
        // Prepare template variables
        const templateVars = {
            total,
            totalAmount: totalAmount.toLocaleString(),
            paid,
            collectionRate: total > 0 ? Math.round(paid/total*100) : 0,
            pending,
            overdue
        };
        
        // Get the appropriate prompt template
        const template = getPromptTemplate('analysis', promptConfig);
        const prompt = processPromptTemplate(template, templateVars);
        
        // Generate with AI
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Extract JSON from response
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            const insights = JSON.parse(jsonMatch[0]);
            return {
                available: true,
                insights,
                promptConfig, // Include which config was used
                summary: {
                    total,
                    totalAmount,
                    paid,
                    pending,
                    overdue,
                    collectionRate: total > 0 ? Math.round(paid/total*100) : 0
                }
            };
        }
        
        return {
            available: true,
            insights: [
                {
                    type: 'info',
                    title: 'Data Analyzed',
                    message: text.substring(0, 200)
                }
            ],
            summary: { total, totalAmount, paid, pending, overdue }
        };
    } catch (error) {
        console.error('AI analysis failed:', error.message);
        return {
            available: false,
            error: error.message
        };
    }
}

// Fallback simple message generator (no AI)
function generateSimpleMessage(pledge, type) {
    const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'your pledged amount';
    const purpose = pledge.purpose || 'your pledge';
    const donorName = pledge.donor_name || 'Valued Donor';
    const collectionDate = pledge.collection_date ? new Date(pledge.collection_date).toLocaleDateString() : 'the due date';
    
    const messages = {
        '7_days': `Hi ${donorName}, friendly reminder: your pledge of ${amount} for ${purpose} is due in 7 days (${collectionDate}). Thank you! 🙏`,
        '3_days': `Hi ${donorName}, your pledge of ${amount} for ${purpose} is due in 3 days (${collectionDate}). We appreciate your commitment! 💙`,
        'due_today': `Hi ${donorName}, your pledge of ${amount} for ${purpose} is due TODAY (${collectionDate}). Thank you for keeping your promise! ✨`,
        'overdue': `Hi ${donorName}, your pledge of ${amount} for ${purpose} was due on ${collectionDate}. Please contact us to arrange payment. Thank you.`
    };
    
    return messages[type] || messages['7_days'];
}

// Initialize on module load
initializeAI();

module.exports = {
    isAIAvailable,
    generateEnhancedReminderMessage,
    analyzePledgeData,
    generateThankYouMessage,
    initializeAI
};

/* 
 * USAGE EXAMPLES:
 * 
 * 1. Standard reminder:
 * generateEnhancedReminderMessage(pledge, '7_days', {tone: 'friendly'});
 * 
 * 2. Ugandan cultural reminder:
 * generateEnhancedReminderMessage(pledge, '7_days', {
 *     tone: 'friendly', 
 *     promptConfig: 'ugandan_cultural'
 * });
 * 
 * 3. Religious reminder:
 * generateEnhancedReminderMessage(pledge, '7_days', {
 *     tone: 'warm', 
 *     promptConfig: 'religious'
 * });
 * 
 * 4. Professional reminder:
 * generateEnhancedReminderMessage(pledge, 'overdue', {
 *     tone: 'professional', 
 *     promptConfig: 'professional'
 * });
 * 
 * 5. Impact-focused thank you:
 * generateThankYouMessage(pledge, {
 *     tone: 'warm',
 *     promptConfig: 'impact_focused'
 * });
 * 
 * 6. Financial analysis:
 * analyzePledgeData(pledges, {
 *     promptConfig: 'financial_focus'
 * });
 * 
 */