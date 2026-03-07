const db = require('../config/db');
const paymentTrackingService = require('../services/paymentTrackingService');

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

    console.log('createPayment called with body:', req.body);

    if (!userId || !pledgeId || !paymentMethod || !isPositiveNumber(amount)) {
        return res.status(400).json({ error: 'Missing or invalid fields (userId, pledgeId, amount, paymentMethod)' });
    }

    try {
        // Use the new payment tracking service to handle partial payments
        console.log('Using payment tracking service for pledge:', pledgeId);
        const result = await paymentTrackingService.recordPayment(
            pledgeId,
            amount,
            paymentMethod,
            userId
        );

        if (!result.success) {
            return res.status(500).json({ error: 'Failed to record payment' });
        }

        // Also update the raised field for compatibility
        try {
            if (db && typeof db.execute === 'function') {
                await db.execute('UPDATE pledges SET raised = raised + ? WHERE id = ?', [amount, pledgeId]);
            }
        } catch (e) {
            console.error('Failed to update raised total:', e);
        }

        // Payment tracking service handles email/SMS notifications automatically
        console.log('✓ Payment recorded successfully:', result.payment);

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
        console.error('Error creating payment:', error);
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
    const { userId, pledgeId } = req.query || {};
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);

    try {
        const { pool } = require('../config/db');
        
        let sql = `SELECT 
            id, 
            pledge_id,
            pledge_id AS pledgeId,
            amount, 
            payment_method AS method,
            payment_method,
            payment_date,
            payment_date AS date,
            reference_number,
            reference_number AS referenceNumber,
            notes,
            verification_status AS status,
            verification_status,
            receipt_number,
            receipt_photo_url,
            created_at AS createdAt,
            created_at AS dateCreated
         FROM payments WHERE deleted = 0`;
        
        const params = [];
        
        if (pledgeId) {
            sql += ` AND pledge_id = ?`;
            params.push(pledgeId);
        }
        
        if (userId) {
            sql += ` AND recorded_by = ?`;
            params.push(userId);
        }
        
        sql += ` ORDER BY payment_date DESC, created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const [payments] = await pool.execute(sql, params);
        return res.status(200).json({ success: true, payments: payments || [], data: payments || [] });
    } catch (err) {
        console.error('listPayments error:', err);
        return res.status(500).json({ success: false, error: 'Internal Server Error', details: err.message });
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