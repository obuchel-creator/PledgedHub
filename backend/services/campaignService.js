const { pool } = require('../config/db');

/**
 * Create a new fundraising campaign
 * @param {Object} params - Campaign parameters
 * @param {string} params.title - Campaign title
 * @param {string} params.description - Campaign description
 * @param {number} params.goalAmount - Total fundraising goal
 * @param {number} params.suggestedAmount - Suggested amount per donor
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function createCampaign({ title, description, goalAmount, suggestedAmount }) {
    try {
        const sql = `
            INSERT INTO campaigns (title, description, goal_amount, suggested_amount, current_amount, status)
            VALUES (?, ?, ?, ?, 0, 'active')
        `;
        
        const [result] = await pool.execute(sql, [
            title,
            description || null,
            goalAmount,
            suggestedAmount || null
        ]);

        console.log(`✅ Campaign created: "${title}" (ID: ${result.insertId}, Goal: ${goalAmount} UGX)`);
        
        return { 
            success: true, 
            data: { 
                id: result.insertId,
                title,
                description,
                goalAmount,
                suggestedAmount,
                status: 'active'
            } 
        };
    } catch (error) {
        console.error('❌ Error creating campaign:', error);
        return {
            success: false,
            error: error.message || 'Failed to create campaign'
        };
    }
}

/**
 * Get all campaigns with aggregated pledge statistics
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by status (active/completed/cancelled)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function getAllCampaigns({ status } = {}) {
    try {
        let sql = `
            SELECT 
                c.id,
                c.name as title,
                c.description,
                c.target_amount as goal_amount,
                c.suggested_amount as suggested_amount,
                COALESCE(SUM(p.amount), 0) as current_amount,
                c.status,
                c.start_date,
                c.end_date,
                c.created_at,
                c.updated_at,
                COUNT(p.id) as pledge_count,
                COALESCE(SUM(p.amount), 0) as total_pledged,
                COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as total_paid,
                COALESCE(SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END), 0) as total_pending,
                ROUND((COALESCE(SUM(p.amount), 0) / c.target_amount) * 100, 2) as progress_percentage
            FROM campaigns c
            LEFT JOIN pledges p ON c.id = p.campaign_id
            WHERE c.deleted = 0
        `;

        const params = [];
        if (status) {
            sql += ' AND c.status = ?';
            params.push(status);
        }

        sql += ' GROUP BY c.id ORDER BY c.created_at DESC';

        const [campaigns] = await pool.execute(sql, params);

        console.log(`📊 Retrieved ${campaigns.length} campaign(s)${status ? ` with status: ${status}` : ''}`);

        return { 
            success: true, 
            data: campaigns.map(c => ({
                ...c,
                goal_amount: parseFloat(c.goal_amount),
                suggested_amount: c.suggested_amount ? parseFloat(c.suggested_amount) : null,
                current_amount: parseFloat(c.current_amount),
                total_pledged: parseFloat(c.total_pledged),
                total_paid: parseFloat(c.total_paid),
                total_pending: parseFloat(c.total_pending),
                progress_percentage: parseFloat(c.progress_percentage)
            }))
        };
    } catch (error) {
        console.error('❌ Error fetching campaigns:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch campaigns'
        };
    }
}

/**
 * Get campaign details with all associated pledges
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function getCampaignWithPledges(campaignId) {
    try {
        // Get campaign details
        const [campaigns] = await pool.execute(
            'SELECT * FROM campaigns WHERE id = ?',
            [campaignId]
        );

        if (campaigns.length === 0) {
            return { 
                success: false, 
                error: 'Campaign not found' 
            };
        }

        // Get associated pledges
        const [pledges] = await pool.execute(`
            SELECT 
                id, donor_name, donor_email, amount, status, purpose,
                collection_date, created_at
            FROM pledges 
            WHERE campaign_id = ?
            ORDER BY created_at DESC
        `, [campaignId]);

        // Calculate statistics
        const totalPledged = pledges.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalPaid = pledges.filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalPending = pledges.filter(p => p.status === 'pending')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const totalOverdue = pledges.filter(p => p.status === 'overdue')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

        const campaign = campaigns[0];
        const goalAmount = parseFloat(campaign.goal_amount);
        const progressPercentage = goalAmount > 0 ? (totalPledged / goalAmount) * 100 : 0;

        const donorsNeeded = campaign.suggested_amount 
            ? Math.ceil((goalAmount - totalPledged) / parseFloat(campaign.suggested_amount))
            : null;

        console.log(`📊 Retrieved campaign "${campaign.title}" with ${pledges.length} pledge(s)`);

        return {
            success: true,
            data: {
                id: campaign.id,
                title: campaign.title,
                description: campaign.description,
                goal_amount: goalAmount,
                suggested_amount: campaign.suggested_amount ? parseFloat(campaign.suggested_amount) : null,
                current_amount: parseFloat(campaign.current_amount),
                status: campaign.status,
                created_at: campaign.created_at,
                updated_at: campaign.updated_at,
                pledges: pledges.map(p => ({
                    ...p,
                    amount: parseFloat(p.amount)
                })),
                stats: {
                    totalPledged,
                    totalPaid,
                    totalPending,
                    totalOverdue,
                    pledgeCount: pledges.length,
                    progressPercentage: Math.round(progressPercentage * 100) / 100,
                    donorsNeeded: donorsNeeded > 0 ? donorsNeeded : 0
                }
            }
        };
    } catch (error) {
        console.error('❌ Error fetching campaign details:', error);
        return {
            success: false,
            error: error.message || 'Failed to fetch campaign details'
        };
    }
}

/**
 * Update campaign's current_amount based on paid pledges
 * Auto-completes campaign when goal is reached
 * @param {number} campaignId - Campaign ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function updateCampaignAmount(campaignId) {
    try {
        // Calculate total paid amount for this campaign
        const updateSQL = `
            UPDATE campaigns c
            SET current_amount = (
                SELECT COALESCE(SUM(amount), 0)
                FROM pledges
                WHERE campaign_id = c.id AND status = 'paid'
            )
            WHERE id = ?
        `;

        await pool.execute(updateSQL, [campaignId]);

        // Check if goal reached and update status
        const [campaigns] = await pool.execute(
            'SELECT id, title, goal_amount, current_amount, status FROM campaigns WHERE id = ?',
            [campaignId]
        );

        if (campaigns.length > 0) {
            const campaign = campaigns[0];
            const goalAmount = parseFloat(campaign.goal_amount);
            const currentAmount = parseFloat(campaign.current_amount);

            if (currentAmount >= goalAmount && campaign.status === 'active') {
                await pool.execute(
                    'UPDATE campaigns SET status = ? WHERE id = ?',
                    ['completed', campaignId]
                );
                console.log(`🎉 Campaign "${campaign.title}" (ID: ${campaignId}) reached its goal! Status: completed`);
                
                return {
                    success: true,
                    data: {
                        campaignId,
                        currentAmount,
                        goalAmount,
                        status: 'completed',
                        goalReached: true
                    }
                };
            }

            console.log(`💰 Campaign "${campaign.title}" updated: ${currentAmount} / ${goalAmount} UGX`);
            
            return {
                success: true,
                data: {
                    campaignId,
                    currentAmount,
                    goalAmount,
                    status: campaign.status,
                    goalReached: false
                }
            };
        }

        return { success: true };
    } catch (error) {
        console.error('❌ Error updating campaign amount:', error);
        return {
            success: false,
            error: error.message || 'Failed to update campaign amount'
        };
    }
}

/**
 * Update campaign status
 * @param {number} campaignId - Campaign ID
 * @param {string} status - New status (active/completed/cancelled)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
async function updateCampaignStatus(campaignId, status) {
    try {
        const validStatuses = ['active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return {
                success: false,
                error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
            };
        }

        await pool.execute(
            'UPDATE campaigns SET status = ? WHERE id = ?',
            [status, campaignId]
        );

        console.log(`✅ Campaign ${campaignId} status updated to: ${status}`);

        return { 
            success: true, 
            data: { campaignId, status } 
        };
    } catch (error) {
        console.error('❌ Error updating campaign status:', error);
        return {
            success: false,
            error: error.message || 'Failed to update campaign status'
        };
    }
}

module.exports = {
    createCampaign,
    getAllCampaigns,
    getCampaignWithPledges,
    updateCampaignAmount,
    updateCampaignStatus
};
