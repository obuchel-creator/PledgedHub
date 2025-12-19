/**
 * Advanced Analytics Service
 * QuickBooks-style analytics with insights, trends, forecasting, and comprehensive reporting
 */

const { pool } = require('../config/db');
const db = { query: pool.query.bind(pool), execute: pool.execute.bind(pool) };

/**
 * Get comprehensive dashboard metrics with trends
 */
async function getDashboardMetrics(userId, dateRange = {}) {
  const { startDate, endDate } = getDateRange(dateRange);
  
  try {
    // Total revenue (all time and period)
    const revenueQuery = `
      SELECT 
        SUM(amount) as total_revenue,
        COUNT(*) as total_transactions,
        AVG(amount) as avg_transaction
      FROM payments
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
    `;
    const [revenueData] = await db.query(revenueQuery, [userId, startDate, endDate]);

    // Total revenue (all time for comparison)
    const [allTimeRevenue] = await db.query(
      'SELECT SUM(amount) as total FROM payments WHERE user_id = ?',
      [userId]
    );

    // Active campaigns
    const [campaignsData] = await db.query(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
        SUM(goal_amount) as total_goals,
        SUM(current_amount) as total_raised
      FROM campaigns
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    // Pledges overview
    const [pledgesData] = await db.query(`
      SELECT 
        COUNT(*) as total_pledges,
        SUM(amount) as total_pledged,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as fulfilled_pledges,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as fulfilled_amount
      FROM pledges
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    // Donor statistics
    const [donorStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT donor_email) as unique_donors,
        COUNT(DISTINCT CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN donor_email END) as active_donors
      FROM pledges
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
    `, [userId, startDate, endDate]);

    // Calculate trends (compare with previous period)
    const periodDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevStartDate.getDate() - periodDays);
    
    const [prevRevenue] = await db.query(
      'SELECT SUM(amount) as total FROM payments WHERE user_id = ? AND created_at BETWEEN ? AND ?',
      [userId, prevStartDate.toISOString(), startDate]
    );

    const revenueTrend = calculateTrend(
      revenueData[0]?.total_revenue || 0,
      prevRevenue[0]?.total || 0
    );

    return {
      success: true,
      data: {
        revenue: {
          current: revenueData[0]?.total_revenue || 0,
          allTime: allTimeRevenue[0]?.total || 0,
          transactions: revenueData[0]?.total_transactions || 0,
          average: revenueData[0]?.avg_transaction || 0,
          trend: revenueTrend,
        },
        campaigns: {
          total: campaignsData[0]?.total_campaigns || 0,
          active: campaignsData[0]?.active_campaigns || 0,
          totalGoals: campaignsData[0]?.total_goals || 0,
          totalRaised: campaignsData[0]?.total_raised || 0,
          completionRate: calculatePercentage(campaignsData[0]?.total_raised, campaignsData[0]?.total_goals),
        },
        pledges: {
          total: pledgesData[0]?.total_pledges || 0,
          totalAmount: pledgesData[0]?.total_pledged || 0,
          fulfilled: pledgesData[0]?.fulfilled_pledges || 0,
          fulfilledAmount: pledgesData[0]?.fulfilled_amount || 0,
          fulfillmentRate: calculatePercentage(pledgesData[0]?.fulfilled_pledges, pledgesData[0]?.total_pledges),
        },
        donors: {
          total: donorStats[0]?.unique_donors || 0,
          active: donorStats[0]?.active_donors || 0,
          retentionRate: calculatePercentage(donorStats[0]?.active_donors, donorStats[0]?.unique_donors),
        },
        period: {
          startDate,
          endDate,
          days: periodDays,
        },
      },
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}

/**
 * Get revenue trend over time (daily, weekly, monthly)
 */
async function getRevenueTrend(userId, groupBy = 'day', dateRange = {}) {
  const { startDate, endDate } = getDateRange(dateRange);
  
  const groupFormats = {
    day: '%Y-%m-%d',
    week: '%Y-%u',
    month: '%Y-%m',
    year: '%Y',
  };

  const format = groupFormats[groupBy] || groupFormats.day;

  try {
    const query = `
      SELECT 
        DATE_FORMAT(created_at, ?) as period,
        SUM(amount) as revenue,
        COUNT(*) as transactions,
        AVG(amount) as avg_amount
      FROM payments
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
      GROUP BY period
      ORDER BY period ASC
    `;

    const [results] = await db.query(query, [format, userId, startDate, endDate]);

    return {
      success: true,
      data: results.map(row => ({
        period: row.period,
        revenue: parseFloat(row.revenue) || 0,
        transactions: row.transactions,
        avgAmount: parseFloat(row.avg_amount) || 0,
      })),
    };
  } catch (error) {
    console.error('Error fetching revenue trend:', error);
    throw error;
  }
}

/**
 * Get campaign performance analytics
 */
async function getCampaignPerformance(userId, dateRange = {}) {
  const { startDate, endDate } = getDateRange(dateRange);

  try {
    const query = `
      SELECT 
        c.id,
        c.name as title,
        c.target_amount as goal_amount,
        COALESCE(SUM(p.amount), 0) as current_amount,
        c.status,
        c.created_at,
        COUNT(DISTINCT p.id) as pledge_count,
        COUNT(DISTINCT p.donor_email) as unique_donors,
        SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as paid_amount,
        (COALESCE(SUM(p.amount), 0) / NULLIF(c.target_amount, 0) * 100) as completion_percentage,
        DATEDIFF(NOW(), c.created_at) as days_active
      FROM campaigns c
      LEFT JOIN pledges p ON c.id = p.campaign_id
      WHERE c.user_id = ? AND c.created_at BETWEEN ? AND ?
      GROUP BY c.id, c.name, c.target_amount, c.status, c.created_at
      ORDER BY COALESCE(SUM(p.amount), 0) DESC
    `;

    const [results] = await db.query(query, [userId, startDate, endDate]);

    // Calculate additional metrics
    const campaigns = results.map(campaign => ({
      ...campaign,
      completion_percentage: parseFloat(campaign.completion_percentage) || 0,
      daily_avg: campaign.days_active > 0 ? campaign.current_amount / campaign.days_active : 0,
      donor_avg: campaign.unique_donors > 0 ? campaign.paid_amount / campaign.unique_donors : 0,
      velocity: calculateVelocity(campaign.current_amount, campaign.goal_amount, campaign.days_active),
    }));

    return {
      success: true,
      data: campaigns,
    };
  } catch (error) {
    console.error('Error fetching campaign performance:', error);
    throw error;
  }
}

/**
 * Get donor cohort analysis
 */
async function getDonorCohortAnalysis(userId) {
  try {
    const query = `
      SELECT 
        DATE_FORMAT(first_pledge, '%Y-%m') as cohort_month,
        COUNT(*) as cohort_size,
        SUM(total_pledges) as total_pledges,
        SUM(total_amount) as total_amount,
        AVG(total_pledges) as avg_pledges_per_donor,
        AVG(total_amount) as avg_amount_per_donor
      FROM (
        SELECT 
          donor_email,
          MIN(created_at) as first_pledge,
          COUNT(*) as total_pledges,
          SUM(amount) as total_amount
        FROM pledges
        WHERE user_id = ?
        GROUP BY donor_email
      ) as donor_cohorts
      GROUP BY cohort_month
      ORDER BY cohort_month DESC
      LIMIT 12
    `;

    const [results] = await db.query(query, [userId]);

    return {
      success: true,
      data: results.map(row => ({
        cohort: row.cohort_month,
        size: row.cohort_size,
        totalPledges: row.total_pledges,
        totalAmount: parseFloat(row.total_amount) || 0,
        avgPledgesPerDonor: parseFloat(row.avg_pledges_per_donor) || 0,
        avgAmountPerDonor: parseFloat(row.avg_amount_per_donor) || 0,
      })),
    };
  } catch (error) {
    console.error('Error fetching cohort analysis:', error);
    throw error;
  }
}

/**
 * Get donor lifetime value (LTV)
 */
async function getDonorLifetimeValue(userId) {
  try {
    const query = `
      SELECT 
        donor_email,
        donor_name,
        COUNT(*) as total_pledges,
        SUM(amount) as lifetime_value,
        MIN(created_at) as first_pledge_date,
        MAX(created_at) as last_pledge_date,
        DATEDIFF(MAX(created_at), MIN(created_at)) as donor_lifespan_days,
        AVG(amount) as avg_pledge_amount
      FROM pledges
      WHERE user_id = ?
      GROUP BY donor_email, donor_name
      HAVING COUNT(*) >= 1
      ORDER BY lifetime_value DESC
      LIMIT 50
    `;

    const [results] = await db.query(query, [userId]);

    return {
      success: true,
      data: results.map(donor => ({
        email: donor.donor_email,
        name: donor.donor_name,
        lifetimeValue: parseFloat(donor.lifetime_value) || 0,
        totalPledges: donor.total_pledges,
        avgPledgeAmount: parseFloat(donor.avg_pledge_amount) || 0,
        firstPledge: donor.first_pledge_date,
        lastPledge: donor.last_pledge_date,
        lifespanDays: donor.donor_lifespan_days,
        frequency: donor.donor_lifespan_days > 0 
          ? donor.total_pledges / (donor.donor_lifespan_days / 30) 
          : donor.total_pledges,
      })),
    };
  } catch (error) {
    console.error('Error fetching donor LTV:', error);
    throw error;
  }
}

/**
 * Get payment method breakdown
 */
async function getPaymentMethodBreakdown(userId, dateRange = {}) {
  const { startDate, endDate } = getDateRange(dateRange);

  try {
    const query = `
      SELECT 
        payment_method,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM payments
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
      GROUP BY payment_method
      ORDER BY total_amount DESC
    `;

    const [results] = await db.query(query, [userId, startDate, endDate]);

    const total = results.reduce((sum, row) => sum + parseFloat(row.total_amount || 0), 0);

    return {
      success: true,
      data: results.map(row => ({
        method: row.payment_method,
        count: row.transaction_count,
        amount: parseFloat(row.total_amount) || 0,
        avgAmount: parseFloat(row.avg_amount) || 0,
        percentage: calculatePercentage(row.total_amount, total),
      })),
    };
  } catch (error) {
    console.error('Error fetching payment method breakdown:', error);
    throw error;
  }
}

/**
 * Generate revenue forecast using linear regression
 */
async function generateRevenueForecast(userId, periods = 6) {
  try {
    // Get historical revenue data (last 12 months)
    const query = `
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(amount) as revenue
      FROM payments
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `;

    const [historicalData] = await db.query(query, [userId]);

    if (historicalData.length < 3) {
      return {
        success: false,
        error: 'Insufficient historical data for forecasting (minimum 3 months required)',
      };
    }

    // Simple linear regression forecast
    const forecast = calculateLinearForecast(historicalData, periods);

    return {
      success: true,
      data: {
        historical: historicalData.map(row => ({
          period: row.month,
          revenue: parseFloat(row.revenue) || 0,
        })),
        forecast: forecast,
      },
    };
  } catch (error) {
    console.error('Error generating forecast:', error);
    throw error;
  }
}

/**
 * Get pledge fulfillment funnel
 */
async function getPledgeFulfillmentFunnel(userId, dateRange = {}) {
  const { startDate, endDate } = getDateRange(dateRange);

  try {
    const query = `
      SELECT 
        COUNT(*) as total_pledges,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(amount) as total_amount,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
      FROM pledges
      WHERE user_id = ? AND created_at BETWEEN ? AND ?
    `;

    const [results] = await db.query(query, [userId, startDate, endDate]);
    const data = results[0];

    return {
      success: true,
      data: {
        stages: [
          { name: 'Total Pledges', count: data.total_pledges, amount: parseFloat(data.total_amount) || 0 },
          { name: 'Pending', count: data.pending, percentage: calculatePercentage(data.pending, data.total_pledges) },
          { name: 'Confirmed', count: data.confirmed, percentage: calculatePercentage(data.confirmed, data.total_pledges) },
          { name: 'Paid', count: data.paid, amount: parseFloat(data.paid_amount) || 0, percentage: calculatePercentage(data.paid, data.total_pledges) },
          { name: 'Overdue', count: data.overdue, percentage: calculatePercentage(data.overdue, data.total_pledges) },
          { name: 'Cancelled', count: data.cancelled, percentage: calculatePercentage(data.cancelled, data.total_pledges) },
        ],
        conversionRate: calculatePercentage(data.paid, data.total_pledges),
        fulfillmentRate: calculatePercentage(data.paid_amount, data.total_amount),
      },
    };
  } catch (error) {
    console.error('Error fetching fulfillment funnel:', error);
    throw error;
  }
}

/**
 * Get top performing campaigns
 */
async function getTopCampaigns(userId, limit = 10, metric = 'revenue') {
  try {
    const orderBy = {
      revenue: 'c.current_amount DESC',
      donors: 'unique_donors DESC',
      completion: 'completion_rate DESC',
      velocity: '(c.current_amount / NULLIF(DATEDIFF(NOW(), c.created_at), 0)) DESC',
    };

    const query = `
      SELECT 
        c.id,
        c.name as title,
        c.target_amount as goal_amount,
        COALESCE(SUM(p.amount), 0) as current_amount,
        (COALESCE(SUM(p.amount), 0) / NULLIF(c.target_amount, 0) * 100) as completion_rate,
        COUNT(DISTINCT p.donor_email) as unique_donors,
        COUNT(p.id) as pledge_count,
        DATEDIFF(NOW(), c.created_at) as days_active,
        (COALESCE(SUM(p.amount), 0) / NULLIF(DATEDIFF(NOW(), c.created_at), 0)) as daily_velocity
      FROM campaigns c
      LEFT JOIN pledges p ON c.id = p.campaign_id
      WHERE c.user_id = ?
      GROUP BY c.id, c.name, c.target_amount, c.created_at
      ORDER BY ${orderBy[metric] || orderBy.revenue}
      LIMIT ?
    `;

    const [results] = await db.query(query, [userId, limit]);

    return {
      success: true,
      data: results.map(campaign => ({
        id: campaign.id,
        title: campaign.title,
        goalAmount: parseFloat(campaign.goal_amount) || 0,
        currentAmount: parseFloat(campaign.current_amount) || 0,
        completionRate: parseFloat(campaign.completion_rate) || 0,
        uniqueDonors: campaign.unique_donors,
        pledgeCount: campaign.pledge_count,
        daysActive: campaign.days_active,
        dailyVelocity: parseFloat(campaign.daily_velocity) || 0,
      })),
    };
  } catch (error) {
    console.error('Error fetching top campaigns:', error);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================

function getDateRange(range = {}) {
  const end = range.endDate ? new Date(range.endDate) : new Date();
  let start;

  if (range.startDate) {
    start = new Date(range.startDate);
  } else if (range.period) {
    start = new Date();
    switch (range.period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
      default:
        start.setMonth(start.getMonth() - 1);
    }
  } else {
    start = new Date();
    start.setMonth(start.getMonth() - 1);
  }

  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function calculatePercentage(part, whole) {
  if (!whole || whole === 0) return 0;
  return Math.round((part / whole) * 100 * 100) / 100;
}

function calculateTrend(current, previous) {
  if (!previous || previous === 0) {
    return { direction: 'up', percentage: current > 0 ? 100 : 0 };
  }
  
  const change = ((current - previous) / previous) * 100;
  return {
    direction: change >= 0 ? 'up' : 'down',
    percentage: Math.abs(Math.round(change * 100) / 100),
  };
}

function calculateVelocity(current, goal, days) {
  if (days === 0) return 0;
  const dailyRate = current / days;
  const remainingAmount = goal - current;
  const daysToGoal = remainingAmount / dailyRate;
  return {
    dailyRate: Math.round(dailyRate * 100) / 100,
    projectedDays: Math.ceil(daysToGoal),
    onTrack: daysToGoal > 0 && daysToGoal < 365,
  };
}

function calculateLinearForecast(historicalData, periods) {
  // Simple linear regression: y = mx + b
  const n = historicalData.length;
  const x = historicalData.map((_, i) => i);
  const y = historicalData.map(d => parseFloat(d.revenue) || 0);

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate forecast
  const lastMonth = new Date(historicalData[n - 1].month + '-01');
  const forecast = [];

  for (let i = 1; i <= periods; i++) {
    const forecastMonth = new Date(lastMonth);
    forecastMonth.setMonth(forecastMonth.getMonth() + i);
    
    const predictedValue = slope * (n + i - 1) + intercept;
    
    forecast.push({
      period: forecastMonth.toISOString().substr(0, 7),
      revenue: Math.max(0, Math.round(predictedValue * 100) / 100),
      confidence: 'medium',
    });
  }

  return forecast;
}

module.exports = {
  getDashboardMetrics,
  getRevenueTrend,
  getCampaignPerformance,
  getDonorCohortAnalysis,
  getDonorLifetimeValue,
  getPaymentMethodBreakdown,
  generateRevenueForecast,
  getPledgeFulfillmentFunnel,
  getTopCampaigns,
};
