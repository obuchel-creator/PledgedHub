// Batch create pledges
async function batchCreatePledges(req, res) {
    try {
        const pledges = Array.isArray(req.body) ? req.body : [];
        if (!pledges.length) {
            return res.status(400).json({ error: 'No pledges provided' });
        }
        // Validate and prepare values
        const validPledges = pledges.filter(p => p && p.title && p.amount && !isNaN(Number(p.amount)));
        if (!validPledges.length) {
            return res.status(400).json({ error: 'No valid pledges in batch' });
        }
        // Prepare bulk insert
        const db = require('../config/db');
        const values = validPledges.map(p => [
            p.campaign_id || null,
            p.title.trim(),
            p.donor_name || p.donorName || 'Anonymous',
            p.donor_email || null,
            p.donor_phone || null,
            p.purpose || p.message || '',
            p.collection_date || new Date().toISOString().split('T')[0],
            Number(p.amount),
            p.status || 'pending',
            null,
            p.purpose || p.message || ''
        ]);
        const insertSql = `INSERT INTO pledges (
            campaign_id, name, donor_name, donor_email, donor_phone, 
            purpose, collection_date, amount, status, payment_method, notes, created_at
        ) VALUES ${values.map(() => '(?,?,?,?,?,?,?,?,?,?,?,NOW())').join(',')}`;
        const flatValues = values.flat();
        const [result] = await db.execute(insertSql, flatValues);
        // Optionally: fetch inserted rows (not required for batch)
        return res.status(201).json({ success: true, inserted: result.affectedRows });
    } catch (err) {
        console.error('❌ [BATCH PLEDGE CREATE] Error:', err);
        return res.status(500).json({ error: 'Server error', details: err.message });
    }
}
const { validationResult } = require('express-validator');
const Pledge = require('../models/Pledge');  // Using database-connected model
const campaignService = require('../services/campaignService');

async function createPledge(req, res) {
    try {
        const { title, amount, donorName, donor_name, donor_email, donor_phone, purpose, collection_date, status, message, date, campaign_id } = req.body || {};
        
        // Require donor_phone for notification readiness
        const phoneValue = donor_phone || req.body.phone;
        if (!phoneValue || typeof phoneValue !== 'string' || !phoneValue.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Phone number (donor_phone) is required',
                details: { received_donor_phone: donor_phone, received_phone: req.body.phone }
            });
        }

        // Enhanced title validation
        if (!title) {
            return res.status(400).json({ 
                success: false,
                error: 'Title is required', 
                details: { received_title: title, title_type: typeof title }
            });
        }
        
        if (typeof title !== 'string') {
            return res.status(400).json({ 
                success: false,
                error: 'Title must be a string', 
                details: { received_title: title, title_type: typeof title }
            });
        }
        
        if (!title.trim()) {
            return res.status(400).json({ 
                success: false,
                error: 'Title cannot be empty', 
                details: { received_title: title, trimmed_title: title.trim() }
            });
        }

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

        // Try database insertion first
        const { pool } = require('../config/db');
        try {


                        // Robust helpers: never return undefined
                        const safeString = (v, fallback = '') =>
                            typeof v === 'string' && v.trim() !== '' ? v : fallback;

                        const safeNumber = (v, fallback = 0) =>
                            typeof v === 'number' && !isNaN(v) ? v : fallback;

                        const sqlParams = [
                            typeof campaign_id !== 'undefined' ? campaign_id : null,
                            safeString(title, 'Untitled').trim(), // name
                            safeString(title, 'Untitled').trim(), // title
                            safeString(donor_name, safeString(donorName, 'Anonymous')),
                            safeString(donor_email, null),
                            safeString(donor_phone, null),
                            safeString(purpose, safeString(message, '')),
                            safeString(collection_date, new Date().toISOString().split('T')[0]),
                            safeNumber(numericAmount, 0),
                            safeString(status, 'pending'),
                            null, // payment_method placeholder
                            safeString(purpose, safeString(message, ''))
                        ];

                        console.log('🔎 [PLEDGE CREATE] SQL PARAMS:', JSON.stringify(sqlParams));
                        console.log('🔎 [PLEDGE CREATE] SQL PARAMS:', JSON.stringify(sqlParams));
                        process.stdout.write('\x1b[33m[DEBUG SQL PARAMS]\x1b[0m ' + JSON.stringify(sqlParams) + '\n');
                        if (process.stdout.flush) process.stdout.flush();

            const insertSql = `
                INSERT INTO pledges (
                    campaign_id, name, title, donor_name, donor_email, donor_phone, 
                    purpose, collection_date, amount, status, payment_method, notes, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            const [result] = await pool.execute(insertSql, sqlParams);

            console.log('✅ [PLEDGE CREATE] Database insertion successful:', result);

            // Fetch the created pledge
            const [rows] = await pool.execute('SELECT * FROM pledges WHERE id = ?', [result.insertId]);
            const createdPledge = rows[0];

            // If pledge is linked to a campaign, update campaign amount
            if (campaign_id) {
                console.log('🔵 [PLEDGE CREATE] Updating campaign amount for campaign:', campaign_id);
                await campaignService.updateCampaignAmount(campaign_id);
            }

            return res.status(201).json({ success: true, pledge: createdPledge });
        } catch (dbError) {
            console.error('❌ [PLEDGE CREATE] Database error:', dbError);
            
            // Fallback to in-memory model
            // Ensure no undefined values in fallback payload
            const payload = {
                title: typeof title === 'string' ? title.trim() : 'Untitled',
                name: typeof title === 'string' ? title.trim() : 'Untitled',
                amount: typeof amount === 'number' && !isNaN(amount) ? amount : 0,
                donor_name: typeof donor_name === 'string' ? donor_name : (typeof donorName === 'string' ? donorName : 'Anonymous'),
                message: typeof message === 'string' ? message : '',
                date: date ? new Date(date) : new Date(),
                createdBy: req.user && req.user._id ? req.user._id : 'test-user-id',
                campaign_id: typeof campaign_id !== 'undefined' ? campaign_id : null
            };

            console.log('🔵 [PLEDGE CREATE] Falling back to in-memory model');
            const result = await Pledge.create(payload);
            console.log('✅ [PLEDGE CREATE] In-memory creation successful:', result);

            // If pledge is linked to a campaign, update campaign amount
            if (campaign_id) {
                console.log('🔵 [PLEDGE CREATE] Updating campaign amount for campaign:', campaign_id);
                await campaignService.updateCampaignAmount(campaign_id);
            }

            return res.status(201).json({ success: true, pledge: result });
        }
    } catch (err) {
        console.error('❌ [PLEDGE CREATE] Error occurred:', err);
        console.error('❌ [PLEDGE CREATE] Error stack:', err.stack);
        console.error('❌ [PLEDGE CREATE] Error details:', {
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

async function getPledge(req, res) {
    try {
        const id = parseInt(req.params.id, 10);

        const pledge = await Pledge.findById(id);
        if (!pledge) {
            return res.status(404).json({ error: 'Pledge not found' });
        }

        return res.status(200).json({ pledge });
    } catch (err) {
        console.error('getPledge error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
}

async function listPledges(req, res) {
    try {
        console.log('🔵 [PLEDGE LIST] Request received');
        console.log('🔵 [PLEDGE LIST] Request headers:', req.headers);
        console.log('🔵 [PLEDGE LIST] Request query:', req.query);
        
        const pledges = await Pledge.list();
        console.log('✅ [PLEDGE LIST] Pledges found:', pledges.length);
        console.log('🔵 [PLEDGE LIST] Returning pledges:', JSON.stringify(pledges, null, 2));
        
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