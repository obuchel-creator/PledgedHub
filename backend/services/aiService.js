const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Service - Google Gemini Integration
 * Provides FREE AI-powered features for message generation, analysis, and insights
 */

let genAI = null;
let model = null;

/**
 * Initialize Google Gemini AI
 */
function initializeAI() {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey || apiKey === 'your_google_gemini_api_key_here') {
        console.log('⚠️  Google AI API key not configured. AI features disabled.');
        console.log('   Get your FREE API key at: https://makersuite.google.com/app/apikey');
        return false;
    }
    
    try {
        genAI = new GoogleGenerativeAI(apiKey);
        model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
        console.log('✓ Google Gemini AI initialized (FREE tier)');
        return true;
    } catch (error) {
        console.error('✗ Failed to initialize Google AI:', error.message);
        return false;
    }
}

/**
 * Check if AI is available
 */
function isAIAvailable() {
    return model !== null;
}

/**
 * Generate AI-enhanced reminder message
 * @param {Object} pledge - Pledge object
 * @param {string} type - Reminder type (7_days, 3_days, due_today, overdue)
 * @param {Object} options - Additional options (tone, language, etc.)
 * @returns {Promise<string>} Enhanced message
 */
async function generateEnhancedReminderMessage(pledge, type, options = {}) {
    if (!isAIAvailable()) {
        // Fallback to simple template
        return generateSimpleMessage(pledge, type);
    }
    
    try {
        const {
            tone = 'friendly',
            language = 'English',
            includeMotivation = true,
            maxLength = 160 // SMS length
        } = options;
        
        const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'the pledged amount';
        const purpose = pledge.purpose || 'your pledge';
        const donorName = pledge.donor_name || 'Valued Donor';
        const collectionDate = pledge.collection_date ? new Date(pledge.collection_date).toLocaleDateString() : 'the due date';
        
        const reminderTypes = {
            '7_days': 'in 7 days',
            '3_days': 'in 3 days',
            'due_today': 'today',
            'overdue': `overdue by ${pledge.days_overdue || 'several'} days`
        };
        
        const prompt = `Generate a ${tone} SMS reminder message for a pledge donor with Ugandan cultural context. 

Context:
- Donor name: ${donorName}
- Amount pledged: ${amount}
- Purpose: ${purpose}
- Collection date: ${collectionDate}
- Status: ${reminderTypes[type]}

Requirements:
- Language: ${language} (if Luganda, use appropriate greetings like 'Oli otya' or 'Webale nyo')
- Tone: ${tone}, respectful, and culturally appropriate for Uganda
- Maximum length: ${maxLength} characters (SMS friendly)
- ${includeMotivation ? 'Include brief motivation/appreciation emphasizing community support' : 'Keep it brief and factual'}
- Use appropriate emojis sparingly (🙏 for respect, 💙 for unity)
- Reference community/family values and collective mission
- Include subtle mention of 'PledgeHub' (unity) values
- Do NOT include quotes or extra formatting
- Make it personal and warm

Generate ONLY the message text, nothing else:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        // Clean up the response (remove quotes if present)
        const cleanText = text.replace(/^["']|["']$/g, '');
        
        return cleanText;
    } catch (error) {
        console.error('AI message generation failed:', error.message);
        // Fallback to simple message
        return generateSimpleMessage(pledge, type);
    }
}

/**
 * Fallback simple message generator (no AI)
 */
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

/**
 * Analyze pledge data and provide insights
 * @param {Array} pledges - Array of pledges
 * @returns {Promise<Object>} AI-generated insights
 */
async function analyzePledgeData(pledges) {
    if (!isAIAvailable()) {
        return {
            available: false,
            message: 'AI analysis not available. Get your FREE API key at https://makersuite.google.com/app/apikey'
        };
    }
    
    try {
        // Prepare summary data
        const total = pledges.length;
        const totalAmount = pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const paid = pledges.filter(p => p.status === 'paid').length;
        const pending = pledges.filter(p => p.status === 'pending').length;
        const overdue = pledges.filter(p => {
            if (p.status === 'paid' || p.status === 'cancelled') return false;
            return new Date(p.collection_date) < new Date();
        }).length;
        
        const prompt = `Analyze this pledge management data and provide 3-5 actionable insights:

Statistics:
- Total pledges: ${total}
- Total amount: UGX ${totalAmount.toLocaleString()}
- Paid: ${paid} (${total > 0 ? Math.round(paid/total*100) : 0}%)
- Pending: ${pending}
- Overdue: ${overdue}

Provide:
1. Key observations about collection performance
2. Potential risks or concerns
3. Specific actionable recommendations
4. Positive highlights

Format as a JSON array of insight objects with: { type: 'success'|'warning'|'info', title: 'string', message: 'string' }

Return ONLY valid JSON, no other text:`;

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
        
        // Fallback if JSON parsing fails
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

/**
 * Generate personalized thank you message
 * @param {Object} pledge - Pledge object
 * @param {Object} options - Options
 * @returns {Promise<string>} Thank you message
 */
async function generateThankYouMessage(pledge, options = {}) {
    if (!isAIAvailable()) {
        const donorName = pledge.donor_name || 'Valued Donor';
        const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'your generous contribution';
        return `Dear ${donorName}, thank you for your payment of ${amount}! Your support makes a real difference. We're grateful for your commitment. 🙏💙`;
    }
    
    try {
        const {
            tone = 'warm',
            includeImpact = true
        } = options;
        
        const donorName = pledge.donor_name || 'Valued Donor';
        const amount = pledge.amount ? `UGX ${Number(pledge.amount).toLocaleString()}` : 'your generous contribution';
        const purpose = pledge.purpose || 'our cause';
        
        const prompt = `Generate a ${tone} thank you message for a donor who just fulfilled their pledge, with Ugandan cultural warmth and community values.

Context:
- Donor name: ${donorName}
- Amount: ${amount}
- Purpose: ${purpose}

Requirements:
- Tone: ${tone}, sincere, appreciative, and culturally warm
- Maximum 200 characters (SMS friendly)
- ${includeImpact ? 'Mention positive community impact and collective progress' : 'Keep focused on gratitude and community appreciation'}
- Use 1-2 appropriate emojis (🙏 for gratitude, 💙 for community love)
- Reference community spirit, unity, or collective mission
- Include subtle reference to 'PledgeHub' (unity) values
- Make it personal, heartfelt, and community-focused
- Do NOT include quotes

Generate ONLY the message text:`;

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
 * Get AI suggestions for improving collection rates
 * @param {Object} stats - Statistics object
 * @returns {Promise<Array>} Suggestions
 */
async function getSuggestions(stats) {
    if (!isAIAvailable()) {
        return [
            {
                title: 'Send Timely Reminders',
                description: 'Use automated reminders 7 days and 3 days before due date',
                priority: 'high'
            },
            {
                title: 'Follow Up on Overdue',
                description: 'Contact overdue donors within 3 days',
                priority: 'high'
            }
        ];
    }
    
    try {
        const prompt = `Based on these pledge management statistics, provide 3-5 specific, actionable suggestions to improve collection rates:

Stats:
- Collection rate: ${stats.collectionRate || 0}%
- Overdue pledges: ${stats.overdue || 0}
- Pending pledges: ${stats.pending || 0}
- Total amount pending: UGX ${(stats.pendingAmount || 0).toLocaleString()}

Provide practical suggestions that can be implemented immediately.

Format as JSON array: [{ title: 'string', description: 'string', priority: 'high'|'medium'|'low' }]

Return ONLY valid JSON:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text().trim();
        
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        return [];
    } catch (error) {
        console.error('AI suggestions failed:', error.message);
        return [];
    }
}

/**
 * Generate AI chat response for general questions
 * @param {string} userMessage - User's question/message
 * @param {string} context - Current page/context (optional)
 * @param {string} dataContext - System data context (optional)
 * @returns {Promise<string>} AI response
 */
async function generateChatResponse(userMessage, context = '', dataContext = '') {
    if (!isAIAvailable()) {
        throw new Error('AI service not available');
    }

    try {
        const systemContext = context ? `\nUser is currently on: ${context}` : '';
        const additionalContext = dataContext || '';
        
        const prompt = `You are a helpful AI assistant for the PledgeHub Pledge Management System, a platform used in Uganda for managing church and community donations/pledges.

Key system features:
- Create and manage pledges with donor information
- Track payments and collection rates
- Send automated reminders via email/SMS
- Generate analytics and insights
- AI-powered message generation
- Dashboard with performance metrics

Context: You're helping users understand and use this pledge management system effectively.${systemContext}${additionalContext}

User question: "${userMessage}"

Provide a helpful, friendly response that:
1. Directly answers their question
2. Relates to the PledgeHub system when relevant
3. Offers practical next steps or suggestions
4. Uses a warm, professional tone suitable for Ugandan users
5. Keeps responses concise but informative (2-3 sentences max)

If they ask about features not available, politely explain and suggest alternatives.
If they need step-by-step help, provide clear instructions.
Always be encouraging and supportive.

Response:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim();
    } catch (error) {
        console.error('AI chat response failed:', error.message);
        throw error;
    }
}

// Initialize on module load
initializeAI();

module.exports = {
    isAIAvailable,
    generateEnhancedReminderMessage,
    analyzePledgeData,
    generateThankYouMessage,
    getSuggestions,
    generateChatResponse,
    initializeAI
};
