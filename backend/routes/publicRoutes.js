const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { mobileMoneyService } = require('../services/mobileMoneyService');
const paymentTrackingService = require('../services/paymentTrackingService');
const { encryptValue, decryptFields } = require('../services/dataEncryptionService');
const { rejectSensitivePaymentData } = require('../middleware/pciDssMiddleware');
const pciComplianceService = require('../services/pciComplianceService');

const pciGuard = rejectSensitivePaymentData(pciComplianceService);

let pledgeColumnsCache = null;

async function getPledgesSchema() {
  if (pledgeColumnsCache) return pledgeColumnsCache;

  const [columns] = await pool.execute(`
    SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pledges'
  `);

  const byName = new Map();
  for (const col of columns) {
    byName.set(col.COLUMN_NAME, {
      dataType: (col.DATA_TYPE || '').toLowerCase(),
      maxLen: col.CHARACTER_MAXIMUM_LENGTH,
    });
  }

  pledgeColumnsCache = byName;
  return pledgeColumnsCache;
}

function maybeEncryptForColumn(value, columnInfo) {
  if (value == null || value === '') return value;
  if (!columnInfo) return value;

  // Keep numeric and date columns untouched.
  if (!['varchar', 'char', 'text', 'tinytext', 'mediumtext', 'longtext'].includes(columnInfo.dataType)) {
    return value;
  }

  const encrypted = encryptValue(value);
  if (!encrypted) return value;

  // Older schemas may still have short VARCHAR columns (e.g. 20/50).
  // If encrypted payload cannot fit, fallback to plain value to avoid hard 500s.
  if (columnInfo.maxLen && encrypted.length > columnInfo.maxLen) {
    return value;
  }

  return encrypted;
}

/**
 * PUBLIC: Get campaign by numeric ID (no auth required)
 * GET /api/public/campaigns/id/:id
 *
 * Returns campaign details + pledge progress for public fundraising page
 */
router.get('/campaigns/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid campaign ID'
      });
    }

    // Get campaign by ID
    const [campaigns] = await pool.execute(`
      SELECT 
        id, name as title, description, target_amount as goal_amount,
        event_code, share_url, is_public, created_at
      FROM campaigns
      WHERE id = ? AND is_public = TRUE AND deleted = 0
      LIMIT 1
    `, [id]);

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or is not public'
      });
    }

    const campaign = campaigns[0];
    
    // Calculate raised amount from pledges
    const [raisedResult] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as raised_amount
      FROM pledges
      WHERE campaign_id = ? AND deleted = 0
    `, [campaign.id]);
    
    campaign.raised_amount = parseFloat(raisedResult[0]?.raised_amount || 0);

    // Get recent pledges (for social proof, showing first names only)
    const [pledges] = await pool.execute(`
      SELECT 
        SUBSTRING(donor_name, 1, 1) as donor_initial,
        amount, created_at
      FROM pledges
      WHERE campaign_id = ? AND deleted = 0
      ORDER BY created_at DESC
      LIMIT 10
    `, [campaign.id]);

    // Get pledge count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as count FROM pledges 
      WHERE campaign_id = ? AND deleted = 0
    `, [campaign.id]);

    const pledgeCount = countResult[0]?.count || 0;

    res.json({
      success: true,
      data: {
        ...campaign,
        pledgeCount,
        recentPledges: pledges.map(p => ({
          donor: `${p.donor_initial}...`,
          amount: p.amount,
          date: p.created_at
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching campaign by ID:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

/**
 * PUBLIC: Get campaign by URL slug (no auth required)
 * GET /api/public/campaigns/:slug
 * 
 * Returns campaign details + pledge progress for public fundraising page
 */
router.get('/campaigns/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    // Get campaign by slug
    const [campaigns] = await pool.execute(`
      SELECT 
        id, name as title, description, target_amount as goal_amount,
        event_code, share_url, is_public, created_at
      FROM campaigns
      WHERE share_url = ? AND is_public = TRUE AND deleted = 0
      LIMIT 1
    `, [slug]);

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or is not public'
      });
    }

    const campaign = campaigns[0];
    
    // Calculate raised amount from pledges
    const [raisedResult] = await pool.execute(`
      SELECT COALESCE(SUM(amount), 0) as raised_amount
      FROM pledges
      WHERE campaign_id = ? AND deleted = 0
    `, [campaign.id]);
    
    campaign.raised_amount = parseFloat(raisedResult[0]?.raised_amount || 0);

    // Get recent pledges (for social proof, showing first names only)
    const [pledges] = await pool.execute(`
      SELECT 
        SUBSTRING(donor_name, 1, 1) as donor_initial,
        amount, created_at
      FROM pledges
      WHERE campaign_id = ? AND deleted = 0
      ORDER BY created_at DESC
      LIMIT 10
    `, [campaign.id]);

    // Get pledge count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as count FROM pledges 
      WHERE campaign_id = ? AND deleted = 0
    `, [campaign.id]);

    const pledgeCount = countResult[0]?.count || 0;

    res.json({
      success: true,
      data: {
        ...campaign,
        pledgeCount,
        recentPledges: pledges.map(p => ({
          donor: `${p.donor_initial}...`,
          amount: p.amount,
          date: p.created_at
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching campaign:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

/**
 * PUBLIC: Get campaign by event code (no auth required)
 * GET /api/public/campaigns/code/:code
 * 
 * Alternative way to access campaign using event code
 */
router.get('/campaigns/code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    // Get campaign by event code
    const [campaigns] = await pool.execute(`
      SELECT 
        id, title, description, goal_amount, raised_amount,
        image_url, event_code, share_url, is_public, created_at
      FROM campaigns
      WHERE event_code = ? AND is_public = TRUE AND deleted_at IS NULL
      LIMIT 1
    `, [code.toUpperCase()]);

    if (campaigns.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Campaign code not found or is not public'
      });
    }

    // Redirect to slug-based URL
    const campaign = campaigns[0];
    res.redirect(`/api/public/campaigns/${campaign.share_url}`);

  } catch (error) {
    console.error('❌ Error fetching campaign by code:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

/**
 * PUBLIC: Create guest pledge (no auth required)
 * POST /api/public/pledges
 * 
 * Body:
 * {
 *   campaign_id: number,
 *   campaign_slug: string,
 *   amount: number,
 *   donor_name: string (optional, defaults to "Anonymous"),
 *   donor_phone: string (for payment notifications),
 *   donor_email: string (optional)
 * }
 */
router.post('/pledges', async (req, res) => {
  try {
    const { campaign_id, campaign_slug, amount, donor_name, donor_phone, donor_email } = req.body;
    const schema = await getPledgesSchema();

    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    if (!donor_phone || !donor_phone.match(/^256\d{9}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Valid phone number required (format: 256700000000)'
      });
    }

    let pledgeCampaignId = campaign_id;

    // If campaign_slug provided instead of ID, look up the ID
    if (!pledgeCampaignId && campaign_slug) {
      const [campaigns] = await pool.execute(`
        SELECT id FROM campaigns 
        WHERE share_url = ? AND is_public = TRUE
      `, [campaign_slug]);

      if (campaigns.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Campaign not found'
        });
      }

      pledgeCampaignId = campaigns[0].id;
    }

    if (!pledgeCampaignId) {
      return res.status(400).json({
        success: false,
        error: 'Campaign ID or slug required'
      });
    }

    // Build insert payload based on columns that actually exist in current DB schema.
    const insertData = {
      campaign_id: pledgeCampaignId,
      donor_name: donor_name || 'Anonymous',
      donor_email: donor_email ? maybeEncryptForColumn(donor_email, schema.get('donor_email')) : null,
      donor_phone: maybeEncryptForColumn(donor_phone, schema.get('donor_phone')),
      amount,
      status: 'pending',
    };

    if (schema.has('payment_status')) {
      insertData.payment_status = 'unpaid';
    }

    // Different installations may use either balance or balance_remaining.
    if (schema.has('balance')) {
      insertData.balance = amount;
    }
    if (schema.has('balance_remaining')) {
      insertData.balance_remaining = amount;
    }

    if (schema.has('created_at')) {
      insertData.created_at = new Date();
    }
    if (schema.has('deleted')) {
      insertData.deleted = 0;
    }

    const fields = Object.keys(insertData);
    const placeholders = fields.map(() => '?');
    const values = fields.map((f) => insertData[f]);

    const [result] = await pool.execute(
      `INSERT INTO pledges (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values,
    );

    const pledgeId = result.insertId;

    // Generate pledge receipt number
    const receiptNumber = `PLG-${pledgeId}-${Date.now().toString().slice(-6)}`;

    // Update with receipt number when schema supports it.
    if (schema.has('receipt_number')) {
      await pool.execute(
        'UPDATE pledges SET receipt_number = ? WHERE id = ?',
        [receiptNumber, pledgeId],
      );
    }

    // Log this guest pledge
    console.log(`✅ Guest pledge created: ID=${pledgeId}, Phone=${donor_phone}, Amount=${amount}`);

    res.status(201).json({
      success: true,
      data: {
        pledgeId,
        receiptNumber,
        amount,
        donorPhone: donor_phone,
        message: `Thank you for pledging UGX ${amount.toLocaleString()}!`
      }
    });

  } catch (error) {
    console.error('❌ Error creating guest pledge:', error.message);
    const includeDebug = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
    res.status(500).json({
      success: false,
      error: 'Failed to create pledge',
      ...(includeDebug
        ? {
            debug: {
              message: error.message,
              code: error.code || null,
              errno: error.errno || null,
              sqlState: error.sqlState || null,
            },
          }
        : {}),
    });
  }
});

/**
 * PUBLIC: Initiate payment for guest pledge
 * POST /api/public/pledges/:pledgeId/pay
 * 
 * Body:
 * {
 *   payment_method: 'mtn' | 'airtel' | 'bank',
 *   donor_phone: string (for MTN/Airtel)
 * }
 */
router.post('/pledges/:pledgeId/pay', pciGuard, async (req, res) => {
  try {
    const { pledgeId } = req.params;
    const { payment_method, donor_phone } = req.body;

    // Validate pledge exists
    const [pledges] = await pool.execute(`
      SELECT * FROM pledges WHERE id = ? AND deleted = 0
    `, [pledgeId]);

    if (pledges.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pledge not found'
      });
    }

    const pledge = decryptFields(pledges[0], ['donor_email', 'donor_phone', 'payment_reference']);
    const amount = pledge.balance || pledge.amount;

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Pledge already fully paid'
      });
    }

    // Handle different payment methods
    if (payment_method === 'mtn') {
      // Use mobile money service
      const phoneNumber = donor_phone || pledge.donor_phone;

      if (!phoneNumber.match(/^256\d{9}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid phone number format'
        });
      }

      const paymentResult = await mobileMoneyService.requestPayment(
        phoneNumber,
        amount,
        pledgeId,
        'PledgeHub Donation',
        'Event Fundraiser Pledge Payment'
      );

      if (!paymentResult.success) {
        return res.status(400).json({
          success: false,
          error: paymentResult.error || 'Payment initiation failed'
        });
      }

      // Update pledge with payment reference
      await pool.execute(`
        UPDATE pledges SET 
          payment_status = 'pending',
          payment_reference = ?,
          payment_method = 'mtn'
        WHERE id = ?
      `, [paymentResult.transactionId, pledgeId]);

      res.json({
        success: true,
        data: {
          pledgeId,
          paymentMethod: 'mtn',
          transactionId: paymentResult.transactionId,
          message: 'Payment initiated. Check your phone for prompt.'
        }
      });

    } else if (payment_method === 'bank') {
      // Return bank transfer details
      const bankDetails = {
        bankName: 'Sample Bank',
        accountName: 'PledgeHub Fundraising',
        accountNumber: '123456789',
        swiftCode: 'SAMPSWFT',
        reference: `PLG-${pledgeId}`
      };

      res.json({
        success: true,
        data: {
          pledgeId,
          paymentMethod: 'bank',
          bankDetails,
          message: 'Please make a bank transfer with the reference number'
        }
      });

    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid payment method'
      });
    }

  } catch (error) {
    console.error('❌ Error initiating payment:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to initiate payment'
    });
  }
});

/**
 * PUBLIC: Check pledge payment status (no auth)
 * GET /api/public/pledges/:pledgeId/status
 */
router.get('/pledges/:pledgeId/status', async (req, res) => {
  try {
    const { pledgeId } = req.params;

    const [pledges] = await pool.execute(`
      SELECT 
        id, receipt_number, amount, balance,
        status, payment_status, donor_name, created_at
      FROM pledges
      WHERE id = ? AND deleted = 0
    `, [pledgeId]);

    if (pledges.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Pledge not found'
      });
    }

    const pledge = pledges[0];

    res.json({
      success: true,
      data: {
        pledgeId: pledge.id,
        receiptNumber: pledge.receipt_number,
        amount: pledge.amount,
        amountPaid: pledge.amount - pledge.balance,
        balance: pledge.balance,
        status: pledge.status,
        paymentStatus: pledge.payment_status,
        createdAt: pledge.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error checking pledge status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to check pledge status'
    });
  }
});

module.exports = router;
