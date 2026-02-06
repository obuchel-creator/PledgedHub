console.log('=== userRoutes.js loaded ===');
const router = require('express').Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const { authenticateToken: protect, requireRole } = require('../middleware/authMiddleware');

const asyncHandler = (fn) => (req, res, next) => {
    try {
        const result = fn(req, res, next);
        return Promise.resolve(result).catch(next);
    } catch (err) {
        next(err);
    }
};

// POST /register -> registration
router.post(
    '/register',
    asyncHandler(async (req, res, next) => {
        await authController.register(req, res, next);
    })
);

// POST /login -> login
router.post(
    '/login',
    asyncHandler(async (req, res, next) => {
        await authController.login(req, res, next);
    })
);

// GET /me -> get current user
router.get(
    '/me',
    protect,
    asyncHandler(async (req, res, next) => {
        await authController.me(req, res, next);
    })
);

// POST /logout -> logout
router.post(
    '/logout',
    protect,
    asyncHandler(async (req, res, next) => {
        await authController.logout(req, res, next);
    })
);

// POST /forgot-password -> request password reset
router.post(
    '/forgot-password',
    asyncHandler(async (req, res, next) => {
        await authController.forgotPassword(req, res, next);
    })
);

// POST /reset-password -> reset password with token
router.post(
    '/reset-password',
    asyncHandler(async (req, res, next) => {
        await authController.resetPassword(req, res, next);
    })
);

// POST /reset-by-phone -> reset password with phone code
router.post(
    '/reset-by-phone',
    asyncHandler(async (req, res, next) => {
        await authController.resetByPhone(req, res, next);
    })
);

// Legacy routes for backward compatibility
// POST / -> registration (legacy)
router.post(
    '/',
    asyncHandler(async (req, res, next) => {
        if (typeof userController.createUser !== 'function') {
            const err = new Error('createUser not implemented');
            err.status = 501;
            return next(err);
        }
        await userController.createUser(req, res, next);
    })
);

// GET / -> list users (optional/admin)
router.get(
    '/',
    protect,
    asyncHandler(async (req, res, next) => {
        console.log('=== userRoutes GET / called ===');
        if (typeof userController.listAllUsers === 'function') {
            await userController.listAllUsers(req, res, next);
        } else if (typeof userController.listUsers === 'function') {
            await userController.listUsers(req, res, next);
        } else {
            const err = new Error('listUsers not implemented');
            err.status = 501;
            return next(err);
        }
    })
);

// GET /me -> get current user if implemented, otherwise fall through to GET /:id
router.get(
    '/me',
    asyncHandler(async (req, res, next) => {
        if (typeof userController.getMe === 'function') {
            await userController.getMe(req, res, next);
        } else {
            // Let the next matching route (e.g. GET /:id) handle this path
            return next();
        }
    })
);

// GET /export -> export current user's data (must be before /:id route)
router.get(
    '/export',
    protect,
    asyncHandler(async (req, res, next) => {
        const { pool } = require('../config/db');
        const userId = req.user.id;

        try {
            // Validate user ID
            if (!userId || isNaN(userId)) {
                return res.status(400).json({ success: false, error: 'Invalid user ID' });
            }

            // Get user data
            const [users] = await pool.execute(
                'SELECT id, username, email, phone_number, role, created_at, email_verified FROM users WHERE id = ? AND deleted_at IS NULL',
                [userId]
            );

            if (!users || users.length === 0) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            const user = users[0];

            // Get user's pledges
            const [pledges] = await pool.execute(
                'SELECT * FROM pledges WHERE ownerId = ? AND deleted_at IS NULL ORDER BY created_at DESC',
                [userId]
            );

            // Prepare export data
            const exportData = {
                exportDate: new Date().toISOString(),
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    phone: user.phone_number,
                    role: user.role,
                    joinedDate: user.created_at,
                    emailVerified: user.email_verified
                },
                pledges: pledges.map(p => ({
                    id: p.id,
                    campaignId: p.campaign_id,
                    amount: p.amount,
                    status: p.status,
                    frequency: p.frequency,
                    nextPaymentDate: p.next_payment_date,
                    createdAt: p.created_at
                })),
                statistics: {
                    totalPledges: pledges.length,
                    activePledges: pledges.filter(p => p.status === 'active').length,
                    totalAmount: pledges.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0)
                }
            };

            // Set headers for file download
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="PledgeHub-data-${userId}-${Date.now()}.json"`);
            res.json(exportData);

        } catch (error) {
            console.error('Export user data error:', error);
            res.status(500).json({ error: 'Failed to export data' });
        }
    })
);

// GET /:id -> get user by id
router.get(
    '/:id',
    asyncHandler(async (req, res, next) => {
        if (typeof userController.getUser !== 'function') {
            const err = new Error('getUser not implemented');
            err.status = 501;
            return next(err);
        }
        // Minimal param handling: controllers perform detailed validation
        await userController.getUser(req, res, next);
    })
);

// PUT /:id -> update user
router.put(
    '/:id',
    protect,
    asyncHandler(async (req, res, next) => {
        if (typeof userController.updateUser !== 'function') {
            const err = new Error('updateUser not implemented');
            err.status = 501;
            return next(err);
        }
        await userController.updateUser(req, res, next);
    })
);

// PATCH /:id/role -> update user role (superadmin only)
router.patch(
    '/:id/role',
    protect,
    asyncHandler(async (req, res, next) => {
        if (typeof userController.updateUserRole !== 'function') {
            const err = new Error('updateUserRole not implemented');
            err.status = 501;
            return next(err);
        }
        await userController.updateUserRole(req, res, next);
    })
);

// DELETE /:id -> delete user (admin only)
router.delete(
    '/:id',
    protect,
    asyncHandler(async (req, res, next) => {
        if (typeof userController.deleteUser !== 'function') {
            const err = new Error('deleteUser not implemented');
            err.status = 501;
            return next(err);
        }
        await userController.deleteUser(req, res, next);
    })
);

// POST /:id/restore -> restore soft-deleted user (admin only)
router.post(
    '/:id/restore',
    protect,
    asyncHandler(async (req, res, next) => {
        if (typeof userController.restoreUser !== 'function') {
            const err = new Error('restoreUser not implemented');
            err.status = 501;
            return next(err);
        }
        await userController.restoreUser(req, res, next);
    })
);

// POST /users/promote -> promote user to admin (admin only)
router.post(
    '/promote',
    protect,
    requireRole('admin'),
    asyncHandler(async (req, res, next) => {
        await userController.promoteToAdmin(req, res, next);
    })
);

module.exports = router;
