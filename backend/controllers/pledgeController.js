// Batch create pledges
async function batchCreatePledges(req, res) {
    try {
        const { pool } = require('../config/db');
        const pledges = Array.isArray(req.body) ? req.body : [];
        if (!pledges.length) {
            return res.status(400).json({ error: 'No pledges provided' });
        }
        
        // SaaS: Get tenant context
        const tenantId = req.tenant?.id || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        
        // Privacy: Get user_id for ownership tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication required'
            });
        }
        
        // Validate and prepare values
        const validPledges = pledges.filter(p => p && p.amount && !isNaN(Number(p.amount)));
        if (!validPledges.length) {
            return res.status(400).json({ error: 'No valid pledges in batch' });
        }
        // Prepare bulk insert
        const values = validPledges.map(p => [
            tenantId,  // SaaS: Include tenant_id
            userId,    // Privacy: Include created_by
            userId,    // Privacy: Include created_by
            p.campaign_id || null,
            p.donor_name || p.donorName || 'Anonymous',
            p.donor_email || null,
            p.donor_phone || null,
            p.purpose || p.message || '',
            p.collection_date || new Date().toISOString().split('T')[0],
            Number(p.amount),
            p.status || 'pending',
            null,
            p.purpose || p.message || '',
            true, // is_private - default to private
            0 // deleted
        ]);
        const insertSql = `INSERT INTO pledges (
            tenant_id, created_by, campaign_id, donor_name, donor_email, donor_phone, 
            purpose, collection_date, amount, status, payment_method, notes, is_private, deleted, created_at
        ) VALUES ${values.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())').join(',')}`;
        const flatValues = values.flat();
        const [result] = await pool.execute(insertSql, flatValues);
        return res.status(201).json({ success: true, inserted: result.affectedRows });
    } catch (err) {
        console.error('❌ [BATCH PLEDGE CREATE] Error:', err);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
}
const { validationResult } = require('express-validator');
const Pledge = require('../models/Pledge');  // Using database-connected model
const campaignService = require('../services/campaignService');
const pledgeVerificationService = require('../services/pledgeVerificationService');
const accountingService = require('../services/accountingService');

async function createPledge(req, res) {
    try {
        const { title, amount, donor_name, donor_email, donor_phone, purpose, collection_date, status, message, date, campaign_id } = req.body || {};

        // Require collection_date (date pledge is to be collected)
        if (!collection_date || typeof collection_date !== 'string' || !collection_date.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Collection date (collection_date) is required and must be a non-empty string.',
                details: { received_collection_date: collection_date }
            });
        }
        // Validate collection_date is a valid date string (YYYY-MM-DD)
        const collectionDateObj = new Date(collection_date);
        if (isNaN(collectionDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Collection date (collection_date) must be a valid date in YYYY-MM-DD format.',
                details: { received_collection_date: collection_date }
            });
        }

        // Require pledge date (date field)
        if (!date || typeof date !== 'string' || !date.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Pledge date (date) is required and must be a non-empty string.',
                details: { received_date: date }
            });
        }
        // Validate pledge date is a valid date string (ISO or YYYY-MM-DD)
        const pledgeDateObj = new Date(date);
        if (isNaN(pledgeDateObj.getTime())) {
            return res.status(400).json({
                success: false,
                error: 'Pledge date (date) must be a valid date string (ISO or YYYY-MM-DD).',
                details: { received_date: date }
            });
        }
        
        // Require donor_phone for notification readiness
        const phoneValue = donor_phone || req.body.phone;
        if (!phoneValue || typeof phoneValue !== 'string' || !phoneValue.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Phone number (donor_phone) is required',
                details: { received_donor_phone: donor_phone, received_phone: req.body.phone }
            });
        }

        // Note: 'title' is optional - used to populate purpose/notes field
        // Database doesn't have a 'title' column

        // Enhanced amount validation
        if (amount == null) {
            console.log('❌ [PLEDGE CREATE] Validation failed: Amount is null/undefined');
            return res.status(400).json({ 
                error: 'Amount is required', 
                details: { received_amount: amount, amount_type: typeof amount }
            });
        }
        
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            console.log('❌ [PLEDGE CREATE] Validation failed: Amount is not a valid number');
            return res.status(400).json({ 
                error: 'Amount must be a valid number', 
                details: { received_amount: amount, amount_type: typeof amount, converted_amount: numericAmount }
            });
        }
        
        if (numericAmount <= 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Amount must be greater than 0', 
                details: { received_amount: amount, numeric_amount: numericAmount }
            });
        }

        // Always use the Pledge model for creation to ensure field mapping and DB consistency
        // Note: pledges table does NOT have 'title' or 'name' columns - only donor_name, purpose, etc.
        // Only allow valid pledge fields
        
        // SaaS: Get tenant_id from request context
        const tenantId = req.tenant?.id || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant context required. Please ensure you are logged in.'
            });
        }
        
        // Privacy: Get user_id for ownership tracking
        const userId = req.user?.id;
        if (!userId) {
            return res.status(400).json({
                success: false,
                error: 'User authentication required. Please log in.'
            });
        }
        
        // SECURITY: Fetch user data from database for validation
        const { pool } = require('../config/db');
        const [userRows] = await pool.execute(
            'SELECT name, phone FROM users WHERE id = ? LIMIT 1',
            [userId]
        );
        
        if (!userRows || userRows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'User account not found. Please log out and log back in.'
            });
        }
        
        const loggedInUser = userRows[0];
        
        // SECURITY: Validate donor_name matches logged-in user's registered name
        if (!loggedInUser.name) {
            return res.status(400).json({
                success: false,
                error: 'Your account is missing a registered name. Please contact support.'
            });
        }
        
        const submittedName = typeof donor_name === 'string' ? donor_name.trim() : '';
        if (submittedName.toLowerCase() !== loggedInUser.name.trim().toLowerCase()) {
            return res.status(400).json({
                success: false,
                error: `Pledge name must match your registered name (${loggedInUser.name}). Individual pledges can only be created under your own account for data integrity and accountability.`
            });
        }
        
        // SECURITY: Validate donor_phone matches logged-in user's registered phone
        if (!loggedInUser.phone) {
            return res.status(400).json({
                success: false,
                error: 'Your account is missing a registered phone number. Please update your profile.'
            });
        }
        
        // Normalize both phones for comparison (remove spaces, dashes, etc.)
        const normalizePhone = (phone) => {
            if (!phone) return '';
            return phone.replace(/[\s\-\(\)\+]/g, '').trim();
        };
        
        const submittedPhone = normalizePhone(donor_phone);
        const registeredPhone = normalizePhone(loggedInUser.phone);
        
        if (submittedPhone !== registeredPhone) {
            return res.status(400).json({
                success: false,
                error: `Phone number must match your registered number (${loggedInUser.phone}). Individual pledges can only be created with your verified contact information for security and SMS notifications.`
            });
        }
        
        const payload = {
            tenant_id: tenantId,  // SaaS: Always include tenant_id
            created_by: userId,   // Privacy: Track ownership
            is_private: req.body.is_private !== undefined ? req.body.is_private : true, // Default private
            campaign_id: typeof campaign_id !== 'undefined' ? campaign_id : null,
            donor_name: typeof donor_name === 'string' ? donor_name : 'Anonymous',
            donor_email: typeof donor_email === 'string' ? donor_email : null,
            donor_phone: typeof donor_phone === 'string' ? donor_phone : null,
            purpose: typeof purpose === 'string' ? purpose : (typeof message === 'string' ? message : ''),
            collection_date: typeof collection_date === 'string' ? collection_date : new Date().toISOString().split('T')[0],
            amount: typeof amount === 'number' && !isNaN(amount) ? amount : Number(amount) || 0,
            status: typeof status === 'string' ? status : 'pending',
            notes: typeof purpose === 'string' ? purpose : (typeof message === 'string' ? message : ''),
            created_at: new Date()
        };
        // Remove any unsupported fields from req.body
        Object.keys(payload).forEach((key) => {
            if (typeof payload[key] === 'undefined') {
                delete payload[key];
            }
        });
        const result = await Pledge.create(payload);
        // Send verification email only if donor_email is present and non-empty after trim
        if (payload.donor_email && typeof payload.donor_email === 'string' && payload.donor_email.trim().length > 0) {
            const verificationResult = await pledgeVerificationService.sendVerificationEmail(
                result.id,
                payload.donor_email.trim(),
                payload.donor_name || 'Donor'
            );
            if (!verificationResult.success) {
                console.warn('⚠️  [PLEDGE CREATE] Failed to send verification email:', verificationResult.error);
            }
        }
        // If pledge is linked to a campaign, update campaign amount
        if (payload.campaign_id) {
            await campaignService.updateCampaignAmount(payload.campaign_id);
        }

        // 📊 ACCOUNTING: Record journal entry for new pledge (Receivable)
        try {
            const pledgeAmount = parseFloat(payload.amount);
            const receivablesAccountId = 1200; // Pledges Receivable
            const unearnedRevenueAccountId = 2000; // Unearned Revenue

            const accountingEntry = {
                date: new Date(),
                description: `New Pledge - ${payload.donor_name}`,
                reference: `PLEDGE-${result.id}-NEW`,
                userId: userId,
                lines: [
                    {
                        accountId: receivablesAccountId,
                        type: 'debit',
                        amount: pledgeAmount,
                        description: `Pledges Receivable - Pledge #${result.id}`
                    },
                    {
                        accountId: unearnedRevenueAccountId,
                        type: 'credit',
                        amount: pledgeAmount,
                        description: `Unearned Revenue - ${payload.purpose || 'General'}`
                    }
                ]
            };

            const accountingResult = await accountingService.createJournalEntry(accountingEntry);
            if (accountingResult.success) {
                // Link pledge to accounting entry
                await pool.execute(
                    'UPDATE pledges SET accounting_entry_id = ? WHERE id = ?',
                    [accountingResult.data.entryId, result.id]
                );
                console.log('✅ [ACCOUNTING] Pledge journal entry recorded:', accountingResult.data.entryNumber);
            }
        } catch (accountingError) {
            console.error('⚠️ [ACCOUNTING] Warning - Failed to record accounting entry:', accountingError.message);
            // Don't fail the pledge if accounting fails - log but continue
        }

        return res.status(201).json({
            success: true,
            pledge: result,
            message: 'Pledge created! Please verify your email to confirm.'
        });
    } catch (err) {
        // Return specific error if possible
        if (err && err.message) {
            // If error is a known validation or DB error, return as is
            return res.status(400).json({
                success: false,
                error: err.message,
                details: err
            });
        }
        // Fallback: unknown error
        return res.status(500).json({
            success: false,
            error: 'An unknown error occurred while creating the pledge. Please check your input and try again.',
            details: err
        });
    }
}

const { pool } = require('../config/db');
async function getPledge(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        
        // SaaS: Get tenant context
        const tenantId = req.tenant?.id || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        
        // Fetch pledge details with tenant filter
        const [pledges] = await pool.execute(
            `SELECT 
                id,
                donor_name AS title,
                donor_name,
                donor_email,
                donor_phone,
                amount,
                collection_date,
                status,
                purpose,
                notes,
                amount_paid,
                balance,
                last_reminder_sent,
                reminder_count,
                campaign_id,
                user_id,
                payment_method,
                payment_reference,
                created_at,
                updated_at
             FROM pledges WHERE id = ? AND tenant_id = ? AND deleted = 0 LIMIT 1`,
            [id, tenantId]
        );
        if (!pledges || !pledges[0]) {
            return res.status(404).json({ success: false, error: 'Pledge not found' });
        }
        const pledge = pledges[0];
        // Fetch payment history
        const [payments] = await pool.execute(
            `SELECT 
                id, 
                amount, 
                payment_method,
                payment_date,
                reference_number,
                notes,
                verification_status,
                receipt_number,
                receipt_photo_url,
                created_at
             FROM payments WHERE pledge_id = ? AND deleted = 0 ORDER BY payment_date DESC, created_at DESC`,
            [id]
        );
        pledge.paymentHistory = payments || [];
        return res.status(200).json({ success: true, data: pledge });
    } catch (err) {
        console.error('❌ [GET PLEDGE] Error:', err);
        return res.status(500).json({ success: false, error: 'Server error', details: err.message });
    }
}

async function listPledges(req, res) {
    try {
        console.log('🔵 [PLEDGE LIST] Request received');
        console.log('🔵 [PLEDGE LIST] Request headers:', req.headers);
        console.log('🔵 [PLEDGE LIST] Request query:', req.query);
        
        // SaaS: Get tenant context
        const tenantId = req.tenant?.id || req.user?.tenant_id;
        if (!tenantId) {
            return res.status(400).json({
                success: false,
                error: 'Tenant context required'
            });
        }
        
        // Privacy: Get user context
        const userId = req.user?.id;
        const userRole = req.user?.role;
        
        // Build filter based on user role
        const filter = { tenant_id: tenantId };
        
        // Admins see all pledges in their tenant
        if (userRole === 'admin' || userRole === 'super_admin') {
            // No additional filter - admins see everything
        }
        // Staff see their own + organization-shared pledges
        else if (userRole === 'staff') {
            filter.created_by = userId;
            filter.includeOrgPledges = true; // Flag to include non-private pledges
        }
        // Regular users see ONLY their own pledges
        else {
            filter.created_by = userId;
        }
        
        // Pass filters to list
        const pledges = await Pledge.list(filter);
        console.log('✅ [PLEDGE LIST] Pledges found:', pledges.length);
        console.log('🔒 [PLEDGE LIST] User role:', userRole, '- Showing', pledges.length, 'pledges');
        
        // Return both formats for compatibility
        return res.status(200).json({ 
            success: true,
            data: pledges,
            pledges: pledges  // Legacy format
        });
    } catch (err) {
        console.error('❌ [PLEDGE LIST] Error occurred:', err);
        console.error('❌ [PLEDGE LIST] Error stack:', err.stack);
        console.error('❌ [PLEDGE LIST] Error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            errno: err.errno,
            sqlState: err.sqlState,
            sqlMessage: err.sqlMessage
        });
        return res.status(500).json({ 
            error: 'Server error', 
            details: {
                message: err.message,
                type: err.name || 'Unknown error'
            }
        });
    }
}

async function updatePledge(req, res) {
    try {
        // Check validation results from route validators
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'Invalid ID' });
        }
        const allowed = ['title', 'amount', 'donorName', 'message', 'date'];
        const updates = {};

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) {
                updates[key] = req.body[key];
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        const result = await Pledge.update(id, updates);

        // Return affectedRows
        return res.status(200).json({ affectedRows: result.affectedRows });
    } catch (err) {
        console.error('updatePledge error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function deletePledge(req, res) {
    try {
        const id = parseInt(req.params.id, 10);

        const affected = await Pledge.softDelete(id);
        if (!affected || affected.affectedRows === 0) {
            return res.status(404).json({ error: 'Pledge not found' });
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('deletePledge error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    createPledge,
    getPledge,
    listPledges,
    updatePledge,
    deletePledge,
    batchCreatePledges,
};