// Production authentication middleware with enhanced security & RBAC
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Removed isSessionActive import - session checking disabled for development

require('dotenv').config();

// Test mode flag (set to false for production)
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_MODE === 'true';
const DEFAULT_TEST_USER = { _id: 'test-user-id', role: 'super_admin' };

/**
 * RBAC Permissions Matrix
 * Maps roles to allowed permissions
 */
const PERMISSIONS = {
  donor: [
    'view_own_pledges',
    'create_pledge',
    'view_own_payments',
    'view_own_profile'
  ],
  creator: [
    'view_own_pledges',
    'create_pledge',
    'create_campaign',
    'view_own_campaigns',
    'view_own_earnings',
    'request_payout',
    'view_own_payments'
  ],
  support_staff: [
    'view_disputes',
    'verify_pledges',
    'issue_small_refunds',
    'view_user_profiles',
    'create_support_ticket'
  ],
  finance_admin: [
    'approve_payouts',
    'view_all_transactions',
    'audit_commissions',
    'generate_financial_reports',
    'view_ledger',
    'export_financial_data'
  ],
  super_admin: [
    'manage_users',
    'manage_roles',
    'system_configuration',
    'view_system_logs',
    'all_permissions'
  ]
};

/**
 * Log role audit events for compliance
 */
async function auditRoleAccess(userId, action, details = {}) {
  try {
    // Log to role_audit_log table
    const { pool } = require('../config/db');
    const detailStr = details ? JSON.stringify(details) : '';
    await pool.execute(
      'INSERT INTO role_audit_log (user_id, action, details, timestamp) VALUES (?, ?, ?, ?)',
      [userId, action, detailStr, new Date()]
    );
    console.log(`🔐 [AUDIT] User ${userId} - ${action}`, details);
  } catch (err) {
    console.error('⚠️ [AUDIT] Failed to log role access:', err.message);
  }
}

async function protect(req, res, next) {
  try {
    // Test mode: bypass authentication
    if (TEST_MODE) {
      req.user = req.user || DEFAULT_TEST_USER;
      return next();
    }

    // Security: Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log(`[SECURITY] Missing or invalid authorization header from IP: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required. Please provide a valid token.' 
      });
    }

    const token = authHeader.substring(7);

    // Security: Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.log(`[SECURITY] Expired token from IP: ${req.ip}`);
        return res.status(401).json({ 
          success: false, 
          message: 'Token expired. Please login again.' 
        });
      }
      console.log(`[SECURITY] Invalid token from IP: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token. Please login again.' 
      });
    }

    // NOTE: Session checking disabled for development
    // In production, uncomment this to check if session is still active
    /*
    if (decoded.jti && !isSessionActive(decoded.jti)) {
      console.log(`[SECURITY] Inactive session token used from IP: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Session expired. Please login again.' 
      });
    }
    */

    // Security: Fetch user from database
    const user = await User.getById(decoded.id);
    if (!user) {
      console.log(`[SECURITY] Token with non-existent user ID from IP: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found. Please login again.' 
      });
    }

    // Attach user to request (remove password fields)
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name || user.username,
      role: user.role || 'donor'
    };
    next();
  } catch (err) {
    console.error('[SECURITY ERROR] Auth middleware error:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error.' 
    });
  }
}

// Removed old exports - using new exports at bottom of file

/**
 * Verify JWT token and attach user to request with role
 * Simpler version for direct token authentication
 */
async function authenticateToken(req, res, next) {
    try {
        // Test mode: bypass authentication
        if (TEST_MODE) {
            req.user = req.user || DEFAULT_TEST_USER;
            return next();
        }

        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            console.log('❌ [AUTH] No token provided');
            return res.status(401).json({ 
                success: false, 
                error: 'Access denied. No token provided.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ [AUTH] Token verified for user ID:', decoded.id);
        
        // Get user from database using correct method
        const user = await User.getById(decoded.id);
        
        if (!user) {
            console.log('❌ [AUTH] User not found for ID:', decoded.id);
            return res.status(401).json({ 
                success: false, 
                error: 'Invalid token. User not found.' 
            });
        }

        console.log('✅ [AUTH] User loaded:', user.email, 'Role:', user.role || user.user_role);

        // Attach user to request (handle both role and user_role columns)
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name || user.username,
            role: user.role || user.user_role || 'donor'
        };

        next();
    } catch (error) {
        console.error('❌ [AUTH] Token verification failed:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                error: 'Token expired. Please login again.' 
            });
        }
        
        return res.status(403).json({ 
            success: false, 
            error: 'Invalid token.' 
        });
    }
}

/**
 * New RBAC Middleware: Require specific role(s)
 * Supports single role string or array of allowed roles
 * 
 * Usage:
 *   router.post('/payouts/approve', requireRole('finance_admin'), approvePayouts);
 *   router.post('/campaigns', requireRole(['creator', 'super_admin']), createCampaign);
 */
function requireRole(roleOrRoles) {
    const allowedRoles = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
    
    return (req, res, next) => {
        if (!req.user) {
            console.log(`🚫 [RBAC] No user authenticated for role check`);
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required.' 
            });
        }

        const userRole = req.user.role || 'donor';
        
        // Check if user's role is in allowed list
        if (!allowedRoles.includes(userRole)) {
            console.log(`🚫 [RBAC] Access DENIED: User ${req.user.id} (${userRole}) tried to access ${req.path}`);
            auditRoleAccess(req.user.id, 'unauthorized_access_attempt', {
                path: req.path,
                userRole,
                requiredRoles: allowedRoles
            });
            
            return res.status(403).json({ 
                success: false, 
                message: `This action requires one of: ${allowedRoles.join(', ')}`,
                currentRole: userRole
            });
        }

        console.log(`✅ [RBAC] Access GRANTED: User ${req.user.id} (${userRole}) accessing ${req.path}`);
        auditRoleAccess(req.user.id, 'authorized_access', {
            path: req.path,
            role: userRole
        });
        
        next();
    };
}

/**
 * Check if user has specific permission (for granular control)
 * Returns boolean - use in route handlers for conditional logic
 */
function hasPermission(userRole, permission) {
    if (!PERMISSIONS[userRole]) return false;
    if (userRole === 'super_admin') return true; // Super admin has all permissions
    return PERMISSIONS[userRole].includes(permission);
}

/**
 * Require specific permission (granular RBAC)
 * Checks permission array instead of just role
 */
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required.' 
            });
        }

        const userRole = req.user.role || 'donor';
        
        if (!hasPermission(userRole, permission)) {
            console.log(`🚫 [RBAC] User ${req.user.id} lacks permission: ${permission}`);
            
            return res.status(403).json({ 
                success: false, 
                message: `Permission denied: ${permission}`,
                currentRole: userRole
            });
        }

        console.log(`✅ [RBAC] User ${req.user.id} granted permission: ${permission}`);
        next();
    };
}

/**
 * LEGACY: Require staff or admin role (backward compatible)
 * Maps to new role hierarchy for existing code
 */
function requireStaff(req, res, next) {
    // Support both old role names (staff, admin, superadmin) and new RBAC names
    return requireRole(['staff', 'admin', 'superadmin', 'support_staff', 'finance_admin', 'super_admin'])(req, res, next);
}

/**
 * LEGACY: Require admin role (backward compatible)
 * Maps to new super_admin role and supports old admin/superadmin role names
 */
function requireAdmin(req, res, next) {
    return requireRole(['admin', 'superadmin', 'super_admin'])(req, res, next);
}

/**
 * Optional authentication - attaches user if token valid, continues otherwise
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.getById(decoded.id);
            
            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name || user.username,
                    role: user.role || user.user_role || 'donor'
                };
                console.log('✅ [AUTH] Optional auth: User attached:', user.email);
            }
        }
    } catch (error) {
        // Silently fail - this is optional auth
        console.log('ℹ️ [AUTH] Optional auth: Token invalid or missing');
    }
    
    next();
}

module.exports = {
    authenticateToken,
    requireRole,
    requirePermission,
    requireAdmin,
    requireStaff,
    optionalAuth,
    PERMISSIONS,
    hasPermission,
    auditRoleAccess
};
