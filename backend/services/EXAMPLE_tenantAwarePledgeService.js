/**
 * EXAMPLE: Updated Pledge Service for Multi-Tenant SaaS
 * 
 * This shows the pattern for updating existing services to support tenant isolation.
 * Copy this pattern to all other services (campaign, user, payment, feedback, etc.)
 */

const { pool } = require('../config/db');

/**
 * Get all pledges for a tenant
 * BEFORE: SELECT * FROM pledges WHERE deleted = 0
 * AFTER: SELECT * FROM pledges WHERE tenant_id = ? AND deleted = 0
 */
async function getAllPledges(tenantId, filters = {}) {
  try {
    let query = 'SELECT * FROM pledges WHERE tenant_id = ? AND deleted = 0';
    const params = [tenantId];

    // Add optional filters
    if (filters.campaign_id) {
      query += ' AND campaign_id = ?';
      params.push(filters.campaign_id);
    }

    if (filters.user_id) {
      query += ' AND user_id = ?';
      params.push(filters.user_id);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    const [pledges] = await pool.execute(query, params);
    return { success: true, data: pledges };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get pledge by ID (with tenant validation)
 * CRITICAL: Always include tenant_id check to prevent cross-tenant access
 */
async function getPledgeById(pledgeId, tenantId) {
  try {
    const [pledges] = await pool.execute(
      'SELECT * FROM pledges WHERE id = ? AND tenant_id = ? AND deleted = 0',
      [pledgeId, tenantId]
    );

    if (pledges.length === 0) {
      return { success: false, error: 'Pledge not found' };
    }

    return { success: true, data: pledges[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Create pledge (assign to tenant)
 */
async function createPledge(pledgeData, tenantId, userId) {
  try {
    const {
      donor_name,
      phone,
      email,
      amount,
      campaign_id,
      collection_date,
      notes
    } = pledgeData;

    // Validate campaign belongs to tenant
    const [campaigns] = await pool.execute(
      'SELECT id FROM campaigns WHERE id = ? AND tenant_id = ?',
      [campaign_id, tenantId]
    );

    if (campaigns.length === 0) {
      return { success: false, error: 'Campaign not found or access denied' };
    }

    const [result] = await pool.execute(
      `INSERT INTO pledges 
       (tenant_id, user_id, donor_name, phone, email, amount, campaign_id, 
        collection_date, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [tenantId, userId, donor_name, phone, email, amount, campaign_id, 
       collection_date, notes]
    );

    return {
      success: true,
      data: { id: result.insertId }
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Update pledge (with tenant validation)
 */
async function updatePledge(pledgeId, updates, tenantId) {
  try {
    // First verify pledge belongs to tenant
    const verifyResult = await getPledgeById(pledgeId, tenantId);
    if (!verifyResult.success) {
      return verifyResult;
    }

    const allowedFields = ['donor_name', 'phone', 'email', 'amount', 
                           'collection_date', 'notes', 'status'];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    values.push(pledgeId);
    values.push(tenantId);

    await pool.execute(
      `UPDATE pledges 
       SET ${updateFields.join(', ')}, updated_at = NOW() 
       WHERE id = ? AND tenant_id = ?`,
      values
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Delete pledge (soft delete with tenant validation)
 */
async function deletePledge(pledgeId, tenantId) {
  try {
    // Verify ownership
    const verifyResult = await getPledgeById(pledgeId, tenantId);
    if (!verifyResult.success) {
      return verifyResult;
    }

    await pool.execute(
      'UPDATE pledges SET deleted = 1, deleted_at = NOW() WHERE id = ? AND tenant_id = ?',
      [pledgeId, tenantId]
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get tenant statistics (useful for dashboard)
 */
async function getTenantPledgeStats(tenantId) {
  try {
    const [stats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_pledges,
        SUM(amount) as total_amount,
        SUM(amount_paid) as total_paid,
        SUM(amount - amount_paid) as outstanding,
        AVG(amount) as avg_pledge_amount
       FROM pledges 
       WHERE tenant_id = ? AND deleted = 0`,
      [tenantId]
    );

    return { success: true, data: stats[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Helper function to add tenant filter to any query
 * Use this to update complex queries incrementally
 */
function addTenantFilter(baseQuery, baseParams, tenantId) {
  // Add tenant_id to WHERE clause
  let query = baseQuery;
  const params = [tenantId, ...baseParams];
  
  if (query.includes('WHERE')) {
    query = query.replace('WHERE', 'WHERE tenant_id = ? AND');
  } else {
    query += ' WHERE tenant_id = ?';
  }
  
  return { query, params };
}

// ROUTE CONTROLLER EXAMPLE
// Update routes to extract tenantId from req.tenant or req.user

/**
 * Example route controller with tenant context
 */
async function handleGetPledges(req, res) {
  try {
    // Get tenant from middleware (set by extractTenant)
    const tenantId = req.tenant?.id || req.user?.tenant_id;
    
    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Tenant context required' 
      });
    }

    const filters = {
      campaign_id: req.query.campaign_id,
      user_id: req.query.user_id,
      status: req.query.status
    };

    const result = await getAllPledges(tenantId, filters);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ pledges: result.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAllPledges,
  getPledgeById,
  createPledge,
  updatePledge,
  deletePledge,
  getTenantPledgeStats,
  addTenantFilter,
  handleGetPledges  // Example controller
};

/**
 * CHECKLIST FOR UPDATING EACH SERVICE:
 * 
 * 1. ✅ Add tenant_id parameter to all functions
 * 2. ✅ Add tenant_id to WHERE clauses in all SELECT queries
 * 3. ✅ Add tenant_id to INSERT statements
 * 4. ✅ Verify tenant_id in UPDATE/DELETE operations
 * 5. ✅ Add tenant validation when referencing foreign keys
 * 6. ✅ Update route controllers to pass tenant_id from req.tenant or req.user
 * 7. ✅ Update integration tests to include tenant context
 * 8. ✅ Add tenant isolation tests (verify cross-tenant access is blocked)
 * 
 * SECURITY CRITICAL RULES:
 * - NEVER trust tenant_id from request body (use req.tenant.id or req.user.tenant_id)
 * - ALWAYS validate tenant_id in WHERE clauses for SELECT/UPDATE/DELETE
 * - NEVER allow queries without tenant_id filter (except super admin operations)
 * - TEST cross-tenant access attempts to verify they're blocked
 */
