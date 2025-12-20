const express = require('express');
const router = express.Router();
const campaignService = require('../services/campaignService');
const { authenticateToken, requireAdmin, requireRole } = require('../middleware/authMiddleware');

/**
 * POST /api/campaigns
 * Create a new campaign (creator and super_admin)
 */
router.post('/', authenticateToken, requireRole(['creator', 'super_admin']), async (req, res) => {
    try {
        console.log('🔵 [CAMPAIGN CREATE] Received request');
        console.log('🔵 [CAMPAIGN CREATE] Body:', JSON.stringify(req.body, null, 2));

        const { title, description, goalAmount, suggestedAmount } = req.body;

        // Validation
        if (!title || !title.trim()) {
            console.log('❌ [CAMPAIGN CREATE] Validation failed: Title is required');
            return res.status(400).json({ 
                success: false, 
                error: 'Title is required' 
            });
        }

        if (!goalAmount || isNaN(goalAmount) || goalAmount <= 0) {
            console.log('❌ [CAMPAIGN CREATE] Validation failed: Invalid goal amount');
            return res.status(400).json({ 
                success: false, 
                error: 'Goal amount must be a positive number' 
            });
        }

        if (suggestedAmount && (isNaN(suggestedAmount) || suggestedAmount <= 0)) {
            console.log('❌ [CAMPAIGN CREATE] Validation failed: Invalid suggested amount');
            return res.status(400).json({ 
                success: false, 
                error: 'Suggested amount must be a positive number' 
            });
        }

        console.log('✅ [CAMPAIGN CREATE] Validation passed');

        const result = await campaignService.createCampaign({
            title: title.trim(),
            description: description?.trim(),
            goalAmount: Number(goalAmount),
            suggestedAmount: suggestedAmount ? Number(suggestedAmount) : null
        });

        if (!result.success) {
            console.log('❌ [CAMPAIGN CREATE] Service error:', result.error);
            return res.status(500).json(result);
        }

        console.log('✅ [CAMPAIGN CREATE] Campaign created successfully');
        res.status(201).json(result);
    } catch (error) {
        console.error('❌ [CAMPAIGN CREATE] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to create campaign',
            details: error.message
        });
    }
});

/**
 * GET /api/campaigns
 * List all campaigns with aggregated stats (PUBLIC - donors can view campaigns)
 * Query params: status (optional) - filter by status
 */
router.get('/', async (req, res) => {
    try {
        console.log('🔵 [CAMPAIGN LIST] Received request');
        console.log('🔵 [CAMPAIGN LIST] Query:', req.query);

        const { status } = req.query;

        const result = await campaignService.getAllCampaigns({ status });

        if (!result.success) {
            console.log('❌ [CAMPAIGN LIST] Service error:', result.error);
            return res.status(500).json(result);
        }

        console.log('✅ [CAMPAIGN LIST] Retrieved', result.data.length, 'campaign(s)');
        res.json(result);
    } catch (error) {
        console.error('❌ [CAMPAIGN LIST] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch campaigns',
            details: error.message
        });
    }
});

/**
 * GET /api/campaigns/:id
 * Get campaign details with all pledges (PUBLIC - donors can view campaign details)
 */
router.get('/:id', async (req, res) => {
    try {
        const campaignId = parseInt(req.params.id, 10);
        
        console.log('🔵 [CAMPAIGN DETAILS] Received request for campaign:', campaignId);

        if (isNaN(campaignId) || campaignId <= 0) {
            console.log('❌ [CAMPAIGN DETAILS] Invalid campaign ID');
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid campaign ID' 
            });
        }

        const result = await campaignService.getCampaignWithPledges(campaignId);

        if (!result.success) {
            console.log('❌ [CAMPAIGN DETAILS]', result.error);
            return res.status(404).json(result);
        }

        console.log('✅ [CAMPAIGN DETAILS] Retrieved campaign with', result.data.pledges.length, 'pledge(s)');
        res.json(result);
    } catch (error) {
        console.error('❌ [CAMPAIGN DETAILS] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch campaign details',
            details: error.message
        });
    }
});

/**
 * PUT /api/campaigns/:id/status
 * Update campaign status (ADMIN ONLY)
 */
router.put('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const campaignId = parseInt(req.params.id, 10);
        const { status } = req.body;

        console.log('🔵 [CAMPAIGN STATUS] Update request for campaign:', campaignId, 'to status:', status);

        if (isNaN(campaignId) || campaignId <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid campaign ID' 
            });
        }

        if (!status) {
            return res.status(400).json({ 
                success: false, 
                error: 'Status is required' 
            });
        }

        const result = await campaignService.updateCampaignStatus(campaignId, status);

        if (!result.success) {
            return res.status(400).json(result);
        }

        console.log('✅ [CAMPAIGN STATUS] Status updated successfully');
        res.json(result);
    } catch (error) {
        console.error('❌ [CAMPAIGN STATUS] Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to update campaign status',
            details: error.message
        });
    }
});

module.exports = router;
