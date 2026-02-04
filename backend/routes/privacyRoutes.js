/**
 * Privacy Routes - User privacy settings and permissions management
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const { extractTenant } = require('../middleware/tenantMiddleware');
const privacyMiddleware = require('../middleware/privacyMiddleware');

/**
 * GET /api/privacy/settings
 * Get current user's privacy settings
 */
router.get('/settings', authenticateToken, extractTenant, async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id || req.user.tenant_id;

    const settings = await privacyMiddleware.getUserPrivacySettings(userId, tenantId);
    
    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error fetching privacy settings:', error);
    res.status(500).json({ error: 'Failed to fetch privacy settings' });
  }
});

/**
 * PUT /api/privacy/settings
 * Update user's privacy settings
 */
router.put('/settings', authenticateToken, extractTenant, async (req, res) => {
  try {
    const userId = req.user.id;
    const tenantId = req.tenant?.id || req.user.tenant_id;
    const { share_pledges_with_org, share_analytics_with_org, allow_staff_view } = req.body;

    const settings = {};
    if (share_pledges_with_org !== undefined) settings.share_pledges_with_org = share_pledges_with_org;
    if (share_analytics_with_org !== undefined) settings.share_analytics_with_org = share_analytics_with_org;
    if (allow_staff_view !== undefined) settings.allow_staff_view = allow_staff_view;

    const result = await privacyMiddleware.updateUserPrivacySettings(userId, tenantId, settings);
    
    if (result.success) {
      const updatedSettings = await privacyMiddleware.getUserPrivacySettings(userId, tenantId);
      res.json({
        success: true,
        message: 'Privacy settings updated',
        settings: updatedSettings
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    res.status(500).json({ error: 'Failed to update privacy settings' });
  }
});

/**
 * POST /api/privacy/pledge/:pledgeId/share
 * Share a pledge with another user
 * Body: { user_id, permission_type: 'viewer' | 'editor' }
 */
router.post('/pledge/:pledgeId/share', authenticateToken, extractTenant, async (req, res) => {
  try {
    const pledgeId = parseInt(req.params.pledgeId);
    const { user_id, permission_type = 'viewer' } = req.body;
    const grantedBy = req.user.id;
    const tenantId = req.tenant?.id || req.user.tenant_id;

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // Verify the user owns the pledge
    const canView = await privacyMiddleware.canViewPledge(grantedBy, pledgeId, req.user.role, tenantId);
    if (!canView.allowed) {
      return res.status(403).json({ error: 'You do not have permission to share this pledge' });
    }

    // Grant permission
    const result = await privacyMiddleware.grantPledgePermission(pledgeId, user_id, grantedBy, permission_type);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Pledge shared successfully'
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error sharing pledge:', error);
    res.status(500).json({ error: 'Failed to share pledge' });
  }
});

/**
 * DELETE /api/privacy/pledge/:pledgeId/share/:userId
 * Revoke pledge sharing permission
 */
router.delete('/pledge/:pledgeId/share/:userId', authenticateToken, extractTenant, async (req, res) => {
  try {
    const pledgeId = parseInt(req.params.pledgeId);
    const targetUserId = parseInt(req.params.userId);
    const currentUserId = req.user.id;
    const tenantId = req.tenant?.id || req.user.tenant_id;

    // Verify the user owns the pledge
    const canView = await privacyMiddleware.canViewPledge(currentUserId, pledgeId, req.user.role, tenantId);
    if (!canView.allowed) {
      return res.status(403).json({ error: 'You do not have permission to manage this pledge' });
    }

    // Revoke permission
    const result = await privacyMiddleware.revokePledgePermission(pledgeId, targetUserId);
    
    res.json({
      success: true,
      message: 'Pledge sharing revoked'
    });
  } catch (error) {
    console.error('Error revoking pledge permission:', error);
    res.status(500).json({ error: 'Failed to revoke permission' });
  }
});

/**
 * GET /api/privacy/pledge/:pledgeId/permissions
 * Get all users who have access to a pledge
 */
router.get('/pledge/:pledgeId/permissions', authenticateToken, extractTenant, async (req, res) => {
  try {
    const pledgeId = parseInt(req.params.pledgeId);
    const currentUserId = req.user.id;
    const tenantId = req.tenant?.id || req.user.tenant_id;

    // Verify the user owns the pledge
    const canView = await privacyMiddleware.canViewPledge(currentUserId, pledgeId, req.user.role, tenantId);
    if (!canView.allowed) {
      return res.status(403).json({ error: 'You do not have permission to view this pledge' });
    }

    // Get permissions
    const { pool } = require('../config/db');
    const [permissions] = await pool.execute(`
      SELECT 
        pvp.user_id,
        pvp.permission_type,
        pvp.created_at,
        u.name as user_name,
        u.email as user_email
      FROM pledge_view_permissions pvp
      JOIN users u ON pvp.user_id = u.id
      WHERE pvp.pledge_id = ?
    `, [pledgeId]);

    res.json({
      success: true,
      permissions
    });
  } catch (error) {
    console.error('Error fetching pledge permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

module.exports = router;
