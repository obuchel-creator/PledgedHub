const db = require('../config/db');
const paymentTrackingService = require('../services/paymentTrackingService');
const accountingService = require('../services/accountingService');

let Payment;
let sendEmail;

try { Payment = require('../models/Payment'); } catch (e) { Payment = null; }
try { sendEmail = require('../utils/sendEmail'); } catch (e) { sendEmail = null; }

const isPositiveNumber = (v) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0;
};

async function createPayment(req, res) {
    const { userId, pledgeId, amount, paymentMethod } = req.body || {};

    // Enhanced debug logging
    console.log('[PaymentController] createPayment called with:', { userId, pledgeId, amount, paymentMethod, body: req.body });

    if (!userId || !pledgeId || !paymentMethod || !isPositiveNumber(amount)) {
        console.error('[PaymentController] Missing or invalid fields:', { userId, pledgeId, amount, paymentMethod });
        return res.status(400).json({ error: 'Missing or invalid fields (userId, pledgeId, amount, paymentMethod)' });
    }

    try {
        // Use the new payment tracking service to handle partial payments
        console.log('[PaymentController] Using paymentTrackingService for pledge:', pledgeId);
        const result = await paymentTrackingService.recordPayment(
            pledgeId,
            amount,
            paymentMethod,
            userId
        );

        if (!result.success) {
            console.error('[PaymentController] Failed to record payment:', result.error);
            return res.status(500).json({ error: 'Failed to record payment', details: result.error });
        }

        // Also update the raised field for compatibility
        try {
            if (db && typeof db.execute === 'function') {
                await db.execute('UPDATE pledges SET raised = raised + ? WHERE id = ?', [amount, pledgeId]);
            }
        } catch (e) {
            console.error('[PaymentController] Failed to update raised total:', e);
        }

        // 📊 ACCOUNTING: Record journal entry for payment
        try {
            const paymentMethodMap = {
                'cash': 1000,           // Cash account
                'mobile_money': 1100,   // Mobile Money account
                'mtn': 1100,            // MTN Mobile Money
                'airtel': 1100,         // Airtel Money
                'bank_transfer': 1050,  // Bank account
                'cheque': 1050,         // Bank account
                'other': 1000           // Default to cash
            };

            const cashAccountId = paymentMethodMap[paymentMethod?.toLowerCase()] || 1000;
            const receivablesAccountId = 1200; // Pledges Receivable

            const accountingEntry = {
                date: new Date(),
                description: `Pledge #${pledgeId} Payment - ${paymentMethod}`,
                reference: `PMT-${result.payment.id}-PLEDGE-${pledgeId}`,
                userId,
                lines: [
                    {
                        accountId: cashAccountId,
                        type: 'debit',
                        amount: parseFloat(amount),
                        description: `Cash received via ${paymentMethod}`
                    },
                    {
                        accountId: receivablesAccountId,
                        type: 'credit',
                        amount: parseFloat(amount),
                        description: `Pledges Receivable reduced - Pledge #${pledgeId}`
                    }
                ]
            };

            const accountingResult = await accountingService.createJournalEntry(accountingEntry);
            if (accountingResult.success) {
                // Link payment to accounting entry
                await db.execute(
                    'UPDATE payments SET accounting_entry_id = ? WHERE id = ?',
                    [accountingResult.data.entryId, result.payment.id]
                );
                console.log('✅ [ACCOUNTING] Payment journal entry recorded:', accountingResult.data.entryNumber);
            }
        } catch (accountingError) {
            console.error('⚠️ [ACCOUNTING] Warning - Failed to record accounting entry:', accountingError.message);
            // Don't fail the payment if accounting fails - log but continue
        }

        // Payment tracking service handles email/SMS notifications automatically
        console.log('[PaymentController] Payment recorded successfully:', result.payment);

        return res.status(201).json({
            success: true,
            payment: result.payment,
            pledge: {
                id: result.pledge.id,
                amount: result.pledge.amount,
                amountPaid: result.pledge.amount_paid,
                balanceRemaining: result.pledge.balance_remaining,
                status: result.pledge.status,
                fullyPaid: result.payment.fullyPaid
            }
        });

    } catch (error) {
        console.error('[PaymentController] Error creating payment:', error);
        return res.status(500).json({ 
            error: 'Failed to create payment', 
            details: error.message 
        });
    }
}

async function getPayment(req, res) {
    const id = Number(req.params && req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        if (Payment && typeof Payment.findByPk === 'function') {
            const payment = await Payment.findByPk(id);
            if (!payment) return res.status(404).json({ error: 'Not Found' });
            return res.status(200).json({ payment });
        }

        if (db && typeof db.execute === 'function') {
            const [rows] = await db.execute('SELECT * FROM payments WHERE id = ? LIMIT 1', [id]);
            if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not Found' });
            return res.status(200).json({ payment: rows[0] });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    } catch (err) {
        console.error('getPayment error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function listPayments(req, res) {
    // Get current user from auth middleware
    const currentUserId = req.user?.id;
    const currentUserEmail = req.user?.email;
    const currentUserRole = req.user?.role;
    const pledgeId = req.query.pledgeId ? parseInt(req.query.pledgeId, 10) : null;

    console.log('[PaymentController] listPayments called for user:', currentUserId, currentUserEmail, 'Role:', currentUserRole);

    try {
        const { pool } = require('../config/db');
        
        let sql = `SELECT 
            p.id, 
            p.pledge_id,
            p.amount, 
            p.payment_method,
            p.verification_status as status,
            p.payment_date as created_at,
            pl.donor_name,
            pl.donor_email,
            pl.donor_phone,
            pl.purpose,
            pl.amount as pledge_amount,
            pl.created_by
         FROM payments p
         JOIN pledges pl ON p.pledge_id = pl.id
         WHERE p.deleted = 0`;

        const params = [];
        
        // Admins see ALL payments
        // Non-admins only see their own pledges
        if (currentUserRole !== 'super_admin' && currentUserRole !== 'finance_admin') {
            console.log('[PaymentController] Non-admin user - filtering by created_by or donor_email');
            sql += ` AND (pl.created_by = ? OR pl.donor_email = ?)`;
            params.push(currentUserId, currentUserEmail);
        } else {
            console.log('[PaymentController] Admin user - showing ALL payments');
        }
        
        if (pledgeId) {
            sql += ` AND p.pledge_id = ?`;
            params.push(pledgeId);
        }
        
        sql += ` ORDER BY p.payment_date DESC LIMIT 50`;
        
        console.log('[PaymentController] listPayments SQL:', sql);
        console.log('[PaymentController] listPayments Params:', params);
        
        const [payments] = await pool.execute(sql, params);
        
        console.log('[PaymentController] listPayments found:', payments ? payments.length : 0, 'payments');
        
        return res.status(200).json({ 
            success: true, 
            payments: payments || [], 
            data: payments || [],
            count: payments ? payments.length : 0
        });
    } catch (err) {
        console.error('[PaymentController] listPayments error:', err);
        return res.status(500).json({ 
            success: false, 
            error: 'Internal Server Error', 
            details: err.message 
        });
    }
}

async function refundPayment(req, res) {
    const id = Number(req.params && req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid id' });
    }

    try {
        // Fetch existing payment
        let paymentRecord;
        if (Payment && typeof Payment.findByPk === 'function') {
            paymentRecord = await Payment.findByPk(id);
            if (!paymentRecord) return res.status(404).json({ error: 'Not Found' });
            if (paymentRecord.status === 'refunded') {
                return res.status(400).json({ error: 'Already refunded' });
            }
            // Prefer model update and any model hooks
            const amount = paymentRecord.amount;
            const pledgeId = paymentRecord.pledgeId || paymentRecord.pledge_id;

            if (Payment && typeof Payment.update === 'function') {
                // Try to update status and refunded_at
                await Payment.update({ status: 'refunded', refundedAt: new Date() }, { where: { id } });
                // Adjust pledge totals best-effort (model or raw SQL)
                try {
                    if (db && typeof db.execute === 'function') {
                        await db.execute('UPDATE pledges SET raised = GREATEST(0, raised - ?) WHERE id = ?', [amount, pledgeId]);
                    }
                } catch (e) {
                    console.error('Failed to decrement pledge totals during refund:', e);
                }
                return res.status(200).json({ success: true });
            }
        }

        if (db && typeof db.execute === 'function') {
            // Use transaction if available
            if (typeof db.getConnection === 'function') {
                const conn = await db.getConnection();
                try {
                    await conn.beginTransaction();
                    const [rows] = await conn.execute('SELECT * FROM payments WHERE id = ? LIMIT 1 FOR UPDATE', [id]);
                    if (!rows || rows.length === 0) {
                        await conn.rollback();
                        conn.release();
                        return res.status(404).json({ error: 'Not Found' });
                    }
                    const payment = rows[0];
                    if (payment.status === 'refunded') {
                        await conn.rollback();
                        conn.release();
                        return res.status(400).json({ error: 'Already refunded' });
                    }

                    await conn.execute('UPDATE payments SET status = ?, refunded_at = NOW() WHERE id = ?', ['refunded', id]);
                    await conn.execute('UPDATE pledges SET raised = GREATEST(0, raised - ?) WHERE id = ?', [payment.amount, payment.pledge_id]);

                    await conn.commit();
                    conn.release();

                    return res.status(200).json({ success: true });
                } catch (err) {
                    await conn.rollback().catch(() => {});
                    conn.release();
                    throw err;
                }
            } else {
                // No transaction support: do best-effort
                const [rows] = await db.execute('SELECT * FROM payments WHERE id = ? LIMIT 1', [id]);
                if (!rows || rows.length === 0) return res.status(404).json({ error: 'Not Found' });
                const payment = rows[0];
                if (payment.status === 'refunded') return res.status(400).json({ error: 'Already refunded' });

                await db.execute('UPDATE payments SET status = ?, refunded_at = NOW() WHERE id = ?', ['refunded', id]);
                try {
                    await db.execute('UPDATE pledges SET raised = GREATEST(0, raised - ?) WHERE id = ?', [payment.amount, payment.pledge_id]);
                } catch (e) {
                    console.error('Failed to decrement pledge totals during refund:', e);
                }
                return res.status(200).json({ success: true });
            }
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    } catch (err) {
        console.error('refundPayment error:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    createPayment,
    getPayment,
    listPayments,
    refundPayment,
};