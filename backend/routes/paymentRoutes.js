const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const paymentIntegrationController = require('../controllers/paymentIntegrationController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Wrap controller handlers to ensure any thrown error or rejected promise
 * is forwarded to Express error handlers via next().
 */
const asyncHandler = (fn, controller = paymentController) => (req, res, next) =>
    Promise.resolve(fn.call(controller, req, res, next)).catch(next);

// ========== Basic Payment Routes (existing) ==========
// Create a payment
router.post('/', authenticateToken, asyncHandler(paymentController.createPayment));

// List payments
router.get('/', authenticateToken, asyncHandler(paymentController.listPayments));

// Get a single payment by id
router.get('/:id', authenticateToken, asyncHandler(paymentController.getPayment));

// Refund a payment by id (legacy - use integration-specific refunds instead)
router.post('/:id/refund', authenticateToken, asyncHandler(paymentController.refundPayment));

// ========== Payment Integration Routes (NEW) ==========
// Get available payment methods
router.get('/methods', authenticateToken, asyncHandler(paymentIntegrationController.getPaymentMethods, paymentIntegrationController));

// PayPal Routes
router.post('/paypal/order', authenticateToken, asyncHandler(paymentIntegrationController.createPayPalOrder, paymentIntegrationController));
router.post('/paypal/capture/:orderId', authenticateToken, asyncHandler(paymentIntegrationController.capturePayPalPayment, paymentIntegrationController));

// MTN Mobile Money Routes
router.post('/mtn/initiate', authenticateToken, asyncHandler(paymentIntegrationController.initiateMTNPayment, paymentIntegrationController));
router.get('/mtn/status/:referenceId', authenticateToken, asyncHandler(paymentIntegrationController.checkMTNPaymentStatus, paymentIntegrationController));

// Airtel Money Routes
router.post('/airtel/initiate', authenticateToken, asyncHandler(paymentIntegrationController.initiateAirtelPayment, paymentIntegrationController));
router.get('/airtel/status/:transactionId', authenticateToken, asyncHandler(paymentIntegrationController.checkAirtelPaymentStatus, paymentIntegrationController));

// Unified Refund Route (works for all payment methods)
router.post('/refund/:paymentId', authenticateToken, asyncHandler(paymentIntegrationController.refundPayment, paymentIntegrationController));

module.exports = router;