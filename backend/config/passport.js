const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

// Try to use real User model, fallback to mock for testing
let User;
try {
    User = require('../models/User');
    console.log('✅ Using real User model with database');
} catch (err) {
    console.warn('⚠️  Database not available, using mock user service for OAuth testing');
    User = require('../services/mockUserService');
}

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.getById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5001/api/oauth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('[OAuth] Google authentication attempt:', profile.id);
            
            // Extract user info from Google profile
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const name = profile.displayName || '';
            
            if (!email) {
                return done(new Error('No email provided by Google'), null);
            }

            // Check if user already exists
            let user = await User.findOne({ email });
            
            if (user) {
                // User exists, update OAuth info if needed
                console.log('[OAuth] Existing user found:', user.id);
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                email,
                name,
                password: null, // OAuth users don't need password
                oauthProvider: 'google',
                oauthId: profile.id,
                emailVerified: true // Google emails are verified
            });

            console.log('[OAuth] New user created:', user.id);
            done(null, user);
        } catch (err) {
            console.error('[OAuth ERROR] Google strategy error:', err);
            done(err, null);
        }
    }));
} else {
    console.log('ℹ Google OAuth credentials not configured. Google Sign-In disabled.');
}

// Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: process.env.FACEBOOK_CALLBACK_URL || 'http://localhost:5001/api/oauth/facebook/callback',
        profileFields: ['id', 'displayName', 'emails', 'photos']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('[OAuth] Facebook authentication attempt:', profile.id);
            
            // Extract user info from Facebook profile
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const name = profile.displayName || '';
            
            if (!email) {
                return done(new Error('No email provided by Facebook'), null);
            }

            // Check if user already exists
            let user = await User.findOne({ email });
            
            if (user) {
                // User exists, update OAuth info if needed
                console.log('[OAuth] Existing user found:', user.id);
                return done(null, user);
            }

            // Create new user
            user = await User.create({
                email,
                name,
                password: null, // OAuth users don't need password
                oauthProvider: 'facebook',
                oauthId: profile.id,
                emailVerified: true // Facebook emails are verified
            });

            console.log('[OAuth] New user created:', user.id);
            done(null, user);
        } catch (err) {
            console.error('[OAuth ERROR] Facebook strategy error:', err);
            done(err, null);
        }
    }));
} else {
    console.log('ℹ Facebook OAuth credentials not configured. Facebook Sign-In disabled.');
}

module.exports = passport;
