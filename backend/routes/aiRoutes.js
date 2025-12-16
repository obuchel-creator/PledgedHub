const express = require('express');
const router = express.Router();
const aiService = require('../services/aiService');
const Pledge = require('../models/Pledge');

/**
 * Temporary simple auth middleware
 * TODO: Replace with proper authentication
 */
const simpleAuth = (req, res, next) => {
    // For now, allow all requests
    next();
};

/**
 * GET /api/ai/status
 * Check if AI features are available
 */
router.get('/status', simpleAuth, async (req, res) => {
    try {
        const available = aiService.isAIAvailable();
        
        res.json({
            success: true,
            available,
            provider: available ? 'Google Gemini' : null,
            model: available ? 'gemini-pro' : null,
            tier: 'FREE',
            message: available 
                ? 'AI features are active and ready'
                : 'AI features disabled. Add GOOGLE_AI_API_KEY to enable FREE AI features.'
        });
    } catch (error) {
        console.error('AI status check failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check AI status',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/enhance-message
 * Generate AI-enhanced reminder message
 * 
 * Body: {
 *   pledgeId: number,
 *   type: '7_days'|'3_days'|'due_today'|'overdue',
 *   tone?: 'friendly'|'professional'|'urgent',
 *   language?: 'English'|'Luganda',
 *   maxLength?: number
 * }
 */
router.post('/enhance-message', simpleAuth, async (req, res) => {
    try {
        const { pledgeId, type, tone, language, maxLength } = req.body;
        
        if (!pledgeId || !type) {
            return res.status(400).json({
                success: false,
                error: 'pledgeId and type are required'
            });
        }
        
        // Get pledge data
        const pledge = await Pledge.findById(pledgeId);
        
        if (!pledge) {
            return res.status(404).json({
                success: false,
                error: 'Pledge not found'
            });
        }
        
        // Generate enhanced message
        const message = await aiService.generateEnhancedReminderMessage(pledge, type, {
            tone,
            language,
            maxLength
        });
        
        res.json({
            success: true,
            message,
            aiGenerated: aiService.isAIAvailable(),
            pledge: {
                id: pledge.id,
                donor_name: pledge.donor_name,
                amount: pledge.amount,
                purpose: pledge.purpose
            }
        });
    } catch (error) {
        console.error('Message enhancement failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate enhanced message',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/insights
 * Get AI-powered insights about pledge data
 */
router.get('/insights', simpleAuth, async (req, res) => {
    try {
        // Get all pledges
        const pledges = await Pledge.list();
        
        // Generate AI insights
        const insights = await aiService.analyzePledgeData(pledges);
        
        res.json({
            success: true,
            ...insights,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Insights generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate insights',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/thank-you
 * Generate personalized thank you message
 * 
 * Body: {
 *   pledgeId: number,
 *   tone?: 'warm'|'professional'|'casual',
 *   includeImpact?: boolean
 * }
 */
router.post('/thank-you', simpleAuth, async (req, res) => {
    try {
        const { pledgeId, tone, includeImpact } = req.body;
        
        if (!pledgeId) {
            return res.status(400).json({
                success: false,
                error: 'pledgeId is required'
            });
        }
        
        // Get pledge data
        const pledge = await Pledge.findById(pledgeId);
        
        if (!pledge) {
            return res.status(404).json({
                success: false,
                error: 'Pledge not found'
            });
        }
        
        // Generate thank you message
        const message = await aiService.generateThankYouMessage(pledge, {
            tone,
            includeImpact
        });
        
        res.json({
            success: true,
            message,
            aiGenerated: aiService.isAIAvailable(),
            pledge: {
                id: pledge.id,
                donor_name: pledge.donor_name,
                amount: pledge.amount
            }
        });
    } catch (error) {
        console.error('Thank you message generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate thank you message',
            details: error.message
        });
    }
});

/**
 * GET /api/ai/suggestions
 * Get AI-powered suggestions to improve collection rates
 */
router.get('/suggestions', simpleAuth, async (req, res) => {
    try {
        // Get pledge statistics
        const pledges = await Pledge.list();
        
        const stats = {
            total: pledges.length,
            paid: pledges.filter(p => p.status === 'paid').length,
            pending: pledges.filter(p => p.status === 'pending').length,
            overdue: pledges.filter(p => {
                if (p.status === 'paid' || p.status === 'cancelled') return false;
                return new Date(p.collection_date) < new Date();
            }).length,
            totalAmount: pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
            pendingAmount: pledges
                .filter(p => p.status === 'pending')
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
        };
        
        stats.collectionRate = stats.total > 0 ? Math.round((stats.paid / stats.total) * 100) : 0;
        
        // Get AI suggestions
        const suggestions = await aiService.getSuggestions(stats);
        
        res.json({
            success: true,
            stats,
            suggestions,
            aiGenerated: aiService.isAIAvailable(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Suggestions generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate suggestions',
            details: error.message
        });
    }
});

/**
 * POST /api/ai/chat
 * General AI chat endpoint for answering questions
 * 
 * Body: {
 *   message: string,
 *   context?: string (current page/location)
 * }
 */
router.post('/chat', simpleAuth, async (req, res) => {
    try {
        const { message, context } = req.body;
        
        if (!message || typeof message !== 'string' || !message.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Message is required'
            });
        }
        
        if (!aiService.isAIAvailable()) {
            // Fallback responses when AI is not available
            const fallbackResponse = getFallbackResponse(message.toLowerCase(), context);
            return res.json({
                success: true,
                message: fallbackResponse,
                aiGenerated: false,
                fallback: true
            });
        }
        
        // Get pledge data for context if needed
        let pledgeContext = '';
        if (message.toLowerCase().includes('pledge') || message.toLowerCase().includes('data') || message.toLowerCase().includes('stat')) {
            try {
                const pledges = await Pledge.list();
                const stats = {
                    total: pledges.length,
                    paid: pledges.filter(p => p.status === 'paid').length,
                    pending: pledges.filter(p => p.status === 'pending').length,
                    totalAmount: pledges.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
                };
                pledgeContext = `\n\nCurrent system data: ${stats.total} total pledges, ${stats.paid} paid, ${stats.pending} pending, total amount: UGX ${stats.totalAmount.toLocaleString()}`;
            } catch (error) {
                console.log('Could not fetch pledge context:', error.message);
            }
        }
        
        // Generate AI response
        const response = await aiService.generateChatResponse(message, context, pledgeContext);
        
        res.json({
            success: true,
            message: response,
            aiGenerated: true,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('AI chat failed:', error);
        
        // Return fallback response on error
        const fallbackResponse = getFallbackResponse(req.body.message?.toLowerCase() || '', req.body.context);
        res.json({
            success: true,
            message: fallbackResponse,
            aiGenerated: false,
            error: error.message,
            fallback: true
        });
    }
});

// Helper function for fallback responses
function getFallbackResponse(message, context) {
    if (message.includes('create') || message.includes('new')) {
        return 'To create a new pledge, navigate to the Create page and fill in the donor information, amount, and purpose. You can set a collection date and add any special notes.';
    } else if (message.includes('dashboard') || message.includes('view') || message.includes('see')) {
        return 'Your dashboard shows all your pledges, collection rates, and analytics. You can track payments, send reminders, and view trends there.';
    } else if (message.includes('reminder') || message.includes('send') || message.includes('notify')) {
        return 'You can send reminders from the dashboard by clicking on individual pledges or using the bulk reminder feature. The system also sends automatic reminders at 9 AM and 5 PM daily.';
    } else if (message.includes('payment') || message.includes('collect') || message.includes('money')) {
        return 'Track payments from your dashboard. When a donor pays, you can update the pledge status to "paid" and record the payment details.';
    } else if (message.includes('help') || message.includes('how') || message.includes('what')) {
        return 'I can help you with:\n• Creating and managing pledges\n• Sending reminders and messages\n• Understanding analytics and trends\n• General system guidance\n\nWhat specific topic would you like help with?';
    } else if (message.includes('ai') || message.includes('features')) {
        return 'This system includes AI features powered by Google Gemini for generating personalized messages, analyzing data, and providing insights. Enable AI by adding your Google AI API key to the environment variables.';
    } else {
        return `I understand you're asking about "${message}". While AI features are not currently active, I can help you with pledge management, creating reminders, viewing analytics, and navigating the system. What would you like to know more about?`;
    }
}

/**
 * POST /api/ai/test
 * Test AI functionality with sample data
 */
router.post('/test', simpleAuth, async (req, res) => {
    try {
        if (!aiService.isAIAvailable()) {
            return res.json({
                success: false,
                message: 'AI not available. Please add GOOGLE_AI_API_KEY to .env file.',
                instructions: 'Get your FREE API key at: https://makersuite.google.com/app/apikey'
            });
        }
        
        // Test with sample pledge data
        const samplePledge = {
            donor_name: 'John Doe',
            amount: 100000,
            purpose: 'Church Building Fund',
            collection_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        };
        
        const message = await aiService.generateEnhancedReminderMessage(samplePledge, '7_days', {
            tone: 'friendly'
        });
        
        res.json({
            success: true,
            message: 'AI is working! 🎉',
            sampleMessage: message,
            provider: 'Google Gemini',
            model: 'gemini-pro',
            tier: 'FREE (1,500 requests/day)'
        });
    } catch (error) {
        console.error('AI test failed:', error);
        res.status(500).json({
            success: false,
            error: 'AI test failed',
            details: error.message
        });
    }
});

module.exports = router;
