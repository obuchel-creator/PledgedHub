const router = require('express').Router();
const qrCodeController = require('../controllers/qrCodeController');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * Wrap controller handlers to ensure any thrown error or rejected promise
 * is forwarded to Express error handlers via next().
 */
const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn.call(qrCodeController, req, res, next)).catch(next);

// ========== QR Code Generation Routes ==========

// Generate MTN QR code
router.post('/mtn', authenticateToken, asyncHandler(qrCodeController.generateMTNQRCode));

// Generate Airtel QR code
router.post('/airtel', authenticateToken, asyncHandler(qrCodeController.generateAirtelQRCode));

// Generate QR code (auto-detect provider)
router.post('/', authenticateToken, asyncHandler(qrCodeController.generateQRCode));

// ========== QR Code Image Streaming Routes ==========

// Get QR code image directly (no authentication for public links)
// Usage: GET /api/qr/image?provider=mtn&pledgeId=1&amount=50000
router.get('/image', asyncHandler(qrCodeController.getQRCodeImage));

// ========== USSD & Payment Decoding Routes ==========

// Get USSD payment instructions (alternative to QR scanning)
// Usage: GET /api/qr/ussd?provider=mtn&pledgeId=1&amount=50000
router.get('/ussd', asyncHandler(qrCodeController.getUSSDInstructions));

// Decode payment data from QR code
router.post('/decode', asyncHandler(qrCodeController.decodePaymentData));

// Initiate payment from scanned QR code
router.post('/initiate', authenticateToken, asyncHandler(qrCodeController.initiatePaymentFromQR));

// ========== QR Code Analytics & Tracking Routes ==========

// Get dashboard stats for QR payments
// Usage: GET /api/qr/dashboard?pledgeId=1
router.get('/dashboard', authenticateToken, asyncHandler(qrCodeController.getDashboardStats));

// Get analytics for QR payments
// Usage: GET /api/qr/analytics?pledgeId=1&provider=mtn&startDate=2026-01-01&endDate=2026-01-31
router.get('/analytics', authenticateToken, asyncHandler(qrCodeController.getAnalytics));

// Get active QR codes for a pledge
// Usage: GET /api/qr/pledges/1/active
router.get('/pledges/:pledgeId/active', authenticateToken, asyncHandler(qrCodeController.getActiveQRCodes));

// Get scan history for a QR code
// Usage: GET /api/qr/123/scans?limit=50
router.get('/:qrCodeId/scans', authenticateToken, asyncHandler(qrCodeController.getScanHistory));

// Get payment history for a QR code
// Usage: GET /api/qr/123/payments
router.get('/:qrCodeId/payments', authenticateToken, asyncHandler(qrCodeController.getPaymentHistory));

module.exports = router;
