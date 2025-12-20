/**
 * Advanced Analytics Routes
 * QuickBooks-style analytics endpoints
 */

const express = require('express');
const router = express.Router();
const advancedAnalytics = require('../services/advancedAnalyticsService');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

/**
 * GET /api/advanced-analytics/dashboard
 * Get comprehensive dashboard metrics with trends
 */
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      period: req.query.period, // today, week, month, quarter, year
    };

    const metrics = await advancedAnalytics.getDashboardMetrics(userId, dateRange);
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
    });
  }
});

/**
 * GET /api/advanced-analytics/revenue-trend
 * Get revenue trend over time with grouping options
 */
router.get('/revenue-trend', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const groupBy = req.query.groupBy || 'day'; // day, week, month, year
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      period: req.query.period,
    };

    const trend = await advancedAnalytics.getRevenueTrend(userId, groupBy, dateRange);
    res.json(trend);
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch revenue trend',
    });
  }
});

/**
 * GET /api/advanced-analytics/campaign-performance
 * Get detailed campaign performance metrics
 */
router.get('/campaign-performance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      period: req.query.period,
    };

    const performance = await advancedAnalytics.getCampaignPerformance(userId, dateRange);
    res.json(performance);
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign performance',
    });
  }
});

/**
 * GET /api/advanced-analytics/donor-cohorts
 * Get donor cohort analysis
 */
router.get('/donor-cohorts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const cohorts = await advancedAnalytics.getDonorCohortAnalysis(userId);
    res.json(cohorts);
  } catch (error) {
    console.error('Error fetching donor cohorts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donor cohort analysis',
    });
  }
});

/**
 * GET /api/advanced-analytics/donor-ltv
 * Get donor lifetime value rankings
 */
router.get('/donor-ltv', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const ltv = await advancedAnalytics.getDonorLifetimeValue(userId);
    res.json(ltv);
  } catch (error) {
    console.error('Error fetching donor LTV:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch donor lifetime value',
    });
  }
});

/**
 * GET /api/advanced-analytics/payment-methods
 * Get payment method breakdown
 */
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      period: req.query.period,
    };

    const breakdown = await advancedAnalytics.getPaymentMethodBreakdown(userId, dateRange);
    res.json(breakdown);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment method breakdown',
    });
  }
});

/**
 * GET /api/advanced-analytics/forecast
 * Generate revenue forecast
 */
router.get('/forecast', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const periods = parseInt(req.query.periods) || 6;

    const forecast = await advancedAnalytics.generateRevenueForecast(userId, periods);
    res.json(forecast);
  } catch (error) {
    console.error('Error generating forecast:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate revenue forecast',
    });
  }
});

/**
 * GET /api/advanced-analytics/pledge-funnel
 * Get pledge fulfillment funnel
 */
router.get('/pledge-funnel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const dateRange = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      period: req.query.period,
    };

    const funnel = await advancedAnalytics.getPledgeFulfillmentFunnel(userId, dateRange);
    res.json(funnel);
  } catch (error) {
    console.error('Error fetching pledge funnel:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pledge fulfillment funnel',
    });
  }
});

/**
 * GET /api/advanced-analytics/top-campaigns
 * Get top performing campaigns
 */
router.get('/top-campaigns', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const metric = req.query.metric || 'revenue'; // revenue, donors, completion, velocity

    const topCampaigns = await advancedAnalytics.getTopCampaigns(userId, limit, metric);
    res.json(topCampaigns);
  } catch (error) {
    console.error('Error fetching top campaigns:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top campaigns',
    });
  }
});

/**
 * GET /api/advanced-analytics/export
 * Export analytics data to CSV/Excel
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const format = req.query.format || 'csv'; // csv, excel
    const reportType = req.query.type || 'dashboard'; // dashboard, revenue, campaigns, donors

    // Get data based on report type
    let data;
    switch (reportType) {
      case 'revenue':
        data = await advancedAnalytics.getRevenueTrend(userId, 'day', {});
        break;
      case 'campaigns':
        data = await advancedAnalytics.getCampaignPerformance(userId, {});
        break;
      case 'donors':
        data = await advancedAnalytics.getDonorLifetimeValue(userId);
        break;
      default:
        data = await advancedAnalytics.getDashboardMetrics(userId, {});
    }

    if (format === 'csv') {
      const csv = convertToCSV(data.data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="pledgehub-${reportType}-${Date.now()}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: data.data,
        message: 'Excel export format not yet implemented. Use CSV for now.',
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export analytics data',
    });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return 'No data available';
  }

  // Handle array of objects
  if (Array.isArray(data)) {
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }

  // Handle single object
  const entries = Object.entries(data);
  return entries.map(([key, value]) => `${key},${value}`).join('\n');
}

module.exports = router;
