const express = require('express');
const router = express.Router();
const messageGenerator = require('../services/messageGenerator');
const Pledge = require('../models/Pledge');

/**
 * Temporary simple auth middleware
 */
const simpleAuth = (req, res, next) => {
    next();
};

/**
 * POST /api/messages/reminder
 * Generate reminder message for a pledge
 * 
 * Body: {
 *   pledgeId: number,
 *   type: '7_days'|'3_days'|'due_today'|'overdue',
 *   tone?: 'friendly'|'professional'|'urgent',
 *   useAI?: boolean,
 *   language?: 'English'|'Luganda'
 * }
 */
router.post('/reminder', simpleAuth, async (req, res) => {
    try {
        const { pledgeId, type, tone, useAI, language } = req.body;
        
        if (!pledgeId || !type) {
            return res.status(400).json({
                success: false,
                error: 'pledgeId and type are required'
            });
        }
        
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                error: 'Pledge not found'
            });
        }
        
        const message = await messageGenerator.generateReminderMessage(
            pledge,
            type,
            { tone, useAI, language }
        );
        
        res.json({
            success: true,
            message,
            pledge: {
                id: pledge.id,
                donor_name: pledge.donor_name,
                amount: pledge.amount,
                collection_date: pledge.collection_date
            }
        });
    } catch (error) {
        console.error('Reminder generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate reminder message',
            details: error.message
        });
    }
});

/**
 * POST /api/messages/thank-you
 * Generate thank you message
 * 
 * Body: {
 *   pledgeId: number,
 *   tone?: 'warm'|'professional'|'casual',
 *   useAI?: boolean
 * }
 */
router.post('/thank-you', simpleAuth, async (req, res) => {
    try {
        const { pledgeId, tone, useAI } = req.body;
        
        if (!pledgeId) {
            return res.status(400).json({
                success: false,
                error: 'pledgeId is required'
            });
        }
        
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                error: 'Pledge not found'
            });
        }
        
        const message = await messageGenerator.generateThankYouMessage(
            pledge,
            { tone, useAI }
        );
        
        res.json({
            success: true,
            message,
            pledge: {
                id: pledge.id,
                donor_name: pledge.donor_name,
                amount: pledge.amount
            }
        });
    } catch (error) {
        console.error('Thank you generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate thank you message',
            details: error.message
        });
    }
});

/**
 * POST /api/messages/follow-up
 * Generate follow-up message for overdue pledge
 * 
 * Body: {
 *   pledgeId: number,
 *   approach?: 'gentle'|'standard'|'firm',
 *   useAI?: boolean
 * }
 */
router.post('/follow-up', simpleAuth, async (req, res) => {
    try {
        const { pledgeId, approach, useAI } = req.body;
        
        if (!pledgeId) {
            return res.status(400).json({
                success: false,
                error: 'pledgeId is required'
            });
        }
        
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                error: 'Pledge not found'
            });
        }
        
        const message = await messageGenerator.generateFollowUpMessage(
            pledge,
            { approach, useAI }
        );
        
        res.json({
            success: true,
            message,
            pledge: {
                id: pledge.id,
                donor_name: pledge.donor_name,
                amount: pledge.amount,
                collection_date: pledge.collection_date
            }
        });
    } catch (error) {
        console.error('Follow-up generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate follow-up message',
            details: error.message
        });
    }
});

/**
 * POST /api/messages/confirmation
 * Generate confirmation message
 * 
 * Body: {
 *   pledgeId: number,
 *   style?: 'standard'|'detailed'
 * }
 */
router.post('/confirmation', simpleAuth, async (req, res) => {
    try {
        const { pledgeId, style } = req.body;
        
        if (!pledgeId) {
            return res.status(400).json({
                success: false,
                error: 'pledgeId is required'
            });
        }
        
        const pledge = await Pledge.findById(pledgeId);
        if (!pledge) {
            return res.status(404).json({
                success: false,
                error: 'Pledge not found'
            });
        }
        
        const message = await messageGenerator.generateConfirmationMessage(
            pledge,
            { style }
        );
        
        res.json({
            success: true,
            message,
            pledge: {
                id: pledge.id,
                donor_name: pledge.donor_name,
                amount: pledge.amount,
                collection_date: pledge.collection_date
            }
        });
    } catch (error) {
        console.error('Confirmation generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate confirmation message',
            details: error.message
        });
    }
});

/**
 * POST /api/messages/bulk
 * Generate messages for multiple pledges
 * 
 * Body: {
 *   pledgeIds: number[],
 *   messageType: 'reminder'|'thankYou'|'followUp'|'confirmation',
 *   options: {...}
 * }
 */
router.post('/bulk', simpleAuth, async (req, res) => {
    try {
        const { pledgeIds, messageType, options } = req.body;
        
        if (!pledgeIds || !Array.isArray(pledgeIds) || pledgeIds.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'pledgeIds array is required'
            });
        }
        
        if (!messageType) {
            return res.status(400).json({
                success: false,
                error: 'messageType is required'
            });
        }
        
        // Get all pledges
        const pledges = await Promise.all(
            pledgeIds.map(id => Pledge.findById(id))
        );
        
        // Filter out null pledges
        const validPledges = pledges.filter(p => p !== null);
        
        if (validPledges.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No valid pledges found'
            });
        }
        
        // Generate messages
        const results = await messageGenerator.generateBulkMessages(
            validPledges,
            messageType,
            options || {}
        );
        
        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;
        
        res.json({
            success: true,
            total: results.length,
            successCount,
            failureCount,
            results
        });
    } catch (error) {
        console.error('Bulk generation failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate bulk messages',
            details: error.message
        });
    }
});

/**
 * GET /api/messages/templates
 * Get available message templates
 */
router.get('/templates', simpleAuth, (req, res) => {
    res.json({
        success: true,
        templates: {
            reminder: {
                types: ['7_days', '3_days', 'due_today', 'overdue'],
                tones: ['friendly', 'professional', 'urgent']
            },
            thankYou: {
                tones: ['warm', 'professional', 'casual']
            },
            followUp: {
                approaches: ['gentle', 'standard', 'firm']
            },
            confirmation: {
                styles: ['standard', 'detailed']
            }
        },
        features: {
            aiGeneration: true,
            multiLanguage: ['English', 'Luganda'],
            customization: true,
            bulkGeneration: true
        }
    });
});

module.exports = router;
