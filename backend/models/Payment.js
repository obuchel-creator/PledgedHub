const { pool } = require('../config/db');

// In-memory fallback store for payments when DB is unavailable
const payments = [];
let nextId = 1;

async function create(payment) {
    const { userId, pledgeId, amount, paymentMethod, status = 'completed' } = payment || {};
    if (!userId || !pledgeId || amount == null || !paymentMethod) {
        throw new Error('Missing required payment fields: userId, pledgeId, amount, paymentMethod');
    }

    // Try DB first, fall back to in-memory on any DB error
    try {
        if (!pool || typeof pool.execute !== 'function') throw new Error('DB not available');
        const sql = `
            INSERT INTO payments (user_id, pledge_id, amount, payment_method, status, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        const params = [userId, pledgeId, amount, paymentMethod, status];
        const [result] = await pool.execute(sql, params);
        // Normalize return shape: always return an object with id
        return { id: result && (result.insertId || result.insertid || null) };
    } catch (err) {
        console.warn('Payment.create: DB unavailable, falling back to in-memory store:', err && err.message);
        const id = Date.now() + (nextId++);
        const rec = {
            id,
            user_id: userId,
            pledge_id: pledgeId,
            amount,
            payment_method: paymentMethod,
            status,
            created_at: new Date().toISOString(),
        };
        payments.unshift(rec);
        return { id };
    }
}

async function getById(id) {
    try {
        if (pool && typeof pool.execute === 'function') {
            const [rows] = await pool.execute('SELECT * FROM payments WHERE id = ? LIMIT 1', [id]);
            if (rows && rows.length) return rows[0];
        }
    } catch (err) {
        console.warn('Payment.getById: DB error, falling back to in-memory:', err && err.message);
    }
    return payments.find(p => String(p.id) === String(id)) || null;
}

async function list(filter = {}) {
    try {
        if (pool && typeof pool.execute === 'function') {
            const clauses = [];
            const params = [];
            if (filter.userId != null) { clauses.push('payments.user_id = ?'); params.push(filter.userId); }
            if (filter.pledgeId != null) { clauses.push('payments.pledge_id = ?'); params.push(filter.pledgeId); }
            const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
            const limit = Number.isInteger(filter.limit) && filter.limit > 0 ? filter.limit : 100;
            const offset = Number.isInteger(filter.offset) && filter.offset >= 0 ? filter.offset : 0;
            
            // Join with pledges table to get pledge details
            const sql = `
                SELECT 
                    payments.*,
                    pledges.donor_name as pledgeDonor,
                    pledges.purpose as pledgeTitle,
                    pledges.amount as pledgeAmount
                FROM payments 
                LEFT JOIN pledges ON payments.pledge_id = pledges.id
                ${where} 
                ORDER BY payments.created_at DESC 
                LIMIT ${limit} OFFSET ${offset}
            `;
            const [rows] = await pool.execute(sql, params);
            return rows || [];
        }
    } catch (err) {
        console.warn('Payment.list: DB error, falling back to in-memory:', err && err.message);
        console.error('Payment.list error details:', err);
    }

    // In-memory filter
    let result = [...payments];
    if (filter.userId != null) result = result.filter(p => String(p.user_id) === String(filter.userId));
    if (filter.pledgeId != null) result = result.filter(p => String(p.pledge_id) === String(filter.pledgeId));
    // pagination
    const offset = Number.isInteger(filter.offset) ? filter.offset : 0;
    const limit = Number.isInteger(filter.limit) ? filter.limit : 100;
    return result.slice(offset, offset + limit);
}

async function markRefunded(id) {
    try {
        if (pool && typeof pool.execute === 'function') {
            const payment = await getById(id);
            if (!payment) return false;
            if (payment.status === 'refunded' || payment.refunded_at) return false;
            const [result] = await pool.execute('UPDATE payments SET status = ?, refunded_at = NOW() WHERE id = ?', ['refunded', id]);
            return result && result.affectedRows > 0;
        }
    } catch (err) {
        console.warn('Payment.markRefunded: DB error, falling back to in-memory:', err && err.message);
    }

    const p = payments.find(x => String(x.id) === String(id));
    if (!p) return false;
    if (p.status === 'refunded' || p.refunded_at) return false;
    p.status = 'refunded';
    p.refunded_at = new Date().toISOString();
    return true;
}

module.exports = { create, getById, list, markRefunded };