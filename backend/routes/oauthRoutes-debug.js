// OAuth Route Testing with proper error handling
const express = require('express');
const passport = require('../config/passport');

const router = express.Router();

// Test route to check if OAuth is working
router.get('/test', (req, res) => {
    res.json({ 
        message: 'OAuth routes are working',
        timestamp: new Date().toISOString()
    });
});

// Google OAuth routes with error handling
router.get('/google', (req, res, next) => {
    console.log('🔵 Google OAuth route hit');
    
    // Check if Google strategy is loaded
    if (!passport._strategy('google')) {
        console.log('❌ Google strategy not found');
        return res.status(503).json({ 
            error: 'Google OAuth not configured',
            message: 'Google Sign-In is temporarily unavailable. Please check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
        });
    }
    
    console.log('✅ Google strategy found, redirecting to Google...');
    passport.authenticate('google', { 
        scope: ['profile', 'email'],
        session: false 
    })(req, res, next);
});

// Facebook OAuth routes with error handling  
router.get('/facebook', (req, res, next) => {
    console.log('🔵 Facebook OAuth route hit');
    
    // Check if Facebook strategy is loaded
    if (!passport._strategy('facebook')) {
        console.log('❌ Facebook strategy not found');
        return res.status(503).json({ 
            error: 'Facebook OAuth not configured',
            message: 'Facebook Sign-In is temporarily unavailable. Please check FACEBOOK_APP_ID and FACEBOOK_APP_SECRET.'
        });
    }
    
    console.log('✅ Facebook strategy found, redirecting to Facebook...');
    passport.authenticate('facebook', { 
        scope: ['email'],
        session: false 
    })(req, res, next);
});

// Status endpoint
router.get('/status', (req, res) => {
    const googleConfigured = process.env.GOOGLE_CLIENT_ID && 
                              process.env.GOOGLE_CLIENT_SECRET &&
                              process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id_here.apps.googleusercontent.com';
    
    const facebookConfigured = process.env.FACEBOOK_APP_ID && 
                               process.env.FACEBOOK_APP_SECRET &&
                               process.env.FACEBOOK_APP_ID !== 'your_facebook_app_id_here';

    res.json({
        oauth: {
            google: {
                configured: googleConfigured,
                strategyLoaded: !!passport._strategy('google')
            },
            facebook: {
                configured: facebookConfigured,
                strategyLoaded: !!passport._strategy('facebook')
            }
        },
        timestamp: new Date().toISOString()
    });
});

module.exports = router;