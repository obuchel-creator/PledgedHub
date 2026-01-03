const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const crypto = require('crypto');

/**
 * Advanced Security Service
 * 
 * Features:
 * - DDoS Protection (rate limiting)
 * - SQL Injection Prevention
 * - XSS Protection
 * - CSRF Token Management
 * - IP Blocking/Whitelist
 * - Intrusion Detection
 * - Security Monitoring
 * - Automatic Threat Response
 */

// Development mode detection
const isDevelopment = process.env.NODE_ENV === 'development' || 
                      process.env.NODE_ENV === 'test' ||
                      process.env.DISABLE_RATE_LIMIT === 'true';

if (isDevelopment) {
    console.log('⚠️  [SECURITY] Running in DEVELOPMENT mode - lenient security settings enabled');
}

// In-memory storage for security tracking (use Redis in production)
const securityStore = {
    blockedIPs: new Set(),
    suspiciousActivity: new Map(),
    failedLogins: new Map(),
    csrfTokens: new Map()
};

/**
 * Rate limiting configuration
 * Prevents brute force attacks and DDoS
 */
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
    // In development mode, use much higher limits
    const devMax = isDevelopment ? max * 10 : max;
    
    return rateLimit({
        windowMs, // Time window in milliseconds
        max: devMax, // Max requests per window (10x in development)
        message: {
            error: 'Too many requests from this IP, please try again later.',
            retryAfter: Math.ceil(windowMs / 1000 / 60) + ' minutes'
        },
        standardHeaders: true,
        legacyHeaders: false,
        skip: (req) => {
            // Skip rate limiting entirely if DISABLE_RATE_LIMIT is true
            return process.env.DISABLE_RATE_LIMIT === 'true';
        },
        handler: (req, res) => {
            const ip = req.ip || req.connection.remoteAddress;
            logSuspiciousActivity(ip, 'RATE_LIMIT_EXCEEDED', req);
            
            res.status(429).json({
                error: 'Too many requests',
                message: 'You have exceeded the rate limit. Please try again later.',
                retryAfter: req.rateLimit.resetTime
            });
        }
    });
};

// Different rate limits for different endpoints
const rateLimiters = {
    // Strict limit for authentication (lenient in dev: 50 vs 5)
    auth: createRateLimiter(15 * 60 * 1000, isDevelopment ? 50 : 5),
    
    // Moderate limit for API calls
    api: createRateLimiter(15 * 60 * 1000, 100), // 100 requests per 15 minutes
    
    // Very strict for payment endpoints
    payment: createRateLimiter(60 * 60 * 1000, 10), // 10 requests per hour
    
    // Lenient for public endpoints
    public: createRateLimiter(15 * 60 * 1000, 200) // 200 requests per 15 minutes
};

/**
 * Helmet configuration for HTTP headers security
 */
const helmetConfig = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'", 'http://localhost:*', 'https://api.mtn.com', 'https://api.airtel.com']
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    noSniff: true,
    xssFilter: true
});

/**
 * SQL Injection Prevention Middleware
 * Validates and sanitizes database queries
 */
function preventSQLInjection(req, res, next) {
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(--|\#|\/\*|\*\/|;)/g,
        /(OR|AND)\s+\d+\s*=\s*\d+/gi,
        /'(''|[^'])*'/g
    ];
    
    const checkForSQL = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                for (let pattern of sqlPatterns) {
                    if (pattern.test(obj[key])) {
                        return true;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkForSQL(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };
    
    if (checkForSQL(req.body) || checkForSQL(req.query) || checkForSQL(req.params)) {
        const ip = req.ip || req.connection.remoteAddress;
        logSuspiciousActivity(ip, 'SQL_INJECTION_ATTEMPT', req);
        
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Potential SQL injection detected. Request blocked.'
        });
    }
    
    next();
}

/**
 * XSS Protection Middleware
 * Prevents cross-site scripting attacks
 */
function preventXSS(req, res, next) {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi,
        /<img[^>]+src[^>]*>/gi
    ];
    
    const checkForXSS = (obj) => {
        for (let key in obj) {
            if (typeof obj[key] === 'string') {
                for (let pattern of xssPatterns) {
                    if (pattern.test(obj[key])) {
                        return true;
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (checkForXSS(obj[key])) {
                    return true;
                }
            }
        }
        return false;
    };
    
    if (checkForXSS(req.body) || checkForXSS(req.query)) {
        const ip = req.ip || req.connection.remoteAddress;
        logSuspiciousActivity(ip, 'XSS_ATTEMPT', req);
        
        return res.status(403).json({
            error: 'Forbidden',
            message: 'Potential XSS attack detected. Request blocked.'
        });
    }
    
    next();
}

/**
 * CSRF Token Generation and Validation
 */
function generateCSRFToken(req) {
    const token = crypto.randomBytes(32).toString('hex');
    const sessionId = req.sessionID || req.ip;
    
    securityStore.csrfTokens.set(sessionId, {
        token,
        createdAt: Date.now(),
        expiresAt: Date.now() + (60 * 60 * 1000) // 1 hour
    });
    
    return token;
}

function validateCSRFToken(req, res, next) {
    // Skip CSRF for GET requests and public endpoints
    if (req.method === 'GET' || req.path.startsWith('/api/public')) {
        return next();
    }
    
    const sessionId = req.sessionID || req.ip;
    const tokenFromHeader = req.headers['x-csrf-token'];
    const tokenFromBody = req.body?._csrf;
    const providedToken = tokenFromHeader || tokenFromBody;
    
    const storedTokenData = securityStore.csrfTokens.get(sessionId);
    
    if (!storedTokenData) {
        return res.status(403).json({
            error: 'CSRF token missing',
            message: 'Please refresh the page and try again.'
        });
    }
    
    if (storedTokenData.expiresAt < Date.now()) {
        securityStore.csrfTokens.delete(sessionId);
        return res.status(403).json({
            error: 'CSRF token expired',
            message: 'Your session has expired. Please refresh the page.'
        });
    }
    
    if (storedTokenData.token !== providedToken) {
        const ip = req.ip || req.connection.remoteAddress;
        logSuspiciousActivity(ip, 'CSRF_TOKEN_MISMATCH', req);
        
        return res.status(403).json({
            error: 'Invalid CSRF token',
            message: 'Security validation failed. Please try again.'
        });
    }
    
    next();
}

/**
 * IP Blocking Middleware
 */
function checkBlockedIP(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Skip IP blocking in development mode
    if (isDevelopment) {
        return next();
    }
    
    if (securityStore.blockedIPs.has(ip)) {
        console.log(`[SECURITY] Blocked IP attempted access: ${ip}`);
        return res.status(403).json({
            error: 'Access Denied',
            message: 'Your IP address has been blocked due to suspicious activity.'
        });
    }
    
    next();
}

/**
 * Block an IP address
 */
function blockIP(ip, reason = 'Suspicious activity') {
    // Don't block IPs in development mode
    if (isDevelopment) {
        console.log(`[SECURITY] Would block IP in production: ${ip} - Reason: ${reason}`);
        return;
    }
    
    securityStore.blockedIPs.add(ip);
    console.log(`[SECURITY] IP blocked: ${ip} - Reason: ${reason}`);
    
    // Auto-unblock after 24 hours
    setTimeout(() => {
        securityStore.blockedIPs.delete(ip);
        console.log(`[SECURITY] IP unblocked: ${ip}`);
    }, 24 * 60 * 60 * 1000);
}

/**
 * Unblock an IP address (manual)
 */
function unblockIP(ip) {
    if (securityStore.blockedIPs.has(ip)) {
        securityStore.blockedIPs.delete(ip);
        console.log(`[SECURITY] IP manually unblocked: ${ip}`);
        return true;
    }
    return false;
}

/**
 * Check if an IP is blocked
 */
function isIPBlocked(ip) {
    return securityStore.blockedIPs.has(ip);
}

/**
 * Log suspicious activity
 */
function logSuspiciousActivity(ip, type, req) {
    const activity = {
        ip,
        type,
        timestamp: new Date(),
        path: req.path,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query
    };
    
    console.log(`[SECURITY ALERT] ${type} detected from IP: ${ip}`);
    
    // Track frequency of suspicious activities
    const activities = securityStore.suspiciousActivity.get(ip) || [];
    activities.push(activity);
    securityStore.suspiciousActivity.set(ip, activities);
    
    // Auto-block after 5 suspicious activities within 1 hour
    const recentActivities = activities.filter(
        a => Date.now() - a.timestamp.getTime() < 60 * 60 * 1000
    );
    
    if (recentActivities.length >= 5) {
        blockIP(ip, `Multiple security violations (${type})`);
    }
}

/**
 * Failed login tracking
 */
function trackFailedLogin(identifier) {
    const attempts = securityStore.failedLogins.get(identifier) || 0;
    securityStore.failedLogins.set(identifier, attempts + 1);
    
    // In development, use higher threshold (20 vs 5)
    const threshold = isDevelopment ? 20 : 5;
    
    // Lock account after threshold failed attempts
    if (attempts + 1 >= threshold) {
        console.log(`[SECURITY] Account locked due to failed logins: ${identifier}`);
        return true; // Account should be locked
    }
    
    // Reset after 15 minutes
    setTimeout(() => {
        securityStore.failedLogins.delete(identifier);
    }, 15 * 60 * 1000);
    
    return false;
}

/**
 * Reset failed login counter (on successful login)
 */
function resetFailedLogins(identifier) {
    securityStore.failedLogins.delete(identifier);
}

/**
 * Intrusion Detection System
 * Monitors for patterns of malicious behavior
 */
function intrusionDetection(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    
    // Check for common attack patterns
    const suspiciousPatterns = [
        // Path traversal
        /\.\.\//g,
        // Command injection
        /;|\||&|`|\$\(/g,
        // File inclusion
        /\bfile:\/\//gi,
        // LDAP injection
        /\(\|\(/g
    ];
    
    const fullUrl = req.originalUrl || req.url;
    const userAgent = req.headers['user-agent'] || '';
    
    // Check URL for suspicious patterns
    for (let pattern of suspiciousPatterns) {
        if (pattern.test(fullUrl)) {
            logSuspiciousActivity(ip, 'INTRUSION_ATTEMPT', req);
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Suspicious request pattern detected.'
            });
        }
    }
    
    // Check for bot/scanner user agents
    const botPatterns = [
        /sqlmap/i, /nikto/i, /nmap/i, /masscan/i,
        /acunetix/i, /burpsuite/i, /metasploit/i
    ];
    
    for (let pattern of botPatterns) {
        if (pattern.test(userAgent)) {
            logSuspiciousActivity(ip, 'SECURITY_SCANNER_DETECTED', req);
            blockIP(ip, 'Security scanner detected');
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Access denied.'
            });
        }
    }
    
    next();
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
    // Remove fingerprinting headers
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    next();
}

/**
 * Get security statistics
 */
function getSecurityStats() {
    return {
        blockedIPs: Array.from(securityStore.blockedIPs),
        suspiciousActivities: securityStore.suspiciousActivity.size,
        failedLoginAttempts: securityStore.failedLogins.size,
        activeCSRFTokens: securityStore.csrfTokens.size
    };
}

/**
 * Clear old CSRF tokens (run periodically)
 */
function cleanupCSRFTokens() {
    const now = Date.now();
    for (let [sessionId, tokenData] of securityStore.csrfTokens.entries()) {
        if (tokenData.expiresAt < now) {
            securityStore.csrfTokens.delete(sessionId);
        }
    }
}

// Cleanup every 10 minutes
setInterval(cleanupCSRFTokens, 10 * 60 * 1000);

module.exports = {
    rateLimiters,
    helmetConfig,
    preventSQLInjection,
    preventXSS,
    generateCSRFToken,
    validateCSRFToken,
    checkBlockedIP,
    blockIP,
    unblockIP,
    isIPBlocked,
    logSuspiciousActivity,
    trackFailedLogin,
    resetFailedLogins,
    intrusionDetection,
    securityHeaders,
    getSecurityStats,
    xssClean: xss(),
    mongoSanitize: mongoSanitize(),
    hpp: hpp(),
    securityStore // Export for testing/debugging
};
