const { pool } = require('../config/db');

// In-memory fallback
let users = [];
let nextId = 1;

async function create(user) {

    try {
        // OAuth users don't need password
        const isOAuthUser = user.oauthProvider && user.oauthId;

        // Accept both phone and phone_number for compatibility
        const phoneValue = user.phone_number || user.phone;
        if (!user || !phoneValue) {
            throw new Error('Missing required field: phone number');
        }

        if (!isOAuthUser && !(user.passwordHash || user.password)) {
            throw new Error('Missing required field: passwordHash/password (required for non-OAuth users)');
        }

        // Try DB first
        const cols = ['phone_number'];
        const placeholders = ['?'];
        const params = [phoneValue];

        // Password (required for non-OAuth users)
        if (user.passwordHash || user.password) {
            cols.push('password_hash');
            placeholders.push('?');
            params.push(user.passwordHash || user.password);
        }

        // Use name for username column if provided
        if (user.name || user.username) {
            cols.push('username');
            placeholders.push('?');
            params.push(user.name || user.username);
        }

        // Email (optional)
        if (user.email) {
            cols.push('email');
            placeholders.push('?');
            params.push(user.email);
        }

        // OAuth fields
        if (user.oauthProvider) {
            cols.push('oauth_provider');
            placeholders.push('?');
            params.push(user.oauthProvider);
        }

        if (user.oauthId) {
            cols.push('oauth_id');
            placeholders.push('?');
            params.push(user.oauthId);
        }

        // Email verified (OAuth emails are pre-verified)
        if (user.emailVerified !== undefined) {
            cols.push('email_verified');
            placeholders.push('?');
            params.push(user.emailVerified ? 1 : 0);
        }

        const sql = `INSERT INTO users (${cols.join(',')}) VALUES (${placeholders.join(',')})`;
        try {
            const [result] = await pool.execute(sql, params);
            const insertId = result && result.insertId ? result.insertId : null;
            if (insertId) {
                return await getById(insertId);
            } else {
                throw new Error('User insert did not return an insertId. Check DB schema.');
            }
        } catch (dbErr) {
            // Log the SQL and params for debugging
            console.error('[DB ERROR] User insert failed:', dbErr.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw new Error('Database error during user creation: ' + dbErr.message);
        }
    } catch (err) {
        // Log and rethrow for controller to handle
        console.error('[USER CREATE ERROR]', err.message);
        throw err;
    }

    // Fallback to in-memory
    const newUser = {
        id: nextId++,
        email: user.email,
        password_hash: user.passwordHash || user.password || null,
        username: user.name || user.username || '',
        oauth_provider: user.oauthProvider || null,
        oauth_id: user.oauthId || null,
        email_verified: user.emailVerified || false,
        created_at: new Date(),
        updated_at: new Date()
    };
    users.push(newUser);
    return newUser;
}

async function getById(id) {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
        if (rows && rows.length) return rows[0];
    } catch (err) {
        console.error('DB error in getById, falling back to in-memory:', err);
    }

    // Fallback
    return users.find(u => u.id === id) || null;
}

async function getByEmail(email) {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
        if (rows && rows.length) return rows[0];
    } catch (err) {
        console.error('DB error in getByEmail, falling back to in-memory:', err);
    }

    // Fallback
    return users.find(u => u.email === email) || null;
}

async function getByPhone(phone) {
    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE phone_number = ? LIMIT 1', [phone]);
        if (rows && rows.length) return rows[0];
    } catch (err) {
        console.error('DB error in getByPhone, falling back to in-memory:', err);
    }

    // Fallback
    return users.find(u => u.phone === phone || u.phone_number === phone) || null;
}

// Alias for compatibility with authController
async function findOne(query) {
    if (query && query.phone) {
        return await getByPhone(query.phone);
    }
    if (query && query.email) {
        return await getByEmail(query.email);
    }
    if (query && query.passwordResetToken) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > ? LIMIT 1', 
                [query.passwordResetToken, query.passwordResetExpires.$gt || Date.now()]
            );
            if (rows && rows.length) return rows[0];
        } catch (err) {
            console.error('DB error in findOne (reset token), falling back to in-memory:', err);
        }
        // Fallback
        return users.find(u => 
            u.passwordResetToken === query.passwordResetToken && 
            u.passwordResetExpires > (query.passwordResetExpires.$gt || Date.now())
        ) || null;
    }
    return null;
}

async function list(filter = {}) {
    try {
        const where = [];
        const params = [];

        if (filter.search) {
            where.push('(name LIKE ? OR email LIKE ?)');
            const s = `%${filter.search}%`;
            params.push(s, s);
        }

        const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

        let limitSql = '';
        if (filter.limit != null) {
            const limit = parseInt(filter.limit, 10) || 0;
            limitSql = ' LIMIT ?';
            params.push(limit);
            if (filter.offset != null) {
                const offset = parseInt(filter.offset, 10) || 0;
                limitSql += ' OFFSET ?';
                params.push(offset);
            }
        }

        const sql = `SELECT * FROM users ${whereSql} ORDER BY id DESC${limitSql}`;
        const [rows] = await pool.execute(sql, params);
        return rows || [];
    } catch (err) {
        console.error('DB error in list, falling back to in-memory:', err);
    }

    // Fallback
    let result = [...users];
    if (filter.search) {
        const s = filter.search.toLowerCase();
        result = result.filter(u => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
    }
    result.sort((a, b) => b.id - a.id);
    if (filter.limit != null) {
        const offset = filter.offset || 0;
        result = result.slice(offset, offset + filter.limit);
    }
    return result;
}

async function update(id, changes) {
    try {
        if (!changes || Object.keys(changes).length === 0) {
            console.error('[User.update] No changes provided for user update', { id, changes });
            return { affectedRows: 0 };
        }

        const allowed = ['name', 'email', 'phone', 'phone_number', 'role', 'passwordHash', 'password', 'password_hash', 'passwordResetToken', 'password_reset_token', 'passwordResetExpires', 'password_reset_expires'];
        const setParts = [];
        const params = [];

        for (const key of allowed) {
            if (Object.prototype.hasOwnProperty.call(changes, key)) {
                // Map camelCase to snake_case for DB
                let dbKey = key;
                if (key === 'passwordHash') dbKey = 'password_hash';
                if (key === 'passwordResetToken') dbKey = 'password_reset_token';
                if (key === 'passwordResetExpires') dbKey = 'password_reset_expires';
                if (key === 'phone') dbKey = 'phone_number';
                setParts.push(`${dbKey} = ?`);
                params.push(changes[key]);
            }
        }

        if (setParts.length === 0) {
            console.error('[User.update] No allowed fields to update', { id, changes });
            return { affectedRows: 0 };
        }

        params.push(id);
        const sql = `UPDATE users SET ${setParts.join(', ')} WHERE id = ?`;
        try {
            const [result] = await pool.execute(sql, params);
            if (result && result.affectedRows > 0) {
                return await getById(id);
            }
            console.error('[User.update] No rows affected', { sql, params, result });
            return { affectedRows: result.affectedRows || 0 };
        } catch (sqlErr) {
            console.error('[User.update] SQL execution error', { sql, params, sqlErr });
            throw sqlErr;
        }
    } catch (err) {
        console.error('DB error in update, falling back to in-memory:', err);
    }

    // Fallback
    const user = users.find(u => u.id === id);
    if (!user) return { affectedRows: 0 };

    const allowed = ['name', 'email', 'phone', 'phone_number', 'role', 'passwordHash', 'password', 'password_hash', 'passwordResetToken', 'password_reset_token', 'passwordResetExpires', 'password_reset_expires'];
    let changed = false;
    for (const key of allowed) {
        if (changes[key] !== undefined) {
            user[key] = changes[key];
            changed = true;
        }
    }
    if (changed) {
        user.updated_at = new Date();
        return user;
    }
    return { affectedRows: 0 };
}

// Helper to save a user object (for compatibility with Mongoose-style code)
async function save(user) {
    if (!user || !user.id) {
        throw new Error('User must have an id to save');
    }
    
    const changes = {
        name: user.name || user.username,
        email: user.email,
        phone: user.phone || user.phone_number,
        password: user.password,
        password_hash: user.password_hash,
        passwordResetToken: user.passwordResetToken,
        password_reset_token: user.password_reset_token,
        passwordResetExpires: user.passwordResetExpires,
        password_reset_expires: user.password_reset_expires
    };
    
    // Remove undefined values
    Object.keys(changes).forEach(key => {
        if (changes[key] === undefined) delete changes[key];
    });
    
    return await update(user.id, changes);
}

/**
 * Soft delete a user (mark as deleted but keep data)
 * @param {number} id - User ID to soft delete
 * @returns {Promise<Object>} Result with success status
 */
async function softDelete(id) {
    try {
        const sql = 'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL';
        const [result] = await pool.execute(sql, [id]);
        
        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows || 0
        };
    } catch (err) {
        console.error('DB error in softDelete:', err);
        throw err;
    }
}

/**
 * Hard delete a user (permanent removal)
 * @param {number} id - User ID to delete permanently
 * @param {Object} options - Deletion options
 * @param {boolean} options.cascade - If true, also delete user's pledges
 * @returns {Promise<Object>} Result with success status
 */
async function hardDelete(id, options = {}) {
    try {
        // First check if user exists
        const user = await getById(id);
        if (!user) {
            return { success: false, error: 'User not found' };
        }

        // Handle cascade deletion of pledges if requested
        if (options.cascade) {
            await pool.execute('DELETE FROM pledges WHERE ownerId = ?', [id]);
        } else {
            // Check if user has pledges
            const [pledges] = await pool.execute('SELECT COUNT(*) as count FROM pledges WHERE ownerId = ?', [id]);
            if (pledges[0].count > 0) {
                return { 
                    success: false, 
                    error: `User has ${pledges[0].count} pledge(s). Use cascade option or transfer pledges first.`,
                    pledgeCount: pledges[0].count
                };
            }
        }

        // Delete the user
        const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
        
        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows || 0,
            cascaded: options.cascade || false
        };
    } catch (err) {
        console.error('DB error in hardDelete:', err);
        throw err;
    }
}

/**
 * Restore a soft-deleted user
 * @param {number} id - User ID to restore
 * @returns {Promise<Object>} Result with success status
 */
async function restore(id) {
    try {
        const sql = 'UPDATE users SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL';
        const [result] = await pool.execute(sql, [id]);
        
        return {
            success: result.affectedRows > 0,
            affectedRows: result.affectedRows || 0
        };
    } catch (err) {
        console.error('DB error in restore:', err);
        throw err;
    }
}

/**
 * Get all users including soft-deleted ones
 * @param {Object} filter - Filter options
 * @returns {Promise<Array>} List of users
 */
async function listAll(filter = {}) {
    try {
        // Build SQL to exclude deleted users by default
        const includeDeleted = filter.includeDeleted === true; // Only include deleted if explicitly requested
        const whereClause = includeDeleted ? '' : 'WHERE deleted_at IS NULL';
        const sql = `SELECT * FROM users ${whereClause} ORDER BY id DESC`;
        const [rows] = await pool.execute(sql);
        console.log('[DEBUG] User.listAll SQL:', sql);
        console.log('[DEBUG] User.listAll result:', rows.length, 'users');
        return rows || [];
    } catch (err) {
        console.error('DB error in listAll:', err);
        return [];
    }
}

module.exports = {
    create,
    getById,
    getByEmail,
    findOne,
    list,
    update,
    save,
    softDelete,
    hardDelete,
    restore,
    listAll,
};