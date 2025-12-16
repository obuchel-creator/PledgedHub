const router = require('express').Router();
const paymentController = require('../controllers/paymentController');
const paymentIntegrationController = require('../controllers/paymentIntegrationController');

/**
 * Wrap controller handlers to ensure any thrown error or rejected promise
 * is forwarded to Express error handlers via next().
 */
const asyncHandler = (fn, controller = paymentController) => (req, res, next) =>
    Promise.resolve(fn.call(controller, req, res, next)).catch(next);

// ========== Basic Payment Routes (existing) ==========
// Create a payment
router.post('/', asyncHandler(paymentController.createPayment));

// List payments
router.get('/', asyncHandler(paymentController.listPayments));

// Get a single payment by id
router.get('/:id', asyncHandler(paymentController.getPayment));

// Refund a payment by id (legacy - use integration-specific refunds instead)
router.post('/:id/refund', asyncHandler(paymentController.refundPayment));

// ========== Payment Integration Routes (NEW) ==========
// Get available payment methods
router.get('/methods', asyncHandler(paymentIntegrationController.getPaymentMethods, paymentIntegrationController));

// PayPal Routes
router.post('/paypal/order', asyncHandler(paymentIntegrationController.createPayPalOrder, paymentIntegrationController));
router.post('/paypal/capture/:orderId', asyncHandler(paymentIntegrationController.capturePayPalPayment, paymentIntegrationController));

// MTN Mobile Money Routes
router.post('/mtn/initiate', asyncHandler(paymentIntegrationController.initiateMTNPayment, paymentIntegrationController));
router.get('/mtn/status/:referenceId', asyncHandler(paymentIntegrationController.checkMTNPaymentStatus, paymentIntegrationController));

// Airtel Money Routes
router.post('/airtel/initiate', asyncHandler(paymentIntegrationController.initiateAirtelPayment, paymentIntegrationController));
router.get('/airtel/status/:transactionId', asyncHandler(paymentIntegrationController.checkAirtelPaymentStatus, paymentIntegrationController));

// Unified Refund Route (works for all payment methods)
router.post('/refund/:paymentId', asyncHandler(paymentIntegrationController.refundPayment, paymentIntegrationController));

module.exports = router;