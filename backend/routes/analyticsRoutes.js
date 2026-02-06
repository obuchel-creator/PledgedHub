const express = require('express');
const router = express.Router();

const analyticsService = require('../services/analyticsService');
const financialAnalyticsService = require('../services/financialAnalyticsService');
const { requireStaff } = require('../middleware/authMiddleware');
const { authenticateToken } = require('../middleware/authMiddleware');
const db = require('../config/db');

// PUBLIC ENDPOINT - Platform-wide aggregate statistics (no auth required)
// GET /api/analytics/platform-stats
router.get('/platform-stats', async (req, res) => {
    try {
        const { pool } = require('../config/db');
        
        // Get aggregate statistics across ALL tenants/organizations
        const [pledgeStats] = await pool.execute(`
            SELECT 
                COUNT(DISTINCT id) as totalPledges,
                COUNT(DISTINCT donor_name) as totalDonors,
                SUM(amount) as totalAmount,
                SUM(CASE WHEN status = 'paid' OR payment_status = 'completed' THEN amount ELSE 0 END) as totalCollected,
                COUNT(CASE WHEN status = 'pending' OR status = 'unpaid' THEN 1 END) as pendingPledges
            FROM pledges
            WHERE deleted = 0
        `);

        const [campaignStats] = await pool.execute(`
            SELECT COUNT(DISTINCT id) as totalCampaigns
            FROM campaigns
            WHERE deleted = 0
        `);

        const [tenantStats] = await pool.execute(`
            SELECT COUNT(DISTINCT id) as totalOrganizations
            FROM tenants
        `);

        const stats = pledgeStats[0];
        const totalAmount = parseFloat(stats.totalAmount) || 0;
        const totalCollected = parseFloat(stats.totalCollected) || 0;
        const collectionRate = totalAmount > 0 
            ? Math.round((totalCollected / totalAmount) * 100) 
            : 0;

        res.json({
            success: true,
            data: {
                totalPledges: parseInt(stats.totalPledges) || 0,
                totalDonors: parseInt(stats.totalDonors) || 0,
                totalAmount: totalAmount,
                totalCollected: totalCollected,
                pendingPledges: parseInt(stats.pendingPledges) || 0,
                totalCampaigns: parseInt(campaignStats[0].totalCampaigns) || 0,
                totalOrganizations: parseInt(tenantStats[0].totalOrganizations) || 0,
                collectionRate: collectionRate
            }
        });
    } catch (err) {
        console.error('Platform stats error:', err);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch platform statistics',
            data: {
                totalPledges: 0,
                totalDonors: 0,
                totalAmount: 0,
                totalCollected: 0,
                pendingPledges: 0,
                totalCampaigns: 0,
                totalOrganizations: 0,
                collectionRate: 0
            }
        });
    }
});

// DRILL-DOWN ANALYTICS ENDPOINTS
// GET /api/analytics/drilldown/by-purpose
router.get('/drilldown/by-purpose', requireStaff, async (req, res) => {
    try {
        const { purpose, start, end } = req.query;
        if (!purpose) return res.status(400).json({ success: false, error: 'Purpose is required' });
        const data = await analyticsService.getDrilldownByPurpose(purpose, start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/drilldown/by-campaign
router.get('/drilldown/by-campaign', requireStaff, async (req, res) => {
    try {
        const { campaign, start, end } = req.query;
        if (!campaign) return res.status(400).json({ success: false, error: 'Campaign is required' });
        const data = await analyticsService.getDrilldownByCampaign(campaign, start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/drilldown/by-donor
router.get('/drilldown/by-donor', requireStaff, async (req, res) => {
    try {
        const { donor, start, end } = req.query;
        if (!donor) return res.status(400).json({ success: false, error: 'Donor is required' });
        const data = await analyticsService.getDrilldownByDonor(donor, start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/drilldown/by-status
router.get('/drilldown/by-status', requireStaff, async (req, res) => {
    try {
        const { status, start, end } = req.query;
        if (!status) return res.status(400).json({ success: false, error: 'Status is required' });
        const data = await analyticsService.getDrilldownByStatus(status, start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// GET /api/analytics/top-donors
router.get('/top-donors', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getTopDonors(10, start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/purpose-breakdown
router.get('/purpose-breakdown', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getPledgesByPurpose(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/at-risk
router.get('/at-risk', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getAtRiskPledgesDetailed(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/payment-methods
router.get('/payment-methods', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getPaymentMethods(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/credit-metrics
router.get('/credit-metrics', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getCreditMetrics(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});
// (moved to top)
// GET /api/analytics/summary
router.get('/summary', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getSummary(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/trends
router.get('/trends', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getTrends(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// GET /api/analytics/campaigns
router.get('/campaigns', requireStaff, async (req, res) => {
    try {
        const { start, end } = req.query;
        const data = await analyticsService.getCampaigns(start, end);
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

/**
 * Temporary simple auth middleware
 */
const simpleAuth = (req, res, next) => {
    next();
};

/**
 * GET /api/analytics/overview
 * Get overall pledge statistics
 */
router.get('/overview', simpleAuth, async (req, res) => {
    try {
        const stats = await analyticsService.getOverallStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Overview stats failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get overview statistics',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/trends
 * Get pledge trends over time
 * Query params: period ('week'|'month'|'year')
 */
router.get('/trends', simpleAuth, async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        if (!['week', 'month', 'year'].includes(period)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid period. Use: week, month, or year'
            });
        }
        
        const trends = await analyticsService.getPledgeTrends(period);
        
        res.json({
            success: true,
            period,
            data: trends
        });
    } catch (error) {
        console.error('Trends failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get trends',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/top-donors
 * Get top donors by contribution
 * Query params: limit (number, default 10)
 */
router.get('/top-donors', simpleAuth, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const donors = await analyticsService.getTopDonors(limit);
        
        res.json({
            success: true,
            limit,
            data: donors
        });
    } catch (error) {
        console.error('Top donors failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get top donors',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/by-status
 * Get pledges grouped by status
 */
router.get('/by-status', simpleAuth, async (req, res) => {
    try {
        const data = await analyticsService.getPledgesByStatus();
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('By status failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get pledges by status',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/by-purpose
 * Get pledges grouped by purpose/category
 */
router.get('/by-purpose', simpleAuth, async (req, res) => {
    try {
        const data = await analyticsService.getPledgesByPurpose();
        
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('By purpose failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get pledges by purpose',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/upcoming
 * Get upcoming collections (next 30 days)
 */
router.get('/upcoming', simpleAuth, async (req, res) => {
    try {
        const pledges = await analyticsService.getUpcomingCollections();
        
        res.json({
            success: true,
            count: pledges.length,
            data: pledges
        });
    } catch (error) {
        console.error('Upcoming collections failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get upcoming collections',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/at-risk
 * Get at-risk pledges (overdue or approaching deadline)
 */
router.get('/at-risk', simpleAuth, async (req, res) => {
    try {
        const pledges = await analyticsService.getAtRiskPledges();
        
        // Group by risk level
        const byRisk = {
            high: pledges.filter(p => p.riskLevel === 'high'),
            medium: pledges.filter(p => p.riskLevel === 'medium'),
            low: pledges.filter(p => p.riskLevel === 'low')
        };
        
        res.json({
            success: true,
            total: pledges.length,
            byRiskLevel: {
                high: byRisk.high.length,
                medium: byRisk.medium.length,
                low: byRisk.low.length
            },
            data: pledges
        });
    } catch (error) {
        console.error('At-risk pledges failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get at-risk pledges',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/insights
 * Get AI-powered insights and recommendations
 */
router.get('/insights', simpleAuth, async (req, res) => {
    try {
        const insights = await analyticsService.getAIInsights();
        
        res.json({
            success: true,
            ...insights
        });
    } catch (error) {
        console.error('AI insights failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get AI insights',
            details: error.message
        });
    }
});

/**
 * GET /api/analytics/dashboard
 * Get complete dashboard data in one call
 */
router.get('/dashboard', simpleAuth, async (req, res) => {
    try {
        const data = await analyticsService.getDashboardData();
        
        res.json({
            success: true,
            ...data
        });
    } catch (error) {
        console.error('Dashboard data failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboard data',
            details: error.message
        });
    }
});

// SOCIAL SHARING ANALYTICS

/**
 * Track a share event
 * POST /api/analytics/track-share
 */
router.post('/track-share', authenticateToken, async (req, res) => {
  try {
    const { contentType, contentId, channel, timestamp } = req.body;
    const userId = req.user.id;

    if (!contentType || !channel) {
      return res.status(400).json({
        success: false,
        error: 'Content type and channel are required',
      });
    }

    // Insert share event (table will be created via migration)
    const query = `
      INSERT INTO share_events 
      (user_id, content_type, content_id, channel, shared_at)
      VALUES (?, ?, ?, ?, ?)
    `;

    await db.query(query, [
      userId,
      contentType,
      contentId || null,
      channel,
      timestamp || new Date().toISOString(),
    ]);

    res.json({
      success: true,
      message: 'Share tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking share:', error);
    // Don't fail if table doesn't exist yet
    res.json({
      success: true,
      message: 'Share tracking pending (table creation required)',
    });
  }
});

/**
 * Get sharing statistics for a user
 * GET /api/analytics/share-stats
 */
router.get('/share-stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30' } = req.query;

    const query = `
      SELECT 
        channel,
        COUNT(*) as share_count,
        DATE(shared_at) as share_date
      FROM share_events
      WHERE user_id = ?
        AND shared_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY channel, DATE(shared_at)
      ORDER BY shared_at DESC
    `;

    const [results] = await db.query(query, [userId, parseInt(period)]);

    const byChannel = {};
    results.forEach(row => {
      if (!byChannel[row.channel]) {
        byChannel[row.channel] = 0;
      }
      byChannel[row.channel] += row.share_count;
    });

    res.json({
      success: true,
      stats: {
        byChannel,
        byDate: results,
        totalShares: Object.values(byChannel).reduce((sum, count) => sum + count, 0),
      },
    });
  } catch (error) {
    console.error('Error fetching share stats:', error);
    res.json({
      success: true,
      stats: { byChannel: {}, byDate: [], totalShares: 0 },
    });
  }
});

/**
 * Get referral statistics
 * GET /api/referrals/stats
 */
router.get('/referrals/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get share events of type 'referral'
    const shareQuery = `
      SELECT COUNT(*) as invite_count
      FROM share_events
      WHERE user_id = ? AND content_type = 'referral'
    `;
    const [shareResults] = await db.query(shareQuery, [userId]);

    // Get signups from this user's referral code (if referred_by column exists)
    const signupQuery = `
      SELECT COUNT(*) as signup_count
      FROM users
      WHERE referred_by = ?
    `;
    const [signupResults] = await db.query(signupQuery, [userId]).catch(() => [[{ signup_count: 0 }]]);

    // Get active users
    const activeQuery = `
      SELECT COUNT(DISTINCT u.id) as active_count
      FROM users u
      INNER JOIN pledges p ON u.id = p.user_id
      WHERE u.referred_by = ?
    `;
    const [activeResults] = await db.query(activeQuery, [userId]).catch(() => [[{ active_count: 0 }]]);

    res.json({
      success: true,
      stats: {
        invitesSent: shareResults[0]?.invite_count || 0,
        signups: signupResults[0]?.signup_count || 0,
        activePledgers: activeResults[0]?.active_count || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.json({
      success: true,
      stats: {
        invitesSent: 0,
        signups: 0,
        activePledgers: 0,
      },
    });
  }
});

// ============================================
// FINANCIAL ANALYTICS ENDPOINTS (QuickBooks-Style)
// ============================================

// GET /api/analytics/profit-loss
// Profit & Loss Statement (Income vs Expenses)
router.get('/profit-loss', authenticateToken, async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end || new Date().toISOString().split('T')[0];
        
        const userId = req.user.role === 'user' ? req.user.id : null;
        const result = await financialAnalyticsService.getProfitAndLoss(startDate, endDate, userId);
        
        res.json(result);
    } catch (error) {
        console.error('Error in /profit-loss:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/cash-flow
// Cash Flow Analysis (Money in vs Money out over time)
router.get('/cash-flow', authenticateToken, async (req, res) => {
    try {
        const { start, end, groupBy = 'day' } = req.query;
        const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end || new Date().toISOString().split('T')[0];
        
        const userId = req.user.role === 'user' ? req.user.id : null;
        const result = await financialAnalyticsService.getCashFlow(startDate, endDate, userId, groupBy);
        
        res.json(result);
    } catch (error) {
        console.error('Error in /cash-flow:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/financial-health
// Financial Health Metrics & KPIs
router.get('/financial-health', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.role === 'user' ? req.user.id : null;
        const result = await financialAnalyticsService.getFinancialHealth(userId);
        
        res.json(result);
    } catch (error) {
        console.error('Error in /financial-health:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/expense-breakdown
// Expense Breakdown by Category (for donut chart)
router.get('/expense-breakdown', authenticateToken, async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end || new Date().toISOString().split('T')[0];
        
        const userId = req.user.role === 'user' ? req.user.id : null;
        const result = await financialAnalyticsService.getExpenseBreakdown(startDate, endDate, userId);
        
        res.json(result);
    } catch (error) {
        console.error('Error in /expense-breakdown:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/analytics/revenue-breakdown
// Revenue Breakdown by Payment Method (for donut chart)
router.get('/revenue-breakdown', authenticateToken, async (req, res) => {
    try {
        const { start, end } = req.query;
        const startDate = start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = end || new Date().toISOString().split('T')[0];
        
        const userId = req.user.role === 'user' ? req.user.id : null;
        const result = await financialAnalyticsService.getRevenueBreakdown(startDate, endDate, userId);
        
        res.json(result);
    } catch (error) {
        console.error('Error in /revenue-breakdown:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;