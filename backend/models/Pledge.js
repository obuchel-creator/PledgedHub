const { pool } = require('../config/db');

const TABLE = 'pledges';
const ALLOWED_UPDATE = [
    'title', 
    'description', 
    'goal', 
    'amount', 
    'status', 
    'ownerId', 
    'raised', 
    'amount_paid',
    'balance_remaining',
    'last_payment_date',
    'last_balance_reminder'
];

async function create(data = {}) {
    // The pledges table doesn't have a 'name' or 'title' column
    // It has: donor_name, purpose, amount, etc.
    
    // Always set deleted = 0 unless explicitly set
    if (!('deleted' in data)) {
        data.deleted = 0;
    }
    
    const fields = [];
    const placeholders = [];
    const params = [];

    Object.keys(data).forEach((k) => {
        fields.push(`\`${k}\``);
        placeholders.push('?');
        params.push(data[k]);
    });

    const sql = `INSERT INTO \`${TABLE}\` (${fields.join(',')}) VALUES (${placeholders.join(',')})`;

    try {
        const [result] = await pool.execute(sql, params);
        const insertId = result.insertId || (result && result[0] && result[0].insertId);
        if (!insertId) return null;
        return await findById(insertId);
    } catch (err) {
        console.error('DB error in create:', err);
        throw err;
    }
}

async function findById(id) {
    if (id == null) return null;
    try {
        const [rows] = await pool.execute(`SELECT * FROM \`${TABLE}\` WHERE id = ? LIMIT 1`, [id]);
        const row = (rows && rows[0]) || null;
        if (!row) return null;
        
        // Convert numeric string fields to actual numbers
        return {
            ...row,
            amount: row.amount ? parseFloat(row.amount) : 0,
            amount_paid: row.amount_paid ? parseFloat(row.amount_paid) : 0,
            balance: row.balance ? parseFloat(row.balance) : 0
        };
    } catch (err) {
        console.error('DB error in findById:', err);
        throw err;
    }
}

async function list(filter = {}) {
    const where = [];
    const params = [];

    // Always filter for deleted = 0 unless explicitly overridden
    if (!('deleted' in filter)) {
        where.push('deleted = 0');
    } else if (filter.deleted !== undefined) {
        where.push('deleted = ?');
        params.push(filter.deleted);
    }

    if (filter.ownerId != null) {
        where.push('ownerId = ?');
        params.push(filter.ownerId);
    }

    if (filter.search) {
        where.push('(donor_name LIKE ? OR purpose LIKE ? OR notes LIKE ?)');
        const term = `%${filter.search}%`;
        params.push(term, term, term);
    }

    let sql = `SELECT * FROM \`${TABLE}\``;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');

    // Add ORDER BY to show newest first
    sql += ' ORDER BY created_at DESC';

    const limit = Number.isFinite(filter.limit) && filter.limit > 0 ? parseInt(filter.limit, 10) : 100;
    const offset = Number.isFinite(filter.offset) && filter.offset >= 0 ? parseInt(filter.offset, 10) : 0;

    // Note: LIMIT and OFFSET must be directly interpolated, not parameterized in MySQL
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    try {
        const [rows] = await pool.execute(sql, params);
        // Convert numeric string fields to actual numbers for the frontend
        return (rows || []).map(row => ({
            ...row,
            amount: row.amount ? parseFloat(row.amount) : 0,
            amount_paid: row.amount_paid ? parseFloat(row.amount_paid) : 0,
            balance: row.balance ? parseFloat(row.balance) : 0
        }));
    } catch (err) {
        console.error('DB error in list:', err);
        throw err;
    }
}

async function update(id, changes = {}) {
    if (id == null) throw new Error('id is required');

    const sets = [];
    const params = [];

    ALLOWED_UPDATE.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(changes, field)) {
            sets.push(`\`${field}\` = ?`);
            params.push(changes[field]);
        }
    });

    if (!sets.length) throw new Error('No valid fields to update');

    params.push(id);
    const sql = `UPDATE \`${TABLE}\` SET ${sets.join(', ')} WHERE id = ?`;

    try {
        const [result] = await pool.execute(sql, params);
        const affectedRows = result.affectedRows || 0;
        if (affectedRows === 0) return { affectedRows: 0, row: null };
        const row = await findById(id);
        return { affectedRows, row };
    } catch (err) {
        console.error('DB error in update:', err);
        throw err;
    }
}

async function incrementRaised(id, amount) {
    if (id == null) throw new Error('id is required');
    if (typeof amount !== 'number') throw new Error('amount must be a number');

    const sql = `UPDATE \`${TABLE}\` SET raised = COALESCE(raised, 0) + ? WHERE id = ?`;
    try {
        const [result] = await pool.execute(sql, [amount, id]);
        return (result.affectedRows && result.affectedRows > 0) || false;
    } catch (err) {
        console.error('DB error in incrementRaised:', err);
        throw err;
    }
}

async function decrementRaised(id, amount) {
    if (id == null) throw new Error('id is required');
    if (typeof amount !== 'number') throw new Error('amount must be a number');

    const sql = `UPDATE \`${TABLE}\` SET raised = COALESCE(raised, 0) - ? WHERE id = ?`;
    try {
        const [result] = await pool.execute(sql, [amount, id]);
        return (result.affectedRows && result.affectedRows > 0) || false;
    } catch (err) {
        console.error('DB error in decrementRaised:', err);
        throw err;
    }
}

async function del(id) {
    if (id == null) throw new Error('id is required');
    try {
        const [result] = await pool.execute(`DELETE FROM \`${TABLE}\` WHERE id = ?`, [id]);
        return result.affectedRows || 0;
    } catch (err) {
        console.error('DB error in delete:', err);
        throw err;
    }
}

async function softDelete(id) {
    if (id == null) throw new Error('id is required');
    try {
        const [result] = await pool.execute(`UPDATE \`${TABLE}\` SET deleted = 1 WHERE id = ?`, [id]);
        return result.affectedRows || 0;
    } catch (err) {
        console.error('DB error in softDelete:', err);
        throw err;
    }
}

module.exports = {
    create,
    findById,
    getById: findById,
    list,
    update,
    incrementRaised,
    decrementRaised,
    delete: del,
    softDelete,
};