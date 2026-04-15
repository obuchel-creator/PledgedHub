const express = require('express');
const router = express.Router();

const { pool } = require('../config/db');

// PUBLIC ENDPOINT - Platform-wide aggregate statistics (no auth required)
// GET /api/analytics/platform-stats
router.get('/platform-stats', async (req, res) => {
  try {
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

    const stats = pledgeStats[0] || {};
    const totalAmount = parseFloat(stats.totalAmount) || 0;
    const totalCollected = parseFloat(stats.totalCollected) || 0;
    const collectionRate = totalAmount > 0 ? Math.round((totalCollected / totalAmount) * 100) : 0;

    res.json({
      success: true,
      data: {
        totalPledges: parseInt(stats.totalPledges) || 0,
        totalDonors: parseInt(stats.totalDonors) || 0,
        totalAmount,
        totalCollected,
        pendingPledges: parseInt(stats.pendingPledges) || 0,
        totalCampaigns: parseInt(campaignStats?.[0]?.totalCampaigns) || 0,
        totalOrganizations: parseInt(tenantStats?.[0]?.totalOrganizations) || 0,
        collectionRate,
      },
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
        collectionRate: 0,
      },
    });
  }
});

module.exports = router;
