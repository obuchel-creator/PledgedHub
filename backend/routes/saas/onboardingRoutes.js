/**
 * SaaS Onboarding Routes
 * 
 * Self-service signup, tenant creation, and onboarding flows
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const tenantService = require('../../services/tenantService');
const emailService = require('../../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/saas/signup
 * Create new tenant and admin user
 */
router.post('/signup', async (req, res) => {
  try {
    const { organizationName, subdomain, email, password, name } = req.body;

    // Validation
    if (!organizationName || !subdomain || !email || !password || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['organizationName', 'subdomain', 'email', 'password', 'name']
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Create tenant
    const result = await tenantService.createTenant({
      organizationName,
      subdomain: subdomain.toLowerCase(),
      adminEmail: email,
      adminPassword: password,
      adminName: name,
      plan: 'free'
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    const { tenantId, userId, trialEndsAt } = result.data;

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId, 
        tenantId, 
        role: 'admin',
        email 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Send welcome email
    try {
      await emailService.sendEmail({
        to: email,
        subject: 'Welcome to PledgeHub! 🎉',
        html: `
          <h2>Welcome to PledgeHub, ${name}!</h2>
          <p>Your account has been created successfully.</p>
          <p><strong>Organization:</strong> ${organizationName}</p>
          <p><strong>Your subdomain:</strong> ${subdomain}.pledgedhub.com</p>
          <p><strong>Trial ends:</strong> ${new Date(trialEndsAt).toLocaleDateString()}</p>
          <p>Get started by logging in at: <a href="https://${subdomain}.pledgedhub.com">https://${subdomain}.pledgedhub.com</a></p>
          <p>Need help? Check our documentation or contact support at support@pledgedhub.com</p>
          <br>
          <p>Best regards,<br>The PledgeHub Team</p>
        `
      });
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // Don't fail signup if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      tenant: {
        id: tenantId,
        name: organizationName,
        subdomain,
        plan: 'free',
        trialEndsAt
      },
      user: {
        id: userId,
        name,
        email,
        role: 'admin'
      },
      redirectUrl: `https://${subdomain}.pledgedhub.com/dashboard`
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ 
      error: 'Failed to create account',
      details: error.message 
    });
  }
});

/**
 * GET /api/saas/check-subdomain/:subdomain
 * Check if subdomain is available
 */
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const { subdomain } = req.params;

    // Format validation
    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      return res.json({ 
        available: false, 
        reason: 'Invalid format. Use lowercase letters, numbers, and hyphens only.' 
      });
    }

    // Length validation
    if (subdomain.length < 3 || subdomain.length > 50) {
      return res.json({ 
        available: false, 
        reason: 'Subdomain must be between 3 and 50 characters.' 
      });
    }

    // Reserved subdomains
    const reserved = ['www', 'api', 'admin', 'app', 'dashboard', 'support', 'help', 'mail', 'smtp', 'ftp', 'dev', 'staging'];
    if (reserved.includes(subdomain)) {
      return res.json({ 
        available: false, 
        reason: 'This subdomain is reserved.' 
      });
    }

    const result = await tenantService.checkSubdomainAvailability(subdomain);

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    res.json({ 
      available: result.available,
      subdomain
    });

  } catch (error) {
    console.error('Check subdomain error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/saas/plans
 * Get available plans and pricing
 */
router.get('/plans', (req, res) => {
  const { SAAS_PLANS, getPlanComparison } = require('../../config/saasPlans');
  
  res.json({
    plans: Object.keys(SAAS_PLANS).map(key => ({
      id: key,
      ...SAAS_PLANS[key]
    })),
    comparison: getPlanComparison()
  });
});

module.exports = router;
