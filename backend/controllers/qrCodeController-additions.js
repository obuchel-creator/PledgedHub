// New methods to add to qrCodeController.js

/**
 * Record a QR code scan (user downloaded or viewed QR)
 */
exports.recordQRScan = async (req, res) => {
    try {
        const { qrCodeId, qrReference, phoneNumber, paymentInitiated = false } = req.body;

        // Validate required fields
        if (!qrCodeId && !qrReference) {
            return res.status(400).json({
                success: false,
                message: 'Either qrCodeId or qrReference is required'
            });
        }

        // Get QR code details
        let qrCode;
        if (qrCodeId) {
            qrCode = await QRCodeModel.findById(qrCodeId);
        } else if (qrReference) {
            qrCode = await QRCodeModel.findByReference(qrReference);
        }

        if (!qrCode) {
            return res.status(404).json({
                success: false,
                message: 'QR code not found'
            });
        }

        // Record scan
        const scanResult = await QRCodeModel.recordScan({
            qrCodeId: qrCode.id,
            pledgeId: qrCode.pledge_id,
            phoneNumber: phoneNumber || null,
            paymentInitiated,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent')
        });

        res.json({
            success: true,
            data: {
                scanId: scanResult.scanId,
                pledgeId: qrCode.pledge_id,
                totalScans: (qrCode.scan_count || 0) + 1
            },
            message: 'QR code scan recorded'
        });
    } catch (error) {
        console.error('Record QR scan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record QR scan',
            error: error.message
        });
    }
};

/**
 * Link a completed payment to a QR code
 */
exports.linkPaymentToQR = async (req, res) => {
    try {
        const { qrCodeId, paymentId, amount, provider, status = 'completed' } = req.body;

        // Validate required fields
        if (!qrCodeId || !paymentId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: qrCodeId, paymentId'
            });
        }

        // Link payment to QR code
        const linkResult = await QRCodeModel.linkPayment({
            qrCodeId,
            paymentId,
            pledgeId: null, // Will be gotten from QR code record
            amount: amount || null,
            provider,
            status
        });

        if (!linkResult.success) {
            return res.status(400).json({
                success: false,
                message: linkResult.error
            });
        }

        // Update payment status in QR code record
        await QRCodeModel.updatePaymentStatus(linkResult.id, status, new Date());

        res.json({
            success: true,
            data: {
                qrPaymentId: linkResult.id,
                qrCodeId,
                paymentId,
                status
            },
            message: 'Payment linked to QR code successfully'
        });
    } catch (error) {
        console.error('Link payment to QR error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to link payment to QR code',
            error: error.message
        });
    }
};

/**
 * Get QR code analytics
 */
exports.getQRAnalytics = async (req, res) => {
    try {
        const { pledgeId, qrCodeId, providerId } = req.query;
        const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
        const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

        if (!pledgeId && !qrCodeId) {
            return res.status(400).json({
                success: false,
                message: 'Either pledgeId or qrCodeId is required'
            });
        }

        let analytics;
        if (qrCodeId) {
            // Get analytics for specific QR code
            analytics = await QRCodeModel.getAnalytics(qrCodeId, null, startDate, endDate);
        } else {
            // Get analytics for all QR codes for a pledge
            analytics = await QRCodeModel.getAnalytics(pledgeId, providerId, startDate, endDate);
        }

        res.json({
            success: true,
            data: analytics,
            message: 'QR code analytics retrieved'
        });
    } catch (error) {
        console.error('Get QR analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR analytics',
            error: error.message
        });
    }
};

/**
 * Get QR code dashboard stats
 */
exports.getQRDashboard = async (req, res) => {
    try {
        const { pledgeId } = req.query;

        if (!pledgeId) {
            return res.status(400).json({
                success: false,
                message: 'pledgeId is required'
            });
        }

        const stats = await QRCodeModel.getDashboardStats(pledgeId);

        res.json({
            success: true,
            data: stats,
            message: 'QR code dashboard stats retrieved'
        });
    } catch (error) {
        console.error('Get QR dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR dashboard stats',
            error: error.message
        });
    }
};

/**
 * Get payment history for a QR code
 */
exports.getQRPaymentHistory = async (req, res) => {
    try {
        const { qrCodeId } = req.query;

        if (!qrCodeId) {
            return res.status(400).json({
                success: false,
                message: 'qrCodeId is required'
            });
        }

        const history = await QRCodeModel.getPaymentHistory(qrCodeId);

        res.json({
            success: true,
            data: history,
            message: 'QR code payment history retrieved'
        });
    } catch (error) {
        console.error('Get QR payment history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR payment history',
            error: error.message
        });
    }
};

/**
 * Get scan history for a QR code
 */
exports.getQRScanHistory = async (req, res) => {
    try {
        const { qrCodeId } = req.query;
        const limit = req.query.limit ? parseInt(req.query.limit) : 50;

        if (!qrCodeId) {
            return res.status(400).json({
                success: false,
                message: 'qrCodeId is required'
            });
        }

        const history = await QRCodeModel.getScanHistory(qrCodeId, limit);

        res.json({
            success: true,
            data: history,
            message: 'QR code scan history retrieved'
        });
    } catch (error) {
        console.error('Get QR scan history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve QR scan history',
            error: error.message
        });
    }
};
