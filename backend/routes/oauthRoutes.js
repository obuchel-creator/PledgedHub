const express = require('express');
const passport = require('../config/passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const router = express.Router();

// Active sessions tracking (same as authController)
const activeSessions = new Set();

function signToken(payload) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const jti = crypto.randomUUID();
    const token = jwt.sign({ ...payload, jti }, secret, { expiresIn });
    activeSessions.add(jti);
    return { token, jti };
}

function sanitizeUser(user) {
    const u = user && user.toObject ? user.toObject() : { ...user };
    if (u.password) delete u.password;
    if (u.password_hash) delete u.password_hash;
    if (u.passwordHash) delete u.passwordHash;
    if (u.__v) delete u.__v;
    return u;
}

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { 
    scope: ['profile', 'email'],
    session: false 
}));

router.get('/google/callback', 
    passport.authenticate('google', { 
        session: false,
        failureRedirect: '/login?error=google_auth_failed'
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const { token } = signToken({ id: req.user.id });
            
            // Redirect to frontend with token
            res.redirect(`http://localhost:5173/auth/callback?token=${token}&provider=google`);
        } catch (err) {
            console.error('[OAuth ERROR] Google callback error:', err);
            res.redirect('/login?error=auth_error');
        }
    }
);

// Facebook OAuth Routes
// OAuth Status endpoint
router.get('/status', (req, res) => {
    const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const facebookConfigured = !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
    
    res.json({
        success: true,
        data: {
            googleOAuth: googleConfigured,
            facebookOAuth: facebookConfigured,
            jwtConfigured: !!process.env.JWT_SECRET,
            availableProviders: [
                ...(googleConfigured ? ['google'] : []),
                ...(facebookConfigured ? ['facebook'] : [])
            ]
        }
    });
});

router.get('/facebook', passport.authenticate('facebook', { 
    scope: ['email'],
    session: false 
}));

router.get('/facebook/callback',
    passport.authenticate('facebook', { 
        session: false,
        failureRedirect: '/login?error=facebook_auth_failed'
    }),
    (req, res) => {
        try {
            // Generate JWT token
            const { token } = signToken({ id: req.user.id });
            
            // Redirect to frontend with token
            res.redirect(`http://localhost:5173/auth/callback?token=${token}&provider=facebook`);
        } catch (err) {
            console.error('[OAuth ERROR] Facebook callback error:', err);
            res.redirect('/login?error=auth_error');
        }
    }
);

module.exports = router;
