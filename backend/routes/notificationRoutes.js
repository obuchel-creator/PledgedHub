const express = require('express');
const { 
    sendReminder, 
    sendBulkReminders, 
    sendCustomNotification, 
    sendThankYou 
} = require('../controllers/notificationController');
const { authenticateToken: protect, requireStaff } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * Send reminder to a specific pledge
 * POST /reminder/:pledgeId
 * Protected - requires authentication
 */
router.post('/reminder/:pledgeId', protect, sendReminder);

/**
 * Send reminders to all pending pledges
 * POST /remind-all
 * Protected - requires authentication
 */
router.post('/remind-all', protect, sendBulkReminders);

/**
 * Send custom notification to a pledge
 * POST /custom/:pledgeId
 * Body: { message: string }
 * Protected - requires authentication
 */
router.post('/custom/:pledgeId', protect, sendCustomNotification);

/**
 * Send thank you message
 * POST /thank-you/:pledgeId
 * Protected - requires authentication
 */
router.post('/thank-you/:pledgeId', protect, sendThankYou);

module.exports = router;
