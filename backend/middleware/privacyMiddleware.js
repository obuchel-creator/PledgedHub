/**
 * Privacy Middleware - User-level data isolation
 * 
 * Ensures users only see their OWN data unless they have proper permissions
 * Hierarchy: Super Admin > Tenant Admin > Staff > Regular User
 */

const { pool } = require('../config/db');

/**
 * Check if user can view specific pledge
 */
async function canViewPledge(userId, pledgeId, userRole, tenantId) {
  // Super admins and tenant admins can see all pledges
  if (userRole === 'super_admin' || userRole === 'admin') {
    return { allowed: true, reason: 'Admin access' };
  }

  // Get pledge info
  const [pledges] = await pool.execute(
    'SELECT created_by, is_private, tenant_id FROM pledges WHERE id = ? AND deleted = 0',
    [pledgeId]
  );

  if (pledges.length === 0) {
    return { allowed: false, reason: 'Pledge not found' };
  }

  const pledge = pledges[0];

  // Tenant isolation check
  if (pledge.tenant_id !== tenantId) {
    return { allowed: false, reason: 'Cross-tenant access denied' };
  }

  // Owner always has access
  if (pledge.created_by === userId) {
    return { allowed: true, reason: 'Owner access' };
  }

  // Check if pledge is shared with organization (staff can view)
  if (!pledge.is_private && userRole === 'staff') {
    return { allowed: true, reason: 'Organization access' };
  }

  // Check explicit permissions
  const [permissions] = await pool.execute(
    'SELECT permission_type FROM pledge_view_permissions WHERE pledge_id = ? AND user_id = ?',
    [pledgeId, userId]
  );

  if (permissions.length > 0) {
    return { allowed: true, reason: 'Explicit permission granted' };
  }

  // Check user privacy settings - allow staff view if enabled
  if (userRole === 'staff') {
    const [settings] = await pool.execute(
      'SELECT allow_staff_view FROM user_privacy_settings WHERE user_id = ? AND tenant_id = ?',
      [pledge.created_by, tenantId]
    );
    
    if (settings.length > 0 && settings[0].allow_staff_view) {
      return { allowed: true, reason: 'Staff view allowed by owner' };
    }
  }

  return { allowed: false, reason: 'No permission to view this pledge' };
}

/**
 * Middleware: Require pledge ownership or admin
 */
function requirePledgeOwnership(req, res, next) {
  const pledgeId = req.params.id || req.body.pledgeId;
  const userId = req.user.id;
  const userRole = req.user.role;
  const tenantId = req.tenant?.id || req.user.tenant_id;

  if (!pledgeId) {
    return res.status(400).json({ error: 'Pledge ID required' });
  }

  canViewPledge(userId, pledgeId, userRole, tenantId)
    .then(result => {
      if (!result.allowed) {
        return res.status(403).json({ 
          error: 'Access denied',
          reason: result.reason 
        });
      }
      next();
    })
    .catch(error => {
      console.error('Error checking pledge ownership:', error);
      res.status(500).json({ error: 'Error validating permissions' });
    });
}

/**
 * Middleware: Require campaign ownership or admin
 */
async function requireCampaignOwnership(req, res, next) {
  const campaignId = req.params.id || req.body.campaignId;
  const userId = req.user.id;
  const userRole = req.user.role;
  const tenantId = req.tenant?.id || req.user.tenant_id;

  if (!campaignId) {
    return res.status(400).json({ error: 'Campaign ID required' });
  }

  try {
    // Admins can access all campaigns
    if (userRole === 'super_admin' || userRole === 'admin') {
      return next();
    }

    // Get campaign info
    const [campaigns] = await pool.execute(
      'SELECT created_by, visibility, tenant_id FROM campaigns WHERE id = ?',
      [campaignId]
    );

    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaigns[0];

    // Tenant isolation
    if (campaign.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Cross-tenant access denied' });
    }

    // Owner has access
    if (campaign.created_by === userId) {
      return next();
    }

    // Organization campaigns visible to staff
    if (campaign.visibility === 'organization' && userRole === 'staff') {
      return next();
    }

    // Public campaigns visible to all in tenant
    if (campaign.visibility === 'public') {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied',
      reason: 'This campaign is private' 
    });

  } catch (error) {
    console.error('Error checking campaign ownership:', error);
    res.status(500).json({ error: 'Error validating permissions' });
  }
}

/**
 * Filter query for user-level privacy
 * Returns SQL WHERE conditions and parameters
 */
function getUserPrivacyFilter(userId, userRole, tenantId) {
  // Admins see all in their tenant
  if (userRole === 'admin' || userRole === 'super_admin') {
    return {
      where: 'tenant_id = ?',
      params: [tenantId]
    };
  }

  // Staff see organization-shared + their own
  if (userRole === 'staff') {
    return {
      where: 'tenant_id = ? AND (created_by = ? OR is_private = FALSE)',
      params: [tenantId, userId]
    };
  }

  // Regular users see only their own
  return {
    where: 'tenant_id = ? AND created_by = ?',
    params: [tenantId, userId]
  };
}

/**
 * Get user privacy settings
 */
async function getUserPrivacySettings(userId, tenantId) {
  const [settings] = await pool.execute(
    'SELECT * FROM user_privacy_settings WHERE user_id = ? AND tenant_id = ?',
    [userId, tenantId]
  );

  if (settings.length > 0) {
    return settings[0];
  }

  // Return default settings if none exist
  return {
    share_pledges_with_org: false,
    share_analytics_with_org: false,
    allow_staff_view: true
  };
}

/**
 * Update user privacy settings
 */
async function updateUserPrivacySettings(userId, tenantId, settings) {
  const allowedFields = ['share_pledges_with_org', 'share_analytics_with_org', 'allow_staff_view'];
  const updates = [];
  const values = [];

  for (const [key, value] of Object.entries(settings)) {
    if (allowedFields.includes(key)) {
      updates.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (updates.length === 0) {
    return { success: false, error: 'No valid fields to update' };
  }

  values.push(userId, tenantId);

  await pool.execute(
    `INSERT INTO user_privacy_settings (user_id, tenant_id, ${allowedFields.join(', ')})
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE ${updates.join(', ')}`,
    [userId, tenantId, 
     settings.share_pledges_with_org ?? false,
     settings.share_analytics_with_org ?? false,
     settings.allow_staff_view ?? true,
     ...updates.map((_, i) => values[i])]
  );

  return { success: true };
}

/**
 * Grant explicit permission to view pledge
 */
async function grantPledgePermission(pledgeId, targetUserId, grantedBy, permissionType = 'viewer') {
  try {
    await pool.execute(
      `INSERT INTO pledge_view_permissions (pledge_id, user_id, granted_by, permission_type)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE permission_type = VALUES(permission_type), granted_by = VALUES(granted_by)`,
      [pledgeId, targetUserId, grantedBy, permissionType]
    );
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Revoke pledge permission
 */
async function revokePledgePermission(pledgeId, targetUserId) {
  await pool.execute(
    'DELETE FROM pledge_view_permissions WHERE pledge_id = ? AND user_id = ?',
    [pledgeId, targetUserId]
  );
  return { success: true };
}

module.exports = {
  canViewPledge,
  requirePledgeOwnership,
  requireCampaignOwnership,
  getUserPrivacyFilter,
  getUserPrivacySettings,
  updateUserPrivacySettings,
  grantPledgePermission,
  revokePledgePermission
};
