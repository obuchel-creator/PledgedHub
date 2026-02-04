/**
 * Tenant Management Service
 * 
 * Handles tenant creation, updates, and management operations
 */

const { pool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const { clearTenantCache } = require('../middleware/tenantMiddleware');

/**
 * Create a new tenant with admin user
 */
async function createTenant({ organizationName, subdomain, adminEmail, adminPassword, adminName, plan = 'free' }) {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    // Validate subdomain format
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return { 
        success: false, 
        error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' 
      };
    }

    // Reserved subdomains
    const reservedSubdomains = ['www', 'api', 'admin', 'app', 'dashboard', 'support', 'help', 'mail', 'smtp', 'ftp'];
    if (reservedSubdomains.includes(subdomain)) {
      return { success: false, error: 'This subdomain is reserved.' };
    }

    // Check subdomain availability
    const [existing] = await connection.execute(
      'SELECT id FROM tenants WHERE subdomain = ?',
      [subdomain]
    );

    if (existing.length > 0) {
      return { success: false, error: 'Subdomain already taken. Please choose another.' };
    }

    // Check if email already exists
    const [existingUser] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [adminEmail]
    );

    if (existingUser.length > 0) {
      await connection.rollback();
      return { success: false, error: 'Email already registered. Please use a different email.' };
    }

    // Create tenant
    const tenantId = uuidv4();
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    await connection.execute(
      `INSERT INTO tenants 
       (id, name, subdomain, plan, status, trial_ends_at, billing_email, settings, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        tenantId,
        organizationName,
        subdomain,
        plan,
        'trial',
        trialEndsAt,
        adminEmail,
        JSON.stringify({
          onboarding_completed: false,
          features: {
            sms_enabled: true,
            email_enabled: true,
            ai_enabled: true,
            mobile_money_enabled: true
          }
        })
      ]
    );

    // Create admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const [userResult] = await connection.execute(
      `INSERT INTO users 
       (tenant_id, name, username, email, password, role, created_at) 
       VALUES (?, ?, ?, ?, ?, 'admin', NOW())`,
      [tenantId, adminName, adminEmail.split('@')[0], adminEmail, hashedPassword]
    );

    const userId = userResult.insertId;

    // Initialize usage stats
    await connection.execute(
      `INSERT INTO usage_stats 
       (tenant_id, user_id, pledges_count, campaigns_count, sms_sent, emails_sent, ai_requests, month, year) 
       VALUES (?, ?, 0, 0, 0, 0, 0, MONTH(NOW()), YEAR(NOW()))`,
      [tenantId, userId]
    );

    await connection.commit();

    return {
      success: true,
      data: {
        tenantId,
        userId,
        subdomain,
        trialEndsAt
      }
    };
  } catch (error) {
    await connection.rollback();
    console.error('Create tenant error:', error);
    return { success: false, error: error.message };
  } finally {
    connection.release();
  }
}

/**
 * Get tenant by ID
 */
async function getTenantById(tenantId) {
  try {
    const [tenants] = await pool.execute(
      'SELECT * FROM tenants WHERE id = ?',
      [tenantId]
    );

    if (tenants.length === 0) {
      return { success: false, error: 'Tenant not found' };
    }

    const tenant = tenants[0];
    
    // Parse settings JSON
    if (tenant.settings && typeof tenant.settings === 'string') {
      tenant.settings = JSON.parse(tenant.settings);
    }

    return { success: true, data: tenant };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update tenant settings
 */
async function updateTenant(tenantId, updates) {
  try {
    const allowedFields = ['name', 'billing_email', 'settings', 'custom_domain'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(key === 'settings' ? JSON.stringify(value) : value);
      }
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    values.push(tenantId);

    await pool.execute(
      `UPDATE tenants SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Clear cache
    clearTenantCache(tenantId);

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Upgrade tenant plan
 */
async function upgradeTenantPlan(tenantId, newPlan, stripeSubscriptionId = null) {
  try {
    const updateData = {
      plan: newPlan,
      status: 'active',
      subscription_starts_at: new Date()
    };

    if (stripeSubscriptionId) {
      updateData.stripe_subscription_id = stripeSubscriptionId;
    }

    await pool.execute(
      `UPDATE tenants 
       SET plan = ?, status = ?, subscription_starts_at = ?, stripe_subscription_id = ?, updated_at = NOW() 
       WHERE id = ?`,
      [newPlan, 'active', updateData.subscription_starts_at, stripeSubscriptionId, tenantId]
    );

    // Clear cache
    clearTenantCache(tenantId);

    // Log audit trail
    await logTenantAction(tenantId, null, 'plan_upgraded', {
      old_plan: 'unknown',
      new_plan: newPlan
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Suspend tenant (for non-payment, etc.)
 */
async function suspendTenant(tenantId, reason) {
  try {
    await pool.execute(
      `UPDATE tenants SET status = 'suspended', updated_at = NOW() WHERE id = ?`,
      [tenantId]
    );

    clearTenantCache(tenantId);

    await logTenantAction(tenantId, null, 'tenant_suspended', { reason });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Reactivate tenant
 */
async function reactivateTenant(tenantId) {
  try {
    await pool.execute(
      `UPDATE tenants SET status = 'active', updated_at = NOW() WHERE id = ?`,
      [tenantId]
    );

    clearTenantCache(tenantId);

    await logTenantAction(tenantId, null, 'tenant_reactivated', {});

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tenant usage stats
 */
async function getTenantUsage(tenantId, month = null, year = null) {
  try {
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    const [stats] = await pool.execute(
      `SELECT 
        SUM(pledges_count) as total_pledges,
        SUM(campaigns_count) as total_campaigns,
        SUM(sms_sent) as total_sms,
        SUM(emails_sent) as total_emails,
        SUM(ai_requests) as total_ai_requests
       FROM usage_stats 
       WHERE tenant_id = ? AND month = ? AND year = ?`,
      [tenantId, currentMonth, currentYear]
    );

    return {
      success: true,
      data: stats[0] || {
        total_pledges: 0,
        total_campaigns: 0,
        total_sms: 0,
        total_emails: 0,
        total_ai_requests: 0
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get all users in tenant
 */
async function getTenantUsers(tenantId) {
  try {
    const [users] = await pool.execute(
      `SELECT id, name, username, email, phone, role, created_at 
       FROM users 
       WHERE tenant_id = ? 
       ORDER BY created_at DESC`,
      [tenantId]
    );

    return { success: true, data: users };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Log tenant action for audit trail
 */
async function logTenantAction(tenantId, userId, action, details = {}) {
  try {
    await pool.execute(
      `INSERT INTO tenant_audit_log 
       (tenant_id, user_id, action, new_values, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [tenantId, userId, action, JSON.stringify(details)]
    );
  } catch (error) {
    console.error('Failed to log tenant action:', error);
  }
}

/**
 * Check subdomain availability (for signup form validation)
 */
async function checkSubdomainAvailability(subdomain) {
  try {
    const [existing] = await pool.execute(
      'SELECT id FROM tenants WHERE subdomain = ?',
      [subdomain]
    );

    return {
      success: true,
      available: existing.length === 0
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tenant statistics (for admin dashboard)
 */
async function getTenantStats(tenantId) {
  try {
    // Get counts
    const [pledgeCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM pledges WHERE tenant_id = ? AND deleted = 0',
      [tenantId]
    );

    const [campaignCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM campaigns WHERE tenant_id = ?',
      [tenantId]
    );

    const [userCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = ?',
      [tenantId]
    );

    const [pledgeSum] = await pool.execute(
      'SELECT SUM(amount) as total FROM pledges WHERE tenant_id = ? AND deleted = 0',
      [tenantId]
    );

    const [paidSum] = await pool.execute(
      'SELECT SUM(amount_paid) as total FROM pledges WHERE tenant_id = ? AND deleted = 0',
      [tenantId]
    );

    return {
      success: true,
      data: {
        total_pledges: pledgeCount[0].count,
        total_campaigns: campaignCount[0].count,
        total_users: userCount[0].count,
        total_pledge_amount: pledgeSum[0].total || 0,
        total_paid_amount: paidSum[0].total || 0,
        outstanding_amount: (pledgeSum[0].total || 0) - (paidSum[0].total || 0)
      }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  createTenant,
  getTenantById,
  updateTenant,
  upgradeTenantPlan,
  suspendTenant,
  reactivateTenant,
  getTenantUsage,
  getTenantUsers,
  logTenantAction,
  checkSubdomainAvailability,
  getTenantStats
};
