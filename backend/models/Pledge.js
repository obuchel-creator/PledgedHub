const { pool } = require('../config/db');

const TABLE = 'pledges';
const ALLOWED_UPDATE = [
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
    
    // SaaS: Ensure tenant_id is set
    if (!data.tenant_id) {
        throw new Error('tenant_id is required for pledge creation');
    }
    
    // Privacy: Ensure created_by is set
    if (!data.created_by) {
        throw new Error('created_by (user_id) is required for pledge creation');
    }
    
    // Privacy: Default to private pledges
    if (!('is_private' in data)) {
        data.is_private = true;
    }
    
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

async function findById(id, tenantId = null) {
    if (id == null) return null;
    try {
        let sql = `SELECT * FROM \`${TABLE}\` WHERE id = ?`;
        const params = [id];
        
        // SaaS: Add tenant filter if provided
        if (tenantId) {
            sql += ' AND tenant_id = ?';
            params.push(tenantId);
        }
        
        sql += ' LIMIT 1';
        
        const [rows] = await pool.execute(sql, params);
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

    // SaaS: CRITICAL - Always filter by tenant_id first
    if (filter.tenant_id) {
        where.push('tenant_id = ?');
        params.push(filter.tenant_id);
    }

    // Always filter for deleted = 0 unless explicitly overridden
    if (!('deleted' in filter)) {
        where.push('deleted = 0');
    } else if (filter.deleted !== undefined) {
        where.push('deleted = ?');
        params.push(filter.deleted);
    }

    // Privacy: Filter by user ownership (unless admin/staff with permissions)
    if (filter.created_by) {
        where.push('created_by = ?');
        params.push(filter.created_by);
    }
    
    // Privacy: Handle staff access to non-private pledges
    if (filter.includeOrgPledges && filter.created_by) {
        // Staff can see their own + organization-shared pledges
        const lastCondition = where.pop(); // Remove created_by = ?
        const lastParam = params.pop();
        where.push('(created_by = ? OR is_private = FALSE)');
        params.push(lastParam);
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

async function update(id, changes = {}, tenantId = null, userId = null) {
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
    let sql = `UPDATE \`${TABLE}\` SET ${sets.join(', ')} WHERE id = ?`;
    
    // SaaS: Add tenant validation
    if (tenantId) {
        sql += ' AND tenant_id = ?';
        params.push(tenantId);
    }
    
    // Privacy: Add user ownership validation (unless admin override)
    if (userId) {
        sql += ' AND created_by = ?';
        params.push(userId);
    }

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

async function softDelete(id, tenantId = null, userId = null) {
    if (id == null) throw new Error('id is required');
    try {
        let sql = `UPDATE \`${TABLE}\` SET deleted = 1 WHERE id = ?`;
        const params = [id];
        
        // SaaS: Add tenant validation
        if (tenantId) {
            sql += ' AND tenant_id = ?';
            params.push(tenantId);
        }
        
        // Privacy: Add user ownership validation
        if (userId) {
            sql += ' AND created_by = ?';
            params.push(userId);
        }
        
        const [result] = await pool.execute(sql, params);
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