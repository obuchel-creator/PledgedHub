/**
 * Tenant Middleware
 * 
 * Extracts tenant context from subdomain, custom domain, or header
 * and validates tenant status before allowing access.
 */

const { pool } = require('../config/db');

// Cache tenant data to reduce DB queries (in-memory cache, use Redis in production)
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Extract tenant from request
 * Methods (priority order):
 * 1. X-Tenant-ID header (for mobile apps, testing)
 * 2. Subdomain (tenant.pledgehub.com)
 * 3. Custom domain (customdomain.com)
 */
async function extractTenant(req, res, next) {
  try {
    let tenantIdentifier = null;
    let identifierType = null;

    // Method 1: Header-based (highest priority, for API clients)
    const tenantIdHeader = req.headers['x-tenant-id'];
    if (tenantIdHeader) {
      tenantIdentifier = tenantIdHeader;
      identifierType = 'id';
    } else {
      // Method 2: Subdomain-based
      const hostname = req.hostname || req.get('host')?.split(':')[0];
      
      if (!hostname) {
        return res.status(400).json({ 
          error: 'Unable to determine tenant',
          details: 'No hostname or tenant ID provided'
        });
      }

      const parts = hostname.split('.');
      
      // Check for subdomain (e.g., acme.pledgehub.com or acme.localhost)
      if (parts.length >= 2 && parts[0] !== 'www' && parts[0] !== 'api' && parts[0] !== 'admin') {
        tenantIdentifier = parts[0];
        identifierType = 'subdomain';
      } else {
        // Method 3: Custom domain (e.g., customdomain.com)
        tenantIdentifier = hostname;
        identifierType = 'custom_domain';
      }
    }

    // Check cache first
    const cacheKey = `${identifierType}:${tenantIdentifier}`;
    const cachedTenant = tenantCache.get(cacheKey);
    
    if (cachedTenant && Date.now() - cachedTenant.cachedAt < CACHE_TTL) {
      req.tenant = cachedTenant.data;
      return next();
    }

    // Fetch tenant from database
    let query, params;
    if (identifierType === 'id') {
      query = 'SELECT * FROM tenants WHERE id = ?';
      params = [tenantIdentifier];
    } else if (identifierType === 'subdomain') {
      query = 'SELECT * FROM tenants WHERE subdomain = ?';
      params = [tenantIdentifier];
    } else {
      query = 'SELECT * FROM tenants WHERE custom_domain = ?';
      params = [tenantIdentifier];
    }

    const [tenants] = await pool.execute(query, params);

    if (!tenants || tenants.length === 0) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        details: `No tenant found for ${identifierType}: ${tenantIdentifier}`,
        hint: 'Check subdomain spelling or contact support'
      });
    }

    const tenant = tenants[0];

    // Validate tenant status
    if (tenant.status === 'suspended') {
      return res.status(403).json({ 
        error: 'Account suspended',
        details: 'This account has been suspended. Please contact billing.',
        contact: 'support@pledgehub.com'
      });
    }

    if (tenant.status === 'cancelled') {
      return res.status(403).json({ 
        error: 'Account cancelled',
        details: 'This account has been cancelled. Contact support to reactivate.',
        contact: 'support@pledgehub.com'
      });
    }

    // Check trial expiration
    if (tenant.status === 'trial' && tenant.trial_ends_at) {
      const trialEndsAt = new Date(tenant.trial_ends_at);
      if (trialEndsAt < new Date()) {
        return res.status(403).json({ 
          error: 'Trial expired',
          details: 'Your free trial has expired. Please upgrade to continue.',
          upgradeUrl: '/billing/upgrade'
        });
      }
    }

    // Parse settings JSON if present
    if (tenant.settings && typeof tenant.settings === 'string') {
      try {
        tenant.settings = JSON.parse(tenant.settings);
      } catch (e) {
        tenant.settings = {};
      }
    }

    // Cache tenant data
    tenantCache.set(cacheKey, {
      data: tenant,
      cachedAt: Date.now()
    });

    // Attach tenant to request
    req.tenant = tenant;
    
    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ 
      error: 'Failed to load tenant context',
      details: error.message 
    });
  }
}

/**
 * Optional tenant middleware - doesn't fail if tenant not found
 * Useful for public endpoints that work with or without tenant context
 */
async function optionalTenant(req, res, next) {
  try {
    await extractTenant(req, res, next);
  } catch (error) {
    // Continue without tenant context
    req.tenant = null;
    next();
  }
}

/**
 * Require tenant admin role
 * Must be used AFTER authenticateToken and extractTenant
 */
function requireTenantAdmin(req, res, next) {
  if (!req.user || !req.tenant) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'admin' || req.user.tenant_id !== req.tenant.id) {
    return res.status(403).json({ 
      error: 'Forbidden',
      details: 'Tenant admin access required'
    });
  }

  next();
}

/**
 * Validate that user belongs to the request tenant
 * Must be used AFTER authenticateToken and extractTenant
 */
function validateTenantAccess(req, res, next) {
  if (!req.user || !req.tenant) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.tenant_id !== req.tenant.id) {
    return res.status(403).json({ 
      error: 'Access denied',
      details: 'You do not have access to this tenant'
    });
  }

  next();
}

/**
 * Clear tenant cache (call after tenant updates)
 */
function clearTenantCache(tenantId = null) {
  if (tenantId) {
    // Clear specific tenant from all cache keys
    for (const [key, value] of tenantCache.entries()) {
      if (value.data.id === tenantId) {
        tenantCache.delete(key);
      }
    }
  } else {
    // Clear entire cache
    tenantCache.clear();
  }
}

/**
 * Super admin middleware - for platform-wide admin access
 * Checks for a special super_admin flag in user table
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user || !req.user.super_admin) {
    return res.status(403).json({ 
      error: 'Forbidden',
      details: 'Super admin access required'
    });
  }
  next();
}

module.exports = {
  extractTenant,
  optionalTenant,
  requireTenantAdmin,
  validateTenantAccess,
  clearTenantCache,
  requireSuperAdmin
};
