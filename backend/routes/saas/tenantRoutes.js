/**
 * Tenant Management Routes
 * 
 * Routes for managing tenant settings, users, and billing
 * Requires authentication and tenant context
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/authMiddleware');
const { extractTenant, requireTenantAdmin, validateTenantAccess } = require('../../middleware/tenantMiddleware');
const tenantService = require('../../services/tenantService');
const { SAAS_PLANS, getSuggestedUpgrade } = require('../../config/saasPlans');

// All routes require authentication and tenant context
router.use(authenticateToken);
router.use(extractTenant);
router.use(validateTenantAccess);

/**
 * GET /api/saas/tenant
 * Get current tenant info
 */
router.get('/', async (req, res) => {
  try {
    const result = await tenantService.getTenantById(req.tenant.id);
    
    if (!result.success) {
      return res.status(404).json({ error: result.error });
    }

    // Get usage stats
    const usageResult = await tenantService.getTenantUsage(req.tenant.id);
    const statsResult = await tenantService.getTenantStats(req.tenant.id);

    res.json({
      tenant: result.data,
      usage: usageResult.success ? usageResult.data : null,
      stats: statsResult.success ? statsResult.data : null,
      plan: SAAS_PLANS[result.data.plan]
    });

  } catch (error) {
    console.error('Get tenant error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/saas/tenant
 * Update tenant settings (admin only)
 */
router.put('/', requireTenantAdmin, async (req, res) => {
  try {
    const { name, billing_email, custom_domain, settings } = req.body;

    const updates = {};
    if (name) updates.name = name;
    if (billing_email) updates.billing_email = billing_email;
    if (custom_domain) updates.custom_domain = custom_domain;
    if (settings) updates.settings = settings;

    const result = await tenantService.updateTenant(req.tenant.id, updates);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ 
      success: true, 
      message: 'Tenant updated successfully' 
    });

  } catch (error) {
    console.error('Update tenant error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saas/tenant/users
 * Get all users in tenant
 */
router.get('/users', async (req, res) => {
  try {
    const result = await tenantService.getTenantUsers(req.tenant.id);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ users: result.data });

  } catch (error) {
    console.error('Get tenant users error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saas/tenant/usage
 * Get detailed usage stats
 */
router.get('/usage', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const result = await tenantService.getTenantUsage(
      req.tenant.id,
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    const planLimits = SAAS_PLANS[req.tenant.plan]?.limits || {};

    // Calculate percentage usage
    const usage = result.data;
    const usageWithPercentages = {
      pledges: {
        used: usage.total_pledges || 0,
        limit: planLimits.pledges,
        percentage: planLimits.pledges === -1 ? 0 : 
          Math.round(((usage.total_pledges || 0) / planLimits.pledges) * 100)
      },
      campaigns: {
        used: usage.total_campaigns || 0,
        limit: planLimits.campaigns,
        percentage: planLimits.campaigns === -1 ? 0 : 
          Math.round(((usage.total_campaigns || 0) / planLimits.campaigns) * 100)
      },
      sms: {
        used: usage.total_sms || 0,
        limit: planLimits.sms,
        percentage: planLimits.sms === -1 ? 0 : 
          Math.round(((usage.total_sms || 0) / planLimits.sms) * 100)
      },
      emails: {
        used: usage.total_emails || 0,
        limit: planLimits.emails,
        percentage: planLimits.emails === -1 ? 0 : 
          Math.round(((usage.total_emails || 0) / planLimits.emails) * 100)
      },
      ai_requests: {
        used: usage.total_ai_requests || 0,
        limit: planLimits.ai_requests,
        percentage: planLimits.ai_requests === -1 ? 0 : 
          Math.round(((usage.total_ai_requests || 0) / planLimits.ai_requests) * 100)
      }
    };

    res.json({ 
      usage: usageWithPercentages,
      plan: req.tenant.plan,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear()
    });

  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saas/tenant/stats
 * Get tenant statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await tenantService.getTenantStats(req.tenant.id);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ stats: result.data });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/saas/tenant/check-limit
 * Check if action is within plan limits
 */
router.post('/check-limit', async (req, res) => {
  try {
    const { action } = req.body; // e.g., 'pledges', 'campaigns', 'sms'

    if (!action) {
      return res.status(400).json({ error: 'Action type required' });
    }

    const usageResult = await tenantService.getTenantUsage(req.tenant.id);
    
    if (!usageResult.success) {
      return res.status(500).json({ error: usageResult.error });
    }

    const planLimits = SAAS_PLANS[req.tenant.plan]?.limits || {};
    const currentUsage = usageResult.data[`total_${action}`] || 0;
    const limit = planLimits[action];

    const allowed = limit === -1 || currentUsage < limit;

    let suggestedUpgrade = null;
    if (!allowed) {
      suggestedUpgrade = getSuggestedUpgrade(req.tenant.plan, action);
    }

    res.json({
      allowed,
      current: currentUsage,
      limit,
      percentage: limit === -1 ? 0 : Math.round((currentUsage / limit) * 100),
      suggestedUpgrade
    });

  } catch (error) {
    console.error('Check limit error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
