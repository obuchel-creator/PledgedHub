const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const userService = require('../services/userService');

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function createUser(req, res) {
    try {
    const { email, password, name, username } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    // Check if user exists by email
    const existing = await User.getByEmail(email);
    if (existing) return res.status(400).json({ error: 'user with this email already exists' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name, username });

    return res.status(201).json({ success: true, userId: user.id });
    } catch (err) {
        console.error('createUser error', err);
        return res.status(500).json({ error: 'server error' });
    }
}

async function login(req, res) {
    try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) return res.status(400).json({ error: 'email and password required' });

    // Find user by email
    const user = await User.getByEmail(identifier);
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'invalid credentials' });

    // Sign JWT
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    const safeUser = { ...user };
    delete safeUser.passwordHash;

    return res.status(200).json({ token, user: safeUser });
    } catch (err) {
        console.error('login error', err);
        return res.status(500).json({ error: 'server error' });
    }
}

async function getUser(req, res) {
    try {
        const paramId = req.params && req.params.id;
        let id;
        if (paramId === 'me') {
            // Assume auth middleware sets req.user
            if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
            id = req.user.id;
        } else {
            id = paramId;
        }
        if (!id) return res.status(400).json({ error: 'id required' });

        const user = await User.getById(id);
        if (!user) return res.status(404).json({ error: 'not found' });

        const safeUser = { ...user };
        delete safeUser.passwordHash;

        return res.status(200).json({ user: safeUser });
    } catch (err) {
        console.error('getUser error', err);
        return res.status(500).json({ error: 'server error' });
    }
}

async function listUsers(req, res) {
                console.log('=== /api/users route handler called ===');
            // Direct DB check for debugging
            const db = require('../config/db');
            try {
                const [countRows] = await db.execute('SELECT COUNT(*) as count FROM users');
                const [sampleRows] = await db.execute('SELECT id, username, email, phone_number FROM users LIMIT 5');
                console.log('[DEBUG] Direct DB user count:', countRows);
                console.log('[DEBUG] Direct DB sample users:', sampleRows);
            } catch (err) {
                console.error('[DEBUG] Direct DB query error:', err);
            }
        console.log('[DEBUG] listUsers route called');
    try {
        // Optional admin check, but for now allow
        const users = await User.listAll({ limit: 100 });
        console.log('[DEBUG] Controller listUsers - users from model:', users);
        const safe = users.map(u => {
            const o = { ...u };
            delete o.passwordHash;
            return o;
        });
        console.log('[DEBUG] Controller listUsers - users sent to client:', safe);
        return res.status(200).json({ users: safe });
    } catch (err) {
        console.error('listUsers error', err);
        return res.status(500).json({ error: 'server error' });
    }
}

async function updateUser(req, res) {
    try {
        const paramId = req.params && req.params.id;
        let id;
        if (paramId === 'me') {
            if (!req.user) return res.status(401).json({ error: 'unauthenticated' });
            id = req.user.id;
        } else {
            id = paramId;
        }
        if (!id) return res.status(400).json({ error: 'id required' });

        const allowed = ['name', 'email', 'password'];
        const updates = {};
        for (const k of allowed) {
            if (req.body && Object.prototype.hasOwnProperty.call(req.body, k)) updates[k] = req.body[k];
        }

        if (updates.password) {
            updates.passwordHash = await bcrypt.hash(updates.password, 10);
            delete updates.password;
        }

        const user = await User.update(id, updates);
        if (!user) return res.status(404).json({ error: 'not found' });

        const safeUser = { ...user };
        delete safeUser.passwordHash;

        return res.status(200).json({ user: safeUser });
    } catch (err) {
        console.error('updateUser error', err);
        return res.status(500).json({ error: 'server error' });
    }
}

async function deleteUser(req, res) {
    try {
        const id = req.params?.id;
        if (!id) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Check if requesting user is admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Forbidden: Admin access required to delete users' 
            });
        }

        // Prevent self-deletion
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ 
                error: 'Cannot delete your own account' 
            });
        }

        // Check if user exists
        const targetUser = await User.getById(id);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get deletion type from query params (soft or hard)
        const deleteType = req.query.type || 'soft'; // Default to soft delete
        const cascade = req.query.cascade === 'true'; // Default false

        let result;
        if (deleteType === 'hard') {
            // Hard delete (permanent)
            result = await User.hardDelete(id, { cascade });
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: result.error,
                    pledgeCount: result.pledgeCount 
                });
            }

            return res.status(200).json({ 
                success: true,
                message: 'User permanently deleted',
                type: 'hard',
                cascaded: result.cascaded,
                user: {
                    id: targetUser.id,
                    email: targetUser.email,
                    username: targetUser.username
                }
            });
        } else {
            // Soft delete (mark as deleted)
            result = await User.softDelete(id);
            
            if (!result.success) {
                return res.status(400).json({ 
                    error: 'User already deleted or does not exist' 
                });
            }

            return res.status(200).json({ 
                success: true,
                message: 'User soft deleted (can be restored)',
                type: 'soft',
                user: {
                    id: targetUser.id,
                    email: targetUser.email,
                    username: targetUser.username
                }
            });
        }
    } catch (err) {
        console.error('deleteUser error:', err);
        return res.status(500).json({ 
            error: 'Server error while deleting user',
            details: err.message 
        });
    }
}

/**
 * Restore a soft-deleted user
 */
async function restoreUser(req, res) {
    try {
        const id = req.params?.id;
        if (!id) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Check if requesting user is admin
        if (!req.user || req.user.role !== 'admin') {
            return res.status(403).json({ 
                error: 'Forbidden: Admin access required' 
            });
        }

        const result = await User.restore(id);
        
        if (!result.success) {
            return res.status(400).json({ 
                error: 'User not found or not deleted' 
            });
        }

        const restoredUser = await User.getById(id);
        const safeUser = { ...restoredUser };
        delete safeUser.password_hash;
        delete safeUser.passwordHash;

        return res.status(200).json({ 
            success: true,
            message: 'User restored successfully',
            user: safeUser
        });
    } catch (err) {
        console.error('restoreUser error:', err);
        return res.status(500).json({ 
            error: 'Server error while restoring user',
            details: err.message 
        });
    }
}

/**
 * Update user role (superadmin only)
 */
async function updateUserRole(req, res) {
    try {
        const targetUserId = req.params?.id;
        if (!targetUserId) {
            return res.status(400).json({ error: 'User ID required' });
        }

        // Check if requesting user is superadmin
        if (!req.user || req.user.role !== 'superadmin') {
            return res.status(403).json({ 
                error: 'Forbidden: Only superadmins can change user roles' 
            });
        }

        // Prevent changing own role (security measure)
        if (req.user.id === parseInt(targetUserId)) {
            return res.status(400).json({ 
                error: 'Cannot change your own role' 
            });
        }

        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ error: 'New role required' });
        }

        // Validate role
        const validRoles = ['donor', 'staff', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                error: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            });
        }

        // Check if target user exists
        const targetUser = await User.getById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user role
        const updatedUser = await User.update(targetUserId, { role });
        if (!updatedUser) {
            return res.status(500).json({ error: 'Failed to update user role' });
        }

        // Remove sensitive data
        const safeUser = { ...updatedUser };
        delete safeUser.password_hash;
        delete safeUser.passwordHash;
        delete safeUser.password_reset_token;
        delete safeUser.password_reset_expires;

        return res.status(200).json({ 
            success: true,
            message: `User role updated from ${targetUser.role} to ${role}`,
            user: safeUser
        });
    } catch (err) {
        console.error('updateUserRole error:', err);
        return res.status(500).json({ 
            error: 'Server error while updating user role',
            details: err.message 
        });
    }
}

/**
 * List all users (including soft-deleted if specified)
 */
async function listAllUsers(req, res) {
    try {
        // Check if requesting user is admin or superadmin
        if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
            return res.status(403).json({ 
                error: 'Forbidden: Admin or Superadmin access required' 
            });
        }

        // For admin or superadmin, always show all users, including deleted if requested, but default to all
        const search = req.query.search || '';
        // If admin or superadmin, ignore limit/offset/includeDeleted for full list (or set a high limit)
        const users = await User.listAll({
            includeDeleted: true, // always include all for admin/superadmin
            search,
            limit: 1000, // show up to 1000 users
            offset: 0
        });

        // Remove sensitive data
        const safeUsers = users.map(u => {
            const safe = { ...u };
            delete safe.password_hash;
            delete safe.passwordHash;
            delete safe.password_reset_token;
            delete safe.password_reset_expires;
            return safe;
        });

        // Debug log for diagnosis
        console.log('[DEBUG] listAllUsers returned:', safeUsers.map(u => ({id: u.id, email: u.email, username: u.username, role: u.role, deleted_at: u.deleted_at})));

        return res.status(200).json({ 
            success: true,
            count: safeUsers.length,
            users: safeUsers
        });
    } catch (err) {
        console.error('listAllUsers error:', err);
        return res.status(500).json({ 
            error: 'Server error while listing users',
            details: err.message 
        });
    }
}

/**
 * Promote a user to admin (admin only)
 */
async function promoteToAdmin(req, res) {
  // Only admins can promote
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ success: false, error: 'Identifier required' });
  }
  const result = await userService.promoteToAdmin(identifier);
  if (result.success) {
    return res.json({ success: true });
  } else {
    return res.status(404).json({ success: false, error: result.error });
  }
}

module.exports = { 
    createUser, 
    getUser, 
    listUsers, 
    updateUser, 
    deleteUser, 
    restoreUser,
    listAllUsers,
    updateUserRole,
    login,
    promoteToAdmin 
};