// DRILL-DOWN ANALYTICS SERVICE METHODS
async function getDrilldownByPurpose(purpose, start, end) {
    let where = 'WHERE deleted = 0 AND COALESCE(description, "Unspecified") = ?';
    let params = [purpose];
    if (start) { where += ' AND collection_date >= ?'; params.push(start); }
    if (end) { where += ' AND collection_date <= ?'; params.push(end); }
    const [rows] = await pool.execute(`
        SELECT id, donor_name, donor_email, donor_phone, amount, status, collection_date, description as purpose, campaign_id
        FROM pledges
        ${where}
        ORDER BY collection_date DESC
        LIMIT 100
    `, params);
    return rows;
}

async function getDrilldownByCampaign(campaign, start, end) {
    let where = 'WHERE p.deleted = 0 AND c.name = ?';
    let params = [campaign];
    if (start) { where += ' AND p.collection_date >= ?'; params.push(start); }
    if (end) { where += ' AND p.collection_date <= ?'; params.push(end); }
    const [rows] = await pool.execute(`
        SELECT p.id, p.donor_name, p.donor_email, p.donor_phone, p.amount, p.status, p.collection_date, p.description as purpose, c.name as campaign
        FROM pledges p
        JOIN campaigns c ON p.campaign_id = c.id
        ${where}
        ORDER BY p.collection_date DESC
        LIMIT 100
    `, params);
    return rows;
}

async function getDrilldownByDonor(donor, start, end) {
    let where = 'WHERE deleted = 0 AND donor_name = ?';
    let params = [donor];
    if (start) { where += ' AND collection_date >= ?'; params.push(start); }
    if (end) { where += ' AND collection_date <= ?'; params.push(end); }
    const [rows] = await pool.execute(`
        SELECT id, donor_name, donor_email, donor_phone, amount, status, collection_date, description as purpose, campaign_id
        FROM pledges
        ${where}
        ORDER BY collection_date DESC
        LIMIT 100
    `, params);
    return rows;
}

async function getDrilldownByStatus(status, start, end) {
    let where = 'WHERE deleted = 0 AND status = ?';
    let params = [status];
    if (start) { where += ' AND collection_date >= ?'; params.push(start); }
    if (end) { where += ' AND collection_date <= ?'; params.push(end); }
    const [rows] = await pool.execute(`
        SELECT id, donor_name, donor_email, donor_phone, amount, status, collection_date, description as purpose, campaign_id
        FROM pledges
        ${where}
        ORDER BY collection_date DESC
        LIMIT 100
    `, params);
    return rows;
}
// New summary endpoint: total pledges, amount, paid, pending, overdue, collection rate
async function getSummary() {
    let where = '';
    let params = [];
    if (arguments.length > 0 && arguments[0]) {
        where += ' AND collection_date >= ?';
        params.push(arguments[0]);
    }
    if (arguments.length > 1 && arguments[1]) {
        where += ' AND collection_date <= ?';
        params.push(arguments[1]);
    }
    const [rows] = await pool.execute(`
        SELECT 
            COUNT(*) AS totalPledges,
            COALESCE(SUM(amount),0) AS totalAmount,
            SUM(status = 'paid') AS paid,
            SUM(status = 'pending') AS pending,
            SUM(status != 'paid' AND status != 'cancelled' AND collection_date < CURDATE()) AS overdue
        FROM pledges
        WHERE 1=1${where}
    `, params);
    const { totalPledges, totalAmount, paid, pending, overdue } = rows[0];
    const collectionRate = totalPledges > 0 ? Math.round((paid / totalPledges) * 100) : 0;
    return { totalPledges, totalAmount, paid, pending, overdue, collectionRate };
}

// New trends endpoint: monthly pledges and amounts
async function getTrends() {
    let where = '';
    let params = [];
    if (arguments.length > 0 && arguments[0]) {
        where += ' AND collection_date >= ?';
        params.push(arguments[0]);
    }
    if (arguments.length > 1 && arguments[1]) {
        where += ' AND collection_date <= ?';
        params.push(arguments[1]);
    }
    const [rows] = await pool.execute(`
        SELECT DATE_FORMAT(collection_date, '%Y-%m') AS month,
               COUNT(*) AS pledges,
               COALESCE(SUM(amount),0) AS amount
        FROM pledges
        WHERE 1=1${where}
        GROUP BY month
        ORDER BY month ASC
    `, params);
    return rows;
}

// New campaigns endpoint: stats per campaign
async function getCampaigns() {
    let where = '';
    let params = [];
    if (arguments.length > 0 && arguments[0]) {
        where += ' AND p.collection_date >= ?';
        params.push(arguments[0]);
    }
    if (arguments.length > 1 && arguments[1]) {
        where += ' AND p.collection_date <= ?';
        params.push(arguments[1]);
    }
    const [rows] = await pool.execute(`
        SELECT c.name AS campaign, COUNT(p.id) AS pledges, COALESCE(SUM(p.amount),0) AS amount, SUM(p.status = 'paid') AS paid
        FROM campaigns c
        LEFT JOIN pledges p ON p.campaign_id = c.id${where ? ' AND 1=1'+where : ''}
        GROUP BY c.id
        ORDER BY amount DESC
    `, params);
    return rows;
}
const { pool } = require('../config/db');
const aiService = require('./aiService');

/**
 * Analytics Service
 * Provides data insights, trends, and predictions for pledges
 */

/**
 * Get overall pledge statistics
 * @returns {Promise<Object>} Statistics object
 */
async function getOverallStats() {
    try {
        const [stats] = await pool.execute(`
            SELECT 
                COUNT(*) as total_pledges,
                COUNT(DISTINCT name) as unique_names,
                SUM(CASE WHEN status = 'paid' OR status = 'completed' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'pending' OR status = 'active' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
                0 as overdue_count,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'paid' OR status = 'completed' THEN amount ELSE 0 END) as paid_amount,
                SUM(CASE WHEN status = 'pending' OR status = 'active' THEN amount ELSE 0 END) as pending_amount,
                0 as overdue_amount
            FROM pledges
            WHERE deleted = 0
        `);
        
        const row = stats[0] || {};
        
        const total = parseInt(row.total_pledges) || 0;
        const paid = parseInt(row.paid_count) || 0;
        
        return {
            totalPledges: total,
            uniqueDonors: parseInt(row.unique_names) || 0,
            counts: {
                paid,
                pending: parseInt(row.pending_count) || 0,
                cancelled: parseInt(row.cancelled_count) || 0,
                overdue: parseInt(row.overdue_count) || 0
            },
            amounts: {
                total: parseFloat(row.total_amount) || 0,
                paid: parseFloat(row.paid_amount) || 0,
                pending: parseFloat(row.pending_amount) || 0,
                overdue: parseFloat(row.overdue_amount) || 0
            },
            collectionRate: total > 0 ? Math.round((paid / total) * 100) : 0
        };
    } catch (error) {
        console.error('Error getting overall stats:', error);
        throw error;
    }
}

/**
 * Get pledge trends over time
 * @param {string} period - 'week', 'month', 'year'
 * @returns {Promise<Array>} Trend data
 */
async function getPledgeTrends(period = 'month') {
    try {
        let groupBy;
        let dateFormat;
        
        switch (period) {
            case 'week':
                groupBy = 'YEARWEEK(created_at)';
                dateFormat = 'Week %v, %Y';
                break;
            case 'year':
                groupBy = 'YEAR(created_at)';
                dateFormat = '%Y';
                break;
            case 'month':
            default:
                groupBy = 'DATE_FORMAT(created_at, "%Y-%m")';
                dateFormat = '%b %Y';
        }
        
        const [trends] = await pool.execute(`
            SELECT 
                ${groupBy} as period,
                DATE_FORMAT(created_at, '${dateFormat}') as label,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
                SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as paid_amount
            FROM pledges
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 ${period === 'week' ? 'WEEK' : period === 'year' ? 'YEAR' : 'MONTH'})
            GROUP BY period, label
            ORDER BY period ASC
        `);
        
        return trends.map(row => ({
            period: row.period,
            label: row.label,
            count: parseInt(row.count) || 0,
            totalAmount: parseFloat(row.total_amount) || 0,
            paidCount: parseInt(row.paid_count) || 0,
            paidAmount: parseFloat(row.paid_amount) || 0,
            collectionRate: row.count > 0 ? Math.round((row.paid_count / row.count) * 100) : 0
        }));
    } catch (error) {
        console.error('Error getting pledge trends:', error);
        throw error;
    }
}

/**
 * Get top donors
 * @param {number} limit - Number of donors to return
 * @returns {Promise<Array>} Top donors
 */
async function getTopDonors(limit = 10) {
    try {
        // Use literal LIMIT to avoid parameter binding issues
        const safeLimit = parseInt(limit) || 10;
        let where = '';
        let params = [];
        if (arguments.length > 1 && arguments[1]) {
            where += ' AND collection_date >= ?';
            params.push(arguments[1]);
        }
        if (arguments.length > 2 && arguments[2]) {
            where += ' AND collection_date <= ?';
            params.push(arguments[2]);
        }
        const [donors] = await pool.execute(`
            SELECT 
                donor_name,
                MAX(donor_email) as donor_email,
                MAX(donor_phone) as donor_phone,
                COUNT(*) as pledge_count,
                SUM(amount) as total_pledged,
                SUM(CASE WHEN status IN ('paid', 'completed') THEN amount ELSE 0 END) as total_paid,
                SUM(CASE WHEN status IN ('paid', 'completed') THEN 1 ELSE 0 END) as paid_count
            FROM pledges
            WHERE deleted = 0 AND donor_name IS NOT NULL AND donor_name != ''${where}
            GROUP BY donor_name
            ORDER BY total_paid DESC, total_pledged DESC
            LIMIT ${safeLimit}
        `, params);
        return donors.map(row => ({
            name: row.donor_name,
            email: row.donor_email,
            phone: row.donor_phone,
            pledgeCount: parseInt(row.pledge_count) || 0,
            totalPledged: parseFloat(row.total_pledged) || 0,
            totalPaid: parseFloat(row.total_paid) || 0,
            paidCount: parseInt(row.paid_count) || 0,
            fulfillmentRate: row.pledge_count > 0 ? Math.round((row.paid_count / row.pledge_count) * 100) : 0
        }));
    } catch (error) {
        console.error('Error getting top donors:', error);
        throw error;
    }
}

/**
 * Get pledges by status
 * @returns {Promise<Object>} Pledges grouped by status
 */
async function getPledgesByStatus() {
    try {
        const [data] = await pool.execute(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM pledges
            GROUP BY status
        `);
        
        const result = {};
        data.forEach(row => {
            result[row.status] = {
                count: parseInt(row.count) || 0,
                totalAmount: parseFloat(row.total_amount) || 0
            };
        });
        
        return result;
    } catch (error) {
        console.error('Error getting pledges by status:', error);
        throw error;
    }
}

/**
 * Get pledges by purpose/category
 * @returns {Promise<Array>} Pledges grouped by purpose
 */
async function getPledgesByPurpose() {
    try {
        let where = '';
        let params = [];
        if (arguments.length > 0 && arguments[0]) {
            where += ' AND collection_date >= ?';
            params.push(arguments[0]);
        }
        if (arguments.length > 1 && arguments[1]) {
            where += ' AND collection_date <= ?';
            params.push(arguments[1]);
        }
        const [data] = await pool.execute(`
            SELECT 
                COALESCE(description, 'Unspecified') as purpose,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                SUM(CASE WHEN status IN ('paid', 'completed') THEN amount ELSE 0 END) as paid_amount
            FROM pledges
            WHERE deleted = 0${where}
            GROUP BY description
            ORDER BY total_amount DESC
            LIMIT 10
        `, params);
        return data.map(row => ({
            purpose: row.purpose,
            count: parseInt(row.count) || 0,
            totalAmount: parseFloat(row.total_amount) || 0,
            paidAmount: parseFloat(row.paid_amount) || 0,
            collectionRate: row.total_amount > 0 ? Math.round((row.paid_amount / row.total_amount) * 100) : 0
        }));
    } catch (error) {
        console.error('Error getting pledges by purpose:', error);
        throw error;
    }
}

/**
 * Get upcoming collections (next 30 days)
 * @returns {Promise<Array>} Upcoming pledges
 */
async function getUpcomingCollections() {
    try {
        const [pledges] = await pool.execute(`
            SELECT 
                id,
                name as donor_name,
                amount,
                description as purpose,
                created_at as collection_date,
                status,
                0 as days_until_due
            FROM pledges
            WHERE status IN ('pending', 'active')
            AND deleted = 0
            ORDER BY created_at DESC
            LIMIT 20
        `);
        
        return pledges.map(p => ({
            id: p.id,
            donorName: p.donor_name,
            amount: parseFloat(p.amount) || 0,
            purpose: p.purpose,
            collectionDate: p.collection_date,
            status: p.status,
            daysUntilDue: parseInt(p.days_until_due) || 0
        }));
    } catch (error) {
        console.error('Error getting upcoming collections:', error);
        throw error;
    }
}

/**
 * Get at-risk pledges (overdue or approaching due date with no contact)
 * @returns {Promise<Array>} At-risk pledges
 */
async function getAtRiskPledges() {
    try {
        let where = '';
        let params = [];
        if (arguments.length > 0 && arguments[0]) {
            where += ' AND collection_date >= ?';
            params.push(arguments[0]);
        }
        if (arguments.length > 1 && arguments[1]) {
            where += ' AND collection_date <= ?';
            params.push(arguments[1]);
        }
        const [pledges] = await pool.execute(`
            SELECT 
                id,
                donor_name,
                amount,
                purpose,
                collection_date,
                status,
                last_reminder_sent,
                DATEDIFF(CURDATE(), collection_date) as days_overdue
            FROM pledges
            WHERE status IN ('pending', 'active', 'overdue')
            AND deleted = 0${where}
            AND (
                collection_date < CURDATE()
                OR (collection_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
                    AND (last_reminder_sent IS NULL OR last_reminder_sent < DATE_SUB(CURDATE(), INTERVAL 3 DAY)))
            )
            ORDER BY collection_date ASC
            LIMIT 20
        `, params);
        return pledges.map(p => ({
            id: p.id,
            donorName: p.donor_name,
            amount: parseFloat(p.amount) || 0,
            purpose: p.purpose,
            collectionDate: p.collection_date,
            status: p.status,
            lastReminderSent: p.last_reminder_sent,
            daysOverdue: parseInt(p.days_overdue) || 0,
            riskLevel: p.days_overdue > 7 ? 'high' : p.days_overdue > 0 ? 'medium' : 'low'
        }));
    } catch (error) {
        console.error('Error getting at-risk pledges:', error);
        throw error;
    }
}

/**
 * Get AI-powered analytics insights
 * @returns {Promise<Object>} AI insights
 */
async function getAIInsights() {
    try {
        if (!aiService.isAIAvailable()) {
            return {
                available: false,
                message: 'AI insights not available'
            };
        }
        
        const stats = await getOverallStats();
        const trends = await getPledgeTrends('month');
        const atRisk = await getAtRiskPledges();
        
        // Create insights data for AI
        const insightsData = {
            stats,
            recentTrend: trends.slice(-3),
            atRiskCount: atRisk.length,
            atRiskAmount: atRisk.reduce((sum, p) => sum + p.amount, 0)
        };
        
        // Get AI analysis (this would call aiService with more context)
        return {
            available: true,
            data: insightsData,
            recommendations: [
                {
                    type: atRisk.length > 5 ? 'warning' : 'info',
                    title: 'At-Risk Pledges',
                    message: `${atRisk.length} pledges need immediate attention`
                }
            ]
        };
    } catch (error) {
        console.error('Error getting AI insights:', error);
        return {
            available: false,
            error: error.message
        };
    }
}

/**
 * Get complete dashboard data
 * @returns {Promise<Object>} Complete dashboard data
 */
async function getDashboardData() {
    try {
        const [
            stats,
            trends,
            topDonors,
            byStatus,
            byPurpose,
            upcoming,
            atRisk
        ] = await Promise.all([
            getOverallStats(),
            getPledgeTrends('month'),
            getTopDonors(10),
            getPledgesByStatus(),
            getPledgesByPurpose(),
            getUpcomingCollections(),
            getAtRiskPledges()
        ]);
        
        return {
            overview: stats,
            trends,
            topDonors,
            byStatus,
            byPurpose,
            upcoming,
            atRisk,
            generatedAt: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error getting dashboard data:', error);
        throw error;
    }
}

/**
 * Get payment methods breakdown (MTN, Airtel, Bank, Cash)
 * @returns {Promise<Array>} Payment methods with amounts
 */
async function getPaymentMethods(start, end) {
    try {
        let where = 'WHERE deleted = 0';
        let params = [];
        
        if (start) {
            where += ' AND created_at >= ?';
            params.push(start);
        }
        if (end) {
            where += ' AND created_at <= ?';
            params.push(end);
        }
        
        const [rows] = await pool.execute(`
            SELECT 
                COALESCE(payment_method, 'unknown') as provider,
                SUM(amount) as amount,
                COUNT(*) as count
            FROM payments
            ${where}
            GROUP BY payment_method
            ORDER BY amount DESC
        `, params);
        
        return rows.map(r => ({
            provider: r.provider || 'Unknown',
            method: r.provider || 'Unknown',
            amount: parseFloat(r.amount) || 0,
            count: parseInt(r.count) || 0
        }));
    } catch (error) {
        console.error('Error getting payment methods:', error);
        return [];
    }
}

/**
 * Get credit system metrics (Free, PayAsYouGo, Campaign, Premium users)
 * @returns {Promise<Object>} Credit metrics
 */
async function getCreditMetrics(start, end) {
    try {
        let where = 'WHERE 1=1';
        let params = [];
        
        if (start) {
            where += ' AND created_at >= ?';
            params.push(start);
        }
        if (end) {
            where += ' AND created_at <= ?';
            params.push(end);
        }
        
        // Get user tier counts
        const [tiers] = await pool.execute(`
            SELECT 
                COALESCE(subscription_tier, 'free') as tier,
                COUNT(*) as count,
                COALESCE(SUM(credits_balance), 0) as total_credits
            FROM users
            ${where}
            GROUP BY subscription_tier
        `, params);
        
        const tierMap = {};
        tiers.forEach(t => {
            tierMap[t.tier] = {
                count: parseInt(t.count) || 0,
                credits: parseFloat(t.total_credits) || 0
            };
        });
        
        // Calculate metrics
        return {
            freeUsers: tierMap['free']?.count || 0,
            payAsYouGoUsers: tierMap['pay_as_you_go']?.count || 0,
            campaignTierSubscribers: tierMap['campaign']?.count || 0,
            premiumTierSubscribers: tierMap['premium']?.count || 0,
            totalCreditsLoaded: Object.values(tierMap).reduce((sum, t) => sum + (t.credits || 0), 0),
            totalUsers: Object.values(tierMap).reduce((sum, t) => sum + (t.count || 0), 0)
        };
    } catch (error) {
        console.error('Error getting credit metrics:', error);
        return {
            freeUsers: 0,
            payAsYouGoUsers: 0,
            campaignTierSubscribers: 0,
            premiumTierSubscribers: 0,
            totalCreditsLoaded: 0,
            totalUsers: 0
        };
    }
}

/**
 * Get at-risk pledges with detailed information
 * @returns {Promise<Array>} At-risk pledges
 */
async function getAtRiskPledgesDetailed(start, end) {
    try {
        let where = "WHERE status IN ('pending', 'active', 'overdue') AND deleted = 0";
        let params = [];
        
        if (start) {
            where += ' AND collection_date >= ?';
            params.push(start);
        }
        if (end) {
            where += ' AND collection_date <= ?';
            params.push(end);
        }
        
        const [pledges] = await pool.execute(`
            SELECT 
                id,
                donor_name,
                donor_email,
                donor_phone,
                amount,
                description as purpose,
                collection_date,
                status,
                last_reminder_sent,
                DATEDIFF(CURDATE(), collection_date) as days_overdue
            FROM pledges
            ${where}
            AND (
                collection_date < CURDATE()
                OR (collection_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) 
                    AND (last_reminder_sent IS NULL OR last_reminder_sent < DATE_SUB(CURDATE(), INTERVAL 3 DAY)))
            )
            ORDER BY days_overdue DESC, collection_date ASC
            LIMIT 50
        `, params);
        
        return pledges.map(p => ({
            id: p.id,
            donorName: p.donor_name,
            donorEmail: p.donor_email,
            donorPhone: p.donor_phone,
            amount: parseFloat(p.amount) || 0,
            purpose: p.purpose || 'Unspecified',
            dueDate: p.collection_date,
            status: p.status,
            lastReminderSent: p.last_reminder_sent,
            daysOverdue: Math.max(0, parseInt(p.days_overdue) || 0),
            riskLevel: (p.days_overdue || 0) > 30 ? 'CRITICAL' : (p.days_overdue || 0) > 10 ? 'HIGH' : 'MEDIUM'
        }));
    } catch (error) {
        console.error('Error getting at-risk pledges detailed:', error);
        return [];
    }
}

module.exports = {
    getOverallStats,
    getPledgeTrends,
    getTopDonors,
    getPledgesByStatus,
    getPledgesByPurpose,
    getUpcomingCollections,
    getAtRiskPledges,
    getAIInsights,
    getDashboardData,
    getSummary,
    getTrends,
    getCampaigns,
    getDrilldownByPurpose,
    getDrilldownByCampaign,
    getDrilldownByDonor,
    getDrilldownByStatus,
    getPaymentMethods,
    getCreditMetrics,
    getAtRiskPledgesDetailed
};
