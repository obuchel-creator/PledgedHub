const router = require('express').Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const transactionController = require('../controllers/transactionController');

// GET /api/transactions/history - List all transactions for current user
router.get('/history', authenticateToken, transactionController.getTransactionHistory);

module.exports = router;
