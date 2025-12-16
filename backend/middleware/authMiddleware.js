// Production authentication middleware with enhanced security
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// Removed isSessionActive import - session checking disabled for development

require('dotenv').config();

// Test mode flag (set to false for production)
const TEST_MODE = process.env.NODE_ENV === 'test' || process.env.ENABLE_TEST_MODE === 'true';
const DEFAULT_TEST_USER = { _id: 'test-user-id', role: 'user' };

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

function requireRole(roleOrRoles) {
  const allowed = Array.isArray(roleOrRoles) ? roleOrRoles : [roleOrRoles];
  return (req, res, next) => {
    if (!req.user) {
      console.log(`[SECURITY] Unauthorized role check from IP: ${req.ip}`);
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required.' 
      });
    }
    if (!allowed.includes(req.user.role)) {
      console.log(`[SECURITY] Forbidden role access attempt by user ${req.user._id} from IP: ${req.ip}`);
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions.' 
      });
    }
    return next();
  };
}

// Removed old exports - using new exports at bottom of file

/**
 * Verify JWT token and attach user to request
 * Simpler version for direct token authentication
 */
async function authenticateToken(req, res, next) {
    try {
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
 * Require admin role
 */
function requireAdmin(req, res, next) {
    if (!req.user) {
        console.log('❌ [AUTH] requireAdmin: No user attached to request');
        return res.status(401).json({ 
            success: false, 
            error: 'Authentication required.' 
        });
    }

    const userRole = req.user.role || req.user.user_role;
    console.log('🔍 [AUTH] requireAdmin check - User role:', userRole);

    if (userRole !== 'admin') {
        console.log('❌ [AUTH] requireAdmin: Access denied for role:', userRole);
        return res.status(403).json({ 
            success: false, 
            error: 'Admin access required. You do not have permission to access this resource.' 
        });
    }

    console.log(`✅ [AUTH] requireAdmin: Access granted for ${req.user.email}`);
    next();
}

/**
 * Require staff or admin role
 */
function requireStaff(req, res, next) {
    if (!req.user) {
        console.log('❌ [AUTH] requireStaff: No user attached to request');
        return res.status(401).json({ 
            success: false, 
            error: 'Authentication required.' 
        });
    }

    const userRole = req.user.role || req.user.user_role;
    console.log('🔍 [AUTH] requireStaff check - User role:', userRole);

    if (userRole !== 'admin' && userRole !== 'staff') {
        console.log('❌ [AUTH] requireStaff: Access denied for role:', userRole);
        return res.status(403).json({ 
            success: false, 
            error: 'Staff access required. You do not have permission to access this resource.' 
        });
    }

    console.log(`✅ [AUTH] requireStaff: Access granted for ${req.user.email} (${userRole})`);
    next();
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

module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;
module.exports.requireStaff = requireStaff;
module.exports.optionalAuth = optionalAuth;
